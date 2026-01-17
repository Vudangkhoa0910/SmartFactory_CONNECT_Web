#!/usr/bin/env node
/**
 * SmartFactory CONNECT - Seed Data via API
 * =========================================
 * Version: 2.0.0
 * Aligned with SRS v2.1
 * 
 * This script seeds the database through the REST API endpoints
 * Run: node seed_via_api.js [--docker]
 * 
 * Options:
 *   --docker    Use Docker internal network URL (backend:3000)
 */

const axios = require('axios');
const readline = require('readline');

// Configuration - Auto-detect Docker environment
const isDocker = process.argv.includes('--docker') || process.env.DOCKER_ENV === 'true';
const API_BASE_URL = process.env.API_URL || (isDocker ? 'http://backend:3000/api' : 'http://localhost:3000/api');
const ADMIN_EMAIL = 'admin@smartfactory.com';
const ADMIN_PASSWORD = 'Admin@123456';

// Retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

let authToken = null;
let createdEntities = {
  departments: [],
  users: [],
  incidents: [],
  ideas: [],
  news: []
};

// Vietnamese names for realistic data
const vietnameseNames = {
  male: [
    'Nguyễn Văn An', 'Trần Minh Tuấn', 'Lê Hoàng Nam', 'Phạm Đức Hùng', 
    'Hoàng Văn Thắng', 'Vũ Đình Khoa', 'Đặng Quốc Toàn', 'Bùi Thanh Tùng',
    'Đỗ Mạnh Cường', 'Ngô Văn Bình', 'Lý Quang Minh', 'Phan Văn Dũng',
    'Đinh Thế Anh', 'Trương Văn Hải', 'Cao Xuân Long', 'Hồ Minh Đức'
  ],
  female: [
    'Nguyễn Thị Hương', 'Trần Thị Mai', 'Lê Thanh Hoa', 'Phạm Thu Hà',
    'Hoàng Ngọc Lan', 'Vũ Thị Linh', 'Đặng Minh Ngọc', 'Bùi Thị Thanh',
    'Đỗ Thị Huyền', 'Ngô Thị Yến', 'Lý Thị Kim', 'Phan Thị Nhung'
  ]
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'info') {
  const icons = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    header: '🚀'
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${icons[type]} ${message}`);
}

function generateEmployeeCode(departmentCode, index) {
  return `${departmentCode}${String(index).padStart(4, '0')}`;
}

function generateEmail(name) {
  const normalized = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/\s+/g, '.');
  return `${normalized}@smartfactory.com`;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =====================================================
// API FUNCTIONS WITH RETRY
// =====================================================

async function apiRequest(method, endpoint, data = null, useAuth = true, retries = 0) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000
  };
  
  if (useAuth && authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    // Retry on rate limiting (429)
    if (error.response?.status === 429 && retries < MAX_RETRIES) {
      const retryAfter = error.response.headers['retry-after'] || 2;
      log(`Rate limited, waiting ${retryAfter}s... (${retries + 1}/${MAX_RETRIES})`, 'warning');
      await sleep(retryAfter * 1000);
      return apiRequest(method, endpoint, data, useAuth, retries + 1);
    }
    // Retry on connection errors
    if (retries < MAX_RETRIES && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
      log(`Connection failed, retrying in ${RETRY_DELAY/1000}s... (${retries + 1}/${MAX_RETRIES})`, 'warning');
      await sleep(RETRY_DELAY);
      return apiRequest(method, endpoint, data, useAuth, retries + 1);
    }
    const errorMessage = error.response?.data?.error || error.message;
    return { success: false, error: errorMessage, status: error.response?.status };
  }
}

// Wait for API to be ready
async function waitForAPI() {
  log(`Waiting for API at ${API_BASE_URL}...`, 'info');
  
  for (let i = 0; i < MAX_RETRIES * 2; i++) {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
      if (response.status === 200) {
        log('API is ready!', 'success');
        return true;
      }
    } catch (error) {
      log(`API not ready yet, waiting... (${i + 1}/${MAX_RETRIES * 2})`, 'warning');
      await sleep(RETRY_DELAY);
    }
  }
  
  log('API did not become ready in time', 'error');
  return false;
}

// =====================================================
// AUTHENTICATION
// =====================================================

async function authenticate() {
  log('Authenticating as admin...', 'info');
  
  // First try to login
  let result = await apiRequest('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  }, false);
  
  if (result.success) {
    authToken = result.data.token || result.data.data?.token;
    log('Authenticated successfully!', 'success');
    return true;
  }
  
  // If login fails, try to register admin
  log('Admin not found, attempting registration...', 'warning');
  
  // Use snake_case to match API validation
  result = await apiRequest('POST', '/auth/register', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    full_name: 'System Administrator',
    employee_code: 'ADMIN001',
    role: 'admin'
  }, false);
  
  if (result.success) {
    authToken = result.data.token || result.data.data?.token;
    log('Admin registered and authenticated!', 'success');
    return true;
  }
  
  log(`Authentication failed: ${result.error}`, 'error');
  return false;
}

// =====================================================
// DEPARTMENT SEEDING (SRS Section 2)
// =====================================================

async function seedDepartments() {
  log('========== Seeding Departments ==========', 'header');
  
  const departments = [
    {
      code: 'SX',
      name: 'Phòng Sản xuất',
      nameJa: '生産部',
      description: 'Phụ trách sản xuất sản phẩm chính'
    },
    {
      code: 'KT',
      name: 'Phòng Kiểm tra',
      nameJa: '検査部',
      description: 'Kiểm tra chất lượng trong quá trình sản xuất'
    },
    {
      code: 'VC',
      name: 'Phòng Vận chuyển',
      nameJa: '輸送部',
      description: 'Vận chuyển hàng hóa và nguyên liệu'
    },
    {
      code: 'LOG',
      name: 'Phòng Logistic',
      nameJa: 'ロジスティクス部',
      description: 'Quản lý chuỗi cung ứng và kho bãi'
    },
    {
      code: 'TB',
      name: 'Phòng Thiết bị',
      nameJa: '設備部',
      description: 'Bảo trì và sửa chữa thiết bị'
    },
    {
      code: 'MA',
      name: 'Phòng MA',
      nameJa: 'MA部',
      description: 'Manufacturing Administration'
    },
    {
      code: 'KTH',
      name: 'Phòng Kỹ thuật',
      nameJa: '技術部',
      description: 'Hỗ trợ kỹ thuật và cải tiến'
    },
    {
      code: 'QA',
      name: 'Phòng QA',
      nameJa: '品質保証部',
      description: 'Đảm bảo chất lượng toàn diện'
    },
    {
      code: 'QLSX',
      name: 'Phòng Quản lý sản xuất',
      nameJa: '生産管理部',
      description: 'Lập kế hoạch và quản lý sản xuất'
    }
  ];
  
  for (const dept of departments) {
    const result = await apiRequest('POST', '/departments', dept);
    
    if (result.success) {
      const created = result.data.data || result.data;
      createdEntities.departments.push(created);
      log(`Created department: ${dept.name} (${dept.code})`, 'success');
    } else if (result.status === 409 || result.error?.includes('exists')) {
      log(`Department ${dept.code} already exists, fetching...`, 'warning');
      const getResult = await apiRequest('GET', `/departments?code=${dept.code}`);
      if (getResult.success) {
        const existing = getResult.data.data?.find(d => d.code === dept.code) || getResult.data[0];
        if (existing) createdEntities.departments.push(existing);
      }
    } else {
      log(`Failed to create ${dept.name}: ${result.error}`, 'error');
    }
    
    await sleep(100);
  }
  
  log(`Total departments: ${createdEntities.departments.length}`, 'info');
}

// =====================================================
// USER SEEDING (SRS Section 9)
// =====================================================

async function seedUsers() {
  log('========== Seeding Users ==========', 'header');
  
  const rolesConfig = [
    { role: 'general_manager', count: 1, prefix: 'GM' },
    { role: 'manager', count: 9, prefix: 'MGR' },
    { role: 'supervisor', count: 9, prefix: 'SPV' },
    { role: 'team_leader', count: 18, prefix: 'TL' },
    { role: 'operator', count: 20, prefix: 'OP' },
    { role: 'technician', count: 5, prefix: 'TECH' },
    { role: 'qc_inspector', count: 5, prefix: 'QC' },
    { role: 'maintenance_staff', count: 5, prefix: 'MT' },
    { role: 'viewer', count: 3, prefix: 'VW' }
  ];
  
  let userIndex = 1;
  const allNames = [...vietnameseNames.male, ...vietnameseNames.female];
  
  for (const config of rolesConfig) {
    log(`Creating ${config.count} ${config.role}(s)...`, 'info');
    
    for (let i = 0; i < config.count; i++) {
      const name = allNames[(userIndex - 1) % allNames.length];
      const department = createdEntities.departments[i % createdEntities.departments.length];
      
      // Use snake_case to match API validation
      const userData = {
        email: generateEmail(name + userIndex),
        password: 'User@123456',
        full_name: name,
        employee_code: generateEmployeeCode(config.prefix, userIndex),
        phone: `09${String(randomInt(10000000, 99999999))}`,
        role: config.role,
        department_id: department?.id || null
      };
      
      const result = await apiRequest('POST', '/users', userData);
      
      if (result.success) {
        const created = result.data.data || result.data;
        createdEntities.users.push(created);
        log(`Created user: ${userData.full_name} (${userData.role})`, 'success');
      } else if (result.status === 409) {
        log(`User ${userData.email} already exists`, 'warning');
      } else {
        log(`Failed to create user ${userData.full_name}: ${result.error}`, 'error');
      }
      
      userIndex++;
      await sleep(50);
    }
  }
  
  log(`Total users created: ${createdEntities.users.length}`, 'info');
}

// =====================================================
// INCIDENT SEEDING (SRS Section 3, 10, 11)
// =====================================================

async function seedIncidents() {
  log('========== Seeding Incidents ==========', 'header');
  
  // Use snake_case to match API validation
  const incidentTemplates = [
    {
      incident_type: 'safety',
      title: 'Phát hiện vết dầu loang trên sàn khu vực lắp ráp',
      description: 'Phát hiện vết dầu loang rộng khoảng 1m2 gần máy ép số 3, có nguy cơ trượt ngã cho công nhân.',
      location: 'Khu vực lắp ráp - Line 3',
      priority: 'high'
    },
    {
      incident_type: 'quality',
      title: 'Phát hiện lỗi kích thước ngoài dung sai cho phép',
      description: 'Kiểm tra mẫu phát hiện 5/20 sản phẩm có kích thước đường kính vượt quá dung sai ±0.02mm.',
      location: 'Phòng QC - Khu vực kiểm tra',
      priority: 'critical'
    },
    {
      incident_type: 'equipment',
      title: 'Máy CNC số 5 phát ra tiếng ồn bất thường',
      description: 'Máy CNC số 5 phát ra tiếng ồn kim loại khi hoạt động, cần kiểm tra bộ phận trục chính.',
      location: 'Xưởng CNC - Line 2',
      priority: 'medium'
    },
    {
      incident_type: 'safety',
      title: 'Đèn báo khẩn cấp không hoạt động',
      description: 'Phát hiện 2 đèn báo khẩn cấp tại lối thoát hiểm A3 không hoạt động khi kiểm tra định kỳ.',
      location: 'Lối thoát hiểm A3',
      priority: 'high'
    },
    {
      incident_type: 'equipment',
      title: 'Băng tải số 2 bị kẹt',
      description: 'Băng tải số 2 đột ngột dừng hoạt động, nghi ngờ motor quá tải hoặc dây đai bị đứt.',
      location: 'Dây chuyền sản xuất - Line 2',
      priority: 'high'
    },
    {
      incident_type: 'quality',
      title: 'Bề mặt sản phẩm có vết xước',
      description: 'Lô hàng LOT-2024-0105 có 15% sản phẩm bị vết xước trên bề mặt, cần điều tra nguyên nhân.',
      location: 'Khu đóng gói',
      priority: 'medium'
    },
    {
      incident_type: 'other',
      title: 'Hệ thống điều hòa không khí gặp sự cố',
      description: 'Điều hòa khu vực văn phòng tầng 2 không hoạt động, nhiệt độ phòng tăng cao.',
      location: 'Văn phòng tầng 2',
      priority: 'low'
    },
    {
      incident_type: 'safety',
      title: 'Phát hiện dây điện hở',
      description: 'Dây điện nguồn máy hàn số 8 bị hở, có nguy cơ điện giật cho người vận hành.',
      location: 'Khu hàn - Station 8',
      priority: 'critical'
    }
  ];
  
  // Get users for assignment
  const reporters = createdEntities.users.filter(u => 
    ['operator', 'technician', 'qc_inspector', 'maintenance_staff'].includes(u?.role)
  );
  
  if (reporters.length === 0) {
    log('No users available to create incidents', 'warning');
    return;
  }
  
  for (let i = 0; i < incidentTemplates.length; i++) {
    const template = incidentTemplates[i];
    const reporter = reporters[i % reporters.length];
    const department = createdEntities.departments[i % createdEntities.departments.length];
    
    // Use snake_case to match API validation
    const incidentData = {
      ...template,
      department_id: department?.id,
      assigned_department_id: createdEntities.departments[randomInt(0, createdEntities.departments.length - 1)]?.id
    };
    
    const result = await apiRequest('POST', '/incidents', incidentData);
    
    if (result.success) {
      const created = result.data.data || result.data;
      createdEntities.incidents.push(created);
      log(`Created incident: ${template.title.substring(0, 50)}...`, 'success');
    } else {
      log(`Failed to create incident: ${result.error}`, 'error');
    }
    
    await sleep(100);
  }
  
  log(`Total incidents created: ${createdEntities.incidents.length}`, 'info');
}

// =====================================================
// IDEAS SEEDING (SRS Section 4, 5)
// =====================================================

async function seedIdeas() {
  log('========== Seeding Ideas ==========', 'header');
  
  // Use snake_case to match API validation  
  const ideaTemplates = [
    // White Box Ideas
    {
      ideabox_type: 'white',
      category: 'process_improvement',
      title: 'Cải tiến quy trình kiểm tra chất lượng',
      description: 'Đề xuất sử dụng camera AI để tự động phát hiện lỗi trên sản phẩm, giảm thời gian kiểm tra từ 30 giây xuống 5 giây mỗi sản phẩm.',
      expected_benefit: 'Tăng năng suất kiểm tra 500%, giảm chi phí nhân công kiểm tra.'
    },
    {
      ideabox_type: 'white',
      category: 'cost_reduction',
      title: 'Tái sử dụng vật liệu đóng gói',
      description: 'Xây dựng hệ thống thu hồi và tái sử dụng thùng carton từ nhà cung cấp, ước tính tiết kiệm 30% chi phí bao bì.',
      expected_benefit: 'Tiết kiệm 50 triệu VND/tháng chi phí bao bì.'
    },
    {
      ideabox_type: 'white',
      category: 'safety_enhancement',
      title: 'Lắp đặt gương cầu lồi tại góc khuất',
      description: 'Lắp gương cầu lồi tại 5 vị trí góc khuất trong nhà máy để giảm nguy cơ va chạm xe nâng và người đi bộ.',
      expected_benefit: 'Giảm 80% nguy cơ va chạm tại các góc khuất.'
    },
    {
      ideabox_type: 'white',
      category: 'productivity',
      title: 'Tối ưu hóa layout khu vực lắp ráp',
      description: 'Sắp xếp lại vị trí các trạm làm việc theo flow sản xuất, giảm khoảng cách di chuyển của công nhân.',
      expected_benefit: 'Giảm 15% thời gian di chuyển, tăng 10% năng suất.'
    },
    {
      ideabox_type: 'white',
      category: 'quality_improvement',
      title: 'Triển khai Poka-Yoke cho máy đóng gói',
      description: 'Lắp cảm biến để ngăn chặn việc đóng gói sản phẩm thiếu phụ kiện.',
      expected_benefit: 'Giảm 100% lỗi thiếu phụ kiện trong đóng gói.'
    },
    // Pink Box Ideas (Anonymous)
    {
      ideabox_type: 'pink',
      category: 'workplace',
      title: 'Cải thiện điều kiện nghỉ ngơi',
      description: 'Đề xuất tăng số lượng ghế ngồi và máy điều hòa trong phòng nghỉ ca. Hiện tại phòng nghỉ quá nóng và thiếu chỗ ngồi.',
      expected_benefit: 'Cải thiện sức khỏe và tinh thần làm việc của công nhân.',
      is_anonymous: true
    },
    {
      ideabox_type: 'pink',
      category: 'other',
      title: 'Đề xuất thay đổi giờ ăn trưa',
      description: 'Hiện tại giờ ăn trưa 11h30 quá sớm, đề xuất dời sang 12h00 để phù hợp với nhịp độ công việc.',
      expected_benefit: 'Tăng hiệu quả làm việc buổi sáng.',
      is_anonymous: true
    },
    {
      ideabox_type: 'pink',
      category: 'environment',
      title: 'Cải thiện hệ thống thông gió',
      description: 'Khu vực hàn thường xuyên có khói, hệ thống hút khói không đủ mạnh, ảnh hưởng sức khỏe công nhân.',
      expected_benefit: 'Cải thiện chất lượng không khí, giảm bệnh nghề nghiệp.',
      is_anonymous: true
    }
  ];
  
  const submitters = createdEntities.users.filter(u => 
    ['operator', 'technician', 'qc_inspector', 'team_leader'].includes(u?.role)
  );
  
  if (submitters.length === 0) {
    log('No users available to create ideas', 'warning');
    return;
  }
  
  for (let i = 0; i < ideaTemplates.length; i++) {
    const template = ideaTemplates[i];
    const submitter = submitters[i % submitters.length];
    const department = createdEntities.departments[i % createdEntities.departments.length];
    
    // Use snake_case
    const ideaData = {
      ...template,
      department_id: department?.id
    };
    
    const result = await apiRequest('POST', '/ideas', ideaData);
    
    if (result.success) {
      const created = result.data.data || result.data;
      createdEntities.ideas.push(created);
      log(`Created idea: ${template.title.substring(0, 50)}... (${template.ideaboxType})`, 'success');
    } else {
      log(`Failed to create idea: ${result.error}`, 'error');
    }
    
    await sleep(300);
  }
  
  log(`Total ideas created: ${createdEntities.ideas.length}`, 'info');
}

// =====================================================
// NEWS SEEDING (SRS Section 7)
// =====================================================

async function seedNews() {
  log('========== Seeding News ==========', 'header');
  
  // Use snake_case to match API validation
  const newsTemplates = [
    {
      category: 'company_announcement',
      title: 'Thông báo lịch nghỉ Tết Nguyên Đán 2025',
      content: `Kính gửi toàn thể CBNV,

Công ty xin thông báo lịch nghỉ Tết Nguyên Đán 2025 như sau:
- Thời gian nghỉ: Từ ngày 25/01/2025 (28 Tết) đến hết ngày 02/02/2025 (Mùng 5 Tết)
- Ngày đi làm lại: 03/02/2025 (Mùng 6 Tết)

Các phòng ban lưu ý hoàn tất công việc trước kỳ nghỉ.

Trân trọng!`,
      is_priority: true,
      status: 'published'
    },
    {
      category: 'safety_alert',
      title: 'Nhắc nhở an toàn: Kiểm tra thiết bị bảo hộ cá nhân',
      content: `Kính gửi CBNV các bộ phận sản xuất,

Phòng An toàn nhắc nhở:
1. Luôn đeo kính bảo hộ khi làm việc với máy móc
2. Sử dụng găng tay phù hợp với từng công việc
3. Đi giày bảo hộ trong toàn bộ khu vực nhà xưởng
4. Báo ngay cho quản lý nếu thiết bị bảo hộ bị hỏng

An toàn là trên hết!`,
      is_priority: true,
      status: 'published'
    },
    {
      category: 'achievement',
      title: 'Chúc mừng Line 3 đạt 100 ngày không sự cố',
      content: `Phòng Quản lý Sản xuất xin chúc mừng tập thể Line 3 đã đạt được cột mốc 100 ngày làm việc không có sự cố an toàn.

Đây là kết quả của sự nỗ lực không ngừng trong việc tuân thủ quy trình an toàn và tinh thần trách nhiệm cao của toàn bộ thành viên.

Các thành viên Line 3 sẽ được tuyên dương trong buổi họp toàn công ty vào thứ Hai tuần tới.`,
      is_priority: false,
      status: 'published'
    },
    {
      category: 'training',
      title: 'Thông báo lớp đào tạo 5S nâng cao',
      content: `Phòng Nhân sự phối hợp với Phòng Quản lý Sản xuất tổ chức lớp đào tạo 5S nâng cao:

- Thời gian: 14h00 - 16h00, Thứ 6 hàng tuần
- Địa điểm: Phòng họp A, Tầng 2
- Đối tượng: Team Leader và Supervisor

Nội dung:
1. Ôn lại 5S cơ bản
2. Phương pháp đánh giá 5S
3. Best practice từ các nhà máy khác
4. Thực hành tại xưởng

Đăng ký qua hệ thống nội bộ trước ngày 15/01.`,
      is_priority: false,
      status: 'published'
    },
    {
      category: 'maintenance',
      title: 'Thông báo bảo trì hệ thống điện định kỳ',
      content: `Phòng Thiết bị thông báo lịch bảo trì hệ thống điện định kỳ:

- Thời gian: 06h00 - 10h00, Chủ Nhật ngày 20/01/2025
- Khu vực ảnh hưởng: Toàn bộ nhà máy

Trong thời gian bảo trì:
- Tất cả máy móc sẽ ngừng hoạt động
- Hệ thống chiếu sáng khẩn cấp sẽ được bật
- Chỉ nhân viên bảo trì được phép vào xưởng

Các bộ phận lưu ý hoàn tất công việc và tắt thiết bị trước 22h00 thứ 7.`,
      is_priority: true,
      status: 'published'
    },
    {
      category: 'welfare',
      title: 'Chương trình khám sức khỏe định kỳ 2025',
      content: `Phòng Nhân sự thông báo chương trình khám sức khỏe định kỳ năm 2025:

Đợt 1: 15-17/01/2025 - Khối văn phòng
Đợt 2: 20-24/01/2025 - Khối sản xuất

Địa điểm: Bệnh viện Đa khoa Thành phố
Xe đưa đón: 7h00 tại cổng chính

Lưu ý: Nhịn ăn sáng trước khi khám để xét nghiệm máu.
Danh sách theo phòng ban sẽ được gửi sau.`,
      is_priority: false,
      status: 'published'
    },
    {
      category: 'event',
      title: 'Sự kiện teambuilding quý 1/2025',
      content: `Công đoàn Công ty tổ chức sự kiện teambuilding Quý 1/2025:

- Thời gian: Thứ 7, ngày 25/01/2025
- Địa điểm: Khu du lịch sinh thái ABC
- Đối tượng: Toàn thể CBNV

Chương trình:
08h00: Tập trung tại công ty
09h00: Xuất phát
10h00: Các hoạt động team building
12h00: Tiệc BBQ
15h00: Thi đấu thể thao
17h00: Tổng kết và trao giải
18h00: Về công ty

Đăng ký tham gia qua trưởng bộ phận trước ngày 20/01.`,
      is_priority: false,
      status: 'published'
    }
  ];
  
  const authors = createdEntities.users.filter(u => 
    ['admin', 'general_manager', 'manager'].includes(u?.role)
  );
  
  // If no suitable authors, use any available user
  const author = authors.length > 0 ? authors[0] : createdEntities.users[0];
  
  for (const template of newsTemplates) {
    // Use snake_case
    const newsData = {
      ...template,
      target_audience: 'all'
    };
    
    const result = await apiRequest('POST', '/news', newsData);
    
    if (result.success) {
      const created = result.data.data || result.data;
      createdEntities.news.push(created);
      log(`Created news: ${template.title.substring(0, 50)}...`, 'success');
    } else {
      log(`Failed to create news: ${result.error}`, 'error');
    }
    
    await sleep(300);
  }
  
  log(`Total news created: ${createdEntities.news.length}`, 'info');
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.log('\n');
  log('=====================================================', 'header');
  log('  SmartFactory CONNECT - Database Seeding via API   ', 'header');
  log('=====================================================', 'header');
  log(`API URL: ${API_BASE_URL}`, 'info');
  log(`Docker Mode: ${isDocker ? 'Yes' : 'No'}`, 'info');
  console.log('\n');
  
  // Step 0: Wait for API to be ready (especially important in Docker)
  const apiReady = await waitForAPI();
  if (!apiReady) {
    log('API is not available. Please ensure the backend is running.', 'error');
    process.exit(1);
  }
  
  // Step 1: Authenticate
  const authenticated = await authenticate();
  if (!authenticated) {
    log('Cannot proceed without authentication. Exiting.', 'error');
    process.exit(1);
  }
  
  console.log('\n');
  
  // Step 2: Seed departments
  await seedDepartments();
  console.log('\n');
  
  // Step 3: Seed users
  await seedUsers();
  console.log('\n');
  
  // Step 4: Seed incidents
  await seedIncidents();
  console.log('\n');
  
  // Step 5: Seed ideas
  await seedIdeas();
  console.log('\n');
  
  // Step 6: Seed news
  await seedNews();
  console.log('\n');
  
  // Summary
  log('=====================================================', 'header');
  log('             SEEDING COMPLETED SUMMARY               ', 'header');
  log('=====================================================', 'header');
  log(`Departments: ${createdEntities.departments.length}`, 'info');
  log(`Users: ${createdEntities.users.length}`, 'info');
  log(`Incidents: ${createdEntities.incidents.length}`, 'info');
  log(`Ideas: ${createdEntities.ideas.length}`, 'info');
  log(`News: ${createdEntities.news.length}`, 'info');
  log('=====================================================', 'header');
  
  // Save results to file
  const fs = require('fs');
  const resultsPath = './logs/seed_results.json';
  try {
    fs.mkdirSync('./logs', { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      apiUrl: API_BASE_URL,
      dockerMode: isDocker,
      summary: {
        departments: createdEntities.departments.length,
        users: createdEntities.users.length,
        incidents: createdEntities.incidents.length,
        ideas: createdEntities.ideas.length,
        news: createdEntities.news.length
      },
      ids: {
        departments: createdEntities.departments.map(d => ({ id: d?.id, code: d?.code })),
        users: createdEntities.users.map(u => ({ id: u?.id, email: u?.email, role: u?.role })).slice(0, 20),
        incidents: createdEntities.incidents.map(i => ({ id: i?.id, title: i?.title?.substring(0, 50) })),
        ideas: createdEntities.ideas.map(i => ({ id: i?.id, title: i?.title?.substring(0, 50), type: i?.ideaboxType })),
        news: createdEntities.news.map(n => ({ id: n?.id, title: n?.title?.substring(0, 50) }))
      }
    }, null, 2));
    log(`Results saved to ${resultsPath}`, 'success');
  } catch (err) {
    log(`Could not save results: ${err.message}`, 'warning');
  }
  
  console.log('\n');
  log('Seeding process completed!', 'success');
}

// Run main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
