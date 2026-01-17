# SmartFactory CONNECT - Data Import Guide

## 📋 Overview

Hướng dẫn này giúp các developer nhanh chóng có được dữ liệu mẫu để phát triển và test.

## 🗂 Exported Files

| File | Description | Records |
|------|-------------|---------|
| `seed_data.sql` | SQL dump với INSERT statements | All |
| `departments.json` | JSON data cho phòng ban | 9 |
| `users.json` | JSON data cho users (không có password) | 76 |
| `incidents.json` | JSON data cho incidents | 8 |
| `ideas.json` | JSON data cho ideas | 8 |
| `news.json` | JSON data cho news | 7 |
| `rooms.json` | JSON data cho phòng họp | 12 |

## 🚀 Quick Import Methods

### Method 1: Fresh Docker Start (Recommended)

Cách đơn giản nhất - khởi động Docker và seed qua API:

```bash
# 1. Start Docker containers
cd SmartFactory_CONNECT_Web
docker compose up -d --build

# 2. Wait for services to be ready
sleep 15

# 3. Run room booking schema (if not included in main schema)
docker exec -i smartfactory_database psql -U smartfactory -d smartfactory_db < backend/src/database/schema_room_booking.sql

# 4. Seed via API (departments, users, incidents, ideas, news)
cd backend
node src/database/seed_via_api.js
```

### Method 2: Import SQL Dump

Nếu đã có database running và muốn import data:

```bash
# 1. Connect to database container
docker exec -it smartfactory_database psql -U smartfactory -d smartfactory_db

# 2. Import data (trong psql)
\i /path/to/seed_data.sql

# HOẶC từ terminal:
docker exec -i smartfactory_database psql -U smartfactory -d smartfactory_db < backend/src/database/exports/seed_data.sql
```

### Method 3: Reset & Import

Xóa sạch database và import lại:

```bash
# 1. Stop and remove volumes
docker compose down -v

# 2. Start fresh
docker compose up -d

# 3. Wait for DB init
sleep 15

# 4. Seed
cd backend && node src/database/seed_via_api.js
```

## 📊 Data Summary

### Departments (9)
- SX - Phòng Sản xuất
- KT - Phòng Kiểm tra  
- VC - Phòng Vận chuyển
- LOG - Phòng Logistic
- TB - Phòng Thiết bị
- MA - Phòng MA
- KTH - Phòng Kỹ thuật
- QA - Phòng QA
- QLSX - Phòng Quản lý sản xuất

### Users (76)
| Role | Count | Level |
|------|-------|-------|
| admin | 1 | 1 |
| general_manager | 1 | 1 |
| manager | 9 | 2 |
| supervisor | 9 | 3 |
| team_leader | 18 | 4 |
| operator | 20 | 5 |
| technician | 5 | 5 |
| qc_inspector | 5 | 5 |
| maintenance_staff | 5 | 5 |
| viewer | 3 | 6 |

### Incidents (8)
- Safety incidents
- Quality defects
- Equipment issues
- Environment problems

### Ideas (8)
- Kaizen improvements
- Cost reduction
- Safety enhancements
- Process optimization

### News (7)
- Company announcements
- Safety alerts
- Achievements
- Training notices

### Meeting Rooms (12)
| Code | Name | Floor | Capacity |
|------|------|-------|----------|
| MH-101 | Phòng họp Sakura | 1 | 6 |
| MH-102 | Phòng họp Fuji | 1 | 8 |
| MH-103 | Phòng phỏng vấn A | 1 | 4 |
| MH-201 | Phòng họp Momiji | 2 | 12 |
| MH-202 | Phòng họp Bamboo | 2 | 15 |
| MH-203 | Phòng đào tạo 1 | 2 | 20 |
| MH-301 | Phòng họp Taiyo | 3 | 25 |
| MH-302 | Phòng hội nghị Denso | 3 | 50 |
| MH-401 | Phòng họp VIP | 4 | 10 |
| MH-402 | Phòng họp Ban Giám đốc | 4 | 15 |
| WS-101 | Workshop Room A | 1 | 30 |
| WS-102 | Workshop Room B | 1 | 15 |

## 🔐 Default Login Credentials

| User | Email | Password |
|------|-------|----------|
| Admin | admin@smartfactory.com | Admin@123456 |
| All seeded users | {name}@smartfactory.com | User@123456 |

## ⚠️ Important Notes

1. **Password Hashing**: Passwords trong SQL dump đã được hash. Nếu import SQL, users có thể login với password gốc.

2. **UUIDs**: Các ID là UUID ngẫu nhiên. Nếu bạn có code reference cố định ID, cần cập nhật sau import.

3. **Foreign Keys**: SQL dump đã include `DISABLE TRIGGER` statements để handle circular FK constraints.

4. **Timestamps**: Data có timestamps của lúc export. Có thể cần update nếu cần test với current date.

## 🛠 Troubleshooting

### Error: "relation does not exist"
Schema chưa được tạo. Chạy schema trước:
```bash
docker exec -i smartfactory_database psql -U smartfactory -d smartfactory_db < backend/src/database/schema.sql
```

### Error: "duplicate key value"
Data đã tồn tại. Clear trước khi import:
```sql
TRUNCATE TABLE news, ideas, incidents, users, departments CASCADE;
```

### Error: "foreign key constraint"
Import theo đúng thứ tự: departments → users → incidents/ideas/news

## 📁 File Locations

```
backend/src/database/
├── schema.sql                # Database schema (core tables)
├── schema_room_booking.sql   # Room booking schema
├── seed_via_api.js           # API-based seeding script
├── DATA_IMPORT_GUIDE.md      # This guide
└── exports/
    ├── seed_data.sql         # Full SQL dump
    ├── departments.json      # Departments data
    ├── users.json            # Users data (no passwords)
    ├── incidents.json        # Incidents data
    ├── ideas.json            # Ideas data
    ├── news.json             # News data
    └── rooms.json            # Meeting rooms data
```

## 🔄 Re-generating Export

Để export data mới từ database đang chạy:

```bash
# Export SQL
docker exec smartfactory_database pg_dump -U smartfactory -d smartfactory_db \
  --data-only --inserts --column-inserts --disable-triggers \
  -t departments -t users -t incidents -t ideas -t news \
  > backend/src/database/exports/seed_data.sql

# Export JSON
docker exec smartfactory_database psql -U smartfactory -d smartfactory_db \
  -c "COPY (SELECT row_to_json(d) FROM (SELECT * FROM departments) d) TO STDOUT" \
  > backend/src/database/exports/departments.json
```

---

**Last Updated**: 2025-01-13  
**Data Version**: v2.0.0 (SRS v2.1)
