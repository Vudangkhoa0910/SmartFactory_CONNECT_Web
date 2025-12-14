# SmartFactory CONNECT - Backend API

Backend API cho hệ thống SmartFactory CONNECT, quản lý báo cáo sự cố, hòm thư ý kiến, và thông báo cho nhà máy sản xuất.

## 🚀 Công nghệ sử dụng

- **Node.js** 18+
- **Express.js** 5.1.0
- **PostgreSQL** 14+
- **JWT** - Authentication
- **Multer** - File upload
- **Socket.io** - Real-time notifications
- **Bcrypt** - Password hashing

## 📋 Yêu cầu hệ thống

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm hoặc yarn

## 🛠️ Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartfactory_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Upload Configuration
MAX_FILE_SIZE=10485760
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### 3. Khởi tạo Database

Tạo database PostgreSQL:

```bash
psql -U postgres
CREATE DATABASE smartfactory_db;
\q
```

Chạy migration để tạo schema:

```bash
# Option 1: Schema đầy đủ (khuyến nghị)
psql -U your_db_user -d smartfactory_db -f src/database/schema_complete.sql

# Option 2: Schema cơ bản
psql -U your_db_user -d smartfactory_db -f src/database/schema_incidents_ideas_news.sql

# Thêm room booking (nếu cần)
psql -U your_db_user -d smartfactory_db -f src/database/schema_room_booking.sql

# Migrations bổ sung
psql -U your_db_user -d smartfactory_db -f src/database/migrations/add_translation_tables.sql
```

### 4. Tạo user mặc định (nếu cần)

```bash
node scripts/create_default_users.js
```

### 4. Tạo user mặc định (nếu cần)

```bash
node scripts/create_default_users.js
```

### 5. Chạy ứng dụng

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js              # PostgreSQL connection
│   │   └── socket.js                # Socket.io configuration
│   ├── controllers/
│   │   ├── auth.controller.js       # Authentication logic
│   │   ├── incident.controller.js   # Incident management
│   │   ├── idea.controller.js       # Ideas/Kaizen management
│   │   ├── news.controller.js       # News management
│   │   ├── department.controller.js # Department management
│   │   ├── room-booking.controller.js # Room booking
│   │   ├── translation.controller.js # Multi-language
│   │   └── ...
│   ├── services/
│   │   ├── notification.service.js  # Notification logic
│   │   ├── translation.service.js   # Translation logic
│   │   └── ...
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT authentication
│   │   ├── error.middleware.js      # Error handling
│   │   ├── upload.middleware.js     # File upload
│   │   └── validation.middleware.js # Request validation
│   ├── routes/
│   │   ├── auth.routes.js           # Auth endpoints
│   │   ├── incident.routes.js       # Incident endpoints
│   │   ├── idea.routes.js           # Idea endpoints
│   │   ├── news.routes.js           # News endpoints
│   │   ├── room-booking.routes.js   # Room booking endpoints
│   │   └── ...
│   └── database/
│       ├── schema_complete.sql      # Full schema
│       ├── schema_incidents_ideas_news.sql
│       ├── schema_room_booking.sql
│       ├── migrations/              # Database migrations
│       └── README.md                # Database documentation
├── scripts/
│   ├── create_default_users.js      # Create default users
│   ├── backup_postgresql.sh         # Backup script
│   └── ...
├── uploads/                          # File uploads directory
│   ├── incidents/
│   ├── ideas/
│   ├── news/
│   └── temp/
├── logs/                             # Application logs
├── .env                              # Environment variables
├── .env.example                      # Environment template
├── index.js                          # Main server file
└── package.json
```

## 🔐 Authentication

API sử dụng JWT (JSON Web Token) để xác thực. Để truy cập các protected endpoints, cần gửi token trong header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Role-based Access Control

Hệ thống có 11 roles với level từ 1-10:

| Level | Role                  | Permissions                        |
|-------|-----------------------|------------------------------------|
| 1     | Admin                 | Full system access                 |
| 2     | Factory Manager       | Factory-wide management            |
| 3     | Production Manager    | Production oversight               |
| 4     | Supervisor            | Team supervision + escalation      |
| 5     | Team Leader           | Team management                    |
| 6     | Operator              | Basic operations                   |
| 7     | Technician            | Technical tasks                    |
| 8     | QC Inspector          | Quality control                    |
| 9     | Maintenance Manager   | Maintenance oversight              |
| 10    | Viewer                | Read-only access                   |

## 📡 API Endpoints

### Incident Management

#### 1. Tạo báo cáo sự cố mới
```http
POST /api/incidents
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- incident_type: safety | quality | equipment | other
- title: string (required, max 200 chars)
- description: string (required)
- location: string (optional)
- department_id: UUID (optional)
- priority: low | medium | high | critical (default: medium)
- files: File[] (optional, max 10MB each)
```

**Response:**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "id": "uuid",
    "incident_type": "safety",
    "title": "Sự cố an toàn tại line 1",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    ...
  }
}
```

#### 2. Lấy danh sách sự cố
```http
GET /api/incidents?page=1&limit=20&status=pending&sortBy=created_at&sortOrder=DESC
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: số trang (default: 1)
- `limit`: số items mỗi trang (default: 20, max: 100)
- `sortBy`: sắp xếp theo field (default: created_at)
- `sortOrder`: ASC | DESC (default: DESC)
- `status`: pending | assigned | in_progress | resolved | closed | cancelled | escalated
- `incident_type`: safety | quality | equipment | other
- `priority`: low | medium | high | critical
- `department_id`: UUID
- `assigned_to`: UUID
- `date_from`: ISO8601 date
- `date_to`: ISO8601 date

#### 3. Lấy chi tiết sự cố
```http
GET /api/incidents/:id
Authorization: Bearer {token}
```

#### 4. Phân công sự cố
```http
PUT /api/incidents/:id/assign
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "assigned_to": "user_uuid"
}
```

**Access:** Team Leader and above

#### 5. Cập nhật trạng thái
```http
PUT /api/incidents/:id/status
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "in_progress",
  "notes": "Đang xử lý sự cố"
}
```

#### 6. Thêm bình luận
```http
POST /api/incidents/:id/comments
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- comment: string (required)
- files: File[] (optional)
```

#### 7. Escalate sự cố
```http
PUT /api/incidents/:id/escalate
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "escalate_to": "user_uuid",
  "reason": "Vượt quá thẩm quyền xử lý"
}
```

**Workflow:** User → Team Leader → Supervisor → Production Manager → Factory Manager

#### 8. Giải quyết sự cố
```http
PUT /api/incidents/:id/resolve
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "resolution_notes": "Đã thay thế thiết bị",
  "root_cause": "Thiết bị hỏng do quá hạn bảo trì",
  "corrective_actions": "Lập kế hoạch bảo trì định kỳ"
}
```

#### 9. Đánh giá sự cố
```http
POST /api/incidents/:id/rate
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "rating": 5,
  "feedback": "Xử lý nhanh chóng và hiệu quả"
}
```

**Access:** Chỉ người báo cáo (reporter) có thể đánh giá

#### 10. Thống kê sự cố
```http
GET /api/incidents/stats?date_from=2024-01-01&date_to=2024-01-31&department_id=uuid
Authorization: Bearer {token}
```

**Access:** Supervisor and above

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_incidents": 150,
      "pending": 10,
      "assigned": 20,
      "in_progress": 30,
      "resolved": 80,
      "closed": 8,
      "escalated": 2,
      "avg_rating": 4.5,
      "avg_resolution_hours": 24.5
    },
    "by_type": [
      { "incident_type": "safety", "count": 50 },
      { "incident_type": "quality", "count": 60 },
      ...
    ],
    "by_priority": [...],
    "by_department": [...]
  }
}
```

### Health Check
```http
GET /health
```

## 📤 File Upload

### Supported File Types:
- **Images:** jpg, jpeg, png, gif (max 10MB)
- **Videos:** mp4, mov, avi, wmv (max 10MB)
- **Audio:** mp3, wav, m4a (max 10MB)
- **Documents:** pdf, doc, docx, xls, xlsx (max 10MB)

### Upload Directories:
- `/uploads/incidents/` - Incident attachments
- `/uploads/ideas/` - Idea box attachments
- `/uploads/news/` - News attachments
- `/uploads/temp/` - Temporary files

Files được truy cập qua: `http://localhost:3000/uploads/{module}/{filename}`

## ⚠️ Error Handling

API trả về error format chuẩn:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "title",
      "message": "Title is required",
      "value": ""
    }
  ]
}
```

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## 🔍 Logging

Logs được lưu trong thư mục `/logs`:
- `access.log` - HTTP access logs (production only)
- Console logs - Development mode

## 🧪 Testing

```bash
# Run tests (TODO: implement)
npm test

# Run with coverage
npm run test:coverage
```

## 📝 TODO

- [ ] Implement Idea Box module
- [ ] Implement News/Announcements module
- [ ] Add WebSocket for real-time notifications
- [ ] Add Authentication endpoints (login, register, forgot password)
- [ ] Add User management endpoints
- [ ] Add Department management endpoints
- [ ] Implement unit tests
- [ ] Add API documentation with Swagger
- [ ] Add rate limiting
- [ ] Add request logging to database

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is proprietary software for DENSO Smart Factory.

## 📞 Support

For support, email: support@smartfactory.com

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Developed by:** SmartFactory Development Team
