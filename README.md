# 🏭 SmartFactory CONNECT

> Hệ thống quản lý nhà máy thông minh toàn diện - Smart Manufacturing Management System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)](https://www.postgresql.org)
[![MongoDB](https://img.shields.io/badge/mongodb-7.0-green.svg)](https://www.mongodb.com)
[![React](https://img.shields.io/badge/react-19.0.0-61dafb.svg)](https://react.dev)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](https://www.docker.com)

## 📋 Tổng quan

SmartFactory CONNECT là hệ thống quản lý thông minh được thiết kế đặc biệt cho môi trường nhà máy sản xuất, hỗ trợ **2000-3000 concurrent users** với các tính năng:

### 🎯 Tính năng chính

#### 1. 🚨 Incident Management (Báo cáo sự cố)
- Báo cáo sự cố từ công nhân với photo/video/voice
- Workflow: Worker → Team Leader → Supervisor → Manager
- Team Leader enrichment (bổ sung customer, product, tags)
- Cross-department task assignment
- SLA tracking & auto-escalation
- Rating system sau khi resolve

#### 2. 💡 Idea Box (Hòm thư góp ý)
- **White Box** (Công khai): Process improvement ideas
- **Pink Box** (Ẩn danh): Sensitive feedback
- Multi-level approval: Supervisor → Manager → GM
- Difficulty classification (A-B-C-D)
- Feasibility & Impact scoring
- Implementation tracking

#### 3. 📰 News & Announcements
- Publish news với target departments
- Priority news notification
- Read receipts tracking
- Rich content (text, images, videos)
- Multi-language support

#### 4. 🔔 Real-time Notifications
- Socket.io based instant updates
- Push notifications for critical events
- Notification preferences
- In-app & desktop notifications

#### 5. 📊 Dashboard & Analytics
- Real-time KPI monitoring
- Incident statistics & trends
- SLA compliance tracking
- Department performance metrics
- Custom reports & exports

#### 6. 🏢 Room Booking System
- Conference room reservation
- Conflict detection
- Recurring bookings
- Check-in/out tracking
- Equipment & catering requests

#### 7. 👥 User & Department Management
- Role-based access control (5 levels)
- Hierarchical department structure
- User activity tracking
- Bulk operations

#### 8. 🌐 Multi-language Support
- Vietnamese (vi)
- Japanese (ja)
- English (en)
- Gemini AI-powered translation

#### 9. 💬 AI Chat Assistant
- Natural language queries
- Quick data lookup
- Report generation
- Powered by Google Gemini AI

---

## 🏗️ Kiến trúc hệ thống

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Users (2000-3000)                        │
│        Workers | Team Leaders | Supervisors | Admins         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Incidents │  │  Ideas   │  │   News   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    Nginx (Port 80)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Node.js + Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   API    │  │ Socket.io│  │  Gemini  │   │
│  │   JWT    │  │  REST    │  │Real-time │  │    AI    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                    Express (Port 3000)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────┬─────────────────────────────────────────┐
│   PostgreSQL 15   │          MongoDB 7.0                    │
│   (Port 5432)     │        (Port 27017)                     │
├───────────────────┼─────────────────────────────────────────┤
│ • 21 Tables       │ • GridFS Media Storage                  │
│ • 7 ENUMs         │ • Images, Documents                     │
│ • Views/Functions │ • Incident/Idea/News Photos             │
│ • Triggers        │ • User Avatars                          │
│ • Pool: 50 max    │ • Binary Files (>16MB support)          │
└───────────────────┴─────────────────────────────────────────┘
```

### Project Structure

```
SmartFactory_CONNECT_Web/
├── 📄 docker-compose.yml          # Multi-container orchestration
├── 📄 QUICK_START.md              # Quick start guide
├── 📄 DEVELOPMENT_PLAN.md         # 6-phase development roadmap
├── 📄 DATABASE_ANALYSIS.md        # Complete database documentation
├── 📄 API_DOCUMENTATION.md        # All API endpoints
├── 📄 PROJECT_ANALYSIS.md         # Project analysis & recommendations
│
├── 📁 backend/                    # Node.js API Server
│   ├── 📁 src/
│   │   ├── 📁 config/            # Database (PostgreSQL + MongoDB), Socket.io, Swagger
│   │   ├── 📁 controllers/       # Request handlers (10 controllers)
│   │   ├── 📁 services/          # Business logic layer + Media Storage
│   │   ├── 📁 routes/            # API routes (11 route files)
│   │   ├── 📁 middlewares/       # Auth, Upload, Validation, Error
│   │   └── 📁 database/          # Schemas & Migrations
│   ├── 📁 uploads/               # File storage (incidents, ideas, news)
│   ├── 📁 logs/                  # Application logs
│   ├── 📄 MONGODB.md             # MongoDB GridFS documentation
│   ├── 📄 Dockerfile
│   └── 📄 package.json
│
├── 📁 frontend/                   # React Application
│   ├── 📁 src/
│   │   ├── 📁 components/        # Reusable components
│   │   ├── 📁 pages/             # Page components
│   │   ├── 📁 services/          # API service layer
│   │   ├── 📁 contexts/          # React contexts (Auth, Language, Theme, Sidebar)
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   ├── 📁 types/             # TypeScript definitions
│   │   ├── 📁 i18n/              # Internationalization (vi, ja, en)
│   │   └── 📁 layout/            # Layout components
│   ├── 📁 public/                # Static assets
│   ├── 📄 nginx.conf             # Nginx configuration
│   ├── 📄 Dockerfile
│   └── 📄 package.json
│
└── 📁 docs/                       # Documentation
    ├── 📄 Software_requirment_specifical.txt
    └── 📄 System_Flow.txt
```

## 🚀 Công nghệ sử dụng

### Backend
- **Node.js** 18+ - JavaScript runtime
- **Express.js** 5.1.0 - Web framework
- **PostgreSQL** 14+ - Database
- **Socket.io** 4.7.2 - Real-time communication
- **JWT** - Authentication
- **Multer** - File upload
- **Bcrypt** - Password hashing

### Frontend
- **React** 19.0.0 - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** 7.1.5 - Routing
- **Axios** - HTTP client
- **ApexCharts** - Data visualization
- **Socket.io Client** - Real-time updates

## 📦 Yêu cầu hệ thống

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **npm** hoặc **yarn**
- **Git**
- **Docker** (optional, khuyến nghị)

## 🐳 Docker - Quick Start (Khuyến nghị)

Cách nhanh nhất để chạy toàn bộ hệ thống với Docker:

```bash
# Clone repository
git clone https://github.com/Vudangkhoa0910/SmartFactory_CONNECT_Web.git
cd SmartFactory_CONNECT_Web

# Build và khởi động tất cả containers
docker-compose up -d --build

# Kiểm tra trạng thái
docker-compose ps
```

### Multi-container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              SmartFactory CONNECT                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  Frontend        │  │  Backend       │  │  Database   │ │
│  │  (Nginx + React) │──│  (Node.js)     │──│ (PostgreSQL)│ │
│  │  Port: 80        │  │  Port: 3000    │  │  Port: 5432 │ │
│  └──────────────────┘  └────────────────┘  └─────────────┘ │
│           │                    │                  │         │
│           └────────────────────┴──────────────────┘         │
│                    smartfactory_network                      │
└─────────────────────────────────────────────────────────────┘
```

| Container                | Image                    | Port | Description               |
|--------------------------|--------------------------|------|---------------------------|
| `smartfactory_frontend`  | React + Nginx            | 80   | Web application           |
| `smartfactory_backend`   | Node.js + Express        | 3000 | API server                |
| `smartfactory_database`  | PostgreSQL 15            | 5432 | Database                  |

### Docker Commands

```bash
# Khởi động
docker-compose up -d

# Xem logs
docker-compose logs -f
docker-compose logs -f backend

# Dừng
docker-compose down

# Rebuild
docker-compose up -d --build

# Truy cập database
docker exec -it smartfactory_database psql -U smartfactory -d smartfactory_db

# Backup database
docker exec smartfactory_database pg_dump -U smartfactory smartfactory_db > backup.sql
```

### Truy cập sau khi chạy Docker

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## 🛠️ Cài đặt (Manual - Development)

### 1. Clone repository

```bash
git clone https://github.com/Vudangkhoa0910/SmartFactory_CONNECT_Web.git
cd SmartFactory_CONNECT_Web
```

### 2. Setup Backend

```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa file .env với thông tin của bạn
nano .env
```

**File .env cần cấu hình:**

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartfactory_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

MAX_FILE_SIZE=10485760
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### 3. Setup Database

```bash
# Tạo database
psql -U postgres -c "CREATE DATABASE smartfactory_db;"

# Chạy schema (chọn 1 trong 2 cách)

# Cách 1: Schema đầy đủ (khuyến nghị)
psql -U postgres -d smartfactory_db -f backend/src/database/schema_complete.sql

# Cách 2: Schema từng phần
psql -U postgres -d smartfactory_db -f backend/src/database/schema_incidents_ideas_news.sql
psql -U postgres -d smartfactory_db -f backend/src/database/schema_room_booking.sql

# Chạy migrations
psql -U postgres -d smartfactory_db -f backend/src/database/migrations/add_translation_tables.sql

# Tạo default users (optional)
node backend/scripts/create_default_users.js
```

### 4. Setup Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa file .env
nano .env
```

**File .env frontend:**

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 5. Chạy ứng dụng

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:3000

## 📚 Tài liệu API

Chi tiết API endpoints, xem tại:
- [Backend README](backend/README.md)
- [Database README](backend/src/database/README.md)

## 🔐 Phân quyền

Hệ thống có 11 roles với level từ 1-10:

| Level | Role                | Quyền hạn                          |
|-------|---------------------|-------------------------------------|
| 1     | Admin               | Toàn quyền hệ thống                |
| 2     | Factory Manager     | Quản lý toàn bộ nhà máy            |
| 3     | Production Manager  | Quản lý sản xuất                   |
| 4     | Supervisor          | Giám sát nhóm                      |
| 5     | Team Leader         | Quản lý team                       |
| 6     | Operator            | Vận hành cơ bản                    |
| 7     | Technician          | Kỹ thuật viên                      |
| 8     | QC Inspector        | Kiểm soát chất lượng               |
| 9     | Maintenance Manager | Quản lý bảo trì                    |
| 10    | Viewer              | Chỉ xem                            |

## 🎯 Tính năng chính

### 1. Dashboard Analytics
- Theo dõi KPI real-time
- Biểu đồ phân tích incidents
- Top máy móc gặp sự cố
- Thống kê theo department

### 2. Incident Management
- Báo cáo sự cố với hình ảnh
- Phân loại theo độ ưu tiên
- Tracking thời gian xử lý
- Export báo cáo Excel

### 3. Kaizen Ideas (White Inbox)
- Submit ý kiến cải tiến
- Vote và comment
- Theo dõi tiến độ triển khai
- Reward system

### 4. News & Announcements
- Đăng tin tức nội bộ
- Upload hình ảnh/video
- Categories và tags
- Push notifications

### 5. Room Booking
- Đặt phòng họp online
- Calendar view
- Conflict detection
- Email notifications

### 6. Multi-language
- Tiếng Việt
- English
- 日本語 (Japanese)
- Dynamic translation

### 7. Real-time Features
- Live notifications
- Chat assistant
- Online status
- Activity tracking

## 🔧 Scripts hữu ích

### Backend

```bash
# Development mode
npm run dev

# Production mode
npm start

# Create default users
node scripts/create_default_users.js

# Backup database
./scripts/backup_postgresql.sh

# Monitor PostgreSQL
./scripts/monitor_postgresql.sh
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📊 Database Backup & Restore

### Backup

```bash
cd backend/scripts
./backup_postgresql.sh
```

### Restore

```bash
psql -U postgres -d smartfactory_db -f backup_file.sql
```

Chi tiết xem [Database README](backend/src/database/README.md)

## 🐛 Troubleshooting

### Backend không kết nối được database
- Kiểm tra PostgreSQL đang chạy: `pg_isready`
- Kiểm tra thông tin trong `.env`
- Test connection: `psql -U postgres -d smartfactory_db`

### Frontend không connect được API
- Kiểm tra backend đang chạy
- Kiểm tra CORS settings
- Verify `VITE_API_URL` trong `.env`

### File upload lỗi
- Kiểm tra quyền thư mục `uploads/`
- Verify `MAX_FILE_SIZE` trong config
- Check disk space

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Dự án này được phân phối dưới giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👨‍💻 Tác giả

**Vũ Đăng Khoa**
- GitHub: [@Vudangkhoa0910](https://github.com/Vudangkhoa0910)

## 📧 Liên hệ

Nếu có thắc mắc hoặc đề xuất, vui lòng tạo issue trên GitHub.

---

Made with ❤️ by Vũ Đăng Khoa
