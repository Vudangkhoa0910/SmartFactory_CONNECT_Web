#!/usr/bin/env node
/**
 * Script to translate existing ideas data
 * Adds Japanese translation for Vietnamese content and vice versa
 * 
 * Usage: node scripts/translate-existing-ideas.js [--dry-run]
 */

require('dotenv').config();
const db = require('../src/config/database');
const translationService = require('../src/services/translation.service');

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

/**
 * Detect language of text
 */
const detectLanguage = (text) => {
  if (!text) return 'vi';
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text) ? 'ja' : 'vi';
};

/**
 * Auto-translate text
 */
const autoTranslate = async (text, fieldName = 'text') => {
  if (!text || text.trim() === '') {
    return { original: text, translated: null, originalLang: 'vi' };
  }

  const detectedLang = detectLanguage(text);
  const targetLang = detectedLang === 'ja' ? 'vi' : 'ja';

  try {
    const translated = await translationService.translateText(text, detectedLang, targetLang, false);
    console.log(`  ✓ ${fieldName}: ${detectedLang} → ${targetLang}`);
    return { original: text, translated, originalLang: detectedLang };
  } catch (error) {
    console.error(`  ✗ ${fieldName}: Translation failed - ${error.message}`);
    return { original: text, translated: null, originalLang: detectedLang };
  }
};

/**
 * Process and translate a single idea
 */
const translateIdea = async (idea) => {
  const updates = {};
  let hasUpdates = false;

  // Translate title
  if (idea.title && !idea.title_ja) {
    const result = await autoTranslate(idea.title, 'title');
    if (result.originalLang === 'ja') {
      updates.title_ja = idea.title;
      updates.title = result.translated || idea.title;
    } else {
      updates.title_ja = result.translated;
    }
    if (updates.title_ja) hasUpdates = true;
  } else if (idea.title_ja && !idea.title) {
    const result = await autoTranslate(idea.title_ja, 'title');
    updates.title = result.translated || idea.title_ja;
    if (updates.title) hasUpdates = true;
  }

  // Translate description
  if (idea.description && !idea.description_ja) {
    const result = await autoTranslate(idea.description, 'description');
    if (result.originalLang === 'ja') {
      updates.description_ja = idea.description;
      updates.description = result.translated || idea.description;
    } else {
      updates.description_ja = result.translated;
    }
    if (updates.description_ja) hasUpdates = true;
  } else if (idea.description_ja && !idea.description) {
    const result = await autoTranslate(idea.description_ja, 'description');
    updates.description = result.translated || idea.description_ja;
    if (updates.description) hasUpdates = true;
  }

  // Translate expected_benefit
  if (idea.expected_benefit && !idea.expected_benefit_ja) {
    const result = await autoTranslate(idea.expected_benefit, 'expected_benefit');
    if (result.originalLang === 'ja') {
      updates.expected_benefit_ja = idea.expected_benefit;
      updates.expected_benefit = result.translated || idea.expected_benefit;
    } else {
      updates.expected_benefit_ja = result.translated;
    }
    if (updates.expected_benefit_ja) hasUpdates = true;
  } else if (idea.expected_benefit_ja && !idea.expected_benefit) {
    const result = await autoTranslate(idea.expected_benefit_ja, 'expected_benefit');
    updates.expected_benefit = result.translated || idea.expected_benefit_ja;
    if (updates.expected_benefit) hasUpdates = true;
  }

  return { updates, hasUpdates };
};

/**
 * Update idea in database
 */
const updateIdea = async (ideaId, updates) => {
  const fields = Object.keys(updates);
  if (fields.length === 0) return;

  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
  const values = [ideaId, ...fields.map(f => updates[f])];

  const query = `UPDATE ideas SET ${setClause}, updated_at = NOW() WHERE id = $1`;
  await db.query(query, values);
};

/**
 * Main function
 */
const main = async () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TRANSLATE EXISTING IDEAS - SmartFactory CONNECT    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (isDryRun) {
    console.log('🔍 DRY-RUN MODE: No changes will be made to the database\n');
  }

  try {
    // Get all ideas that need translation
    const query = `
      SELECT id, ideabox_type, title, title_ja, description, description_ja, 
             expected_benefit, expected_benefit_ja
      FROM ideas
      WHERE (title IS NOT NULL AND title_ja IS NULL)
         OR (title_ja IS NOT NULL AND title IS NULL)
         OR (description IS NOT NULL AND description_ja IS NULL)
         OR (description_ja IS NOT NULL AND description IS NULL)
         OR (expected_benefit IS NOT NULL AND expected_benefit_ja IS NULL)
         OR (expected_benefit_ja IS NOT NULL AND expected_benefit IS NULL)
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);
    const ideas = result.rows;

    console.log(`📊 Found ${ideas.length} ideas needing translation\n`);

    if (ideas.length === 0) {
      console.log('✅ All ideas are already bilingual!');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const idea of ideas) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 Idea #${idea.id} [${idea.ideabox_type.toUpperCase()}]`);
      console.log(`   Title: "${idea.title?.substring(0, 50) || 'N/A'}..."`);

      const { updates, hasUpdates } = await translateIdea(idea);

      if (hasUpdates) {
        if (!isDryRun) {
          await updateIdea(idea.id, updates);
          console.log(`   ✅ Updated with ${Object.keys(updates).length} translations`);
        } else {
          console.log(`   🔍 Would update: ${Object.keys(updates).join(', ')}`);
        }
        successCount++;
      } else {
        console.log(`   ⏭️  No translations needed or all failed`);
        failCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('════════════════════════════════════════════════════════');
    console.log(`   Total processed: ${ideas.length}`);
    console.log(`   ✅ Translated:   ${successCount}`);
    console.log(`   ⏭️  Skipped:      ${failCount}`);
    
    if (isDryRun) {
      console.log('\n🔍 This was a DRY-RUN. Run without --dry-run to apply changes.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
};

main();
