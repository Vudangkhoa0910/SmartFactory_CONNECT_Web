/**
 * =============================================================
 * SMARTFACTORY CONNECT - UNIFIED ROLE & PERMISSION CONSTANTS
 * =============================================================
 * Based on SRS Document Section 9: Vai trò & quyền hạn
 * 
 * This is the SINGLE SOURCE OF TRUTH for all role/permission
 * definitions across the entire backend system.
 * 
 * DO NOT define role/level mappings anywhere else!
 * =============================================================
 */

/**
 * ROLE DEFINITIONS
 * Based on SRS Section 9 - Vai trò & quyền hạn
 */
const ROLES = {
  // Level 1 - Full System Access
  ADMIN: 'admin',
  GENERAL_MANAGER: 'general_manager',
  
  // Level 2 - Management Access
  MANAGER: 'manager',
  
  // Level 3 - Department Supervision
  SUPERVISOR: 'supervisor',
  
  // Level 4 - Team Management
  TEAM_LEADER: 'team_leader',
  
  // Level 5 - Operations (Self scope)
  OPERATOR: 'operator',
  TECHNICIAN: 'technician',
  QC_INSPECTOR: 'qc_inspector',
  MAINTENANCE_STAFF: 'maintenance_staff',
  
  // Level 6 - Read Only
  VIEWER: 'viewer'
};

/**
 * LEVEL DEFINITIONS
 * Lower number = Higher authority
 * 
 * Based on SRS escalation workflow:
 * - Incident: User → Team Leader → Supervisor → Manager → Admin
 * - Ideas: Supervisor → Manager → General Manager
 */
const LEVELS = {
  ADMIN: 1,
  GENERAL_MANAGER: 1,
  MANAGER: 2,
  SUPERVISOR: 3,
  TEAM_LEADER: 4,
  OPERATOR: 5,
  TECHNICIAN: 5,
  QC_INSPECTOR: 5,
  MAINTENANCE_STAFF: 5,
  VIEWER: 6
};

/**
 * ROLE TO LEVEL MAPPING
 * Used in user creation and authentication
 */
const ROLE_TO_LEVEL = {
  [ROLES.ADMIN]: LEVELS.ADMIN,                           // 1
  [ROLES.GENERAL_MANAGER]: LEVELS.GENERAL_MANAGER,       // 1
  [ROLES.MANAGER]: LEVELS.MANAGER,                       // 2
  [ROLES.SUPERVISOR]: LEVELS.SUPERVISOR,                 // 3
  [ROLES.TEAM_LEADER]: LEVELS.TEAM_LEADER,               // 4
  [ROLES.OPERATOR]: LEVELS.OPERATOR,                     // 5
  [ROLES.TECHNICIAN]: LEVELS.TECHNICIAN,                 // 5
  [ROLES.QC_INSPECTOR]: LEVELS.QC_INSPECTOR,             // 5
  [ROLES.MAINTENANCE_STAFF]: LEVELS.MAINTENANCE_STAFF,   // 5
  [ROLES.VIEWER]: LEVELS.VIEWER                          // 6
};

/**
 * ALL VALID ROLES - for validation
 */
const ALL_ROLES = Object.values(ROLES);

/**
 * ROLES ALLOWED FOR WEB DASHBOARD ACCESS
 * Based on SRS: Manager/Admin sử dụng Web Dashboard
 * Level 1-4 can access web (Admin, GM, Manager, Supervisor, Team Leader)
 */
const WEB_ACCESS_ROLES = [
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER,
  ROLES.MANAGER,
  ROLES.SUPERVISOR,
  ROLES.TEAM_LEADER
];

/**
 * ROLES THAT CAN MANAGE USERS
 * Only Admin can manage all users
 */
const USER_MANAGEMENT_ROLES = [
  ROLES.ADMIN
];

/**
 * ROLES THAT CAN VIEW PINK BOX (Anonymous ideas)
 * Based on SRS: Admin quản lý hòm hồng
 */
const PINK_BOX_ACCESS_ROLES = [
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER
];

/**
 * ROLES THAT CAN CREATE/PUBLISH NEWS
 * Based on SRS: Tin tức được tạo qua Web Dashboard
 */
const NEWS_MANAGEMENT_ROLES = [
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER,
  ROLES.MANAGER,
  ROLES.SUPERVISOR
];

/**
 * ROLES THAT CAN REVIEW IDEAS
 * Based on SRS Section 5: Quy trình xử lý hòm thư
 */
const IDEA_REVIEW_ROLES = [
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER,
  ROLES.MANAGER,
  ROLES.SUPERVISOR
];

/**
 * ROLES THAT CAN MANAGE ROOMS
 * Only Admin can create/update/delete rooms
 */
const ROOM_MANAGEMENT_ROLES = [
  ROLES.ADMIN
];

/**
 * ROLES THAT CAN APPROVE ROOM BOOKINGS
 * Supervisor and above can approve bookings
 */
const ROOM_APPROVAL_ROLES = [
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER,
  ROLES.MANAGER,
  ROLES.SUPERVISOR
];

/**
 * ROLES THAT CAN BOOK ALL ROOMS
 * Without department restriction
 */
const BOOK_ALL_ROOMS_ROLES = [
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER,
  ROLES.MANAGER
];

/**
 * ROLES THAT CAN ASSIGN INCIDENTS
 * Supervisor and above can assign incidents to staff
 */
const INCIDENT_ASSIGNMENT_ROLES = [
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER,
  ROLES.MANAGER,
  ROLES.SUPERVISOR,
  ROLES.TEAM_LEADER
];

/**
 * INCIDENT ESCALATION LEVELS
 * Based on SRS Section 10: Quy trình xử lý báo cáo sự cố
 * User → Team Leader → Supervisor → Manager → Admin
 */
const INCIDENT_ESCALATION_LEVELS = {
  1: { name: 'Team Leader', role: ROLES.TEAM_LEADER, level: LEVELS.TEAM_LEADER },
  2: { name: 'Supervisor', role: ROLES.SUPERVISOR, level: LEVELS.SUPERVISOR },
  3: { name: 'Manager', role: ROLES.MANAGER, level: LEVELS.MANAGER },
  4: { name: 'Admin/GM', role: ROLES.ADMIN, level: LEVELS.ADMIN }
};

/**
 * IDEA ESCALATION LEVELS (White Box)
 * Based on SRS Section 5: Quy trình xử lý hòm thư
 * Supervisor → Manager → General Manager
 */
const IDEA_ESCALATION_LEVELS = {
  1: { name: 'Supervisor', role: ROLES.SUPERVISOR, level: LEVELS.SUPERVISOR },
  2: { name: 'Manager', role: ROLES.MANAGER, level: LEVELS.MANAGER },
  3: { name: 'General Manager', role: ROLES.GENERAL_MANAGER, level: LEVELS.GENERAL_MANAGER }
};

/**
 * DATA SCOPE DEFINITIONS
 * Determines what data a user can access based on their level
 */
const DATA_SCOPES = {
  ALL: 'all',           // Can see all data (Level 1-2)
  DEPARTMENT: 'department', // Can see department data (Level 3)
  TEAM: 'team',         // Can see team data (Level 4)
  SELF: 'self'          // Can only see own data (Level 5-6)
};

/**
 * Get data scope based on user level
 * @param {number} level - User's role level
 * @returns {string} Data scope identifier
 */
const getDataScopeByLevel = (level) => {
  if (level <= 2) return DATA_SCOPES.ALL;
  if (level === 3) return DATA_SCOPES.DEPARTMENT;
  if (level === 4) return DATA_SCOPES.TEAM;
  return DATA_SCOPES.SELF;
};

/**
 * PERMISSION HELPER FUNCTIONS
 */

/**
 * Check if role has web access
 * @param {string} role - Role name
 * @returns {boolean}
 */
const hasWebAccess = (role) => WEB_ACCESS_ROLES.includes(role);

/**
 * Check if role can manage users
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canManageUsers = (role) => USER_MANAGEMENT_ROLES.includes(role);

/**
 * Check if role can view pink box
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canViewPinkBox = (role) => PINK_BOX_ACCESS_ROLES.includes(role);

/**
 * Check if role can review ideas
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canReviewIdeas = (role) => IDEA_REVIEW_ROLES.includes(role);

/**
 * Check if role can create news
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canCreateNews = (role) => NEWS_MANAGEMENT_ROLES.includes(role);

/**
 * Check if role can manage rooms
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canManageRooms = (role) => ROOM_MANAGEMENT_ROLES.includes(role);

/**
 * Check if role can approve room bookings
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canApproveRoomBookings = (role) => ROOM_APPROVAL_ROLES.includes(role);

/**
 * Check if role can book all rooms
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canBookAllRooms = (role) => BOOK_ALL_ROOMS_ROLES.includes(role);

/**
 * Check if role can assign incidents
 * @param {string} role - Role name
 * @returns {boolean}
 */
const canAssignIncidents = (role) => INCIDENT_ASSIGNMENT_ROLES.includes(role);

/**
 * Get level from role
 * @param {string} role - Role name
 * @returns {number} Level (defaults to 6 if not found)
 */
const getLevelFromRole = (role) => ROLE_TO_LEVEL[role] || LEVELS.VIEWER;

/**
 * Check if a role is valid
 * @param {string} role - Role name to validate
 * @returns {boolean}
 */
const isValidRole = (role) => ALL_ROLES.includes(role);

/**
 * Get roles at or above a certain level
 * @param {number} minLevel - Minimum level (inclusive)
 * @returns {string[]} Array of roles
 */
const getRolesAtOrAboveLevel = (minLevel) => {
  return ALL_ROLES.filter(role => ROLE_TO_LEVEL[role] <= minLevel);
};

/**
 * Get roles at a specific level
 * @param {number} level - Target level
 * @returns {string[]} Array of roles
 */
const getRolesAtLevel = (level) => {
  return ALL_ROLES.filter(role => ROLE_TO_LEVEL[role] === level);
};

module.exports = {
  // Core definitions
  ROLES,
  LEVELS,
  ROLE_TO_LEVEL,
  ALL_ROLES,
  
  // Access control lists
  WEB_ACCESS_ROLES,
  USER_MANAGEMENT_ROLES,
  PINK_BOX_ACCESS_ROLES,
  NEWS_MANAGEMENT_ROLES,
  IDEA_REVIEW_ROLES,
  ROOM_MANAGEMENT_ROLES,
  ROOM_APPROVAL_ROLES,
  BOOK_ALL_ROOMS_ROLES,
  INCIDENT_ASSIGNMENT_ROLES,
  
  // Escalation definitions
  INCIDENT_ESCALATION_LEVELS,
  IDEA_ESCALATION_LEVELS,
  
  // Data scope
  DATA_SCOPES,
  getDataScopeByLevel,
  
  // Helper functions
  hasWebAccess,
  canManageUsers,
  canViewPinkBox,
  canReviewIdeas,
  canCreateNews,
  canManageRooms,
  canApproveRoomBookings,
  canBookAllRooms,
  canAssignIncidents,
  getLevelFromRole,
  isValidRole,
  getRolesAtOrAboveLevel,
  getRolesAtLevel
};
