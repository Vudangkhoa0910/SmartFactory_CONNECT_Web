# Hướng dẫn Restore Database

## ✅ Database đã được restore thành công!

### Thông tin Database hiện tại:
- **Database name**: `smartfactory_db`
- **Tables**: 13 bảng
- **Dữ liệu**:
  - Departments: 9 records
  - Users: 10 records
  - Incidents: 8 records
  - Ideas: 2 records
  - News: 12 records

### Backup của database cũ:
File backup đã được tạo tại: `src/database/backup_before_restore_YYYYMMDD_HHMMSS.backup`

---

## 🔄 Cách restore database trong tương lai

### Phương pháp 1: Sử dụng script tự động (Khuyến nghị)

```bash
cd backend
./scripts/restore_database.sh src/database/your_backup_file.sql
```

Script sẽ tự động:
1. Tạo backup của database hiện tại
2. Drop và recreate database
3. Restore từ file SQL
4. Sửa ownership và permissions
5. Verify kết quả

### Phương pháp 2: Thủ công

#### Bước 1: Backup database hiện tại
```bash
pg_dump -h localhost -U $USER -d smartfactory_db -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).backup
```

#### Bước 2: Drop và recreate database
```bash
psql -h localhost -U $USER -d postgres -c "DROP DATABASE IF EXISTS smartfactory_db;"
psql -h localhost -U $USER -d postgres -c "CREATE DATABASE smartfactory_db WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE=template0;"
```

#### Bước 3: Restore từ file SQL
```bash
psql -h localhost -U $USER -d smartfactory_db -f your_backup_file.sql
```

#### Bước 4: Fix ownership (nếu cần)
```bash
psql -h localhost -U $USER -d smartfactory_db -c "ALTER DATABASE smartfactory_db OWNER TO $USER;"
psql -h localhost -U $USER -d smartfactory_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $USER;"
psql -h localhost -U $USER -d smartfactory_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $USER;"
```

#### Bước 5: Verify
```bash
psql -h localhost -U $USER -d smartfactory_db -c "\dt"
psql -h localhost -U $USER -d smartfactory_db -c "SELECT COUNT(*) FROM users;"
```

---

## 📦 Restore từ backup file (.backup format)

Nếu bạn có file backup format custom của PostgreSQL:

```bash
pg_restore -h localhost -U $USER -d smartfactory_db -c -v your_backup_file.backup
```

---

## ⚠️ Troubleshooting

### Lỗi: "role does not exist"
Đây là lỗi thông thường khi restore từ máy khác có user khác. Đã được tự động xử lý trong script.

### Lỗi: "database is being accessed by other users"
```bash
# Đóng tất cả connections
psql -h localhost -U $USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'smartfactory_db';"
```

### Kiểm tra kết nối database
```bash
psql -h localhost -U $USER -d smartfactory_db -c "SELECT version();"
```

---

## 📝 Notes

- Luôn tạo backup trước khi restore
- File backup được lưu tại `src/database/backups/`
- Đảm bảo file SQL không có ký tự đặc biệt trong path
- Kiểm tra quyền của user PostgreSQL hiện tại

---

## 🔗 Liên kết hữu ích

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore Manual](https://www.postgresql.org/docs/current/app-pgrestore.html)
