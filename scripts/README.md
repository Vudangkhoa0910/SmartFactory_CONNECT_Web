# Scripts - SmartFactory CONNECT

Thư mục này chứa các utility scripts cho việc quản lý và vận hành hệ thống SmartFactory CONNECT.

## 📜 Danh Sách Scripts

### `import-database.sh`

**Mục đích**: Import database từ file backup SQL vào PostgreSQL container

**Sử dụng**:
```bash
# Chạy script với prompt xác nhận
./scripts/import-database.sh

# Script sẽ tự động:
# 1. Kiểm tra Docker container đang chạy
# 2. Kiểm tra file backup tồn tại
# 3. Đợi PostgreSQL sẵn sàng
# 4. Yêu cầu xác nhận trước khi xóa database cũ
# 5. Import dữ liệu mới
# 6. Xác minh kết quả
```

**Yêu cầu**:
- Docker và Docker Compose đã cài đặt
- Container `smartfactory_database` đang chạy
- File backup tại `./data/smartfactory_db_backup.sql`

**Output**:
```
============================================
SmartFactory CONNECT - Database Import
============================================

[1/6] Checking Docker container...
✓ Container is running

[2/6] Checking backup file...
✓ Backup file found: ./data/smartfactory_db_backup.sql

[3/6] Waiting for PostgreSQL to be ready...
✓ PostgreSQL is ready

[4/6] Dropping existing database...
⚠️  WARNING: This will delete all existing data in 'smartfactory_db'
Continue? (yes/no): yes
  Terminating active connections...
  Dropping database...
  Creating fresh database...
✓ Database recreated successfully

[5/6] Importing database from backup...
  This may take a few minutes...
✓ Database imported successfully

[6/6] Verifying import...
  Total tables imported: 18

Imported tables:
  departments
  idea_history
  idea_responses
  ideas
  incident_comments
  incident_department_tasks
  incident_history
  incidents
  meeting_rooms
  news
  news_read_receipts
  news_views
  notifications
  room_bookings
  system_settings
  translation_cache
  user_fcm_tokens
  users

============================================
✓ Database import completed successfully!
============================================

Database Information:
  Host: localhost
  Port: 5432
  Database: smartfactory_db
  User: smartfactory
  Password: smartfactory123

Next steps:
  1. Restart backend container: docker-compose restart backend
  2. Check backend logs: docker-compose logs -f backend
```

## ⚠️ Lưu Ý Quan Trọng

### Trước Khi Chạy Scripts

1. **Backup hiện tại**: Luôn backup dữ liệu trước khi import mới
2. **Kiểm tra quyền**: Đảm bảo script có quyền execute (`chmod +x script.sh`)
3. **Docker running**: Các containers phải đang chạy
4. **Disk space**: Kiểm tra đủ dung lượng ổ cứng

### Sau Khi Import

1. **Restart backend**: `docker-compose restart backend`
2. **Check health**: `curl http://localhost:3000/health`
3. **Verify data**: Kiểm tra dữ liệu trong database
4. **Test API**: Thử các endpoint API

## 📖 Tài Liệu Liên Quan

- [Database Import Guide](../docs/DATABASE_IMPORT_GUIDE.md) - Hướng dẫn chi tiết import database
- [Docker Compose](../docker-compose.yml) - Cấu hình containers
- [Backend Config](../backend/src/config/database.js) - Cấu hình kết nối database

## 🔧 Troubleshooting

### Script không chạy được

```bash
# Cấp quyền execute
chmod +x scripts/import-database.sh

# Chạy với bash explicit
bash scripts/import-database.sh
```

### Container không running

```bash
# Khởi động database
docker-compose up -d database

# Kiểm tra status
docker-compose ps
```

### Import thất bại

```bash
# Xem logs chi tiết
docker-compose logs database

# Kiểm tra file backup
ls -lh data/smartfactory_db_backup.sql

# Kiểm tra PostgreSQL
docker exec smartfactory_database pg_isready -U smartfactory
```

## 🚀 Phát Triển Thêm

Các scripts có thể thêm trong tương lai:

- `backup-database.sh` - Backup database hiện tại
- `reset-database.sh` - Reset database về trạng thái ban đầu
- `migrate-database.sh` - Chạy migrations
- `seed-database.sh` - Seed data mẫu
- `cleanup-docker.sh` - Dọn dẹp Docker resources
- `deploy.sh` - Deploy automation

## 📝 Quy Tắc Viết Scripts

Khi thêm scripts mới, tuân theo các quy tắc:

1. **Shebang**: Bắt đầu với `#!/bin/bash`
2. **Error handling**: Sử dụng `set -e` để exit on error
3. **Colors**: Sử dụng colors cho output dễ đọc
4. **Logging**: Log rõ ràng từng bước thực hiện
5. **Validation**: Kiểm tra điều kiện trước khi thực thi
6. **Confirmation**: Yêu cầu xác nhận với các thao tác nguy hiểm
7. **Documentation**: Comment đầy đủ và header mô tả

### Template Script

```bash
#!/bin/bash

# ============================================
# Script Name - SmartFactory CONNECT
# ============================================
# Purpose: What this script does
# Usage: ./scripts/script-name.sh
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VARIABLE_NAME="value"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Script Title${NC}"
echo -e "${BLUE}============================================${NC}"

# Main logic here
echo -e "${YELLOW}[1/3] Step 1...${NC}"
# ...

echo -e "${GREEN}✓ Completed successfully${NC}"
```

---

**Tác giả**: SmartFactory CONNECT Team  
**Cập nhật**: 15/12/2025
