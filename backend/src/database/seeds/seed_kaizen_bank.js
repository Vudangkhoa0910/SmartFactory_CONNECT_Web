/**
 * KAIZEN BANK & WHITE BOX SEED DATA
 * Dữ liệu mẫu chi tiết cho Ngân hàng Kaizen và Hòm trắng
 * Sử dụng thông qua API seeding
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Helper function with retry logic
async function makeRequest(method, url, data = null, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${url}`,
        data,
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429 && i < retries - 1) {
        console.log(`⏳ Rate limited, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      throw error;
    }
  }
}

// Sample Kaizen Bank data - Chi tiết đầy đủ cho báo cáo
const kaizenSeedData = [
  {
    title: 'Giảm thời gian chuyển đổi khuôn',
    title_ja: '金型交換時間の短縮',
    title_en: 'Reduce Mold Changeover Time',
    category: '5S',
    sub_category: 'SMED',
    keywords: ['changeover', 'mold', 'SMED', '5S', 'productivity'],
    problem_description: 'Thời gian chuyển đổi khuôn hiện tại mất 45 phút, ảnh hưởng đến năng suất sản xuất. Công nhân phải tìm kiếm dụng cụ và bu lông trong quá trình chuyển đổi, dẫn đến nhiều thời gian chết.',
    problem_description_ja: '現在の金型交換時間は45分かかり、生産性に影響を与えています。',
    root_cause_analysis: '1. Dụng cụ không được sắp xếp có hệ thống\n2. Bu lông và ốc vít không chuẩn hóa\n3. Thiếu checklist quy trình\n4. Thiếu huấn luyện cho nhân viên mới\n5. Không có shadow board cho dụng cụ',
    solution_description: '1. Thiết kế Shadow Board cho tất cả dụng cụ\n2. Chuẩn hóa kích thước bu lông\n3. Tạo checklist chuyển đổi khuôn\n4. Đào tạo SMED cho công nhân\n5. Phân chia công việc Internal/External',
    solution_description_ja: '1. 全ての工具用シャドーボードを設計\n2. ボルトサイズの標準化\n3. 金型交換チェックリストの作成',
    implementation_steps: '1. Khảo sát hiện trạng (1 tuần)\n2. Thiết kế và lắp đặt shadow board (2 tuần)\n3. Đặt hàng bu lông chuẩn (1 tuần)\n4. Tập huấn SMED (3 ngày)\n5. Thử nghiệm và điều chỉnh (1 tuần)',
    before_situation: 'Thời gian chuyển đổi: 45 phút\nSố lần tìm kiếm dụng cụ: 15 lần\nTỷ lệ sai sót: 10%',
    before_metrics: {
      changeover_time_minutes: 45,
      tool_search_count: 15,
      error_rate: 10.0,
      productivity_loss_hours: 3.75
    },
    after_situation: 'Thời gian chuyển đổi: 18 phút\nSố lần tìm kiếm dụng cụ: 0 lần\nTỷ lệ sai sót: 1%',
    after_metrics: {
      changeover_time_minutes: 18,
      tool_search_count: 0,
      error_rate: 1.0,
      productivity_loss_hours: 1.5
    },
    improvement_rate: 60.0,
    is_team_submission: true,
    team_name: 'Kaizen Team Line A',
    impact_level: 'high',
    affected_areas: ['Line A', 'Line B'],
    affected_processes: ['Injection Molding', 'Assembly'],
    benefit_type: 'tangible',
    currency: 'VND',
    estimated_cost_savings: 150000000,
    estimated_time_savings_hours: 75,
    estimated_quality_improvement: 9.0,
    estimated_productivity_gain: 15.0,
    implementation_cost: 25000000,
    implementation_cost_breakdown: {
      shadow_board: 10000000,
      standard_bolts: 8000000,
      training: 5000000,
      other: 2000000
    },
    actual_cost_savings: 180000000,
    actual_time_savings_hours: 90,
    actual_quality_improvement: 9.0,
    actual_productivity_gain: 18.0,
    roi_percentage: 620.0,
    payback_period_months: 1.7,
    annual_savings: 2160000000,
    effectiveness_score: 92,
    creativity_score: 85,
    implementation_difficulty_score: 35,
    sustainability_score: 90,
    overall_score: 88,
    replication_potential: 5,
    can_replicate_to: ['Line C', 'Line D', 'Plant 2'],
    is_standardized: true,
    sop_number: 'SOP-INJ-001',
    award_level: 'gold',
    award_amount: 5000000,
    certificate_number: 'KZ-GOLD-2024-001'
  },
  {
    title: 'Tiết kiệm điện năng hệ thống chiếu sáng',
    title_ja: '照明システムの省エネルギー',
    title_en: 'Energy Saving Lighting System',
    category: 'energy_saving',
    sub_category: 'LED Conversion',
    keywords: ['energy', 'LED', 'lighting', 'cost saving', 'environment'],
    problem_description: 'Hệ thống chiếu sáng huỳnh quang cũ tiêu tốn 50kWh/ngày, chi phí điện cao và ánh sáng không đồng đều. Bóng đèn phải thay thế thường xuyên (mỗi 6 tháng).',
    root_cause_analysis: '1. Công nghệ đèn cũ (T8 fluorescent)\n2. Không có sensor tự động tắt\n3. Thiếu phân vùng chiếu sáng\n4. Không có lịch bảo trì định kỳ',
    solution_description: '1. Thay thế toàn bộ bằng đèn LED T5\n2. Lắp đặt cảm biến chuyển động\n3. Phân vùng công tắc theo khu vực\n4. Thiết lập lịch bảo trì 12 tháng',
    before_situation: 'Tiêu thụ điện: 50kWh/ngày\nChi phí bóng thay thế: 5 triệu/năm\nSố bóng hỏng: 24 bóng/năm',
    before_metrics: {
      daily_consumption_kwh: 50,
      annual_replacement_cost: 5000000,
      bulbs_replaced_annually: 24
    },
    after_situation: 'Tiêu thụ điện: 25kWh/ngày\nChi phí bóng thay thế: 1 triệu/năm\nSố bóng hỏng: 2 bóng/năm',
    after_metrics: {
      daily_consumption_kwh: 25,
      annual_replacement_cost: 1000000,
      bulbs_replaced_annually: 2
    },
    improvement_rate: 50.0,
    is_team_submission: false,
    impact_level: 'medium',
    affected_areas: ['Production Hall 1'],
    benefit_type: 'tangible',
    currency: 'VND',
    estimated_cost_savings: 45000000,
    estimated_time_savings_hours: 20,
    implementation_cost: 30000000,
    implementation_cost_breakdown: {
      led_bulbs: 20000000,
      sensors: 5000000,
      installation: 5000000
    },
    actual_cost_savings: 52000000,
    roi_percentage: 73.3,
    payback_period_months: 6.9,
    annual_savings: 52000000,
    effectiveness_score: 85,
    creativity_score: 70,
    sustainability_score: 95,
    overall_score: 82,
    replication_potential: 5,
    award_level: 'silver',
    award_amount: 3000000,
    certificate_number: 'KZ-SILVER-2024-001'
  },
  {
    title: 'Cải tiến quy trình kiểm tra chất lượng',
    title_ja: '品質検査プロセスの改善',
    title_en: 'Quality Inspection Process Improvement',
    category: 'quality',
    sub_category: 'Inspection Optimization',
    keywords: ['quality', 'inspection', 'defect', 'process improvement'],
    problem_description: 'Quy trình kiểm tra chất lượng hiện tại phát hiện lỗi chậm, nhiều sản phẩm lỗi lọt ra ngoài. Thời gian kiểm tra mỗi sản phẩm: 5 phút.',
    root_cause_analysis: '1. Checklist kiểm tra chưa đầy đủ\n2. Thiếu công cụ đo lường phù hợp\n3. Ánh sáng khu vực kiểm tra không đủ\n4. Nhân viên QC thiếu training về lỗi mới',
    solution_description: '1. Cập nhật checklist với 20 điểm kiểm tra\n2. Trang bị kính lúp LED\n3. Cải thiện chiếu sáng 500 lux\n4. Training hàng tuần về lỗi thường gặp',
    before_situation: 'Tỷ lệ phát hiện lỗi: 85%\nThời gian kiểm tra: 5 phút/sp\nSố lỗi lọt: 150 lỗi/tháng',
    before_metrics: {
      defect_detection_rate: 85,
      inspection_time_minutes: 5,
      escaped_defects_monthly: 150
    },
    after_situation: 'Tỷ lệ phát hiện lỗi: 98%\nThời gian kiểm tra: 3 phút/sp\nSố lỗi lọt: 20 lỗi/tháng',
    after_metrics: {
      defect_detection_rate: 98,
      inspection_time_minutes: 3,
      escaped_defects_monthly: 20
    },
    improvement_rate: 15.3,
    is_team_submission: true,
    team_name: 'QC Excellence Team',
    impact_level: 'high',
    benefit_type: 'tangible',
    currency: 'VND',
    estimated_cost_savings: 80000000,
    actual_cost_savings: 95000000,
    implementation_cost: 15000000,
    roi_percentage: 533.3,
    annual_savings: 95000000,
    effectiveness_score: 90,
    creativity_score: 75,
    overall_score: 85,
    replication_potential: 4,
    award_level: 'silver',
    award_amount: 3000000,
    certificate_number: 'KZ-SILVER-2024-002'
  },
  {
    title: 'Giảm phế phẩm dây chuyền đóng gói',
    title_ja: '梱包ラインの不良品削減',
    title_en: 'Reduce Packaging Line Waste',
    category: 'cost_reduction',
    sub_category: 'Waste Reduction',
    keywords: ['waste', 'packaging', 'cost reduction', 'lean'],
    problem_description: 'Dây chuyền đóng gói tạo ra 5% phế phẩm do hộp bị móp, nhãn lệch, seal không kín.',
    root_cause_analysis: '1. Máy seal nhiệt độ không ổn định\n2. Bộ dẫn hướng hộp bị mòn\n3. Cảm biến vị trí nhãn sai lệch\n4. Áp suất khí nén không đủ',
    solution_description: '1. Hiệu chuẩn máy seal hàng tuần\n2. Thay bộ dẫn hướng mới\n3. Calibrate cảm biến mỗi ca\n4. Kiểm tra áp suất 2 lần/ngày',
    before_metrics: {
      waste_rate: 5.0,
      monthly_waste_cost: 25000000,
      complaints: 12
    },
    after_metrics: {
      waste_rate: 0.8,
      monthly_waste_cost: 4000000,
      complaints: 2
    },
    improvement_rate: 84.0,
    is_team_submission: false,
    impact_level: 'medium',
    benefit_type: 'tangible',
    currency: 'VND',
    estimated_cost_savings: 250000000,
    actual_cost_savings: 252000000,
    implementation_cost: 35000000,
    roi_percentage: 620.0,
    annual_savings: 252000000,
    effectiveness_score: 88,
    creativity_score: 72,
    overall_score: 80,
    replication_potential: 3,
    award_level: 'bronze',
    award_amount: 2000000,
    certificate_number: 'KZ-BRONZE-2024-001'
  },
  {
    title: 'Cải thiện an toàn khu vực xe nâng',
    title_ja: 'フォークリフトエリアの安全性向上',
    title_en: 'Forklift Area Safety Improvement',
    category: 'safety',
    sub_category: 'Traffic Safety',
    keywords: ['safety', 'forklift', 'traffic', 'accident prevention'],
    problem_description: 'Khu vực xe nâng có 3 vụ va chạm nhẹ trong 6 tháng. Đường đi bộ và đường xe nâng chưa phân định rõ ràng.',
    root_cause_analysis: '1. Thiếu vạch kẻ đường\n2. Gương cầu lồi không đủ\n3. Không có đèn cảnh báo\n4. Tốc độ xe nâng không giới hạn',
    solution_description: '1. Kẻ vạch đường đi bộ màu xanh\n2. Lắp gương cầu lồi tại 8 góc\n3. Cài đèn cảnh báo tại giao lộ\n4. Giới hạn tốc độ 10km/h',
    before_situation: 'Số vụ va chạm: 3 vụ/6 tháng\nNear-miss: 15 vụ/tháng\nKhiếu nại: 8 vụ/tháng',
    before_metrics: {
      accidents_per_6months: 3,
      near_miss_monthly: 15,
      complaints_monthly: 8
    },
    after_situation: 'Số vụ va chạm: 0 vụ/6 tháng\nNear-miss: 2 vụ/tháng\nKhiếu nại: 0 vụ/tháng',
    after_metrics: {
      accidents_per_6months: 0,
      near_miss_monthly: 2,
      complaints_monthly: 0
    },
    improvement_rate: 100.0,
    is_team_submission: true,
    team_name: 'Safety First Team',
    impact_level: 'very_high',
    benefit_type: 'intangible',
    estimated_safety_improvement: 'Giảm 100% tai nạn, nâng cao văn hóa an toàn',
    actual_safety_improvement: 'Không có tai nạn trong 6 tháng sau cải tiến',
    currency: 'VND',
    implementation_cost: 20000000,
    implementation_cost_breakdown: {
      road_marking: 8000000,
      mirrors: 5000000,
      warning_lights: 5000000,
      signs: 2000000
    },
    effectiveness_score: 100,
    creativity_score: 78,
    sustainability_score: 95,
    overall_score: 92,
    replication_potential: 5,
    is_standardized: true,
    sop_number: 'SOP-SAF-001',
    award_level: 'gold',
    award_amount: 5000000,
    certificate_number: 'KZ-GOLD-2024-002'
  },
  {
    title: 'Tự động hóa báo cáo sản xuất',
    title_ja: '生産レポートの自動化',
    title_en: 'Automate Production Reporting',
    category: 'automation',
    sub_category: 'Digital Transformation',
    keywords: ['automation', 'reporting', 'digital', 'efficiency'],
    problem_description: 'Nhân viên mất 2 giờ/ngày để tổng hợp báo cáo sản xuất thủ công. Dữ liệu từ nhiều nguồn khác nhau, dễ sai sót.',
    root_cause_analysis: '1. Không có hệ thống tập trung\n2. Dữ liệu nhập thủ công\n3. Thiếu kết nối giữa các máy\n4. Không có dashboard real-time',
    solution_description: '1. Kết nối PLC với database\n2. Tạo dashboard Power BI\n3. Tự động gửi email báo cáo\n4. Alert khi có bất thường',
    before_metrics: {
      reporting_time_hours: 2,
      error_rate: 8.0,
      data_freshness_hours: 24
    },
    after_metrics: {
      reporting_time_hours: 0.1,
      error_rate: 0.5,
      data_freshness_hours: 0.5
    },
    improvement_rate: 95.0,
    is_team_submission: true,
    team_name: 'Digital Innovation Team',
    impact_level: 'high',
    benefit_type: 'tangible',
    currency: 'VND',
    estimated_cost_savings: 120000000,
    estimated_time_savings_hours: 500,
    implementation_cost: 50000000,
    actual_cost_savings: 144000000,
    actual_time_savings_hours: 520,
    roi_percentage: 188.0,
    annual_savings: 144000000,
    effectiveness_score: 95,
    creativity_score: 90,
    sustainability_score: 85,
    overall_score: 90,
    replication_potential: 4,
    award_level: 'gold',
    award_amount: 5000000,
    certificate_number: 'KZ-GOLD-2024-003'
  },
  {
    title: 'Cải tiến bảo trì phòng ngừa máy CNC',
    title_ja: 'CNC機械の予防保全改善',
    title_en: 'CNC Machine Preventive Maintenance',
    category: 'maintenance',
    sub_category: 'TPM',
    keywords: ['maintenance', 'CNC', 'TPM', 'preventive', 'uptime'],
    problem_description: 'Máy CNC thường xuyên dừng đột ngột do hỏng hóc, OEE chỉ đạt 72%. Không có lịch bảo trì định kỳ.',
    root_cause_analysis: '1. Không có lịch PM\n2. Thiếu checklist hàng ngày\n3. Không theo dõi giờ chạy\n4. Spare parts không sẵn sàng',
    solution_description: '1. Lập lịch PM theo giờ chạy\n2. Autonomous Maintenance mỗi ca\n3. Theo dõi OEE real-time\n4. Stock spare parts quan trọng',
    before_metrics: {
      oee_percentage: 72,
      breakdowns_monthly: 8,
      mtbf_hours: 120,
      mttr_hours: 4
    },
    after_metrics: {
      oee_percentage: 88,
      breakdowns_monthly: 1,
      mtbf_hours: 500,
      mttr_hours: 1.5
    },
    improvement_rate: 22.2,
    is_team_submission: true,
    team_name: 'TPM Champions',
    impact_level: 'high',
    benefit_type: 'tangible',
    currency: 'VND',
    estimated_cost_savings: 200000000,
    implementation_cost: 40000000,
    actual_cost_savings: 230000000,
    roi_percentage: 475.0,
    annual_savings: 230000000,
    effectiveness_score: 91,
    creativity_score: 80,
    overall_score: 87,
    replication_potential: 5,
    is_standardized: true,
    sop_number: 'SOP-PM-001',
    award_level: 'gold',
    award_amount: 5000000,
    certificate_number: 'KZ-GOLD-2024-004'
  },
  {
    title: 'Công thái học trạm lắp ráp',
    title_ja: '組立ステーションの人間工学',
    title_en: 'Assembly Station Ergonomics',
    category: 'ergonomics',
    sub_category: 'Workstation Design',
    keywords: ['ergonomics', 'assembly', 'health', 'comfort'],
    problem_description: 'Công nhân lắp ráp than phiền đau lưng và mỏi tay. Bàn làm việc cao không phù hợp, phải với xa.',
    root_cause_analysis: '1. Chiều cao bàn cố định 90cm\n2. Vật tư đặt xa tầm tay\n3. Ghế không có đệm lưng\n4. Thiếu thảm chống mỏi',
    solution_description: '1. Bàn điều chỉnh chiều cao 70-110cm\n2. Sắp xếp vật tư trong tầm với\n3. Ghế ergonomic với đệm lưng\n4. Thảm chống mỏi tại chỗ đứng',
    before_metrics: {
      discomfort_complaints: 25,
      sick_leave_days: 45,
      productivity_per_hour: 50
    },
    after_metrics: {
      discomfort_complaints: 3,
      sick_leave_days: 12,
      productivity_per_hour: 58
    },
    improvement_rate: 88.0,
    is_team_submission: false,
    impact_level: 'medium',
    benefit_type: 'intangible',
    currency: 'VND',
    estimated_safety_improvement: 'Giảm 88% phàn nàn, tăng 16% năng suất',
    actual_safety_improvement: 'Giảm đáng kể ngày nghỉ bệnh và tăng năng suất',
    implementation_cost: 35000000,
    effectiveness_score: 85,
    creativity_score: 75,
    sustainability_score: 90,
    overall_score: 82,
    replication_potential: 5,
    award_level: 'silver',
    award_amount: 3000000,
    certificate_number: 'KZ-SILVER-2024-003'
  }
];

// Sample White Box suggestions
const whiteBoxSeedData = [
  {
    suggestion_type: 'improvement',
    title: 'Đề xuất cải thiện canteen công ty',
    content: 'Đề nghị thêm microwave vào khu vực canteen để nhân viên có thể hâm nóng đồ ăn mang theo. Hiện tại chỉ có 1 lò vi sóng cho 200 người.',
    target_area: 'Canteen',
    priority: 'normal'
  },
  {
    suggestion_type: 'safety_concern',
    title: 'Cần thêm đèn chiếu sáng bãi đậu xe',
    content: 'Bãi đậu xe máy khu B rất tối vào buổi tối, đặc biệt những ngày trời mưa. Đề nghị lắp thêm 3-4 bóng đèn LED để đảm bảo an toàn cho nhân viên tan ca muộn.',
    target_area: 'Parking Area B',
    priority: 'high'
  },
  {
    suggestion_type: 'welfare',
    title: 'Đề xuất tổ chức câu lạc bộ thể thao',
    content: 'Đề nghị công ty hỗ trợ thành lập câu lạc bộ bóng đá và cầu lông để nhân viên có hoạt động thể thao sau giờ làm việc. Có thể thuê sân tập 2 buổi/tuần.',
    target_area: 'Company-wide',
    priority: 'normal'
  },
  {
    suggestion_type: 'work_environment',
    title: 'Điều hòa phòng Meeting Room 3 không đủ mát',
    content: 'Phòng họp số 3 thường rất nóng khi có từ 8 người trở lên. Máy lạnh dường như không đủ công suất. Đề nghị kiểm tra và nâng cấp.',
    target_area: 'Meeting Room 3',
    priority: 'normal'
  },
  {
    suggestion_type: 'feedback',
    title: 'Phản hồi về chương trình đào tạo Excel',
    content: 'Chương trình đào tạo Excel tuần trước rất hữu ích. Đề nghị tổ chức thêm các khóa về Power BI và Python cho nhân viên muốn nâng cao kỹ năng phân tích dữ liệu.',
    target_area: 'Training',
    priority: 'normal'
  },
  {
    suggestion_type: 'complaint',
    title: 'Máy ATM trong công ty thường xuyên hết tiền',
    content: 'Máy ATM của ngân hàng X trong công ty thường xuyên hết tiền vào ngày trả lương. Đề nghị công ty liên hệ với ngân hàng để nạp tiền thường xuyên hơn.',
    target_area: 'Finance',
    priority: 'high'
  },
  {
    suggestion_type: 'question',
    title: 'Hỏi về chính sách làm việc từ xa',
    content: 'Công ty có kế hoạch áp dụng chính sách làm việc từ xa (WFH) 1-2 ngày/tuần không? Nhiều công ty khác đã áp dụng và nhân viên rất hài lòng.',
    target_area: 'HR Policy',
    priority: 'normal'
  },
  {
    suggestion_type: 'appreciation',
    title: 'Cảm ơn bộ phận IT hỗ trợ nhanh chóng',
    content: 'Xin cảm ơn team IT đã hỗ trợ xử lý sự cố mạng rất nhanh chóng hôm qua. Chỉ trong 30 phút đã khắc phục xong, không ảnh hưởng đến công việc.',
    target_area: 'IT Department',
    priority: 'normal'
  },
  {
    suggestion_type: 'improvement',
    title: 'Đề xuất số hóa quy trình xin phép nghỉ',
    content: 'Quy trình xin phép nghỉ hiện tại vẫn dùng giấy, mất thời gian ký duyệt. Đề nghị chuyển sang hệ thống online để dễ quản lý và theo dõi.',
    target_area: 'HR Process',
    priority: 'normal'
  },
  {
    suggestion_type: 'policy',
    title: 'Góp ý về thời gian nghỉ trưa',
    content: 'Đề nghị xem xét kéo dài thời gian nghỉ trưa từ 60 phút lên 75 phút để nhân viên có thể nghỉ ngơi tốt hơn, đặc biệt những ngày làm việc căng thẳng.',
    target_area: 'HR Policy',
    priority: 'normal'
  }
];

async function seedKaizenBank() {
  console.log('\n🚀 Starting Kaizen Bank seeding...\n');
  
  // First, get list of users and departments
  let users = [];
  let departments = [];
  
  try {
    const usersResult = await makeRequest('GET', '/users?size=100');
    users = usersResult.data || [];
    console.log(`✅ Found ${users.length} users`);
  } catch (error) {
    console.log('⚠️ Could not fetch users:', error.message);
  }
  
  try {
    const depsResult = await makeRequest('GET', '/departments');
    departments = depsResult.data || [];
    console.log(`✅ Found ${departments.length} departments`);
  } catch (error) {
    console.log('⚠️ Could not fetch departments:', error.message);
  }
  
  // Get a random user and department
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const kaizen of kaizenSeedData) {
    try {
      // Assign random submitter and department
      const randomUser = getRandomItem(users);
      const randomDept = getRandomItem(departments);
      
      const kaizenData = {
        ...kaizen,
        submitter_id: randomUser?.id,
        department_id: randomDept?.id,
        status: 'submitted',
        team_members: kaizen.is_team_submission ? [
          {
            user_id: randomUser?.id,
            role: 'leader',
            contribution_percentage: 40
          }
        ] : []
      };
      
      const result = await makeRequest('POST', '/kaizen-bank', kaizenData);
      console.log(`✅ Created Kaizen: ${result.data?.kaizen_code || result.data?.title}`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Failed to create Kaizen "${kaizen.title}": ${error.response?.data?.message || error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Kaizen Bank Seeding Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  return { success: successCount, failed: failCount };
}

async function seedWhiteBox() {
  console.log('\n🚀 Starting White Box seeding...\n');
  
  // Get users
  let users = [];
  try {
    const usersResult = await makeRequest('GET', '/users?size=100');
    users = usersResult.data || [];
  } catch (error) {
    console.log('⚠️ Could not fetch users:', error.message);
  }
  
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const suggestion of whiteBoxSeedData) {
    try {
      const randomUser = getRandomItem(users);
      
      const suggestionData = {
        ...suggestion,
        submitter_id: randomUser?.id
      };
      
      const result = await makeRequest('POST', '/kaizen-bank/white-box', suggestionData);
      console.log(`✅ Created White Box: ${result.data?.suggestion_code || result.data?.title}`);
      successCount++;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Failed to create suggestion "${suggestion.title}": ${error.response?.data?.message || error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 White Box Seeding Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  return { success: successCount, failed: failCount };
}

async function seedAll() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║    KAIZEN BANK & WHITE BOX - COMPREHENSIVE DATA SEEDING     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const kaizenResult = await seedKaizenBank();
  const whiteBoxResult = await seedWhiteBox();
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║ Kaizen Bank:  ${kaizenResult.success} created, ${kaizenResult.failed} failed                        ║`);
  console.log(`║ White Box:    ${whiteBoxResult.success} created, ${whiteBoxResult.failed} failed                        ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

// Export for use as module
module.exports = {
  seedKaizenBank,
  seedWhiteBox,
  seedAll,
  kaizenSeedData,
  whiteBoxSeedData
};

// Run if called directly
if (require.main === module) {
  seedAll().catch(console.error);
}
