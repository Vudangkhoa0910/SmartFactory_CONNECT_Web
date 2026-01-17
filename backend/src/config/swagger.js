/**
 * Swagger Configuration
 * API Documentation for SmartFactory CONNECT
 * Aligned with SRS v2.1
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartFactory CONNECT API',
      version: '2.0.0',
      description: `
# SmartFactory CONNECT API Documentation

API backend cho hệ thống quản lý nhà máy thông minh SmartFactory CONNECT.

## Tính năng chính (theo SRS v2.1)

- **Authentication**: Đăng nhập, đăng xuất, quản lý phiên
- **Users**: Quản lý người dùng theo vai trò
- **Departments**: Quản lý phòng ban (9 phòng ban chính)
- **Incidents**: Báo cáo và quản lý sự cố với RAG AI
- **Ideas**: Hộp thư góp ý (Hòm trắng/Hòm hồng)
- **News**: Tin tức nội bộ đa dạng
- **Dashboard**: Thống kê và KPI
- **Notifications**: Thông báo realtime
- **Chat AI**: Trợ lý AI với Mistral + RAG (App/Web differentiation)
- **Translation**: Dịch thuật Việt-Nhật
- **Room Booking**: Đặt phòng họp với phê duyệt
- **Kaizen Bank**: Ngân hàng ý tưởng Kaizen
- **Metadata**: Enums và filters cho Mobile App

## Vai trò & Phân quyền Chi tiết (SRS Section 9)

| Level | Vai trò | Quyền hạn |
|-------|---------|-----------|
| 1 | Admin, General Manager | Full access - Quản lý toàn hệ thống |
| 2 | Manager | Department management - Quản lý phòng ban |
| 3 | Supervisor | Team supervision - Giám sát team |
| 4 | Team Leader | Team coordination - Điều phối team |
| 5 | Operator, Technician, QC, Maintenance | Standard users - Người dùng cơ bản |
| 6 | Viewer | Read-only - Chỉ xem |

## Ma trận Quyền Chi tiết

| Chức năng | L1 Admin/GM | L2 Manager | L3 Supervisor | L4 Team Leader | L5 Operator | L6 Viewer |
|-----------|-------------|------------|---------------|----------------|-------------|----------|
| Quản lý Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Quản lý Departments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem tất cả Incidents | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem tất cả Ideas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish News | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem Statistics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Pink Box Access | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Room Bookings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Rooms | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Book All Rooms | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Web Dashboard Access | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

## Authentication

Sử dụng JWT Bearer Token:
\`\`\`
Authorization: Bearer <token>
\`\`\`
      `,
      contact: {
        name: 'PKA_AUTOMAX Team',
        email: 'support@smartfactory.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      },
      {
        url: 'https://api.smartfactory.com',
        description: 'Production Server'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication - Đăng nhập/Đăng xuất' },
      { name: 'Users', description: 'User Management - Quản lý người dùng (Admin only)' },
      { name: 'Departments', description: 'Department Management - Quản lý phòng ban' },
      { name: 'Incidents', description: 'Incident Reporting - Báo cáo sự cố (SRS Section 3, 10)' },
      { name: 'Ideas', description: 'Idea Box - Hòm thư góp ý (SRS Section 4, 5)' },
      { name: 'News', description: 'News Management - Tin tức nội bộ (SRS Section 7)' },
      { name: 'Notifications', description: 'Notifications - Thông báo realtime' },
      { name: 'Dashboard', description: 'Dashboard & KPI - Thống kê (SRS Section 11.2)' },
      { name: 'Chat', description: 'AI Chat - Trợ lý AI với RAG, App/Web differentiation' },
      { name: 'Translation', description: 'Translation - Dịch thuật Việt-Nhật (SRS Section 8.1)' },
      { name: 'Media', description: 'Media Storage - Lưu trữ file đa phương tiện' },
      { name: 'Settings', description: 'System Settings - Cấu hình hệ thống' },
      { name: 'Rooms', description: 'Room Management - Quản lý phòng họp (Admin only)' },
      { name: 'Room Bookings', description: 'Room Booking - Đặt phòng với phê duyệt theo phân quyền' },
      { name: 'Kaizen Bank', description: 'Kaizen Bank - Ngân hàng ý tưởng cải tiến' },
      { name: 'Metadata', description: 'Metadata API - Enums, filters cho Mobile App' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token từ login API'
        }
      },
      schemas: {
        // ==================== COMMON SCHEMAS ====================
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalItems: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 }
          }
        },

        // ==================== AUTH SCHEMAS ====================
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@smartfactory.vn' },
            password: { type: 'string', minLength: 6, example: 'Admin@123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['employee_code', 'email', 'password', 'full_name', 'role'],
          properties: {
            employee_code: { type: 'string', example: 'NV001' },
            email: { type: 'string', format: 'email', example: 'user@smartfactory.vn' },
            password: { type: 'string', minLength: 6, example: 'User@123' },
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            phone: { type: 'string', example: '0901234567' },
            role: { 
              type: 'string', 
              enum: ['admin', 'general_manager', 'manager', 'supervisor', 'team_leader', 'operator', 'technician', 'qc_inspector', 'maintenance_staff', 'viewer'],
              example: 'operator'
            },
            department_id: { type: 'string', format: 'uuid' }
          }
        },

        // ==================== USER SCHEMAS ====================
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employee_code: { type: 'string', example: 'NV001' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            phone: { type: 'string', example: '0901234567' },
            role: { 
              type: 'string', 
              enum: ['admin', 'general_manager', 'manager', 'supervisor', 'team_leader', 'operator', 'technician', 'qc_inspector', 'maintenance_staff', 'viewer']
            },
            level: { type: 'integer', minimum: 1, maximum: 6, description: 'Level 1 (Admin) to Level 6 (Viewer)' },
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            is_active: { type: 'boolean' },
            last_login: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateUser: {
          type: 'object',
          required: ['employee_code', 'email', 'password', 'full_name', 'role'],
          properties: {
            employee_code: { type: 'string', example: 'NV002' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            full_name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'general_manager', 'manager', 'supervisor', 'team_leader', 'operator', 'technician', 'qc_inspector', 'maintenance_staff', 'viewer'] },
            department_id: { type: 'string', format: 'uuid' }
          }
        },
        UpdateUser: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' },
            department_id: { type: 'string', format: 'uuid' },
            is_active: { type: 'boolean' }
          }
        },

        // ==================== DEPARTMENT SCHEMAS (SRS Section 2) ====================
        Department: {
          type: 'object',
          description: 'Phòng ban theo SRS Section 2',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'PROD', description: 'Mã phòng ban' },
            name: { type: 'string', example: 'Phòng Sản xuất' },
            description: { type: 'string' },
            parent_id: { type: 'string', format: 'uuid', description: 'Phòng ban cấp trên' },
            manager_id: { type: 'string', format: 'uuid' },
            manager_name: { type: 'string' },
            employee_count: { type: 'integer' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateDepartment: {
          type: 'object',
          required: ['code', 'name'],
          properties: {
            code: { type: 'string', maxLength: 50 },
            name: { type: 'string', maxLength: 100 },
            description: { type: 'string' },
            parent_id: { type: 'string', format: 'uuid' },
            manager_id: { type: 'string', format: 'uuid' }
          }
        },

        // ==================== INCIDENT SCHEMAS (SRS Section 3, 10, 11) ====================
        Incident: {
          type: 'object',
          description: 'Báo cáo sự cố theo SRS Section 3',
          properties: {
            id: { type: 'string', format: 'uuid' },
            incident_type: { 
              type: 'string', 
              enum: ['safety', 'quality', 'equipment', 'other'],
              description: 'Loại sự cố: An toàn, Chất lượng, Thiết bị, Khác'
            },
            title: { type: 'string', example: 'Máy CNC #5 ngừng hoạt động' },
            title_ja: { type: 'string', description: 'Tiêu đề tiếng Nhật' },
            description: { type: 'string' },
            description_ja: { type: 'string' },
            location: { type: 'string', example: 'Xưởng A - Line 3' },
            priority: { 
              type: 'string', 
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Mức độ ưu tiên'
            },
            status: { 
              type: 'string', 
              enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled', 'escalated'],
              description: 'Trạng thái xử lý'
            },
            reporter_id: { type: 'string', format: 'uuid' },
            reporter_name: { type: 'string' },
            assigned_to: { type: 'string', format: 'uuid' },
            assigned_to_name: { type: 'string' },
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            escalation_level: { type: 'integer', description: 'Cấp độ leo thang' },
            rag_suggestion: { 
              type: 'object', 
              description: 'Đề xuất từ AI RAG',
              properties: {
                department_id: { type: 'string', format: 'uuid' },
                department_name: { type: 'string' },
                confidence: { type: 'number', example: 0.92 },
                auto_assign: { type: 'boolean' },
                similar_incidents: { type: 'array', items: { type: 'object' } }
              }
            },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            rating_feedback: { type: 'string' },
            resolution_notes: { type: 'string' },
            resolved_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateIncident: {
          type: 'object',
          required: ['incident_type', 'title', 'description', 'priority'],
          properties: {
            incident_type: { type: 'string', enum: ['safety', 'quality', 'equipment', 'other'] },
            title: { type: 'string', maxLength: 200 },
            title_ja: { type: 'string', maxLength: 200 },
            description: { type: 'string' },
            description_ja: { type: 'string' },
            location: { type: 'string', maxLength: 200 },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
            department_id: { type: 'string', format: 'uuid' }
          }
        },
        UpdateIncidentStatus: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled', 'escalated'] },
            notes: { type: 'string' }
          }
        },
        AssignIncident: {
          type: 'object',
          properties: {
            assigned_to: { type: 'string', format: 'uuid' },
            department_id: { type: 'string', format: 'uuid' }
          }
        },
        ResolveIncident: {
          type: 'object',
          required: ['resolution_notes'],
          properties: {
            resolution_notes: { type: 'string' },
            root_cause: { type: 'string' },
            corrective_actions: { type: 'string' }
          }
        },
        RateIncident: {
          type: 'object',
          required: ['rating'],
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            feedback: { type: 'string' }
          }
        },
        IncidentComment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            incident_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            user_name: { type: 'string' },
            comment: { type: 'string' },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // ==================== IDEA SCHEMAS (SRS Section 4, 5) ====================
        Idea: {
          type: 'object',
          description: 'Ý tưởng/Góp ý theo SRS Section 4',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ideabox_type: { 
              type: 'string', 
              enum: ['white', 'pink'],
              description: 'Hòm trắng (công khai) / Hòm hồng (ẩn danh)'
            },
            category: { 
              type: 'string', 
              enum: ['process_improvement', 'cost_reduction', 'quality_improvement', 'safety_enhancement', 'productivity', 'innovation', 'environment', 'workplace', 'other'],
              description: 'Phân loại: Chất lượng, An toàn, Hiệu suất, Tiết kiệm NL, Khác'
            },
            title: { type: 'string' },
            title_ja: { type: 'string' },
            description: { type: 'string' },
            description_ja: { type: 'string' },
            expected_benefit: { type: 'string' },
            expected_benefit_ja: { type: 'string' },
            difficulty: { 
              type: 'string', 
              enum: ['A', 'B', 'C', 'D'],
              description: 'Độ khó: A (dễ) -> D (khó)'
            },
            status: { 
              type: 'string', 
              enum: ['pending', 'under_review', 'approved', 'rejected', 'implemented', 'on_hold']
            },
            submitter_id: { type: 'string', format: 'uuid' },
            submitter_name: { type: 'string' },
            is_anonymous: { type: 'boolean', description: 'Hòm hồng = true' },
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            assigned_to: { type: 'string', format: 'uuid' },
            handler_level: { type: 'integer', description: '1=Supervisor, 2=Manager, 3=GM' },
            escalation_level: { type: 'integer' },
            feasibility_score: { type: 'integer', minimum: 1, maximum: 10 },
            impact_score: { type: 'integer', minimum: 1, maximum: 10 },
            review_notes: { type: 'string' },
            reviewed_by: { type: 'string', format: 'uuid' },
            reviewed_at: { type: 'string', format: 'date-time' },
            implementation_notes: { type: 'string' },
            actual_benefit: { type: 'string' },
            implemented_at: { type: 'string', format: 'date-time' },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateIdea: {
          type: 'object',
          required: ['ideabox_type', 'category', 'title', 'description'],
          properties: {
            ideabox_type: { type: 'string', enum: ['white', 'pink'] },
            category: { type: 'string', enum: ['process_improvement', 'cost_reduction', 'quality_improvement', 'safety_enhancement', 'productivity', 'innovation', 'environment', 'workplace', 'other'] },
            title: { type: 'string', maxLength: 200 },
            title_ja: { type: 'string', maxLength: 200 },
            description: { type: 'string' },
            description_ja: { type: 'string' },
            expected_benefit: { type: 'string' },
            expected_benefit_ja: { type: 'string' },
            difficulty: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
            department_id: { type: 'string', format: 'uuid' }
          }
        },
        ReviewIdea: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['under_review', 'approved', 'rejected', 'implemented', 'on_hold'] },
            review_notes: { type: 'string' },
            feasibility_score: { type: 'integer', minimum: 1, maximum: 10 },
            impact_score: { type: 'integer', minimum: 1, maximum: 10 },
            difficulty: { type: 'string', enum: ['A', 'B', 'C', 'D'] }
          }
        },
        ImplementIdea: {
          type: 'object',
          required: ['implementation_notes'],
          properties: {
            implementation_notes: { type: 'string' },
            actual_benefit: { type: 'string' }
          }
        },
        IdeaResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            idea_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            user_name: { type: 'string' },
            response: { type: 'string' },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        IdeaRating: {
          type: 'object',
          required: ['overall_rating'],
          properties: {
            overall_rating: { type: 'integer', minimum: 1, maximum: 5 },
            response_quality: { type: 'integer', minimum: 1, maximum: 5 },
            response_time: { type: 'integer', minimum: 1, maximum: 5 },
            implementation_quality: { type: 'integer', minimum: 1, maximum: 5 },
            feedback: { type: 'string' },
            is_satisfied: { type: 'boolean' }
          }
        },

        // ==================== NEWS SCHEMAS (SRS Section 7) ====================
        News: {
          type: 'object',
          description: 'Tin tức theo SRS Section 7',
          properties: {
            id: { type: 'string', format: 'uuid' },
            category: { 
              type: 'string', 
              enum: ['company_announcement', 'policy_update', 'event', 'achievement', 'safety_alert', 'maintenance', 'training', 'welfare', 'newsletter', 'emergency', 'other'],
              description: 'Loại: Kỹ thuật, An toàn, Nhân sự, Chất lượng, etc.'
            },
            title: { type: 'string' },
            content: { type: 'string' },
            excerpt: { type: 'string', maxLength: 500 },
            author_id: { type: 'string', format: 'uuid' },
            author_name: { type: 'string' },
            target_audience: { 
              type: 'string', 
              enum: ['all', 'departments', 'users'],
              default: 'all'
            },
            target_departments: { 
              type: 'array', 
              items: { type: 'string', format: 'uuid' }
            },
            target_users: { 
              type: 'array', 
              items: { type: 'string', format: 'uuid' }
            },
            is_priority: { type: 'boolean', default: false },
            status: { type: 'string', enum: ['draft', 'published', 'archived', 'deleted'] },
            publish_at: { type: 'string', format: 'date-time' },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
            view_count: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateNews: {
          type: 'object',
          required: ['category', 'title', 'content'],
          properties: {
            category: { type: 'string', enum: ['company_announcement', 'policy_update', 'event', 'achievement', 'safety_alert', 'maintenance', 'training', 'welfare', 'newsletter', 'emergency', 'other'] },
            title: { type: 'string', maxLength: 200 },
            content: { type: 'string' },
            excerpt: { type: 'string', maxLength: 500 },
            target_audience: { type: 'string', enum: ['all', 'departments', 'users'] },
            target_departments: { type: 'array', items: { type: 'string', format: 'uuid' } },
            target_users: { type: 'array', items: { type: 'string', format: 'uuid' } },
            is_priority: { type: 'boolean' },
            publish_at: { type: 'string', format: 'date-time' }
          }
        },

        // ==================== NOTIFICATION SCHEMAS ====================
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            type: { 
              type: 'string', 
              enum: ['incident_assigned', 'incident_escalated', 'incident_resolved', 'idea_submitted', 'idea_reviewed', 'idea_implemented', 'news_published', 'system_alert', 'comment_added', 'response_added']
            },
            title: { type: 'string' },
            message: { type: 'string' },
            reference_type: { type: 'string', enum: ['incident', 'idea', 'news', 'system'] },
            reference_id: { type: 'string', format: 'uuid' },
            action_url: { type: 'string' },
            is_read: { type: 'boolean' },
            read_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // ==================== DASHBOARD SCHEMAS (SRS Section 11.2) ====================
        DashboardSummary: {
          type: 'object',
          description: 'Thống kê tổng quan theo SRS Section 11.2',
          properties: {
            incidents: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                pending: { type: 'integer' },
                in_progress: { type: 'integer' },
                resolved: { type: 'integer' },
                this_week: { type: 'integer' }
              }
            },
            ideas: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                white_box: { type: 'integer' },
                pink_box: { type: 'integer' },
                pending: { type: 'integer' },
                implemented: { type: 'integer' }
              }
            },
            users: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                active: { type: 'integer' }
              }
            },
            departments: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                active: { type: 'integer' }
              }
            }
          }
        },
        IncidentTrend: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] },
            labels: { type: 'array', items: { type: 'string' } },
            reported: { type: 'array', items: { type: 'integer' } },
            resolved: { type: 'array', items: { type: 'integer' } }
          }
        },
        DepartmentKPI: {
          type: 'object',
          properties: {
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            incident_count: { type: 'integer' },
            resolution_rate: { type: 'number', example: 0.85 },
            avg_resolution_time: { type: 'number', description: 'Hours' },
            idea_count: { type: 'integer' },
            implementation_rate: { type: 'number' }
          }
        },

        // ==================== CHAT/AI SCHEMAS (SRS Section 8.2) ====================
        ChatMessage: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', example: 'Tìm sự cố liên quan đến máy CNC' },
            conversation_id: { type: 'string' }
          }
        },
        ChatResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            response: { type: 'string', description: 'Phản hồi từ AI' },
            tool_calls: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  function: { type: 'string' },
                  result: { type: 'object' }
                }
              }
            },
            conversation_id: { type: 'string' }
          }
        },

        // ==================== TRANSLATION SCHEMAS (SRS Section 8.1) ====================
        TranslateRequest: {
          type: 'object',
          required: ['text', 'target'],
          properties: {
            text: { type: 'string', example: 'Máy ngừng hoạt động' },
            source: { type: 'string', enum: ['vi', 'ja', 'en'], default: 'auto' },
            target: { type: 'string', enum: ['vi', 'ja', 'en'], example: 'ja' }
          }
        },
        TranslateResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            original: { type: 'string' },
            translated: { type: 'string' },
            source_language: { type: 'string' },
            target_language: { type: 'string' }
          }
        },

        // ==================== MEDIA SCHEMAS ====================
        Attachment: {
          type: 'object',
          properties: {
            file_id: { type: 'string' },
            filename: { type: 'string' },
            original_name: { type: 'string' },
            mime_type: { type: 'string' },
            size: { type: 'integer' },
            url: { type: 'string' }
          }
        },
        UploadResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            files: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' }
            }
          }
        },

        // ==================== SETTINGS SCHEMAS ====================
        SystemSetting: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            value: { type: 'object' },
            description: { type: 'string' },
            category: { type: 'string' }
          }
        },

        // ==================== ROOM SCHEMAS ====================
        Room: {
          type: 'object',
          description: 'Phòng họp',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'MR-01', description: 'Mã phòng' },
            name: { type: 'string', example: 'Phòng họp A' },
            name_ja: { type: 'string', example: '会議室A' },
            description: { type: 'string' },
            floor: { type: 'integer', example: 1 },
            building: { type: 'string', example: 'Main' },
            location_details: { type: 'string' },
            capacity: { type: 'integer', example: 10 },
            min_capacity: { type: 'integer', example: 2 },
            has_projector: { type: 'boolean' },
            has_whiteboard: { type: 'boolean' },
            has_video_conference: { type: 'boolean' },
            has_audio_system: { type: 'boolean' },
            has_air_conditioner: { type: 'boolean' },
            has_tv_screen: { type: 'boolean' },
            other_equipment: { type: 'array', items: { type: 'string' } },
            image_url: { type: 'string' },
            thumbnail_url: { type: 'string' },
            status: { type: 'string', enum: ['available', 'occupied', 'maintenance', 'unavailable'] },
            is_active: { type: 'boolean' },
            requires_approval: { type: 'boolean', description: 'Cần phê duyệt khi đặt' },
            max_booking_hours: { type: 'integer', example: 4 },
            advance_booking_days: { type: 'integer', example: 14 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateRoom: {
          type: 'object',
          required: ['code', 'name'],
          description: 'Admin only - Tạo phòng họp mới',
          properties: {
            code: { type: 'string', maxLength: 20 },
            name: { type: 'string', maxLength: 100 },
            name_ja: { type: 'string' },
            description: { type: 'string' },
            floor: { type: 'integer', minimum: -2, maximum: 50, default: 1 },
            building: { type: 'string', default: 'Main' },
            capacity: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            min_capacity: { type: 'integer', default: 2 },
            has_projector: { type: 'boolean', default: false },
            has_whiteboard: { type: 'boolean', default: true },
            has_video_conference: { type: 'boolean', default: false },
            requires_approval: { type: 'boolean', default: false },
            max_booking_hours: { type: 'integer', default: 4 },
            advance_booking_days: { type: 'integer', default: 14 }
          }
        },

        // ==================== ROOM BOOKING SCHEMAS ====================
        RoomBooking: {
          type: 'object',
          description: 'Đặt phòng họp',
          properties: {
            id: { type: 'string', format: 'uuid' },
            room_id: { type: 'string', format: 'uuid' },
            room_name: { type: 'string' },
            room_code: { type: 'string' },
            user_id: { type: 'string', format: 'uuid' },
            user_name: { type: 'string' },
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            title: { type: 'string', example: 'Họp dự án A' },
            title_ja: { type: 'string' },
            description: { type: 'string' },
            purpose: { type: 'string' },
            start_time: { type: 'string', format: 'date-time' },
            end_time: { type: 'string', format: 'date-time' },
            actual_start_time: { type: 'string', format: 'date-time' },
            actual_end_time: { type: 'string', format: 'date-time' },
            expected_attendees: { type: 'integer' },
            attendee_emails: { type: 'array', items: { type: 'string', format: 'email' } },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
              description: 'pending=Chờ duyệt, confirmed=Đã duyệt, in_progress=Đang họp, completed=Kết thúc, cancelled=Đã hủy'
            },
            approved_by: { type: 'string', format: 'uuid' },
            approved_by_name: { type: 'string' },
            approved_at: { type: 'string', format: 'date-time' },
            rejection_reason: { type: 'string' },
            cancelled_by: { type: 'string', format: 'uuid' },
            cancelled_at: { type: 'string', format: 'date-time' },
            cancellation_reason: { type: 'string' },
            is_recurring: { type: 'boolean' },
            recurring_pattern: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
            recurring_end_date: { type: 'string', format: 'date' },
            notes: { type: 'string' },
            special_requirements: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateRoomBooking: {
          type: 'object',
          required: ['room_id', 'title', 'start_time', 'end_time'],
          description: 'Tạo yêu cầu đặt phòng - Cần phê duyệt nếu phòng yêu cầu',
          properties: {
            room_id: { type: 'string', format: 'uuid' },
            title: { type: 'string', maxLength: 200 },
            title_ja: { type: 'string' },
            description: { type: 'string' },
            purpose: { type: 'string', maxLength: 100 },
            start_time: { type: 'string', format: 'date-time' },
            end_time: { type: 'string', format: 'date-time' },
            expected_attendees: { type: 'integer', minimum: 1, default: 1 },
            attendee_emails: { type: 'array', items: { type: 'string', format: 'email' } },
            is_recurring: { type: 'boolean', default: false },
            recurring_pattern: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
            recurring_end_date: { type: 'string', format: 'date' },
            notes: { type: 'string' },
            special_requirements: { type: 'string' }
          }
        },
        ApproveBooking: {
          type: 'object',
          required: ['action'],
          description: 'Phê duyệt/Từ chối booking - Level 3+ (Supervisor trở lên)',
          properties: {
            action: { type: 'string', enum: ['approve', 'reject'] },
            rejection_reason: { type: 'string', description: 'Bắt buộc nếu reject' }
          }
        },
        CancelBooking: {
          type: 'object',
          properties: {
            cancellation_reason: { type: 'string' }
          }
        },
        RoomBookingHistory: {
          type: 'object',
          description: 'Lịch sử thay đổi booking',
          properties: {
            id: { type: 'string', format: 'uuid' },
            booking_id: { type: 'string', format: 'uuid' },
            changed_by: { type: 'string', format: 'uuid' },
            changed_by_name: { type: 'string' },
            old_status: { type: 'string' },
            new_status: { type: 'string' },
            old_start_time: { type: 'string', format: 'date-time' },
            new_start_time: { type: 'string', format: 'date-time' },
            action: { type: 'string', enum: ['created', 'status_changed', 'time_changed', 'updated', 'deleted'] },
            reason: { type: 'string' },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        RoomApprovalRule: {
          type: 'object',
          description: 'Quy tắc phê duyệt phòng - Admin only',
          properties: {
            id: { type: 'string', format: 'uuid' },
            room_id: { type: 'string', format: 'uuid', description: 'NULL = áp dụng tất cả phòng' },
            department_id: { type: 'string', format: 'uuid', description: 'NULL = áp dụng tất cả phòng ban' },
            approver_role: { type: 'string' },
            approver_level: { type: 'integer' },
            min_level_required: { type: 'integer', minimum: 1, maximum: 6, default: 5 },
            auto_approve_for_level: { type: 'integer', minimum: 1, maximum: 6, description: 'Level được tự động duyệt' },
            max_booking_hours_without_approval: { type: 'integer', default: 2 },
            requires_manager_approval: { type: 'boolean', default: false },
            requires_department_head_approval: { type: 'boolean', default: false },
            is_active: { type: 'boolean', default: true },
            priority: { type: 'integer', default: 0 }
          }
        },

        // ==================== KAIZEN BANK SCHEMAS ====================
        KaizenIdea: {
          type: 'object',
          description: 'Ý tưởng Kaizen đã triển khai thành công',
          properties: {
            id: { type: 'string', format: 'uuid' },
            original_idea_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            title_ja: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string', enum: ['process_improvement', 'cost_reduction', 'quality_improvement', 'safety_enhancement', 'productivity', 'innovation'] },
            before_state: { type: 'string', description: 'Trạng thái trước cải tiến' },
            after_state: { type: 'string', description: 'Trạng thái sau cải tiến' },
            implementation_steps: { type: 'string' },
            actual_benefit: { type: 'string' },
            cost_saved: { type: 'number', description: 'Số tiền tiết kiệm (VND)' },
            time_saved_hours: { type: 'number' },
            quality_improvement_percent: { type: 'number' },
            safety_improvement: { type: 'string' },
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            submitter_name: { type: 'string' },
            is_replicable: { type: 'boolean', description: 'Có thể nhân rộng' },
            replication_count: { type: 'integer', description: 'Số lần đã nhân rộng' },
            images: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            total_score: { type: 'number', description: 'Điểm đánh giá tổng' },
            view_count: { type: 'integer' },
            implemented_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // ==================== METADATA SCHEMAS ====================
        MetadataEnum: {
          type: 'object',
          description: 'Enum value cho dropdown/filter',
          properties: {
            value: { type: 'string', example: 'equipment' },
            label_vi: { type: 'string', example: 'Thiết bị' },
            label_ja: { type: 'string', example: '設備' },
            label_en: { type: 'string', example: 'Equipment' },
            color: { type: 'string', example: '#3b82f6' },
            icon: { type: 'string', example: 'build' },
            order: { type: 'integer', example: 1 }
          }
        },
        FilterDropdown: {
          type: 'object',
          description: 'Filter dropdown 2 cột cho Mobile App',
          properties: {
            dropdown_layout: {
              type: 'object',
              properties: {
                column_1: {
                  type: 'object',
                  properties: {
                    title_vi: { type: 'string', example: 'Mức độ ưu tiên' },
                    title_ja: { type: 'string', example: '優先度' },
                    items: { type: 'array', items: { $ref: '#/components/schemas/MetadataEnum' } },
                    filter_key: { type: 'string', example: 'priority' }
                  }
                },
                column_2: {
                  type: 'object',
                  properties: {
                    title_vi: { type: 'string', example: 'Trạng thái' },
                    title_ja: { type: 'string', example: 'ステータス' },
                    items: { type: 'array', items: { $ref: '#/components/schemas/MetadataEnum' } },
                    filter_key: { type: 'string', example: 'status' }
                  }
                }
              }
            },
            quick_filters: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Unauthorized - Token không hợp lệ hoặc đã hết hạn'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Forbidden - Không đủ quyền hạn'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Not Found - Không tìm thấy dữ liệu'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation Error',
                errors: [{ field: 'email', message: 'Email không hợp lệ' }]
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Số trang'
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
          description: 'Số lượng mỗi trang'
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          schema: { type: 'string', example: '-created_at' },
          description: 'Sắp xếp (prefix - = DESC)'
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Tìm kiếm'
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

const swaggerConfig = {
  specs,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #dc2626 }
      .swagger-ui .btn.authorize { background-color: #dc2626; border-color: #dc2626 }
      .swagger-ui .btn.authorize:hover { background-color: #b91c1c }
      .swagger-ui .opblock-tag { font-size: 18px; font-weight: 600 }
    `,
    customSiteTitle: 'SmartFactory CONNECT API v2.0',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  })
};

module.exports = swaggerConfig;
