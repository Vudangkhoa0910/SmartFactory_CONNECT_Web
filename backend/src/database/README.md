# SmartFactory CONNECT - Database Documentation

## Overview

This directory contains the PostgreSQL database schema and seeding scripts for SmartFactory CONNECT, aligned with **SRS v2.1**.

## Files Structure

```
database/
├── README.md                 # This file
├── schema.sql                # Complete database schema
├── seed_via_api.js           # API-based data seeding script
└── logs/
    └── seed_results.json     # Seeding results (auto-generated)
```

## Database Schema

### Core Tables

| Table | Description | SRS Section |
|-------|-------------|-------------|
| `departments` | Phòng ban (9 departments) | Section 2 |
| `users` | Người dùng với role hierarchy | Section 9 |
| `role_levels` | Mapping vai trò và quyền hạn | Section 9 |

### Incident Management

| Table | Description | SRS Section |
|-------|-------------|-------------|
| `incidents` | Báo cáo sự cố | Section 3, 10, 11 |
| `incident_comments` | Bình luận sự cố | Section 3 |
| `incident_history` | Lịch sử thay đổi | Section 10 |
| `incident_department_tasks` | Phân công xử lý | Section 10 |

### Idea Box System

| Table | Description | SRS Section |
|-------|-------------|-------------|
| `ideas` | Ý tưởng (Hòm trắng/Hòm hồng) | Section 4, 5 |
| `idea_responses` | Phản hồi ý tưởng | Section 5 |
| `idea_history` | Lịch sử xử lý | Section 5 |
| `idea_ratings` | Đánh giá ý tưởng | Section 5 |

### News & Notifications

| Table | Description | SRS Section |
|-------|-------------|-------------|
| `news` | Tin tức nội bộ | Section 7 |
| `news_views` | Lượt xem tin | Section 7 |
| `news_read_receipts` | Xác nhận đã đọc | Section 7 |
| `notifications` | Thông báo cá nhân | Section 8 |

### System Tables

| Table | Description |
|-------|-------------|
| `user_fcm_tokens` | Firebase Cloud Messaging tokens |
| `system_settings` | Cài đặt hệ thống |
| `audit_logs` | Nhật ký kiểm toán |

## Role Hierarchy

Based on **SRS Section 9**:

| Level | Roles | Permissions |
|-------|-------|-------------|
| 1 | `admin`, `general_manager` | Full access, manage users, all statistics |
| 2 | `manager` | Department management, publish news |
| 3 | `supervisor` | Team supervision, view all incidents/ideas |
| 4 | `team_leader` | Team coordination |
| 5 | `operator`, `technician`, `qc_inspector`, `maintenance_staff` | Basic access |
| 6 | `viewer` | Read-only access |

## Enum Types

### Incident Types
- `safety` - An toàn lao động
- `quality` - Chất lượng sản phẩm
- `equipment` - Thiết bị/máy móc
- `other` - Khác

### Idea Categories
- `process_improvement` - Cải tiến quy trình
- `cost_reduction` - Giảm chi phí
- `quality_improvement` - Cải tiến chất lượng
- `safety_enhancement` - Tăng cường an toàn
- `productivity` - Năng suất
- `innovation` - Đổi mới
- `environment` - Môi trường
- `workplace` - Nơi làm việc
- `other` - Khác

### Idea Difficulty (SRS Section 6)
- `A` - Dễ (< 7 ngày)
- `B` - Trung bình (7-14 ngày)
- `C` - Khó (15-30 ngày)
- `D` - Rất khó (> 30 ngày)

## Installation

### Prerequisites
- PostgreSQL 14+ with extensions:
  - `uuid-ossp`
  - `pgcrypto`

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE smartfactory_db;
CREATE USER smartfactory WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smartfactory_db TO smartfactory;

# Connect to the database
\c smartfactory_db

# Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Apply Schema

```bash
# From project root
cd backend/src/database

# Apply schema
psql -U smartfactory -d smartfactory_db -f schema.sql
```

### Seed Data via API

The seeding script uses the REST API to create realistic test data:

```bash
# Make sure the backend server is running
npm run dev

# In another terminal, run the seed script
cd backend/src/database
node seed_via_api.js

# With reset flag (attempts to clear existing data first)
node seed_via_api.js --reset
```

#### Environment Variables

```bash
# API URL (default: http://localhost:3000/api)
export API_URL=http://localhost:3000/api
```

#### What Gets Seeded

1. **9 Departments** (SRS Section 2)
   - Sản xuất, Kiểm tra, Vận chuyển, Logistic
   - Thiết bị, MA, Kỹ thuật, QA, QLSX

2. **75+ Users** with various roles
   - 1 General Manager
   - 9 Managers (1 per department)
   - 9 Supervisors
   - 18 Team Leaders
   - 20 Operators
   - 5 Technicians
   - 5 QC Inspectors
   - 5 Maintenance Staff
   - 3 Viewers

3. **8 Sample Incidents**
   - Safety incidents
   - Quality issues
   - Equipment problems

4. **8 Sample Ideas**
   - White box (public) ideas
   - Pink box (anonymous) ideas

5. **7 News Articles**
   - Company announcements
   - Safety alerts
   - Training notices
   - Events

## Views

The schema includes helpful views:

```sql
-- Active incidents with user info
SELECT * FROM active_incidents;

-- Active ideas with submitter info
SELECT * FROM active_ideas;

-- User permissions based on role
SELECT * FROM user_permissions;
```

## Maintenance

### Backup

```bash
pg_dump -U smartfactory -d smartfactory_db > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
psql -U smartfactory -d smartfactory_db < backup_20250115.sql
```

### Reset Database

```bash
# Drop and recreate (CAUTION: destroys all data)
psql -U postgres -c "DROP DATABASE IF EXISTS smartfactory_db;"
psql -U postgres -c "CREATE DATABASE smartfactory_db OWNER smartfactory;"
psql -U smartfactory -d smartfactory_db -f schema.sql
```

## Changelog

### v2.0.0 (2025-01-15)
- Complete rewrite aligned with SRS v2.1
- Removed room-booking module (not in SRS)
- Added all enum types matching SRS specifications
- Added role_levels table with permissions
- Added comprehensive indexes and triggers
- Added API-based seeding script

### v1.0.0
- Initial schema version
