/**
 * whitebox_complete_seed.js
 * Complete seed data for White Box demo with full workflow history
 * 
 * This script creates comprehensive test data for White Box including:
 * - Ideas with various statuses (pending, under_review, approved, in_progress, implemented, rejected, on_hold)
 * - Opinions with various statuses
 * - Complete history records for each idea
 * - Support and reminder counts
 * - Responses/discussions
 * 
 * Usage: node src/database/seeds/whitebox_complete_seed.js
 */

// Load environment variables first
require('dotenv').config();

const { Pool } = require('pg');

// Detect if running inside Docker or from host machine
// When running from host, we need to use localhost and Docker's exposed port
const isRunningInDocker = process.env.DOCKER_ENV === 'true' || process.env.DB_HOST === 'database';

// Docker database configuration (from docker-compose.yml)
const DOCKER_DB_CONFIG = {
  host: 'localhost',      // From host machine, connect to localhost
  port: 5432,             // Docker exposes port 5432
  database: 'smartfactory_db',
  user: 'smartfactory',
  password: 'smartfactory123',
};

// Use Docker config when running from host, otherwise use env vars
const dbConfig = {
  host: isRunningInDocker ? (process.env.DB_HOST || 'database') : DOCKER_DB_CONFIG.host,
  port: parseInt(process.env.DB_PORT) || DOCKER_DB_CONFIG.port,
  database: process.env.DB_NAME || DOCKER_DB_CONFIG.database,
  user: isRunningInDocker ? (process.env.DB_USER || 'smartfactory') : DOCKER_DB_CONFIG.user,
  password: isRunningInDocker ? (process.env.DB_PASSWORD || 'smartfactory123') : DOCKER_DB_CONFIG.password,
};

console.log('📊 Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  hasPassword: !!dbConfig.password,
  mode: isRunningInDocker ? 'Docker internal' : 'Host → Docker',
});

const pool = new Pool(dbConfig);

// Simple query wrapper
const db = {
  query: async (text, params) => {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error('❌ Query error:', error.message);
      throw error;
    }
  },
  end: () => pool.end(),
};

// Sample data for complete White Box demo
const WHITEBOX_IDEAS = [
  // ===== IDEAS (Ý tưởng cải tiến) =====
  {
    ideabox_type: 'white',
    whitebox_subtype: 'idea',
    category: 'process_improvement',
    title: 'Ứng dụng AI Vision để kiểm tra chất lượng tự động',
    title_ja: '品質検査の自動化のためのAIビジョンの適用',
    description: 'Đề xuất triển khai hệ thống camera AI để tự động phát hiện lỗi trên sản phẩm trong quá trình sản xuất. Hệ thống sẽ sử dụng deep learning để nhận diện các khuyết tật như vết xước, lỗi hàn, thiếu linh kiện với độ chính xác >99%.',
    description_ja: '製造過程で製品の欠陥を自動検出するAIカメラシステムの導入を提案します。ディープラーニングを使用して、傷、溶接不良、部品欠損などの欠陥を99%以上の精度で検出します。',
    expected_benefit: 'Giảm 80% thời gian kiểm tra, tăng độ chính xác từ 95% lên 99.5%, tiết kiệm 200 triệu VND/tháng chi phí nhân công.',
    expected_benefit_ja: '検査時間80%削減、精度95%から99.5%に向上、人件費月2億VND節約。',
    status: 'implemented',
    difficulty: 'A',
    support_count: 45,
    remind_count: 0,
    history: [
      { action: 'created', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 30 },
      { action: 'under_review', note: 'Bắt đầu xem xét bởi Trưởng phòng Sản xuất', days_ago: 28 },
      { action: 'approved', note: 'Ý tưởng được phê duyệt. Đánh giá: Khả thi cao, ROI tốt', days_ago: 25 },
      { action: 'in_progress', note: 'Bắt đầu triển khai pilot tại Line 3', days_ago: 20 },
      { action: 'implemented', note: 'Triển khai thành công. Kết quả: Giảm 85% thời gian kiểm tra', days_ago: 5 },
    ],
    responses: [
      { role: 'admin', response: 'Ý tưởng rất hay! Chúng tôi sẽ ưu tiên xem xét.', days_ago: 29 },
      { role: 'admin', response: 'Đã liên hệ với nhà cung cấp camera AI. Dự kiến pilot trong 2 tuần.', days_ago: 22 },
      { role: 'user', response: 'Cảm ơn! Tôi có thể hỗ trợ trong quá trình test.', days_ago: 21 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'idea',
    category: 'cost_reduction',
    title: 'Tái sử dụng pallet nhựa từ nhà cung cấp',
    title_ja: 'サプライヤーからのプラスチックパレットの再利用',
    description: 'Xây dựng hệ thống thu hồi và tái sử dụng pallet nhựa từ nhà cung cấp linh kiện. Hiện tại các pallet này đang bị thải bỏ sau 1 lần sử dụng.',
    description_ja: '部品サプライヤーからのプラスチックパレットを回収・再利用するシステムを構築。現在、これらのパレットは1回使用後に廃棄されています。',
    expected_benefit: 'Tiết kiệm 80 triệu VND/tháng, giảm 2 tấn rác thải nhựa/tháng.',
    expected_benefit_ja: '月8000万VND節約、月2トンのプラスチック廃棄物削減。',
    status: 'approved',
    difficulty: 'B',
    support_count: 32,
    remind_count: 2,
    history: [
      { action: 'created', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 15 },
      { action: 'under_review', note: 'Đang xem xét tính khả thi', days_ago: 12 },
      { action: 'approved', note: 'Đã phê duyệt. Sẽ triển khai từ tháng sau.', days_ago: 7 },
    ],
    responses: [
      { role: 'admin', response: 'Ý tưởng tốt! Đang liên hệ với bộ phận mua hàng để đàm phán với nhà cung cấp.', days_ago: 10 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'idea',
    category: 'safety_enhancement',
    title: 'Hệ thống cảnh báo va chạm xe nâng',
    title_ja: 'フォークリフト衝突警告システム',
    description: 'Lắp đặt cảm biến proximity và đèn cảnh báo tại các góc khuất để cảnh báo khi xe nâng đến gần, giảm nguy cơ va chạm với người đi bộ.',
    description_ja: '死角にプロキシミティセンサーと警告灯を設置し、フォークリフトが接近した際に警告を発し、歩行者との衝突リスクを軽減。',
    expected_benefit: 'Giảm 95% nguy cơ va chạm, đảm bảo an toàn cho 500+ công nhân.',
    expected_benefit_ja: '衝突リスク95%削減、500人以上の作業員の安全確保。',
    status: 'under_review',
    difficulty: 'C',
    support_count: 58,
    remind_count: 5,
    history: [
      { action: 'created', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 7 },
      { action: 'under_review', note: 'Đang xem xét. Cần đánh giá chi phí lắp đặt.', days_ago: 5 },
    ],
    responses: [
      { role: 'admin', response: 'Đang liên hệ với nhà cung cấp thiết bị an toàn để báo giá.', days_ago: 4 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'idea',
    category: 'quality_improvement',
    title: 'Triển khai SPC (Statistical Process Control)',
    title_ja: 'SPC（統計的工程管理）の導入',
    description: 'Áp dụng phương pháp kiểm soát quá trình thống kê để theo dõi và cải thiện chất lượng sản phẩm theo thời gian thực.',
    description_ja: '統計的工程管理手法を適用し、リアルタイムで製品品質を監視・改善。',
    expected_benefit: 'Giảm 50% tỷ lệ sản phẩm lỗi, tiết kiệm 150 triệu VND/tháng.',
    expected_benefit_ja: '不良品率50%削減、月1億5000万VND節約。',
    status: 'in_progress',
    difficulty: 'A',
    support_count: 28,
    remind_count: 0,
    history: [
      { action: 'created', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 45 },
      { action: 'under_review', note: 'Đang xem xét với bộ phận QC', days_ago: 42 },
      { action: 'approved', note: 'Đã phê duyệt. Cần đào tạo nhân viên trước khi triển khai.', days_ago: 35 },
      { action: 'in_progress', note: 'Đang triển khai tại Line 1 và Line 2', days_ago: 20 },
    ],
    responses: [
      { role: 'admin', response: 'Đã hoàn thành đào tạo SPC cho 20 nhân viên QC.', days_ago: 25 },
      { role: 'admin', response: 'Kết quả pilot tại Line 1: Giảm 40% tỷ lệ lỗi. Đang mở rộng.', days_ago: 10 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'idea',
    category: 'process_improvement',
    title: 'Số hóa bảng theo dõi sản xuất',
    title_ja: '生産追跡ボードのデジタル化',
    description: 'Thay thế bảng theo dõi sản xuất giấy bằng màn hình LCD hiển thị real-time, kết nối với hệ thống MES.',
    description_ja: '紙の生産追跡ボードをリアルタイム表示のLCDスクリーンに置き換え、MESシステムと連携。',
    expected_benefit: 'Giảm 100% thời gian cập nhật thủ công, tăng độ chính xác dữ liệu.',
    expected_benefit_ja: '手動更新時間100%削減、データ精度向上。',
    status: 'on_hold',
    difficulty: 'B',
    support_count: 15,
    remind_count: 8,
    history: [
      { action: 'created', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 60 },
      { action: 'under_review', note: 'Đang xem xét', days_ago: 55 },
      { action: 'on_hold', note: 'Tạm hoãn do chờ nâng cấp hệ thống MES', days_ago: 50 },
    ],
    responses: [
      { role: 'admin', response: 'Ý tưởng tốt nhưng cần chờ dự án nâng cấp MES hoàn thành (dự kiến Q2/2026).', days_ago: 50 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'idea',
    category: 'cost_reduction',
    title: 'Tối ưu hóa lịch bảo trì máy móc',
    title_ja: '設備保全スケジュールの最適化',
    description: 'Áp dụng bảo trì dự đoán (predictive maintenance) dựa trên dữ liệu vận hành để giảm thời gian dừng máy không kế hoạch.',
    description_ja: '運転データに基づく予知保全を適用し、計画外のダウンタイムを削減。',
    expected_benefit: 'Giảm 60% thời gian dừng máy, tiết kiệm 300 triệu VND/năm.',
    expected_benefit_ja: 'ダウンタイム60%削減、年間3億VND節約。',
    status: 'rejected',
    difficulty: null,
    support_count: 12,
    remind_count: 0,
    history: [
      { action: 'created', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 40 },
      { action: 'under_review', note: 'Đang xem xét', days_ago: 38 },
      { action: 'rejected', note: 'Từ chối: Đã có dự án tương tự đang triển khai bởi bộ phận Bảo trì.', days_ago: 35 },
    ],
    responses: [
      { role: 'admin', response: 'Cảm ơn ý tưởng! Tuy nhiên, bộ phận Bảo trì đã có dự án predictive maintenance đang triển khai.', days_ago: 35 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'idea',
    category: 'safety_enhancement',
    title: 'Ứng dụng RFID theo dõi PPE',
    title_ja: 'PPE追跡のためのRFID適用',
    description: 'Gắn chip RFID vào thiết bị bảo hộ cá nhân để theo dõi việc sử dụng và nhắc nhở khi hết hạn.',
    description_ja: '個人保護具にRFIDチップを取り付け、使用状況を追跡し、有効期限切れ時に通知。',
    expected_benefit: 'Đảm bảo 100% tuân thủ quy định PPE, giảm nguy cơ tai nạn.',
    expected_benefit_ja: 'PPE規制100%遵守、事故リスク軽減。',
    status: 'pending',
    difficulty: null,
    support_count: 8,
    remind_count: 1,
    history: [
      { action: 'created', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 3 },
    ],
    responses: [],
  },

  // ===== OPINIONS (Ý kiến đóng góp) =====
  {
    ideabox_type: 'white',
    whitebox_subtype: 'opinion',
    category: 'workplace',
    title: 'Cải thiện chất lượng bữa ăn ca',
    title_ja: '食堂の食事品質の改善',
    description: 'Đề nghị cải thiện chất lượng bữa ăn ca, đặc biệt là thêm rau xanh và trái cây. Hiện tại thực đơn khá đơn điệu và thiếu dinh dưỡng.',
    description_ja: '食堂の食事品質の改善を提案します。特に野菜と果物を追加してください。現在のメニューは単調で栄養が不足しています。',
    expected_benefit: 'Cải thiện sức khỏe và tinh thần làm việc của công nhân.',
    expected_benefit_ja: '作業員の健康と仕事の士気を向上。',
    status: 'implemented',
    difficulty: 'D',
    support_count: 120,
    remind_count: 0,
    history: [
      { action: 'created', note: 'Ý kiến được gửi lên hệ thống', days_ago: 20 },
      { action: 'under_review', note: 'Đang xem xét với bộ phận Hành chính', days_ago: 18 },
      { action: 'approved', note: 'Đã phê duyệt. Sẽ cải thiện thực đơn từ tuần sau.', days_ago: 15 },
      { action: 'implemented', note: 'Đã triển khai: Thêm salad bar và trái cây tráng miệng', days_ago: 10 },
    ],
    responses: [
      { role: 'admin', response: 'Cảm ơn góp ý! Chúng tôi đã liên hệ với đơn vị cung cấp suất ăn.', days_ago: 17 },
      { role: 'admin', response: 'Từ tuần tới sẽ có salad bar và trái cây tráng miệng mỗi ngày.', days_ago: 12 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'opinion',
    category: 'environment',
    title: 'Tăng cường điều hòa khu vực sản xuất',
    title_ja: '生産エリアの空調強化',
    description: 'Khu vực Line 5 và Line 6 rất nóng vào buổi chiều, ảnh hưởng đến sức khỏe và năng suất công nhân. Đề nghị lắp thêm quạt công nghiệp hoặc điều hòa.',
    description_ja: 'ライン5と6は午後非常に暑く、作業員の健康と生産性に影響しています。工業用ファンまたはエアコンの追加設置を提案します。',
    expected_benefit: 'Cải thiện điều kiện làm việc, giảm stress nhiệt.',
    expected_benefit_ja: '労働条件の改善、熱ストレスの軽減。',
    status: 'under_review',
    difficulty: null,
    support_count: 85,
    remind_count: 12,
    history: [
      { action: 'created', note: 'Ý kiến được gửi lên hệ thống', days_ago: 10 },
      { action: 'under_review', note: 'Đang khảo sát thực tế tại Line 5 và Line 6', days_ago: 8 },
    ],
    responses: [
      { role: 'admin', response: 'Đã nhận góp ý. Bộ phận Cơ sở vật chất sẽ khảo sát trong tuần này.', days_ago: 9 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'opinion',
    category: 'communication',
    title: 'Tổ chức họp giao ban ngắn hơn',
    title_ja: '朝礼の短縮化',
    description: 'Đề nghị rút ngắn họp giao ban sáng từ 30 phút xuống 15 phút, tập trung vào các điểm quan trọng nhất.',
    description_ja: '朝礼を30分から15分に短縮し、最も重要な点に集中することを提案します。',
    expected_benefit: 'Tiết kiệm thời gian, tăng hiệu quả làm việc.',
    expected_benefit_ja: '時間の節約、業務効率の向上。',
    status: 'approved',
    difficulty: 'D',
    support_count: 95,
    remind_count: 0,
    history: [
      { action: 'created', note: 'Ý kiến được gửi lên hệ thống', days_ago: 25 },
      { action: 'under_review', note: 'Đang xem xét với các Trưởng phòng', days_ago: 22 },
      { action: 'approved', note: 'Đã phê duyệt. Áp dụng format mới từ đầu tháng sau.', days_ago: 18 },
    ],
    responses: [
      { role: 'admin', response: 'Góp ý hợp lý! Chúng tôi sẽ thử nghiệm format họp 15 phút.', days_ago: 20 },
    ],
  },
  {
    ideabox_type: 'white',
    whitebox_subtype: 'opinion',
    category: 'training',
    title: 'Tăng cường đào tạo kỹ năng mềm',
    title_ja: 'ソフトスキル研修の強化',
    description: 'Đề nghị tổ chức thêm các khóa đào tạo về giao tiếp, làm việc nhóm và quản lý thời gian cho công nhân.',
    description_ja: '作業員向けにコミュニケーション、チームワーク、時間管理の研修を追加開催することを提案します。',
    expected_benefit: 'Nâng cao kỹ năng làm việc, cải thiện môi trường làm việc.',
    expected_benefit_ja: '業務スキルの向上、職場環境の改善。',
    status: 'pending',
    difficulty: null,
    support_count: 42,
    remind_count: 3,
    history: [
      { action: 'created', note: 'Ý kiến được gửi lên hệ thống', days_ago: 5 },
    ],
    responses: [],
  },
];

async function seedWhiteBoxData() {
  console.log('🚀 Starting White Box complete seed...\n');

  try {
    // Get users and departments for reference
    const usersResult = await db.query('SELECT id, full_name FROM users LIMIT 10');
    const deptsResult = await db.query('SELECT id, name FROM departments');
    
    if (usersResult.rows.length === 0 || deptsResult.rows.length === 0) {
      console.error('❌ No users or departments found. Please seed users and departments first.');
      return;
    }

    const users = usersResult.rows;
    const departments = deptsResult.rows;
    
    console.log(`📋 Found ${users.length} users and ${departments.length} departments\n`);

    // Clear existing White Box data
    console.log('🗑️  Clearing existing White Box data...');
    
    // Check which tables exist
    const tableCheck = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('idea_history', 'idea_responses', 'idea_supports', 'idea_status_transitions')
    `);
    const existingTables = tableCheck.rows.map(r => r.table_name);
    console.log('   Found tables:', existingTables.join(', '));

    // Delete from related tables first
    if (existingTables.includes('idea_history')) {
      await db.query("DELETE FROM idea_history WHERE idea_id IN (SELECT id FROM ideas WHERE ideabox_type = 'white')");
    }
    if (existingTables.includes('idea_responses')) {
      await db.query("DELETE FROM idea_responses WHERE idea_id IN (SELECT id FROM ideas WHERE ideabox_type = 'white')");
    }
    if (existingTables.includes('idea_supports')) {
      await db.query("DELETE FROM idea_supports WHERE idea_id IN (SELECT id FROM ideas WHERE ideabox_type = 'white')");
    }
    if (existingTables.includes('idea_status_transitions')) {
      await db.query("DELETE FROM idea_status_transitions WHERE idea_id IN (SELECT id FROM ideas WHERE ideabox_type = 'white')");
    }
    
    // Delete ideas
    await db.query("DELETE FROM ideas WHERE ideabox_type = 'white'");
    console.log('✅ Cleared existing data\n');

    // Insert ideas
    for (const ideaData of WHITEBOX_IDEAS) {
      const submitter = users[Math.floor(Math.random() * users.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const reviewer = users[Math.floor(Math.random() * users.length)];

      // Calculate created_at based on history
      const oldestHistory = ideaData.history.reduce((max, h) => Math.max(max, h.days_ago), 0);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - oldestHistory);

      // Insert idea
      const ideaResult = await db.query(`
        INSERT INTO ideas (
          ideabox_type, whitebox_subtype, category, 
          title, title_ja, description, description_ja,
          expected_benefit, expected_benefit_ja,
          submitter_id, department_id, is_anonymous,
          status, difficulty, handler_level,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        ideaData.ideabox_type,
        ideaData.whitebox_subtype,
        ideaData.category,
        ideaData.title,
        ideaData.title_ja,
        ideaData.description,
        ideaData.description_ja,
        ideaData.expected_benefit,
        ideaData.expected_benefit_ja,
        submitter.id,
        department.id,
        false,
        ideaData.status,
        ideaData.difficulty,
        1,
        createdAt,
        new Date(),
      ]);

      const ideaId = ideaResult.rows[0].id;
      console.log(`✅ Created ${ideaData.whitebox_subtype}: "${ideaData.title.substring(0, 40)}..." [${ideaData.status}]`);

      // Insert history
      for (const historyItem of ideaData.history) {
        const historyDate = new Date();
        historyDate.setDate(historyDate.getDate() - historyItem.days_ago);
        
        await db.query(`
          INSERT INTO idea_history (idea_id, action, performed_by, details, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          ideaId,
          historyItem.action,
          reviewer.id,
          JSON.stringify({ note: historyItem.note }),
          historyDate,
        ]);
      }
      console.log(`   📜 Added ${ideaData.history.length} history records`);

      // Insert responses
      for (const response of ideaData.responses) {
        const responseDate = new Date();
        responseDate.setDate(responseDate.getDate() - response.days_ago);
        
        await db.query(`
          INSERT INTO idea_responses (idea_id, user_id, response, created_at)
          VALUES ($1, $2, $3, $4)
        `, [
          ideaId,
          response.role === 'admin' ? reviewer.id : submitter.id,
          response.response,
          responseDate,
        ]);
      }
      if (ideaData.responses.length > 0) {
        console.log(`   💬 Added ${ideaData.responses.length} responses`);
      }

      // Insert supports (random users) - uses idea_supports table with support_type
      const supportUsers = users.slice(0, Math.min(ideaData.support_count, users.length));
      for (let i = 0; i < Math.min(ideaData.support_count, supportUsers.length); i++) {
        try {
          await db.query(`
            INSERT INTO idea_supports (idea_id, user_id, support_type)
            VALUES ($1, $2, 'support')
            ON CONFLICT (idea_id, user_id, support_type) DO NOTHING
          `, [ideaId, supportUsers[i].id]);
        } catch (e) {
          // Ignore duplicate key errors
        }
      }
      // Update support_count on ideas table
      if (ideaData.support_count > 0) {
        await db.query('UPDATE ideas SET support_count = $1 WHERE id = $2', [ideaData.support_count, ideaId]);
        console.log(`   👍 Added ${Math.min(ideaData.support_count, supportUsers.length)} supports`);
      }

      // Insert reminders (random users) - uses idea_supports table with support_type = 'remind'
      const remindUsers = users.slice(0, Math.min(ideaData.remind_count, users.length));
      for (let i = 0; i < Math.min(ideaData.remind_count, remindUsers.length); i++) {
        try {
          await db.query(`
            INSERT INTO idea_supports (idea_id, user_id, support_type)
            VALUES ($1, $2, 'remind')
            ON CONFLICT (idea_id, user_id, support_type) DO NOTHING
          `, [ideaId, remindUsers[i].id]);
        } catch (e) {
          // Ignore duplicate key errors
        }
      }
      // Update remind_count on ideas table
      if (ideaData.remind_count > 0) {
        await db.query('UPDATE ideas SET remind_count = $1 WHERE id = $2', [ideaData.remind_count, ideaId]);
        console.log(`   🔔 Added ${Math.min(ideaData.remind_count, remindUsers.length)} reminders`);
      }

      console.log('');
    }

    // Summary
    const statsResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM ideas
      WHERE ideabox_type = 'white'
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n📊 White Box Seed Summary:');
    console.log('========================');
    for (const row of statsResult.rows) {
      console.log(`   ${row.status}: ${row.count} items`);
    }

    const totalResult = await db.query("SELECT COUNT(*) FROM ideas WHERE ideabox_type = 'white'");
    console.log(`\n✅ Total White Box items created: ${totalResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding White Box data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedWhiteBoxData()
    .then(async () => {
      console.log('\n🎉 White Box seed completed successfully!');
      await db.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ White Box seed failed:', error);
      await db.end();
      process.exit(1);
    });
}

module.exports = { seedWhiteBoxData };
