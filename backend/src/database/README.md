# SmartFactory Database Migration Package

## 📦 Nội dung Package

Thư mục này chứa tất cả các file cần thiết để migrate database từ macOS/Linux sang Windows:

```
database/
├── full_backup_20251118_210248.sql    # Full database backup (72KB)
├── RESTORE_GUIDE_WINDOWS.md           # Hướng dẫn chi tiết restore trên Windows
├── restore_windows.bat                # Script tự động restore (Batch)
├── restore_windows.ps1                # Script tự động restore (PowerShell)
├── schema_complete.sql                # Schema gốc (backup)
├── schema_incidents_ideas_news.sql    # Schema features mới (backup)
└── README.md                          # File này
```

## 🚀 Quick Start (Windows)

### Cách 1: Sử dụng Batch Script (Đơn giản nhất)

1. Copy toàn bộ thư mục `database` sang máy Windows
2. Đảm bảo PostgreSQL đã được cài đặt
3. Mở Command Prompt **với quyền Administrator**
4. Chạy lệnh:
   ```cmd
   cd path\to\database
   restore_windows.bat
   ```
5. Nhập password PostgreSQL khi được yêu cầu
6. Đợi quá trình restore hoàn tất

### Cách 2: Sử dụng PowerShell Script

1. Copy toàn bộ thư mục `database` sang máy Windows
2. Mở PowerShell **với quyền Administrator**
3. Enable script execution (nếu cần):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
4. Chạy script:
   ```powershell
   cd path\to\database
   .\restore_windows.ps1
   ```

### Cách 3: Restore thủ công

Xem hướng dẫn chi tiết trong file `RESTORE_GUIDE_WINDOWS.md`

## 📋 Yêu cầu hệ thống

- **Windows**: 10/11 hoặc Windows Server 2016+
- **PostgreSQL**: Version 12 trở lên (khuyến nghị 14+)
- **RAM**: Tối thiểu 4GB
- **Disk Space**: Tối thiểu 1GB trống
- **Node.js**: Version 16 trở lên (để chạy backend)

## 🗄️ Thông tin Database

- **Database Name**: `smartfactory_db`
- **Backup Date**: 18/11/2025 21:02:48
- **Backup Size**: 72KB
- **Format**: SQL (Plain text)
- **Include**: Schema + Data
- **PostgreSQL Version**: Compatible with 12+

## 📊 Database Structure

### Main Tables

| Table | Description | Records |
|-------|-------------|---------|
| users | User accounts and authentication | ~50+ |
| departments | Organization departments | ~10+ |
| news | Internal news and announcements | ~20+ |
| ideas | Kaizen improvement ideas | ~15+ |
| incidents | Incident management | ~30+ |
| notifications | System notifications | ~100+ |

### Features

- ✅ User authentication & authorization
- ✅ Role-based access control (Admin, Manager, User)
- ✅ Department management
- ✅ News publishing system
- ✅ Kaizen idea submission (White Inbox)
- ✅ Sensitive feedback (Pink Inbox)
- ✅ Incident reporting & tracking
- ✅ Real-time notifications
- ✅ File uploads support

## 🔧 Sau khi Restore

### 1. Cấu hình Backend

Tạo file `.env` trong thư mục `backend/`:

```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartfactory_db
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=smartfactory_jwt_secret_key_2024_change_in_production
JWT_EXPIRE=7d
```

### 2. Cài đặt Dependencies

```cmd
# Backend
cd backend
npm install
npm start

# Frontend (terminal mới)
cd frontend
npm install
npm run dev
```

### 3. Truy cập ứng dụng

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

### 4. Đăng nhập

**Admin Account**:
- Email: `admin@smartfactory.com`
- Password: Xem trong database hoặc liên hệ team

## ⚠️ Lưu ý quan trọng

1. **Backup trước khi restore**: Nếu đã có database cũ, hãy backup trước
2. **Password PostgreSQL**: Ghi nhớ password khi cài đặt
3. **Quyền Administrator**: Cần chạy script với quyền admin
4. **Firewall**: Có thể cần mở port 3001 (backend) và 5173 (frontend)
5. **Antivirus**: Có thể cần tạm thời tắt để tránh chặn kết nối database

## 🐛 Troubleshooting

### Lỗi "psql: command not found"

**Giải pháp**:
1. Thêm PostgreSQL vào PATH
2. Path thường là: `C:\Program Files\PostgreSQL\[version]\bin`
3. Restart Command Prompt sau khi thêm PATH

### Lỗi "authentication failed"

**Giải pháp**:
1. Kiểm tra username/password trong .env
2. Kiểm tra file `pg_hba.conf` của PostgreSQL
3. Đảm bảo user có quyền truy cập database

### Lỗi "database already exists"

**Giải pháp**:
```cmd
psql -U postgres
DROP DATABASE IF EXISTS smartfactory_db;
\q
```
Sau đó chạy lại restore script

### Lỗi "permission denied"

**Giải pháp**:
1. Chạy Command Prompt/PowerShell với quyền Administrator
2. Hoặc cấp quyền cho user:
```sql
GRANT ALL PRIVILEGES ON DATABASE smartfactory_db TO your_user;
```

### Backend không kết nối được database

**Giải pháp**:
1. Kiểm tra PostgreSQL service đang chạy
2. Kiểm tra file .env có đúng thông tin
3. Test kết nối: `psql -U postgres -d smartfactory_db`

## 📞 Liên hệ & Support

Nếu gặp vấn đề trong quá trình migration:

1. Kiểm tra file `RESTORE_GUIDE_WINDOWS.md` để biết chi tiết
2. Xem log errors trong Command Prompt/PowerShell
3. Liên hệ team phát triển với thông tin lỗi chi tiết

## 📝 Change Log

- **18/11/2025 21:02**: Initial backup với full data
- **18/11/2025**: Thêm scripts tự động cho Windows
- **18/11/2025**: Thêm hướng dẫn chi tiết

## ✅ Checklist Migration

- [ ] Copy toàn bộ thư mục database sang Windows
- [ ] Cài đặt PostgreSQL trên Windows
- [ ] Thêm PostgreSQL vào PATH
- [ ] Chạy restore script
- [ ] Verify tables và data
- [ ] Cấu hình file .env
- [ ] Cài đặt Node.js dependencies
- [ ] Test chạy backend
- [ ] Test chạy frontend
- [ ] Test đăng nhập và các chức năng

---

**Version**: 1.0.0  
**Last Updated**: 18/11/2025  
**Maintained by**: SmartFactory Development Team
