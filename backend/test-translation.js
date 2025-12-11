const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testTranslationAPI() {
  console.log('\n' + '='.repeat(60));
  log(colors.cyan, '🧪 TESTING TRANSLATION SYSTEM');
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Get Vietnamese translations
    log(colors.blue, '📋 Test 1: Get Vietnamese static translations');
    const viTranslations = await axios.get(`${API_BASE}/translations/vi`);
    log(colors.green, `✅ Success: ${viTranslations.data.count} translations loaded`);
    console.log('Sample:', Object.entries(viTranslations.data.data).slice(0, 3));
    console.log('');

    // Test 2: Get Japanese translations
    log(colors.blue, '📋 Test 2: Get Japanese static translations');
    const jaTranslations = await axios.get(`${API_BASE}/translations/ja`);
    log(colors.green, `✅ Success: ${jaTranslations.data.count} translations loaded`);
    console.log('Sample:', Object.entries(jaTranslations.data.data).slice(0, 3));
    console.log('');

    // Test 3: Translate single text (mock mode)
    log(colors.blue, '📋 Test 3: Translate single text (mock mode)');
    const singleTranslate = await axios.post(`${API_BASE}/translations/translate`, {
      text: 'Báo cáo sự cố nghiêm trọng tại line sản xuất',
      sourceLang: 'vi',
      targetLang: 'ja',
      useMock: true
    });
    log(colors.green, '✅ Translation result:');
    console.log('Original:', singleTranslate.data.data.original);
    console.log('Translated:', singleTranslate.data.data.translated);
    console.log('Method:', singleTranslate.data.data.method);
    console.log('');

    // Test 4: Batch translate (mock mode)
    log(colors.blue, '📋 Test 4: Batch translate multiple texts');
    const batchTexts = [
      'Sự cố máy móc',
      'Cần hỗ trợ khẩn cấp',
      'Đang xử lý vấn đề'
    ];
    const batchTranslate = await axios.post(`${API_BASE}/translations/batch`, {
      texts: batchTexts,
      sourceLang: 'vi',
      targetLang: 'ja',
      useMock: true
    });
    log(colors.green, `✅ Translated ${batchTranslate.data.count} texts:`);
    batchTranslate.data.data.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.original} → ${item.translated}`);
    });
    console.log('');

    // Test 5: Try real Google Translate API
    log(colors.blue, '📋 Test 5: Test real Google Translate API');
    try {
      const realTranslate = await axios.get(`${API_BASE}/translations/test/api`);
      if (realTranslate.data.success) {
        log(colors.green, '✅ Google Translate API is working!');
        console.log('Test result:', realTranslate.data.test);
      } else {
        log(colors.yellow, '⚠️  Google Translate API not available, using mock mode');
        console.log('Message:', realTranslate.data.message);
      }
    } catch (error) {
      log(colors.yellow, '⚠️  Google Translate API test failed, but mock mode is working');
    }
    console.log('');

    // Test 6: Translation stats
    log(colors.blue, '📋 Test 6: Get translation cache statistics');
    const stats = await axios.get(`${API_BASE}/translations/stats/overview`);
    log(colors.green, '✅ Translation statistics:');
    console.log(stats.data.data);
    console.log('');

    // Summary
    console.log('='.repeat(60));
    log(colors.green, '✅ ALL TESTS PASSED!');
    log(colors.cyan, '📝 Translation system is ready to use');
    console.log('='.repeat(60) + '\n');

    log(colors.yellow, '💡 Next steps:');
    console.log('1. Run database migration: psql -U your_user -d smartfactory_db -f backend/src/database/migrations/add_translation_tables.sql');
    console.log('2. Start backend: cd backend && npm run dev');
    console.log('3. Start frontend: cd frontend && npm run dev');
    console.log('4. Click language switcher (🇻🇳 VI / 🇯🇵 JA) in header');
    console.log('');

  } catch (error) {
    log(colors.red, '❌ TEST FAILED');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      log(colors.red, '❌ Cannot connect to backend server');
      log(colors.yellow, '💡 Make sure backend is running on http://localhost:3000');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run tests
testTranslationAPI();
