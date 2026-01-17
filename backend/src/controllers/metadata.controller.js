/**
 * =============================================================
 * SMARTFACTORY CONNECT - METADATA CONTROLLER
 * =============================================================
 * Cung cấp tất cả metadata, enums, options cho App Mobile
 * Đảm bảo App không cần hardcode bất kỳ giá trị nào
 * Hỗ trợ i18n: Vietnamese và Japanese
 * =============================================================
 * Based on SRS Document v2.1
 * =============================================================
 */

const db = require('../config/database');
const { asyncHandler } = require('../middlewares/error.middleware');
const { ROLES, LEVELS, ROLE_TO_LEVEL, ALL_ROLES } = require('../constants/roles');

/**
 * =============================================================
 * INCIDENT ENUMS (SRS Section 3)
 * Matching App UI: Thiết bị, An toàn, Chất lượng, Quy trình, Khác
 * =============================================================
 */
const INCIDENT_TYPES = {
  equipment: {
    value: 'equipment',
    label_vi: 'Thiết bị',
    label_ja: '設備',
    icon: 'build',
    color: '#45B7D1',
    order: 1
  },
  safety: {
    value: 'safety',
    label_vi: 'An toàn',
    label_ja: '安全',
    icon: 'shield',
    color: '#FF6B6B',
    order: 2
  },
  quality: {
    value: 'quality',
    label_vi: 'Chất lượng',
    label_ja: '品質',
    icon: 'verified',
    color: '#4ECDC4',
    order: 3
  },
  process: {
    value: 'process',
    label_vi: 'Quy trình',
    label_ja: 'プロセス',
    icon: 'account_tree',
    color: '#9C27B0',
    order: 4
  },
  other: {
    value: 'other',
    label_vi: 'Khác',
    label_ja: 'その他',
    icon: 'more_horiz',
    color: '#96CEB4',
    order: 5
  }
};

const INCIDENT_STATUSES = {
  pending: {
    value: 'pending',
    label_vi: 'Chờ xử lý',
    label_ja: '保留中',
    color: '#FFA726',
    order: 1
  },
  assigned: {
    value: 'assigned',
    label_vi: 'Đã phân công',
    label_ja: '割当済み',
    color: '#42A5F5',
    order: 2
  },
  in_progress: {
    value: 'in_progress',
    label_vi: 'Đang xử lý',
    label_ja: '処理中',
    color: '#26C6DA',
    order: 3
  },
  resolved: {
    value: 'resolved',
    label_vi: 'Đã giải quyết',
    label_ja: '解決済み',
    color: '#66BB6A',
    order: 4
  },
  closed: {
    value: 'closed',
    label_vi: 'Đã đóng',
    label_ja: '完了',
    color: '#78909C',
    order: 5
  },
  cancelled: {
    value: 'cancelled',
    label_vi: 'Đã hủy',
    label_ja: 'キャンセル',
    color: '#EF5350',
    order: 6
  },
  escalated: {
    value: 'escalated',
    label_vi: 'Đã leo thang',
    label_ja: 'エスカレーション',
    color: '#AB47BC',
    order: 7
  }
};

const INCIDENT_PRIORITIES = {
  low: {
    value: 'low',
    label_vi: 'Thấp',
    label_ja: '低',
    color: '#4CAF50',
    level: 1
  },
  medium: {
    value: 'medium',
    label_vi: 'Trung bình',
    label_ja: '中',
    color: '#2196F3',
    level: 2
  },
  high: {
    value: 'high',
    label_vi: 'Cao',
    label_ja: '高',
    color: '#FF9800',
    level: 3
  },
  critical: {
    value: 'critical',
    label_vi: 'Khẩn cấp',
    label_ja: '緊急',
    color: '#F44336',
    level: 4
  }
};

/**
 * =============================================================
 * IDEA ENUMS (SRS Section 4, 5, 6)
 * =============================================================
 */
const IDEABOX_TYPES = {
  white: {
    value: 'white',
    label_vi: 'Hòm trắng (Công khai)',
    label_ja: '白箱（公開）',
    description_vi: 'Góp ý công khai, có danh tính người gửi',
    description_ja: '公開提案、送信者の身元あり',
    icon: 'mail_outline',
    color: '#FFFFFF',
    requires_identity: true
  },
  pink: {
    value: 'pink',
    label_vi: 'Hòm hồng (Ẩn danh)',
    label_ja: 'ピンク箱（匿名）',
    description_vi: 'Góp ý ẩn danh, vấn đề nhạy cảm',
    description_ja: '匿名提案、機密事項',
    icon: 'lock_outline',
    color: '#FFB6C1',
    requires_identity: false
  }
};

const IDEA_CATEGORIES = {
  process_improvement: {
    value: 'process_improvement',
    label_vi: 'Cải tiến quy trình',
    label_ja: 'プロセス改善',
    icon: 'trending_up',
    color: '#2196F3',
    applicable_boxes: ['white', 'pink']
  },
  cost_reduction: {
    value: 'cost_reduction',
    label_vi: 'Giảm chi phí',
    label_ja: 'コスト削減',
    icon: 'savings',
    color: '#4CAF50',
    applicable_boxes: ['white']
  },
  quality_improvement: {
    value: 'quality_improvement',
    label_vi: 'Cải tiến chất lượng',
    label_ja: '品質改善',
    icon: 'verified',
    color: '#9C27B0',
    applicable_boxes: ['white']
  },
  safety_enhancement: {
    value: 'safety_enhancement',
    label_vi: 'Tăng cường an toàn',
    label_ja: '安全強化',
    icon: 'health_and_safety',
    color: '#F44336',
    applicable_boxes: ['white', 'pink']
  },
  productivity: {
    value: 'productivity',
    label_vi: 'Năng suất',
    label_ja: '生産性',
    icon: 'speed',
    color: '#FF9800',
    applicable_boxes: ['white']
  },
  innovation: {
    value: 'innovation',
    label_vi: 'Đổi mới sáng tạo',
    label_ja: 'イノベーション',
    icon: 'lightbulb',
    color: '#00BCD4',
    applicable_boxes: ['white']
  },
  environment: {
    value: 'environment',
    label_vi: 'Môi trường',
    label_ja: '環境',
    icon: 'eco',
    color: '#8BC34A',
    applicable_boxes: ['white', 'pink']
  },
  workplace: {
    value: 'workplace',
    label_vi: 'Môi trường làm việc',
    label_ja: '職場環境',
    icon: 'work',
    color: '#607D8B',
    applicable_boxes: ['white', 'pink']
  },
  welfare: {
    value: 'welfare',
    label_vi: 'Phúc lợi',
    label_ja: '福利厚生',
    icon: 'favorite',
    color: '#E91E63',
    applicable_boxes: ['pink']
  },
  personnel: {
    value: 'personnel',
    label_vi: 'Nhân sự',
    label_ja: '人事',
    icon: 'people',
    color: '#673AB7',
    applicable_boxes: ['pink']
  },
  infrastructure: {
    value: 'infrastructure',
    label_vi: 'Cơ sở hạ tầng',
    label_ja: 'インフラ',
    icon: 'domain',
    color: '#795548',
    applicable_boxes: ['pink']
  },
  other: {
    value: 'other',
    label_vi: 'Khác',
    label_ja: 'その他',
    icon: 'more_horiz',
    color: '#9E9E9E',
    applicable_boxes: ['white', 'pink']
  }
};

const IDEA_STATUSES = {
  pending: {
    value: 'pending',
    label_vi: 'Chờ xem xét',
    label_ja: '審査待ち',
    color: '#FFA726',
    order: 1,
    can_edit: true
  },
  under_review: {
    value: 'under_review',
    label_vi: 'Đang xem xét',
    label_ja: '審査中',
    color: '#42A5F5',
    order: 2,
    can_edit: false
  },
  approved: {
    value: 'approved',
    label_vi: 'Đã phê duyệt',
    label_ja: '承認済み',
    color: '#66BB6A',
    order: 3,
    can_edit: false
  },
  rejected: {
    value: 'rejected',
    label_vi: 'Từ chối',
    label_ja: '却下',
    color: '#EF5350',
    order: 4,
    can_edit: false
  },
  implemented: {
    value: 'implemented',
    label_vi: 'Đã triển khai',
    label_ja: '実施済み',
    color: '#26A69A',
    order: 5,
    can_edit: false
  },
  on_hold: {
    value: 'on_hold',
    label_vi: 'Tạm hoãn',
    label_ja: '保留',
    color: '#78909C',
    order: 6,
    can_edit: false
  }
};

const IDEA_DIFFICULTIES = {
  A: {
    value: 'A',
    label_vi: 'Dễ (< 7 ngày)',
    label_ja: '簡単（7日未満）',
    days: 7,
    color: '#4CAF50'
  },
  B: {
    value: 'B',
    label_vi: 'Trung bình (7-14 ngày)',
    label_ja: '普通（7〜14日）',
    days: 14,
    color: '#2196F3'
  },
  C: {
    value: 'C',
    label_vi: 'Khó (15-30 ngày)',
    label_ja: '難しい（15〜30日）',
    days: 30,
    color: '#FF9800'
  },
  D: {
    value: 'D',
    label_vi: 'Rất khó (> 30 ngày)',
    label_ja: '非常に難しい（30日以上）',
    days: 60,
    color: '#F44336'
  }
};

/**
 * =============================================================
 * NEWS ENUMS (SRS Section 7)
 * =============================================================
 */
const NEWS_CATEGORIES = {
  company_announcement: {
    value: 'company_announcement',
    label_vi: 'Thông báo công ty',
    label_ja: '会社告知',
    icon: 'campaign',
    color: '#1976D2'
  },
  policy_update: {
    value: 'policy_update',
    label_vi: 'Cập nhật chính sách',
    label_ja: 'ポリシー更新',
    icon: 'policy',
    color: '#7B1FA2'
  },
  event: {
    value: 'event',
    label_vi: 'Sự kiện',
    label_ja: 'イベント',
    icon: 'event',
    color: '#00796B'
  },
  achievement: {
    value: 'achievement',
    label_vi: 'Thành tựu',
    label_ja: '達成',
    icon: 'emoji_events',
    color: '#FFA000'
  },
  safety_alert: {
    value: 'safety_alert',
    label_vi: 'Cảnh báo an toàn',
    label_ja: '安全警報',
    icon: 'warning',
    color: '#D32F2F'
  },
  maintenance: {
    value: 'maintenance',
    label_vi: 'Bảo trì',
    label_ja: 'メンテナンス',
    icon: 'build',
    color: '#455A64'
  },
  training: {
    value: 'training',
    label_vi: 'Đào tạo',
    label_ja: 'トレーニング',
    icon: 'school',
    color: '#388E3C'
  },
  welfare: {
    value: 'welfare',
    label_vi: 'Phúc lợi',
    label_ja: '福利厚生',
    icon: 'favorite',
    color: '#E91E63'
  },
  newsletter: {
    value: 'newsletter',
    label_vi: 'Bản tin',
    label_ja: 'ニュースレター',
    icon: 'newspaper',
    color: '#0288D1'
  },
  emergency: {
    value: 'emergency',
    label_vi: 'Khẩn cấp',
    label_ja: '緊急',
    icon: 'notification_important',
    color: '#B71C1C'
  },
  other: {
    value: 'other',
    label_vi: 'Khác',
    label_ja: 'その他',
    icon: 'article',
    color: '#757575'
  }
};

/**
 * =============================================================
 * ROLE METADATA (SRS Section 9)
 * =============================================================
 */
const ROLE_METADATA = {
  admin: {
    value: 'admin',
    label_vi: 'Quản trị viên hệ thống',
    label_ja: 'システム管理者',
    level: 1,
    color: '#D32F2F',
    permissions: ['all']
  },
  general_manager: {
    value: 'general_manager',
    label_vi: 'Tổng giám đốc',
    label_ja: '総務部長',
    level: 1,
    color: '#7B1FA2',
    permissions: ['view_all', 'approve', 'manage_department', 'view_statistics', 'access_pink_box']
  },
  manager: {
    value: 'manager',
    label_vi: 'Quản lý',
    label_ja: 'マネージャー',
    level: 2,
    color: '#1976D2',
    permissions: ['manage_department', 'approve', 'view_statistics', 'access_pink_box']
  },
  supervisor: {
    value: 'supervisor',
    label_vi: 'Giám sát viên',
    label_ja: '監督者',
    level: 3,
    color: '#388E3C',
    permissions: ['supervise_team', 'assign', 'view_statistics']
  },
  team_leader: {
    value: 'team_leader',
    label_vi: 'Tổ trưởng',
    label_ja: 'チームリーダー',
    level: 4,
    color: '#FFA000',
    permissions: ['lead_team', 'review_reports', 'escalate']
  },
  operator: {
    value: 'operator',
    label_vi: 'Công nhân vận hành',
    label_ja: 'オペレーター',
    level: 5,
    color: '#00796B',
    permissions: ['create_incident', 'create_idea', 'view_own']
  },
  technician: {
    value: 'technician',
    label_vi: 'Kỹ thuật viên',
    label_ja: '技術者',
    level: 5,
    color: '#0288D1',
    permissions: ['create_incident', 'create_idea', 'view_own', 'handle_technical']
  },
  qc_inspector: {
    value: 'qc_inspector',
    label_vi: 'Kiểm tra chất lượng',
    label_ja: '品質検査員',
    level: 5,
    color: '#5D4037',
    permissions: ['create_incident', 'create_idea', 'view_own', 'handle_quality']
  },
  maintenance_staff: {
    value: 'maintenance_staff',
    label_vi: 'Nhân viên bảo trì',
    label_ja: 'メンテナンススタッフ',
    level: 5,
    color: '#455A64',
    permissions: ['create_incident', 'create_idea', 'view_own', 'handle_maintenance']
  },
  viewer: {
    value: 'viewer',
    label_vi: 'Người xem',
    label_ja: '閲覧者',
    level: 6,
    color: '#9E9E9E',
    permissions: ['view_news', 'view_public']
  }
};

/**
 * =============================================================
 * NAVIGATION MENU BY ROLE
 * =============================================================
 */
const NAVIGATION_MENU = {
  // Common screens for all authenticated users
  common: [
    {
      id: 'home',
      route: '/home',
      icon: 'home',
      label_vi: 'Trang chủ',
      label_ja: 'ホーム',
      order: 1
    },
    {
      id: 'news',
      route: '/news',
      icon: 'newspaper',
      label_vi: 'Tin tức',
      label_ja: 'ニュース',
      order: 2
    },
    {
      id: 'profile',
      route: '/profile',
      icon: 'person',
      label_vi: 'Hồ sơ',
      label_ja: 'プロフィール',
      order: 99
    }
  ],
  
  // Incident module
  incidents: {
    min_level: 6,
    screens: [
      {
        id: 'incident_list',
        route: '/incidents',
        icon: 'report',
        label_vi: 'Danh sách sự cố',
        label_ja: 'インシデント一覧',
        min_level: 6,
        order: 3
      },
      {
        id: 'incident_create',
        route: '/incidents/create',
        icon: 'add_circle',
        label_vi: 'Báo cáo sự cố',
        label_ja: 'インシデント報告',
        min_level: 6,
        order: 4
      },
      {
        id: 'incident_management',
        route: '/incidents/manage',
        icon: 'assignment',
        label_vi: 'Quản lý sự cố',
        label_ja: 'インシデント管理',
        min_level: 4,
        order: 5
      }
    ]
  },
  
  // Ideas module
  ideas: {
    min_level: 6,
    screens: [
      {
        id: 'idea_white_box',
        route: '/ideas/white',
        icon: 'mail_outline',
        label_vi: 'Hòm trắng',
        label_ja: '白箱',
        min_level: 6,
        order: 6
      },
      {
        id: 'idea_pink_box',
        route: '/ideas/pink',
        icon: 'lock_outline',
        label_vi: 'Hòm hồng',
        label_ja: 'ピンク箱',
        min_level: 6,
        order: 7
      },
      {
        id: 'idea_create',
        route: '/ideas/create',
        icon: 'lightbulb',
        label_vi: 'Gửi góp ý',
        label_ja: '提案送信',
        min_level: 6,
        order: 8
      },
      {
        id: 'idea_management',
        route: '/ideas/manage',
        icon: 'inbox',
        label_vi: 'Quản lý góp ý',
        label_ja: '提案管理',
        min_level: 3,
        order: 9
      }
    ]
  },
  
  // Admin screens
  admin: {
    min_level: 2,
    screens: [
      {
        id: 'dashboard',
        route: '/dashboard',
        icon: 'dashboard',
        label_vi: 'Bảng điều khiển',
        label_ja: 'ダッシュボード',
        min_level: 3,
        order: 10
      },
      {
        id: 'statistics',
        route: '/statistics',
        icon: 'analytics',
        label_vi: 'Thống kê',
        label_ja: '統計',
        min_level: 3,
        order: 11
      },
      {
        id: 'user_management',
        route: '/users',
        icon: 'people',
        label_vi: 'Quản lý người dùng',
        label_ja: 'ユーザー管理',
        min_level: 1,
        order: 12
      },
      {
        id: 'department_management',
        route: '/departments',
        icon: 'business',
        label_vi: 'Quản lý phòng ban',
        label_ja: '部門管理',
        min_level: 2,
        order: 13
      },
      {
        id: 'settings',
        route: '/settings',
        icon: 'settings',
        label_vi: 'Cài đặt hệ thống',
        label_ja: 'システム設定',
        min_level: 1,
        order: 14
      }
    ]
  }
};

/**
 * =============================================================
 * CONTROLLER FUNCTIONS
 * =============================================================
 */

/**
 * Get all enums
 * GET /api/metadata/enums
 */
const getAllEnums = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      incident_types: Object.values(INCIDENT_TYPES),
      incident_statuses: Object.values(INCIDENT_STATUSES),
      incident_priorities: Object.values(INCIDENT_PRIORITIES),
      ideabox_types: Object.values(IDEABOX_TYPES),
      idea_categories: Object.values(IDEA_CATEGORIES),
      idea_statuses: Object.values(IDEA_STATUSES),
      idea_difficulties: Object.values(IDEA_DIFFICULTIES),
      news_categories: Object.values(NEWS_CATEGORIES),
      roles: Object.values(ROLE_METADATA)
    }
  });
});

/**
 * Get incident form options
 * GET /api/metadata/incidents/options
 */
const getIncidentOptions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      types: Object.values(INCIDENT_TYPES),
      statuses: Object.values(INCIDENT_STATUSES),
      priorities: Object.values(INCIDENT_PRIORITIES)
    }
  });
});

/**
 * Get idea form options
 * GET /api/metadata/ideas/options
 */
const getIdeaOptions = asyncHandler(async (req, res) => {
  const boxType = req.query.box_type;
  
  // Filter categories based on box type if specified
  let categories = Object.values(IDEA_CATEGORIES);
  if (boxType) {
    categories = categories.filter(cat => 
      cat.applicable_boxes.includes(boxType)
    );
  }
  
  res.json({
    success: true,
    data: {
      box_types: Object.values(IDEABOX_TYPES),
      categories: categories,
      statuses: Object.values(IDEA_STATUSES),
      difficulties: Object.values(IDEA_DIFFICULTIES)
    }
  });
});

/**
 * Get incident filter options based on user role
 * GET /api/metadata/filters/incidents
 */
const getIncidentFilters = asyncHandler(async (req, res) => {
  const userLevel = req.user.level;
  const userId = req.user.id;
  
  // Get departments for filter (if user has permission)
  let departments = [];
  if (userLevel <= 4) { // Team Leader and above
    const deptResult = await db.query(
      'SELECT id, code, name, name_ja FROM departments WHERE is_active = true ORDER BY name'
    );
    departments = deptResult.rows;
  }
  
  // Get assignable users (if user has permission)
  let users = [];
  if (userLevel <= 3) { // Supervisor and above
    const userResult = await db.query(`
      SELECT u.id, u.full_name, u.full_name_ja, u.employee_code, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.is_active = true AND u.level <= 5
      ORDER BY u.full_name
      LIMIT 100
    `);
    users = userResult.rows;
  }
  
  res.json({
    success: true,
    data: {
      types: Object.values(INCIDENT_TYPES),
      statuses: Object.values(INCIDENT_STATUSES),
      priorities: Object.values(INCIDENT_PRIORITIES),
      departments: departments,
      assignable_users: users,
      // Filter configuration for UI
      filter_config: {
        can_filter_by_department: userLevel <= 4,
        can_filter_by_assignee: userLevel <= 3,
        can_filter_by_reporter: userLevel <= 3,
        can_filter_by_date_range: true,
        can_export: userLevel <= 3
      }
    }
  });
});

/**
 * Get idea filter options based on user role
 * GET /api/metadata/filters/ideas
 */
const getIdeaFilters = asyncHandler(async (req, res) => {
  const userLevel = req.user.level;
  
  // Check pink box access
  const canAccessPinkBox = await checkPinkBoxAccess(req.user);
  
  // Get departments for filter
  let departments = [];
  if (userLevel <= 3) {
    const deptResult = await db.query(
      'SELECT id, code, name, name_ja FROM departments WHERE is_active = true ORDER BY name'
    );
    departments = deptResult.rows;
  }
  
  res.json({
    success: true,
    data: {
      box_types: canAccessPinkBox 
        ? Object.values(IDEABOX_TYPES) 
        : [IDEABOX_TYPES.white],
      categories: Object.values(IDEA_CATEGORIES),
      statuses: Object.values(IDEA_STATUSES),
      difficulties: Object.values(IDEA_DIFFICULTIES),
      departments: departments,
      // Filter configuration for UI
      filter_config: {
        can_access_pink_box: canAccessPinkBox,
        can_filter_by_department: userLevel <= 3,
        can_filter_by_submitter: userLevel <= 2 && canAccessPinkBox,
        can_filter_by_date_range: true,
        can_export: userLevel <= 2
      }
    }
  });
});

/**
 * Get incident filter dropdown for App Mobile
 * GET /api/metadata/filters/incidents/dropdown
 * Returns 2-column filter format matching App UI
 */
const getIncidentFilterDropdown = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      // Dropdown "Tất cả" with 2 columns
      dropdown_layout: {
        column_1: {
          title_vi: 'Mức độ ưu tiên',
          title_ja: '優先度',
          items: [
            { value: 'critical', label_vi: 'Khẩn cấp', label_ja: '緊急', color: '#F44336' },
            { value: 'high', label_vi: 'Cao', label_ja: '高', color: '#FF9800' },
            { value: 'medium', label_vi: 'Trung bình', label_ja: '中', color: '#2196F3' },
            { value: 'low', label_vi: 'Thấp', label_ja: '低', color: '#4CAF50' }
          ],
          filter_key: 'priority'
        },
        column_2: {
          title_vi: 'Trạng thái',
          title_ja: 'ステータス',
          items: [
            { value: 'in_progress', label_vi: 'Đang xử lý', label_ja: '処理中', color: '#26C6DA' },
            { value: 'resolved', label_vi: 'Hoàn thành', label_ja: '解決済み', color: '#66BB6A' },
            { value: 'closed', label_vi: 'Đã đóng', label_ja: '完了', color: '#78909C' }
          ],
          filter_key: 'status'
        }
      },
      // Quick filters for tabs
      quick_filters: [
        { value: 'all', label_vi: 'Tất cả', label_ja: 'すべて', icon: 'list' },
        { value: 'pending', label_vi: 'Chờ duyệt', label_ja: '保留中', icon: 'pending' },
        { value: 'in_progress', label_vi: 'Đang xử lý', label_ja: '処理中', icon: 'autorenew' },
        { value: 'resolved', label_vi: 'Hoàn thành', label_ja: '完了', icon: 'check_circle' }
      ]
    }
  });
});

/**
 * Get navigation menu based on user role
 * GET /api/metadata/navigation
 */
const getNavigationMenu = asyncHandler(async (req, res) => {
  const userLevel = req.user.level;
  const userRole = req.user.role;
  
  // Build menu based on user level
  const menu = [];
  
  // Add common screens
  menu.push(...NAVIGATION_MENU.common);
  
  // Add incident screens
  NAVIGATION_MENU.incidents.screens.forEach(screen => {
    if (userLevel <= screen.min_level) {
      menu.push(screen);
    }
  });
  
  // Add idea screens
  NAVIGATION_MENU.ideas.screens.forEach(screen => {
    if (userLevel <= screen.min_level) {
      // Check pink box access for idea management
      if (screen.id === 'idea_management' && userLevel > 1) {
        // Skip pink box management for non-admin
      } else {
        menu.push(screen);
      }
    }
  });
  
  // Add admin screens
  NAVIGATION_MENU.admin.screens.forEach(screen => {
    if (userLevel <= screen.min_level) {
      menu.push(screen);
    }
  });
  
  // Sort by order
  menu.sort((a, b) => a.order - b.order);
  
  res.json({
    success: true,
    data: {
      menu: menu,
      user_level: userLevel,
      user_role: userRole
    }
  });
});

/**
 * Get current user's permissions
 * GET /api/metadata/permissions
 */
const getUserPermissions = asyncHandler(async (req, res) => {
  const user = req.user;
  const canAccessPinkBox = await checkPinkBoxAccess(user);
  
  res.json({
    success: true,
    data: {
      role: user.role,
      level: user.level,
      permissions: {
        // Incidents
        can_create_incident: true,
        can_view_all_incidents: user.level <= 3,
        can_assign_incident: user.level <= 4,
        can_resolve_incident: user.level <= 4,
        can_close_incident: user.level <= 3,
        can_escalate_incident: user.level <= 4,
        can_view_incident_stats: user.level <= 3,
        
        // Ideas
        can_create_idea: true,
        can_view_white_box: true,
        can_view_pink_box: canAccessPinkBox,
        can_review_idea: user.level <= 3,
        can_approve_idea: user.level <= 2,
        can_implement_idea: user.level <= 3,
        can_escalate_idea: user.level <= 4,
        can_view_idea_stats: user.level <= 3,
        
        // News
        can_view_news: true,
        can_create_news: user.level <= 3,
        can_edit_news: user.level <= 2,
        can_delete_news: user.level <= 1,
        
        // Users & Departments
        can_view_users: user.level <= 3,
        can_manage_users: user.level <= 1,
        can_view_departments: true,
        can_manage_departments: user.level <= 2,
        
        // Statistics & Dashboard
        can_view_dashboard: user.level <= 4,
        can_view_statistics: user.level <= 3,
        can_export_data: user.level <= 2,
        
        // System
        can_access_settings: user.level <= 1,
        can_view_audit_logs: user.level <= 1
      }
    }
  });
});

/**
 * Get all roles hierarchy (Admin only)
 * GET /api/metadata/roles
 */
const getRolesHierarchy = asyncHandler(async (req, res) => {
  // Get role statistics from database
  const statsResult = await db.query(`
    SELECT role, COUNT(*) as user_count
    FROM users
    WHERE is_active = true
    GROUP BY role
  `);
  
  const userCounts = {};
  statsResult.rows.forEach(row => {
    userCounts[row.role] = parseInt(row.user_count);
  });
  
  const roles = Object.values(ROLE_METADATA).map(role => ({
    ...role,
    user_count: userCounts[role.value] || 0
  }));
  
  res.json({
    success: true,
    data: {
      roles: roles,
      level_hierarchy: [
        { level: 1, name_vi: 'Quản trị viên', name_ja: '管理者', roles: ['admin', 'general_manager'] },
        { level: 2, name_vi: 'Quản lý', name_ja: 'マネージャー', roles: ['manager'] },
        { level: 3, name_vi: 'Giám sát', name_ja: '監督者', roles: ['supervisor'] },
        { level: 4, name_vi: 'Tổ trưởng', name_ja: 'チームリーダー', roles: ['team_leader'] },
        { level: 5, name_vi: 'Nhân viên', name_ja: 'スタッフ', roles: ['operator', 'technician', 'qc_inspector', 'maintenance_staff'] },
        { level: 6, name_vi: 'Người xem', name_ja: '閲覧者', roles: ['viewer'] }
      ]
    }
  });
});

/**
 * Get department dropdown options
 * GET /api/metadata/departments/options
 */
const getDepartmentOptions = asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      d.id, 
      d.code, 
      d.name, 
      d.name_ja,
      d.parent_id,
      u.full_name as manager_name
    FROM departments d
    LEFT JOIN users u ON d.manager_id = u.id
    WHERE d.is_active = true
    ORDER BY d.name
  `);
  
  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get user dropdown options for assignment
 * GET /api/metadata/users/options
 */
const getUserOptions = asyncHandler(async (req, res) => {
  const userLevel = req.user.level;
  const departmentId = req.query.department_id;
  const roleFilter = req.query.role;
  const levelFilter = req.query.max_level;
  
  let query = `
    SELECT 
      u.id, 
      u.employee_code,
      u.full_name, 
      u.full_name_ja,
      u.role,
      u.level,
      d.name as department_name,
      d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.is_active = true
  `;
  
  const params = [];
  let paramIndex = 1;
  
  // Filter by department
  if (departmentId) {
    query += ` AND u.department_id = $${paramIndex}`;
    params.push(departmentId);
    paramIndex++;
  }
  
  // Filter by role
  if (roleFilter) {
    query += ` AND u.role = $${paramIndex}`;
    params.push(roleFilter);
    paramIndex++;
  }
  
  // Filter by level (for assignment - can only assign to same or lower level)
  if (levelFilter) {
    query += ` AND u.level >= $${paramIndex}`;
    params.push(parseInt(levelFilter));
    paramIndex++;
  } else if (userLevel > 1) {
    // Non-admin can only see users at same level or below
    query += ` AND u.level >= $${paramIndex}`;
    params.push(userLevel);
    paramIndex++;
  }
  
  query += ' ORDER BY u.level, u.full_name LIMIT 200';
  
  const result = await db.query(query, params);
  
  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get app configuration
 * GET /api/metadata/app-config
 */
const getAppConfig = asyncHandler(async (req, res) => {
  // Get settings from database
  const settingsResult = await db.query(`
    SELECT key, value FROM system_settings
  `);
  
  const settings = {};
  settingsResult.rows.forEach(row => {
    settings[row.key] = row.value;
  });
  
  res.json({
    success: true,
    data: {
      api_version: '2.1',
      app_version: {
        minimum: '1.0.0',
        recommended: '2.1.0'
      },
      features: {
        rag_enabled: settings.auto_assign_enabled === 'true' || settings.auto_assign_enabled === true,
        rag_threshold: parseFloat(settings.auto_assign_threshold || '0.85'),
        translation_enabled: true,
        push_notifications: true,
        offline_mode: false,
        dark_mode: true
      },
      limits: {
        max_file_size_mb: parseInt(settings.max_file_size_mb || '10'),
        max_attachments: 5,
        max_title_length: 200,
        max_description_length: 5000
      },
      timeouts: {
        escalation_hours: parseInt(settings.escalation_timeout_hours || '24'),
        notification_retention_days: parseInt(settings.notification_retention_days || '90')
      },
      difficulty_targets: settings.idea_difficulty_targets || { A: 7, B: 14, C: 30, D: 60 },
      supported_languages: ['vi', 'ja'],
      default_language: 'vi'
    }
  });
});

/**
 * Helper: Check if user can access pink box
 */
async function checkPinkBoxAccess(user) {
  // Level 1 (Admin, GM) always has access
  if (user.level === 1) return true;
  
  // Level 2 (Manager) has access
  if (user.level === 2) return true;
  
  // Check role_levels table for explicit permission
  const result = await db.query(
    'SELECT can_access_pink_box FROM role_levels WHERE role = $1',
    [user.role]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].can_access_pink_box === true;
  }
  
  return false;
}

module.exports = {
  getAllEnums,
  getIncidentOptions,
  getIdeaOptions,
  getIncidentFilters,
  getIdeaFilters,
  getIncidentFilterDropdown,
  getNavigationMenu,
  getUserPermissions,
  getRolesHierarchy,
  getDepartmentOptions,
  getUserOptions,
  getAppConfig,
  // Export constants for use in other modules
  INCIDENT_TYPES,
  INCIDENT_STATUSES,
  INCIDENT_PRIORITIES,
  IDEABOX_TYPES,
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  IDEA_DIFFICULTIES,
  NEWS_CATEGORIES,
  ROLE_METADATA
};
