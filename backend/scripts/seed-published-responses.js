/**
 * Seed Script for Published Responses (Pink Box)
 * 
 * Run: node scripts/seed-published-responses.js
 * 
 * This script creates sample published responses for Pink Box ideas
 * to demonstrate the public board feature on both App and Web.
 */

// Import existing database configuration
const db = require('../src/config/database');

// Sample published responses data
const publishedResponsesData = [
  {
    title: 'Đề xuất cải thiện điều kiện nhà ăn',
    description: 'Nhà ăn hiện tại khá chật hẹp vào giờ cao điểm. Đề xuất mở rộng khu vực ngồi ăn hoặc điều chỉnh giờ ăn trưa theo ca để giảm tải.',
    ideabox_type: 'pink',
    category: 'productivity',
    status: 'implemented',
    is_anonymous: true,
    is_published: true,
    published_response: 'Cảm ơn ý kiến đóng góp của bạn. Ban Quản lý đã họp và quyết định:\n\n1. Mở rộng thêm 50 chỗ ngồi tại khu vực nhà ăn B\n2. Điều chỉnh giờ ăn trưa: Ca A từ 11:30-12:00, Ca B từ 12:00-12:30\n3. Bổ sung thêm 2 quầy phục vụ\n\nDự kiến hoàn thành trong tháng 2/2026.',
    published_response_ja: 'ご意見ありがとうございます。経営陣で検討した結果、以下の対応を決定しました：\n\n1. 食堂Bエリアに50席追加\n2. 昼食時間の調整：Aシフト 11:30-12:00、Bシフト 12:00-12:30\n3. サービスカウンターを2つ追加\n\n2026年2月完了予定です。',
    published_at: '2026-01-15'
  },
  {
    title: 'Vấn đề về đồng phục mùa đông',
    description: 'Đồng phục mùa đông hiện tại khá mỏng, không đủ ấm khi làm việc ca đêm. Mong công ty xem xét cấp thêm áo ấm hoặc cho phép mặc thêm áo bên ngoài.',
    ideabox_type: 'pink',
    category: 'safety_enhancement',
    status: 'implemented',
    is_anonymous: true,
    is_published: true,
    published_response: 'Công ty đã ghi nhận phản ánh và có giải pháp như sau:\n\n• Cấp phát áo khoác ấm cho toàn bộ nhân viên ca đêm (hoàn thành ngày 20/01/2026)\n• Cho phép mặc thêm áo giữ nhiệt bên trong đồng phục\n• Lắp đặt thêm máy sưởi tại các khu vực làm việc ngoài trời\n\nMọi thắc mắc xin liên hệ phòng Nhân sự.',
    published_response_ja: '会社として以下の対策を実施します：\n\n• 夜勤全員に防寒ジャケット支給（2026年1月20日完了）\n• 制服の下にインナーウェア着用許可\n• 屋外作業エリアにヒーター追加設置\n\nご質問は人事部までお問い合わせください。',
    published_at: '2026-01-14'
  },
  {
    title: 'Góp ý về quy trình kiểm tra chất lượng',
    description: 'Quy trình QC hiện tại có một số bước trùng lặp gây mất thời gian. Đề xuất tích hợp bước kiểm tra ngoại quan và kiểm tra kích thước vào cùng một công đoạn.',
    ideabox_type: 'pink',
    category: 'quality_improvement',
    status: 'implemented',
    is_anonymous: true,
    is_published: true,
    published_response: 'Cảm ơn đề xuất cải tiến quy trình. Phòng QA/QC đã xem xét và:\n\n✓ Đồng ý tích hợp 2 bước kiểm tra như đề xuất\n✓ Cập nhật SOP mới có hiệu lực từ 01/02/2026\n✓ Dự kiến giảm 15% thời gian kiểm tra mỗi lô hàng\n\nĐây là đóng góp rất giá trị. Nhân viên đề xuất sẽ được khen thưởng theo chính sách Kaizen.',
    published_response_ja: 'プロセス改善のご提案ありがとうございます。QA/QC部門で検討した結果：\n\n✓ 提案通り2つの検査工程を統合します\n✓ 新SOPは2026年2月1日より施行\n✓ ロットあたりの検査時間を15%短縮見込み\n\n貴重なご提案です。提案者はカイゼン方針に基づき表彰されます。',
    published_at: '2026-01-12'
  },
  {
    title: 'Yêu cầu cải thiện khu vực nghỉ ngơi',
    description: 'Khu vực nghỉ ngơi thiếu điều hòa, máy bán nước tự động thường xuyên hết hàng. Đề xuất bổ sung tiện nghi để nhân viên có thể nghỉ ngơi tốt hơn.',
    ideabox_type: 'pink',
    category: 'productivity',
    status: 'approved',
    is_anonymous: true,
    is_published: true,
    published_response: 'Ban Quản lý ghi nhận và cam kết cải thiện:\n\n🔹 Lắp đặt thêm 2 điều hòa (hoàn thành 25/01/2026)\n🔹 Ký hợp đồng với nhà cung cấp máy bán hàng mới, đảm bảo bổ sung hàng 2 lần/ngày\n🔹 Bổ sung ghế sofa và bàn uống nước\n\nChúng tôi luôn lắng nghe ý kiến để tạo môi trường làm việc tốt nhất.',
    published_response_ja: '経営陣として以下の改善をお約束します：\n\n🔹 エアコン2台追加設置（2026年1月25日完了）\n🔹 新しい自動販売機業者と契約、1日2回補充保証\n🔹 ソファと給水テーブル追加\n\n最高の職場環境を作るため、ご意見をお待ちしております。',
    published_at: '2026-01-16'
  },
  {
    title: 'Đề xuất chương trình đào tạo nâng cao',
    description: 'Mong muốn công ty tổ chức thêm các khóa đào tạo kỹ năng chuyên môn như PLC, lập trình robot để nhân viên có cơ hội phát triển.',
    ideabox_type: 'pink',
    category: 'productivity',
    status: 'implemented',
    is_anonymous: true,
    is_published: true,
    published_response: 'Công ty đánh giá cao tinh thần học hỏi của các bạn! Kế hoạch đào tạo Q1/2026:\n\n📚 Khóa PLC cơ bản: 15-17/02/2026 (20 slots)\n📚 Khóa lập trình Robot: 01-05/03/2026 (15 slots)\n📚 Khóa Lean Manufacturing: 20-21/03/2026 (30 slots)\n\nĐăng ký qua hệ thống HR Portal. Chi phí do công ty tài trợ 100%.',
    published_response_ja: '学習意欲を高く評価します！2026年第1四半期の研修計画：\n\n📚 PLC基礎コース：2026年2月15-17日（20名）\n📚 ロボットプログラミング：2026年3月1-5日（15名）\n📚 リーン製造：2026年3月20-21日（30名）\n\nHR Portalから登録してください。費用は会社が100%負担します。',
    published_at: '2026-01-13'
  },
  {
    title: 'Phản ánh về việc tăng ca',
    description: 'Gần đây tăng ca liên tục, nhân viên khá mệt mỏi. Mong công ty xem xét điều chỉnh kế hoạch sản xuất hoặc tuyển thêm người.',
    ideabox_type: 'pink',
    category: 'safety_enhancement',
    status: 'approved',
    is_anonymous: true,
    is_published: true,
    published_response: 'Công ty hiểu và chia sẻ với các bạn. Các biện pháp đã triển khai:\n\n⚡ Giới hạn tăng ca tối đa 2 giờ/ngày, không quá 4 ngày/tuần\n⚡ Tuyển bổ sung 30 công nhân mới (dự kiến hoàn thành tháng 2/2026)\n⚡ Điều chỉnh lịch sản xuất để phân bổ đều công việc\n⚡ Tăng phụ cấp tăng ca thêm 20%\n\nSức khỏe nhân viên là ưu tiên hàng đầu của công ty.',
    published_response_ja: '皆さんの状況を理解し、共感します。以下の対策を実施しています：\n\n⚡ 残業は1日2時間まで、週4日までに制限\n⚡ 新規作業員30名採用予定（2026年2月完了見込み）\n⚡ 生産スケジュール調整で作業負荷を平準化\n⚡ 残業手当を20%増額\n\n従業員の健康が会社の最優先事項です。',
    published_at: '2026-01-17'
  }
];

async function seedPublishedResponses() {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    console.log('✅ Connected to PostgreSQL');

    console.log('\n🔄 Seeding published responses...');
    
    // Get first admin user for published_by
    const adminResult = await db.query(
      "SELECT id FROM users WHERE role IN ('admin', 'general_manager', 'manager') LIMIT 1"
    );
    const adminId = adminResult.rows[0]?.id || null;
    
    // Get first department 
    const deptResult = await db.query("SELECT id FROM departments LIMIT 1");
    const deptId = deptResult.rows[0]?.id || null;

    // Get first user for submitter
    const userResult = await db.query("SELECT id FROM users LIMIT 1");
    const userId = userResult.rows[0]?.id || null;

    if (!userId) {
      console.log('❌ No users found in database. Please create users first.');
      return;
    }
    
    for (const data of publishedResponsesData) {
      // Check if similar idea already exists
      const existing = await db.query(
        "SELECT id FROM ideas WHERE title = $1 AND ideabox_type = 'pink' AND is_published = true",
        [data.title]
      );
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping (already exists): ${data.title.substring(0, 40)}...`);
        continue;
      }
      
      // Insert new idea
      await db.query(`
        INSERT INTO ideas (
          title, description, ideabox_type, category, status,
          is_anonymous, department_id, submitter_id, is_published,
          published_response, published_response_ja, published_at, published_by,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        data.title,
        data.description,
        data.ideabox_type,
        data.category,
        data.status,
        data.is_anonymous,
        deptId,
        userId,
        data.is_published,
        data.published_response,
        data.published_response_ja,
        data.published_at,
        adminId
      ]);
      
      console.log(`✅ Created: ${data.title.substring(0, 50)}...`);
    }

    // Count total published responses
    const countResult = await db.query(
      "SELECT COUNT(*) as count FROM ideas WHERE ideabox_type = 'pink' AND is_published = true"
    );
    console.log(`\n📊 Total published Pink Box responses: ${countResult.rows[0].count}`);
    
    console.log('\n🎉 Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    console.log('🔌 Done');
    process.exit(0);
  }
}

// Run the seed function
seedPublishedResponses();
