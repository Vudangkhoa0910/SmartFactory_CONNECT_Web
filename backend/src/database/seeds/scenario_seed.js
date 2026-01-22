/**
 * scenario_seed.js
 * Seed data for 4 scenarios with EXACT content from scenario files
 * Used for RAG duplicate detection demo
 * 
 * SCENARIOS:
 * 1. Bữa ăn ca 3 - Thực đơn ít món, đồ ăn nguội
 * 2. Lỗi chất lượng tăng ca 3 - NG tăng vào ca đêm  
 * 3. Lỗi thao tác lắp ráp ca 3 - Mệt mỏi, tỷ lệ lỗi tăng
 * 4. Ekanban mẫu mã 2670 - Bị cũ mờ chữ
 * 
 * Usage: node src/database/seeds/scenario_seed.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Database configuration
const isRunningInDocker = process.env.DOCKER_ENV === 'true' || process.env.DB_HOST === 'database';
const DOCKER_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'smartfactory_db',
  user: 'smartfactory',
  password: 'smartfactory123',
};

const dbConfig = {
  host: isRunningInDocker ? (process.env.DB_HOST || 'database') : DOCKER_DB_CONFIG.host,
  port: parseInt(process.env.DB_PORT) || DOCKER_DB_CONFIG.port,
  database: process.env.DB_NAME || DOCKER_DB_CONFIG.database,
  user: isRunningInDocker ? (process.env.DB_USER || 'smartfactory') : DOCKER_DB_CONFIG.user,
  password: isRunningInDocker ? (process.env.DB_PASSWORD || 'smartfactory123') : DOCKER_DB_CONFIG.password,
};

const pool = new Pool(dbConfig);
const db = {
  query: async (text, params) => pool.query(text, params),
  end: () => pool.end(),
};

// ========================================================================
// SCENARIO 1: Bữa ăn ca 3
// Source: scenario1.md
// ========================================================================
const SCENARIO_1 = {
  ideabox_type: 'white',
  whitebox_subtype: 'opinion',
  category: 'workplace',
  title: 'Thực đơn ăn ca 3 ít món, đồ ăn nguội không đảm bảo chất lượng',
  title_ja: 'シフト3の食事メニューが少なく、冷たい食事で品質が保証されていない',
  
  // EXACT description from scenario1.md
  description: `Hiện trạng:
- Thực đơn ăn ca 3 ít món
- Đồ ăn nguội, không đảm bảo chất lượng

Ảnh hưởng:
- Ảnh hưởng sức khoẻ người lao động
- Giảm tinh thần làm việc, tăng nguy cơ lỗi trong sản xuất ca đêm

Đề nghị bố trí phòng GA (General Affairs) có người giám sát suất ăn ca 3 nhằm:
- Đảm bảo đủ món
- Đảm bảo đồ ăn nóng
- Đảm bảo an toàn vệ sinh thực phẩm`,
  
  description_ja: `現状:
- シフト3の食事メニューが少ない
- 食事が冷たく、品質が保証されていない

影響:
- 労働者の健康に影響
- 仕事のモチベーション低下、夜勤での生産エラーリスク増加

GA（総務）部門にシフト3の食事を監督する担当者を配置することを提案:
- 十分なメニューを確保
- 温かい食事を確保
- 食品衛生安全を確保`,

  expected_benefit: 'Cải thiện sức khỏe và tinh thần làm việc của công nhân ca 3, giảm nguy cơ lỗi trong sản xuất',
  expected_benefit_ja: 'シフト3作業員の健康と仕事のモチベーション向上、生産エラーリスク軽減',
  
  status: 'implemented',
  difficulty: 'D',
  
  // EXACT final resolution from scenario1.md
  final_resolution: `GIẢI PHÁP ĐÃ TRIỂN KHAI:

1. Tham chiếu giải pháp trong quá khứ:
   - GA đã từng bố trí người trực ca 3
   - Chất lượng bữa ăn ca 3 đã được cải thiện
   - Người lao động phản hồi tốt, không phát sinh khiếu nại

2. Chuẩn hoá giải pháp:
   - Ban hành quy trình/SOP quản lý suất ăn ca 3
   - Chỉ định GA chịu trách nhiệm (Owner)
   - Checklist kiểm tra suất ăn ca 3 mỗi ngày
   - Báo cáo tuần/tháng

3. Kết quả:
   - Đã tái triển khai phương án GA trực ca 3
   - Chất lượng bữa ăn được cải thiện
   - Không còn khiếu nại từ công nhân`,

  final_resolution_ja: `実施済み解決策:

1. 過去の解決策参照:
   - GAがシフト3の担当者を配置していた
   - シフト3の食事品質が改善された
   - 労働者から良いフィードバック、苦情なし

2. 解決策の標準化:
   - シフト3食事管理のSOP発行
   - GA責任者を指定（オーナー）
   - 毎日のシフト3食事チェックリスト
   - 週次/月次レポート

3. 結果:
   - GAシフト3担当者方式を再実施
   - 食事品質が改善
   - 作業員からの苦情なし`,

  support_count: 120,
  remind_count: 0,
  
  history: [
    { action: 'submitted', from_stage: null, to_stage: 'submitted', note: 'Ý kiến được gửi lên hệ thống', days_ago: 30 },
    { action: 'status_changed', from_stage: 'submitted', to_stage: 'under_review', note: 'Bắt đầu xem xét bởi phòng GA', days_ago: 28 },
    { action: 'status_changed', from_stage: 'under_review', to_stage: 'approved', note: 'Đã phê duyệt. Tham chiếu giải pháp quá khứ: GA đã từng bố trí người trực ca 3 với kết quả tốt', days_ago: 25 },
    { action: 'status_changed', from_stage: 'approved', to_stage: 'in_progress', note: 'Bắt đầu triển khai: Raise lại vấn đề tới GA, Quản lý sản xuất, HR/HSE', days_ago: 20 },
    { action: 'status_changed', from_stage: 'in_progress', to_stage: 'implemented', note: 'Triển khai thành công. Đã chuẩn hoá: Ban hành SOP, chỉ định Owner, tạo checklist hàng ngày', days_ago: 10 },
  ],
  
  responses: [
    { 
      role: 'supervisor', 
      response: 'Đã nhận góp ý. Đang xem xét với bộ phận GA và HR.', 
      days_ago: 29,
      is_final: false 
    },
    { 
      role: 'manager', 
      response: 'Tham chiếu giải pháp quá khứ: GA đã từng bố trí người trực ca 3 và chất lượng bữa ăn được cải thiện. Đề xuất tái triển khai.', 
      days_ago: 26,
      is_final: false 
    },
    { 
      role: 'admin', 
      response: 'Đã liên hệ GA. Sẽ raise lại vấn đề và đề xuất chuẩn hoá giải pháp.', 
      days_ago: 22,
      is_final: false 
    },
    { 
      role: 'manager', 
      response: `CHỐT PHƯƠNG ÁN THỰC HIỆN:
1. Tái triển khai phương án GA trực ca 3
2. Ban hành SOP quản lý suất ăn ca 3
3. Chỉ định GA làm Owner
4. Tạo checklist kiểm tra hàng ngày
5. Báo cáo tuần/tháng để duy trì`, 
      days_ago: 15,
      is_final: true 
    },
    { 
      role: 'admin', 
      response: 'Đã triển khai thành công. Chất lượng bữa ăn ca 3 được cải thiện, không còn khiếu nại.', 
      days_ago: 10,
      is_final: false 
    },
  ],
};

// ========================================================================
// SCENARIO 2: Lỗi chất lượng tăng ca 3
// Source: scenario2.md
// ========================================================================
const SCENARIO_2 = {
  ideabox_type: 'white',
  whitebox_subtype: 'opinion',
  category: 'quality_improvement',
  title: 'Lỗi chất lượng NG tăng vào ca đêm (ca 3)',
  title_ja: 'シフト3（夜勤）でNGの品質不良が増加',
  
  // EXACT from scenario2.md
  description: `Vấn đề: NG tăng vào ca đêm (ca 3)
- Tỷ lệ lỗi chất lượng tăng đáng kể trong ca 3
- Ảnh hưởng đến chất lượng sản phẩm và năng suất

Đề xuất: Bố trí QC trực ca 3 để giám sát chất lượng`,
  
  description_ja: `問題: シフト3（夜勤）でNGが増加
- シフト3で品質不良率が大幅に増加
- 製品品質と生産性に影響

提案: 品質監視のためシフト3にQC担当者を配置`,

  expected_benefit: 'Giảm tỷ lệ NG trong ca 3, đảm bảo chất lượng sản phẩm',
  expected_benefit_ja: 'シフト3のNG率削減、製品品質確保',
  
  status: 'implemented',
  difficulty: 'C',
  
  // EXACT final resolution from scenario2.md  
  final_resolution: `GIẢI PHÁP ĐÃ TRIỂN KHAI:

1. Giải pháp cũ đã áp dụng thành công:
   - Bố trí QC trực ca 3

2. Vấn đề hiện tại:
   - QC không còn trực ca 3

3. Hành động khắc phục:
   - Raise lại vấn đề
   - Đưa vào tiêu chuẩn nhân sự ca 3
   - Đảm bảo QC luôn có mặt trong ca 3`,

  final_resolution_ja: `実施済み解決策:

1. 成功した過去の解決策:
   - シフト3にQC担当者を配置

2. 現在の問題:
   - シフト3にQCが配置されていない

3. 是正措置:
   - 問題を再度提起
   - シフト3の人員基準に組み込む
   - シフト3に常にQCを配置することを確保`,

  support_count: 85,
  remind_count: 5,
  
  history: [
    { action: 'submitted', from_stage: null, to_stage: 'submitted', note: 'Ý kiến được gửi lên hệ thống', days_ago: 25 },
    { action: 'status_changed', from_stage: 'submitted', to_stage: 'under_review', note: 'Đang xem xét với bộ phận QC và HR', days_ago: 23 },
    { action: 'status_changed', from_stage: 'under_review', to_stage: 'approved', note: 'Đã phê duyệt. Giải pháp: Raise lại + đưa vào tiêu chuẩn nhân sự ca 3', days_ago: 20 },
    { action: 'status_changed', from_stage: 'approved', to_stage: 'in_progress', note: 'Đang triển khai: Cập nhật tiêu chuẩn nhân sự', days_ago: 15 },
    { action: 'status_changed', from_stage: 'in_progress', to_stage: 'implemented', note: 'Đã triển khai: QC đã được bố trí lại ca 3, đưa vào tiêu chuẩn nhân sự', days_ago: 8 },
  ],
  
  responses: [
    { 
      role: 'supervisor', 
      response: 'Xác nhận vấn đề. Trước đây đã có QC trực ca 3 và hiệu quả tốt.', 
      days_ago: 24,
      is_final: false 
    },
    { 
      role: 'manager', 
      response: 'Đã raise lại với HR về việc bố trí QC ca 3. Đề xuất đưa vào tiêu chuẩn nhân sự.', 
      days_ago: 21,
      is_final: false 
    },
    { 
      role: 'admin', 
      response: `CHỐT PHƯƠNG ÁN THỰC HIỆN:
1. Bố trí lại QC trực ca 3
2. Đưa vào tiêu chuẩn nhân sự ca 3 (bắt buộc có QC)
3. Theo dõi tỷ lệ NG hàng tuần`, 
      days_ago: 18,
      is_final: true 
    },
    { 
      role: 'admin', 
      response: 'Hoàn thành triển khai. Tỷ lệ NG ca 3 đã giảm 40%.', 
      days_ago: 8,
      is_final: false 
    },
  ],
};

// ========================================================================
// SCENARIO 3: Lỗi thao tác lắp ráp ca 3
// Source: scenario3.md
// ========================================================================
const SCENARIO_3 = {
  ideabox_type: 'white',
  whitebox_subtype: 'idea',
  category: 'process_improvement',
  title: 'Giảm lỗi thao tác lắp ráp ca 3 do công nhân mệt mỏi',
  title_ja: 'シフト3の作業員の疲労による組立作業ミスの削減',
  
  // EXACT from scenario3.md
  description: `Công đoạn: Lắp ráp (Assembly Line)

Vấn đề:
Ca 3 người lao động mệt mỏi, dẫn đến tỷ lệ lỗi thao tác lắp ráp tăng.

Giải pháp quá khứ:
Đã từng cải thiện bữa ăn ca 3 và bổ sung hướng dẫn thao tác trực quan để giảm mệt mỏi và hỗ trợ công nhân. Giải pháp này có hiệu quả trong thời gian đầu nhưng phụ thuộc nhiều vào việc duy trì thủ công, nên không ổn định lâu dài.`,
  
  description_ja: `工程: 組立（アセンブリライン）

問題:
シフト3の労働者が疲労し、組立作業のミス率が増加。

過去の解決策:
シフト3の食事改善と視覚的な作業ガイドを追加し、疲労を軽減し作業員をサポート。この解決策は初期には効果的でしたが、手動での維持に依存するため、長期的には安定しませんでした。`,

  expected_benefit: 'Giảm tỷ lệ lỗi lắp ráp ca 3 một cách ổn định và lâu dài',
  expected_benefit_ja: 'シフト3の組立ミス率を安定的かつ長期的に削減',
  
  status: 'implemented',
  difficulty: 'B',
  
  // EXACT final resolution from scenario3.md
  final_resolution: `GIẢI PHÁP THAY THẾ ĐÃ TRIỂN KHAI:

Chuyển sang kiểm soát bằng quy trình:
1. Chuẩn hoá thao tác lắp ráp theo từng bước rõ ràng
2. Bố trí linh kiện cố định và phân biệt dễ nhận biết
3. Chỉ cho phép thực hiện đúng bước trước khi chuyển sang bước tiếp theo (Poka-Yoke)

Kết quả:
- Ngăn lỗi ngay tại công đoạn
- Đảm bảo chất lượng ổn định cho ca 3
- Không phụ thuộc vào duy trì thủ công`,

  final_resolution_ja: `実施済み代替解決策:

プロセス制御への移行:
1. 各ステップを明確に標準化した組立作業
2. 固定配置で識別しやすい部品配置
3. 次のステップに進む前に正しいステップの完了を確認（ポカヨケ）

結果:
- 工程でのエラー防止
- シフト3の品質安定確保
- 手動維持に依存しない`,

  support_count: 58,
  remind_count: 2,
  
  history: [
    { action: 'submitted', from_stage: null, to_stage: 'submitted', note: 'Ý tưởng được gửi lên hệ thống', days_ago: 40 },
    { action: 'status_changed', from_stage: 'submitted', to_stage: 'under_review', note: 'Đang xem xét với bộ phận Sản xuất và Kỹ thuật', days_ago: 38 },
    { action: 'status_changed', from_stage: 'under_review', to_stage: 'evaluating', note: 'Đánh giá: Giải pháp quá khứ (bữa ăn + hướng dẫn trực quan) hiệu quả nhưng không ổn định', days_ago: 35 },
    { action: 'status_changed', from_stage: 'evaluating', to_stage: 'approved', note: 'Đề xuất giải pháp thay thế: Kiểm soát bằng quy trình (Poka-Yoke)', days_ago: 30 },
    { action: 'status_changed', from_stage: 'approved', to_stage: 'in_progress', note: 'Triển khai: Chuẩn hoá thao tác, bố trí linh kiện, thiết lập Poka-Yoke', days_ago: 25 },
    { action: 'status_changed', from_stage: 'in_progress', to_stage: 'implemented', note: 'Hoàn thành triển khai. Chất lượng ca 3 ổn định, không phụ thuộc duy trì thủ công', days_ago: 12 },
  ],
  
  responses: [
    { 
      role: 'supervisor', 
      response: 'Tham khảo giải pháp quá khứ: Đã cải thiện bữa ăn ca 3 và bổ sung hướng dẫn trực quan. Hiệu quả ban đầu nhưng không ổn định lâu dài vì phụ thuộc duy trì thủ công.', 
      days_ago: 36,
      is_final: false 
    },
    { 
      role: 'manager', 
      response: 'Đề xuất giải pháp thay thế: Chuyển sang kiểm soát bằng quy trình thay vì duy trì thủ công.', 
      days_ago: 32,
      is_final: false 
    },
    { 
      role: 'admin', 
      response: `CHỐT PHƯƠNG ÁN THỰC HIỆN (Giải pháp thay thế):
1. Chuẩn hoá thao tác lắp ráp theo từng bước rõ ràng
2. Bố trí linh kiện cố định và phân biệt dễ nhận biết
3. Áp dụng Poka-Yoke: Chỉ cho phép thực hiện đúng bước trước khi chuyển bước tiếp theo
4. Mục tiêu: Ngăn lỗi ngay tại công đoạn, đảm bảo chất lượng ổn định`, 
      days_ago: 28,
      is_final: true 
    },
    { 
      role: 'admin', 
      response: 'Triển khai thành công. Tỷ lệ lỗi ca 3 giảm 75%, chất lượng ổn định không phụ thuộc duy trì thủ công.', 
      days_ago: 12,
      is_final: false 
    },
  ],
};

// ========================================================================
// SCENARIO 4: Ekanban mẫu mã 2670
// Source: scenario4.md - MOST IMPORTANT FOR DEMO
// ========================================================================
const SCENARIO_4 = {
  ideabox_type: 'white',
  whitebox_subtype: 'opinion',
  category: 'process_improvement',
  title: 'Ekanban mẫu mã 2670 line RT2 bị cũ mờ chữ, trên số ekanban khó nhìn',
  title_ja: 'ラインRT2の品番2670のEkanbanが古くなり文字がかすれて読みにくい',
  
  // EXACT from scenario4.md - This is the INPUT
  description: `Ekanban mẫu mã 2670 line RT2 bị cũ mờ chữ, trên số ekanban khó nhìn.

Vấn đề:
- Kanban in bị mờ, khó đọc số mẫu mã
- Ảnh hưởng đến việc nhận diện và xử lý của NTT (Nhà thầu)
- Có nguy cơ nhầm lẫn trong quá trình sản xuất`,
  
  description_ja: `ラインRT2の品番2670のEkanbanが古くなり、文字がかすれてekanban番号が読みにくい。

問題:
- カンバンの印刷がかすれて品番が読みにくい
- NTT（請負業者）の識別と処理に影響
- 生産過程で混乱するリスク`,

  expected_benefit: 'Đảm bảo kanban rõ ràng, tránh nhầm lẫn trong sản xuất',
  expected_benefit_ja: 'カンバンを明確にし、生産での混乱を防止',
  
  status: 'implemented',
  difficulty: 'D',
  
  // EXACT final resolutions from scenario4.md
  final_resolution: `GIẢI PHÁP ĐÃ TRIỂN KHAI:

1. GIẢI PHÁP QUÁ KHỨ (Đã áp dụng):
   - Thống nhất rút từ trên xuống dưới
   - Liên hệ SX cấp đồng nhất với các line H, L, SL để NTT không bị nhầm

2. GIẢI PHÁP THAY THẾ (Ngăn ngừa lâu dài):
   - IS vệ sinh đầu ghi máy in, mực để ngăn ngừa
   - Lịch bảo trì định kỳ máy in kanban
   - Kiểm tra chất lượng in hàng tuần`,

  final_resolution_ja: `実施済み解決策:

1. 過去の解決策（適用済み）:
   - 上から下への統一的な抜き取り
   - H、L、SLラインと統一するようSXに連絡し、NTTの混乱を防止

2. 代替解決策（長期的予防）:
   - ISがプリンターヘッドとインクを清掃して予防
   - カンバンプリンターの定期メンテナンススケジュール
   - 毎週の印刷品質チェック`,

  support_count: 32,
  remind_count: 0,
  
  history: [
    { action: 'submitted', from_stage: null, to_stage: 'submitted', note: 'Ý kiến được gửi: Ekanban mẫu mã 2670 line RT2 bị cũ mờ chữ', days_ago: 15 },
    { action: 'status_changed', from_stage: 'submitted', to_stage: 'under_review', note: 'Đang xem xét với bộ phận Sản xuất và IS', days_ago: 13 },
    { action: 'status_changed', from_stage: 'under_review', to_stage: 'approved', note: 'Đã duyệt. Áp dụng giải pháp quá khứ + giải pháp thay thế ngăn ngừa', days_ago: 10 },
    { action: 'status_changed', from_stage: 'approved', to_stage: 'in_progress', note: 'Triển khai: Thống nhất rút kanban + IS vệ sinh máy in', days_ago: 8 },
    { action: 'status_changed', from_stage: 'in_progress', to_stage: 'implemented', note: 'Hoàn thành: Kanban đã được in lại rõ ràng, thiết lập lịch bảo trì', days_ago: 3 },
  ],
  
  responses: [
    { 
      role: 'supervisor', 
      response: 'Đã xác nhận vấn đề. Kiểm tra cho thấy máy in kanban cần bảo trì.', 
      days_ago: 14,
      is_final: false 
    },
    { 
      role: 'manager', 
      response: 'Tham khảo giải pháp quá khứ: Thống nhất rút từ trên xuống dưới, liên hệ SX cấp đồng nhất với các line H, L, SL để NTT không bị nhầm.', 
      days_ago: 11,
      is_final: false 
    },
    { 
      role: 'admin', 
      response: `CHỐT PHƯƠNG ÁN THỰC HIỆN:

GIẢI PHÁP QUÁ KHỨ:
- Thống nhất rút từ trên xuống dưới
- Liên hệ SX cấp đồng nhất với các line H, L, SL để NTT không bị nhầm

GIẢI PHÁP THAY THẾ (ngăn ngừa):
- IS vệ sinh đầu ghi máy in, mực để ngăn ngừa
- Thiết lập lịch bảo trì định kỳ`, 
      days_ago: 9,
      is_final: true 
    },
    { 
      role: 'admin', 
      response: 'Đã hoàn thành triển khai. Kanban mới đã in rõ ràng, lịch bảo trì máy in đã được thiết lập.', 
      days_ago: 3,
      is_final: false 
    },
  ],
};

// ========================================================================
// ADDITIONAL TEST SCENARIOS for similar input detection
// ========================================================================
const ADDITIONAL_SCENARIOS = [
  // Scenario tương tự #1 - Để test RAG với input "mẫu in 2670 bị mờ"
  {
    ideabox_type: 'white',
    whitebox_subtype: 'opinion',
    category: 'process_improvement',
    title: 'Mẫu in 2670 có vấn đề nhiều, chữ mờ khó đọc',
    title_ja: '品番2670の印刷に問題が多く、文字がかすれて読みにくい',
    description: 'Mẫu in 2670 bị mờ, chất lượng in kém. Đề nghị kiểm tra và bảo trì máy in.',
    description_ja: '品番2670の印刷がかすれて品質が悪い。プリンターの点検とメンテナンスを提案。',
    expected_benefit: 'Cải thiện chất lượng in kanban',
    expected_benefit_ja: 'カンバン印刷品質の改善',
    status: 'under_review',
    difficulty: null,
    final_resolution: null,
    final_resolution_ja: null,
    support_count: 15,
    remind_count: 2,
    history: [
      { action: 'submitted', from_stage: null, to_stage: 'submitted', note: 'Ý kiến được gửi', days_ago: 1 },
      { action: 'status_changed', from_stage: 'submitted', to_stage: 'under_review', note: 'Phát hiện tương tự ý kiến đã có giải pháp. Đang xem xét.', days_ago: 0 },
    ],
    responses: [
      { 
        role: 'admin', 
        response: 'Đã liên lạc hãng để thay đầu ghi. Tham khảo giải pháp từ ý kiến #4 đã triển khai thành công.', 
        days_ago: 0,
        is_final: false 
      },
    ],
  },
  
  // Scenario tương tự bữa ăn ca 3
  {
    ideabox_type: 'white',
    whitebox_subtype: 'opinion',
    category: 'workplace',
    title: 'Đồ ăn ca đêm không đảm bảo, nguội lạnh',
    title_ja: '夜勤の食事が保証されておらず、冷たい',
    description: 'Suất ăn ca đêm thường nguội, thiếu món. Đề nghị cải thiện chất lượng.',
    description_ja: '夜勤の食事が冷たく、メニューが少ない。品質改善を提案。',
    expected_benefit: 'Cải thiện chất lượng bữa ăn ca đêm',
    expected_benefit_ja: '夜勤の食事品質改善',
    status: 'pending',
    difficulty: null,
    final_resolution: null,
    final_resolution_ja: null,
    support_count: 25,
    remind_count: 1,
    history: [
      { action: 'submitted', from_stage: null, to_stage: 'submitted', note: 'Ý kiến được gửi', days_ago: 2 },
    ],
    responses: [],
  },
];

// All scenarios
const ALL_SCENARIOS = [SCENARIO_1, SCENARIO_2, SCENARIO_3, SCENARIO_4, ...ADDITIONAL_SCENARIOS];

async function seedScenarios() {
  console.log('🚀 Starting Scenario Seed (4 main scenarios + additional)...\n');
  console.log('📊 Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    mode: isRunningInDocker ? 'Docker internal' : 'Host → Docker',
  });

  try {
    // Get users and departments
    const usersResult = await db.query(`
      SELECT id, full_name, role FROM users 
      WHERE role IN ('admin', 'manager', 'supervisor', 'operator')
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'manager' THEN 2 
          WHEN 'supervisor' THEN 3 
          ELSE 4 
        END
      LIMIT 10
    `);
    const deptsResult = await db.query("SELECT id, name, code FROM departments WHERE code IN ('PROD', 'QC', 'MA', 'LOG', 'MAINT')");
    
    if (usersResult.rows.length === 0 || deptsResult.rows.length === 0) {
      console.error('❌ No users or departments found. Please seed users and departments first.');
      return;
    }

    const users = usersResult.rows;
    const departments = deptsResult.rows;
    const adminUser = users.find(u => u.role === 'admin') || users[0];
    const managerUser = users.find(u => u.role === 'manager') || users[0];
    const supervisorUser = users.find(u => u.role === 'supervisor') || users[0];
    
    console.log(`\n📋 Found users: ${users.map(u => `${u.full_name} (${u.role})`).join(', ')}`);
    console.log(`📋 Found departments: ${departments.map(d => d.code).join(', ')}\n`);

    // Run migration first
    console.log('📦 Running migration for final_resolution fields...');
    try {
      await db.query(`
        ALTER TABLE ideas ADD COLUMN IF NOT EXISTS final_resolution TEXT;
        ALTER TABLE ideas ADD COLUMN IF NOT EXISTS final_resolution_ja TEXT;
        ALTER TABLE idea_responses ADD COLUMN IF NOT EXISTS is_final_resolution BOOLEAN DEFAULT FALSE;
        ALTER TABLE idea_responses ADD COLUMN IF NOT EXISTS response_type VARCHAR(50) DEFAULT 'comment';
        
        CREATE TABLE IF NOT EXISTS idea_status_transitions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
          from_status VARCHAR(50),
          to_status VARCHAR(50),
          from_stage VARCHAR(50),
          to_stage VARCHAR(50),
          reason TEXT,
          transitioned_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_idea_status_transitions_idea_id ON idea_status_transitions(idea_id);
      `);
      console.log('✅ Migration applied\n');
    } catch (migErr) {
      console.log('⚠️ Migration may already exist:', migErr.message);
    }

    // Clear existing scenario data
    console.log('🗑️  Clearing existing scenario data...');
    const scenarioTitles = ALL_SCENARIOS.map(s => s.title);
    await db.query(`
      DELETE FROM idea_status_transitions WHERE idea_id IN (
        SELECT id FROM ideas WHERE title = ANY($1)
      )
    `, [scenarioTitles]);
    await db.query(`
      DELETE FROM idea_responses WHERE idea_id IN (
        SELECT id FROM ideas WHERE title = ANY($1)
      )
    `, [scenarioTitles]);
    await db.query(`
      DELETE FROM idea_history WHERE idea_id IN (
        SELECT id FROM ideas WHERE title = ANY($1)
      )
    `, [scenarioTitles]);
    await db.query(`DELETE FROM ideas WHERE title = ANY($1)`, [scenarioTitles]);
    console.log('✅ Cleared existing scenario data\n');

    // Insert each scenario
    for (let i = 0; i < ALL_SCENARIOS.length; i++) {
      const scenario = ALL_SCENARIOS[i];
      const isMainScenario = i < 4;
      const scenarioNum = i + 1;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📌 ${isMainScenario ? `SCENARIO ${scenarioNum}` : `ADDITIONAL ${scenarioNum - 4}`}: ${scenario.title.substring(0, 50)}...`);
      console.log(`${'='.repeat(60)}`);
      
      const submitter = users[Math.floor(Math.random() * users.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      
      // Calculate created_at based on history
      const oldestHistory = scenario.history.reduce((max, h) => Math.max(max, h.days_ago), 0);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - oldestHistory);

      // Insert idea with final_resolution
      const ideaResult = await db.query(`
        INSERT INTO ideas (
          ideabox_type, whitebox_subtype, category, 
          title, title_ja, description, description_ja,
          expected_benefit, expected_benefit_ja,
          submitter_id, department_id, is_anonymous,
          status, difficulty, handler_level,
          final_resolution, final_resolution_ja,
          workflow_stage,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING id
      `, [
        scenario.ideabox_type,
        scenario.whitebox_subtype,
        scenario.category,
        scenario.title,
        scenario.title_ja,
        scenario.description,
        scenario.description_ja,
        scenario.expected_benefit,
        scenario.expected_benefit_ja,
        submitter.id,
        department.id,
        false,
        scenario.status,
        scenario.difficulty,
        1,
        scenario.final_resolution,
        scenario.final_resolution_ja,
        scenario.status === 'implemented' ? 'implemented' : scenario.status === 'pending' ? 'submitted' : scenario.status,
        createdAt,
        new Date(),
      ]);

      const ideaId = ideaResult.rows[0].id;
      console.log(`✅ Created idea: ${ideaId}`);
      console.log(`   Type: ${scenario.ideabox_type}/${scenario.whitebox_subtype}`);
      console.log(`   Status: ${scenario.status}`);
      console.log(`   Has Final Resolution: ${scenario.final_resolution ? 'YES' : 'NO'}`);

      // Insert status transitions (workflow history)
      for (const historyItem of scenario.history) {
        const historyDate = new Date();
        historyDate.setDate(historyDate.getDate() - historyItem.days_ago);
        
        const performer = historyItem.action === 'submitted' ? submitter : 
          (historyItem.action.includes('approved') || historyItem.action.includes('implemented')) ? managerUser : supervisorUser;
        
        await db.query(`
          INSERT INTO idea_status_transitions (idea_id, from_status, to_status, from_stage, to_stage, reason, transitioned_by, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          ideaId,
          historyItem.from_stage,
          historyItem.to_stage,
          historyItem.from_stage,
          historyItem.to_stage,
          historyItem.note,
          performer.id,
          historyDate,
        ]);
        
        // Also insert into idea_history for backward compatibility
        await db.query(`
          INSERT INTO idea_history (idea_id, action, performed_by, details, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          ideaId,
          historyItem.action,
          performer.id,
          JSON.stringify({ note: historyItem.note, from_stage: historyItem.from_stage, to_stage: historyItem.to_stage }),
          historyDate,
        ]);
      }
      console.log(`   📜 Added ${scenario.history.length} history/transition records`);

      // Insert responses
      for (const response of scenario.responses) {
        const responseDate = new Date();
        responseDate.setDate(responseDate.getDate() - response.days_ago);
        
        const responder = response.role === 'admin' ? adminUser : 
          response.role === 'manager' ? managerUser : 
          response.role === 'supervisor' ? supervisorUser : submitter;
        
        await db.query(`
          INSERT INTO idea_responses (idea_id, user_id, response, is_final_resolution, response_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          ideaId,
          responder.id,
          response.response,
          response.is_final || false,
          response.is_final ? 'final_resolution' : 'comment',
          responseDate,
        ]);
      }
      if (scenario.responses.length > 0) {
        console.log(`   💬 Added ${scenario.responses.length} responses`);
        const finalRes = scenario.responses.find(r => r.is_final);
        if (finalRes) {
          console.log(`   ✨ Has FINAL RESOLUTION response`);
        }
      }

      // Update support_count
      if (scenario.support_count > 0) {
        await db.query('UPDATE ideas SET support_count = $1 WHERE id = $2', [scenario.support_count, ideaId]);
        console.log(`   👍 Support count: ${scenario.support_count}`);
      }
    }

    // Generate embeddings for scenarios
    console.log('\n\n📊 Generating embeddings for RAG...');
    console.log('   Note: Run RAG batch processing to generate embeddings:');
    console.log('   docker exec smartfactory_rag python -c "from api import *; process_batch()"');

    // Summary
    console.log('\n\n📊 SEED SUMMARY:');
    console.log('================');
    const statsResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN final_resolution IS NOT NULL THEN 1 END) as with_resolution
      FROM ideas
      WHERE title = ANY($1)
      GROUP BY status
      ORDER BY count DESC
    `, [scenarioTitles]);
    
    for (const row of statsResult.rows) {
      console.log(`   ${row.status}: ${row.count} items (${row.with_resolution} with final resolution)`);
    }
    
    console.log('\n✅ Main Scenarios (for RAG duplicate detection):');
    console.log('   1. Bữa ăn ca 3 - Thực đơn ít món, đồ ăn nguội');
    console.log('   2. Lỗi chất lượng NG tăng ca 3');
    console.log('   3. Lỗi thao tác lắp ráp ca 3');
    console.log('   4. Ekanban mẫu mã 2670 bị mờ chữ ⭐ (DEMO INPUT)');
    
    console.log('\n🎯 Test Input for RAG:');
    console.log('   "mẫu in 2670 bị mờ" → Should match Scenario 4');
    console.log('   "đồ ăn ca 3 nguội" → Should match Scenario 1');
    console.log('   "lỗi lắp ráp ca đêm" → Should match Scenario 3');

  } catch (error) {
    console.error('\n❌ Error seeding scenarios:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedScenarios()
    .then(async () => {
      console.log('\n\n🎉 Scenario seed completed successfully!');
      await db.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Scenario seed failed:', error);
      await db.end();
      process.exit(1);
    });
}

module.exports = { seedScenarios, ALL_SCENARIOS };
