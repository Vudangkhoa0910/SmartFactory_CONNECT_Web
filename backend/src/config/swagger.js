/**
 * Swagger Configuration
 * API Documentation for SmartFactory CONNECT
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartFactory CONNECT API',
      version: '1.0.0',
      description: `
# SmartFactory CONNECT API Documentation

API backend cho hệ thống quản lý nhà máy thông minh SmartFactory CONNECT.

## Tính năng chính

- **Authentication**: Đăng nhập, đăng xuất, quản lý phiên
- **Users**: Quản lý người dùng
- **Departments**: Quản lý phòng ban
- **Incidents**: Báo cáo và quản lý sự cố
- **Ideas**: Hộp thư góp ý (Kaizen)
- **Dashboard**: Thống kê và biểu đồ
- **Notifications**: Thông báo realtime
- **Room Booking**: Đặt phòng họp
- **News**: Tin tức nội bộ

## Authentication

Sử dụng JWT Bearer Token. Thêm header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
      `,
      contact: {
        name: 'SmartFactory Support',
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
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Departments', description: 'Department management' },
      { name: 'Incidents', description: 'Incident reporting and management' },
      { name: 'Ideas', description: 'Idea/Kaizen management' },
      { name: 'Dashboard', description: 'Dashboard statistics and charts' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Room Booking', description: 'Meeting room booking' },
      { name: 'News', description: 'Internal news management' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        // Common schemas
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

        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@smartfactory.com' },
            password: { type: 'string', example: 'admin123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employee_id: { type: 'string', example: 'NV001' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'manager', 'employee', 'guest'] },
            level: { type: 'integer', minimum: 1, maximum: 10 },
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // Department schemas
        Department: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'IT' },
            name: { type: 'string', example: 'Phòng IT' },
            description: { type: 'string' },
            manager_id: { type: 'string', format: 'uuid' },
            manager_name: { type: 'string' },
            employee_count: { type: 'integer' },
            is_active: { type: 'boolean' }
          }
        },

        // Incident schemas
        Incident: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            incident_code: { type: 'string', example: 'INC-2024-001' },
            title: { type: 'string' },
            description: { type: 'string' },
            incident_type: { type: 'string', enum: ['machine', 'quality', 'safety', 'environment', 'other'] },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            status: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled', 'escalated'] },
            location: { type: 'string' },
            reporter_id: { type: 'string', format: 'uuid' },
            reporter_name: { type: 'string' },
            assigned_to: { type: 'string', format: 'uuid' },
            assigned_to_name: { type: 'string' },
            department_id: { type: 'string', format: 'uuid' },
            department_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            resolved_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateIncident: {
          type: 'object',
          required: ['title', 'description', 'incident_type', 'priority', 'location'],
          properties: {
            title: { type: 'string', example: 'Máy CNC #5 ngừng hoạt động' },
            description: { type: 'string', example: 'Máy CNC số 5 bị lỗi không khởi động được' },
            incident_type: { type: 'string', enum: ['machine', 'quality', 'safety', 'environment', 'other'] },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            location: { type: 'string', example: 'Xưởng A - Line 3' },
            department_id: { type: 'string', format: 'uuid' }
          }
        },

        // Idea schemas
        Idea: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            idea_code: { type: 'string', example: 'IDEA-2024-001' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            box_type: { type: 'string', enum: ['white', 'pink'] },
            status: { type: 'string', enum: ['pending', 'under_review', 'approved', 'rejected', 'implemented', 'on_hold'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            difficulty_level: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
            expected_benefit: { type: 'string' },
            estimated_savings: { type: 'number' },
            actual_savings: { type: 'number' },
            submitter_id: { type: 'string', format: 'uuid' },
            submitter_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateIdea: {
          type: 'object',
          required: ['title', 'description', 'category', 'box_type'],
          properties: {
            title: { type: 'string', example: 'Cải tiến quy trình đóng gói' },
            description: { type: 'string' },
            category: { type: 'string', example: 'Chất lượng' },
            box_type: { type: 'string', enum: ['white', 'pink'] },
            expected_benefit: { type: 'string' },
            estimated_savings: { type: 'number' }
          }
        },

        // Dashboard schemas
        DashboardSummary: {
          type: 'object',
          properties: {
            total_incidents: { type: 'integer' },
            pending_incidents: { type: 'integer' },
            resolved_incidents: { type: 'integer' },
            total_ideas: { type: 'integer' },
            pending_ideas: { type: 'integer' },
            implemented_ideas: { type: 'integer' },
            active_users: { type: 'integer' },
            departments_count: { type: 'integer' }
          }
        },
        IncidentTrend: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' } },
            reported: { type: 'array', items: { type: 'integer' } },
            resolved: { type: 'array', items: { type: 'integer' } }
          }
        },

        // Notification schemas
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['incident', 'idea', 'system', 'news'] },
            title: { type: 'string' },
            message: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // Room Booking schemas
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            location: { type: 'string' },
            capacity: { type: 'integer' },
            amenities: { type: 'array', items: { type: 'string' } },
            is_active: { type: 'boolean' }
          }
        },
        RoomBooking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            room_id: { type: 'string', format: 'uuid' },
            room_name: { type: 'string' },
            user_id: { type: 'string', format: 'uuid' },
            user_name: { type: 'string' },
            title: { type: 'string' },
            start_time: { type: 'string', format: 'date-time' },
            end_time: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'] }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
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
    `,
    customSiteTitle: 'SmartFactory CONNECT API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  })
};

module.exports = swaggerConfig;
