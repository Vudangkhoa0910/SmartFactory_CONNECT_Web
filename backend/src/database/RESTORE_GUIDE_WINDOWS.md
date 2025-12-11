# HƯỚNG DẪN RESTORE DATABASE TRÊN WINDOWS

## Yêu cầu
- PostgreSQL đã được cài đặt trên Windows
- Có quyền admin để tạo database

## Bước 1: Cài đặt PostgreSQL (nếu chưa có)
1. Download PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Chạy installer và làm theo hướng dẫn
3. Ghi nhớ password cho user `postgres`
4. Thêm PostgreSQL vào PATH (thường là `C:\Program Files\PostgreSQL\16\bin`)

## Bước 2: Kiểm tra kết nối
Mở Command Prompt (CMD) hoặc PowerShell và chạy:
```cmd
psql --version
```

## Bước 3: Restore Database

### Cách 1: Sử dụng psql command line
```cmd
# Đăng nhập vào PostgreSQL
psql -U postgres

# Trong psql, tạo user mới (nếu cần)
CREATE USER smartfactory WITH PASSWORD 'your_password_here';
ALTER USER smartfactory WITH CREATEDB;

# Thoát psql
\q

# Restore database từ file backup
psql -U postgres -f full_backup_20251118_210248.sql
```

### Cách 2: Sử dụng pg_restore (nếu file là .dump)
```cmd
pg_restore -U postgres -d smartfactory_db full_backup_20251118_210248.sql
```

### Cách 3: Sử dụng pgAdmin (GUI)
1. Mở pgAdmin
2. Kết nối đến PostgreSQL server
3. Chuột phải vào "Databases" → "Create" → "Database"
4. Tên database: `smartfactory_db`
5. Chuột phải vào database vừa tạo → "Restore"
6. Chọn file `full_backup_20251118_210248.sql`
7. Click "Restore"

## Bước 4: Cập nhật file .env trong backend

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartfactory_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=smartfactory_jwt_secret_key_2024_change_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=smartfactory_refresh_secret_key_2024_change_in_production
JWT_REFRESH_EXPIRE=30d

# Password Reset
PASSWORD_RESET_EXPIRE=3600000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@smartfactory.com
```

## Bước 5: Kiểm tra Database

```cmd
# Đăng nhập vào database
psql -U postgres -d smartfactory_db

# Kiểm tra các bảng
\dt

# Kiểm tra dữ liệu users
SELECT * FROM users LIMIT 5;

# Thoát
\q
```

## Bước 6: Chạy ứng dụng

```cmd
# Cài đặt dependencies
cd backend
npm install

# Chạy server
npm start
```

## Troubleshooting

### Lỗi: "psql: command not found"
- Thêm PostgreSQL vào PATH:
  - Mở "Environment Variables"
  - Thêm `C:\Program Files\PostgreSQL\16\bin` vào PATH
  - Restart Command Prompt

### Lỗi: "authentication failed"
- Kiểm tra lại username và password trong .env
- Đảm bảo user có quyền truy cập database

### Lỗi: "database already exists"
- Xóa database cũ trước:
  ```cmd
  psql -U postgres
  DROP DATABASE IF EXISTS smartfactory_db;
  \q
  ```
- Sau đó chạy lại restore

### Lỗi: "permission denied"
- Chạy Command Prompt với quyền Administrator
- Hoặc cấp quyền cho user:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE smartfactory_db TO your_user;
  ```

## Thông tin Database hiện tại

- **Database name**: smartfactory_db
- **Backup file**: full_backup_20251118_210248.sql
- **Backup size**: 72KB
- **Created**: November 18, 2025, 21:02:48

## Cấu trúc Database chính

- `users` - Quản lý người dùng và xác thực
- `departments` - Các phòng ban
- `news` - Tin tức nội bộ
- `ideas` - Ý tưởng cải tiến (Kaizen)
- `incidents` - Quản lý sự cố
- `notifications` - Thông báo hệ thống

## Liên hệ hỗ trợ
Nếu gặp vấn đề trong quá trình restore, vui lòng liên hệ team phát triển.
