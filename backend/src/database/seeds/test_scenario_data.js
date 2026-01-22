/**
 * Test script to verify scenario data in PostgreSQL
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'smartfactory_db',
  user: 'smartfactory',
  password: 'smartfactory123'
});

async function testData() {
  console.log('\n📊 KIỂM TRA DỮ LIỆU SCENARIO TRONG DATABASE\n');
  console.log('='.repeat(70));
  
  // 1. Check ideas with final_resolution
  console.log('\n1️⃣ IDEAS VỚI FINAL RESOLUTION:');
  const ideasRes = await pool.query(`
    SELECT 
      id, title, status, 
      CASE WHEN final_resolution IS NOT NULL THEN 'YES' ELSE 'NO' END as has_resolution,
      SUBSTRING(final_resolution, 1, 100) as resolution_preview
    FROM ideas
    WHERE title ILIKE '%ca 3%' OR title ILIKE '%2670%' OR title ILIKE '%lắp ráp%'
    ORDER BY created_at
  `);
  
  ideasRes.rows.forEach((r, i) => {
    console.log(`\n   📌 [${i+1}] ${r.title.substring(0, 50)}...`);
    console.log(`       Status: ${r.status} | Has Resolution: ${r.has_resolution}`);
    if (r.resolution_preview) {
      console.log(`       Preview: ${r.resolution_preview}...`);
    }
  });
  
  // 2. Check responses with is_final_resolution
  console.log('\n\n2️⃣ RESPONSES VỚI IS_FINAL_RESOLUTION:');
  const responsesRes = await pool.query(`
    SELECT 
      i.title,
      ir.response_type,
      ir.is_final_resolution,
      SUBSTRING(ir.response, 1, 100) as response_preview,
      u.full_name as responder
    FROM idea_responses ir
    JOIN ideas i ON ir.idea_id = i.id
    JOIN users u ON ir.user_id = u.id
    WHERE ir.is_final_resolution = true
    ORDER BY ir.created_at
  `);
  
  responsesRes.rows.forEach((r, i) => {
    console.log(`\n   ✨ [${i+1}] ${r.title.substring(0, 40)}...`);
    console.log(`       By: ${r.responder} | Type: ${r.response_type}`);
    console.log(`       Response: ${r.response_preview}...`);
  });
  
  // 3. Check history/transitions
  console.log('\n\n3️⃣ LỊCH SỬ TRẠNG THÁI (idea_status_transitions):');
  const transRes = await pool.query(`
    SELECT 
      i.title,
      COUNT(*) as transition_count,
      string_agg(DISTINCT ist.to_stage, ' → ') as stages
    FROM idea_status_transitions ist
    JOIN ideas i ON ist.idea_id = i.id
    GROUP BY i.id, i.title
    ORDER BY transition_count DESC
    LIMIT 6
  `);
  
  transRes.rows.forEach((r) => {
    console.log(`   📜 ${r.title.substring(0, 40)}... (${r.transition_count} transitions)`);
    console.log(`      Stages: ${r.stages}`);
  });
  
  // 4. Count total data
  console.log('\n\n4️⃣ THỐNG KÊ TỔNG:');
  const statsRes = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM ideas WHERE final_resolution IS NOT NULL) as ideas_with_resolution,
      (SELECT COUNT(*) FROM idea_responses WHERE is_final_resolution = true) as final_responses,
      (SELECT COUNT(*) FROM idea_status_transitions) as total_transitions,
      (SELECT COUNT(*) FROM idea_history) as total_history
  `);
  
  const stats = statsRes.rows[0];
  console.log(`   Ideas với Final Resolution: ${stats.ideas_with_resolution}`);
  console.log(`   Responses đánh dấu is_final: ${stats.final_responses}`);
  console.log(`   Total status transitions: ${stats.total_transitions}`);
  console.log(`   Total history records: ${stats.total_history}`);
  
  // 5. Check Scenario 4 detail (Ekanban 2670)
  console.log('\n\n5️⃣ CHI TIẾT SCENARIO 4 (Ekanban 2670):');
  const scenario4 = await pool.query(`
    SELECT 
      id, title, description, final_resolution
    FROM ideas
    WHERE title ILIKE '%2670%' AND status = 'implemented'
    LIMIT 1
  `);
  
  if (scenario4.rows.length > 0) {
    const s4 = scenario4.rows[0];
    console.log(`\n   📌 Title: ${s4.title}`);
    console.log(`\n   📝 Description:\n${s4.description.split('\n').map(l => '      ' + l).join('\n')}`);
    console.log(`\n   ✅ Final Resolution:\n${s4.final_resolution.split('\n').map(l => '      ' + l).join('\n')}`);
    
    // Get responses for scenario 4
    const s4Responses = await pool.query(`
      SELECT 
        ir.response,
        ir.is_final_resolution,
        u.full_name,
        ir.created_at
      FROM idea_responses ir
      JOIN users u ON ir.user_id = u.id
      WHERE ir.idea_id = $1
      ORDER BY ir.created_at
    `, [s4.id]);
    
    console.log('\n   💬 Responses:');
    s4Responses.rows.forEach((r, i) => {
      console.log(`\n      [${i+1}] ${r.full_name} ${r.is_final_resolution ? '⭐FINAL' : ''}`);
      console.log(`          ${r.response.substring(0, 150)}...`);
    });
  }
  
  console.log('\n\n✅ Data verification completed!\n');
  await pool.end();
}

testData().catch(err => {
  console.error('Error:', err);
  pool.end();
});
