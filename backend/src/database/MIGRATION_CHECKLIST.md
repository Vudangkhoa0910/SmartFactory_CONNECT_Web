# ✅ SmartFactory Migration Checklist

## 📋 Pre-Migration (Trên máy hiện tại - macOS)

- [x] Tạo full database backup
- [x] Verify backup file size (72KB)
- [x] Tạo restore scripts cho Windows
- [x] Tạo hướng dẫn chi tiết
- [x] Tạo .env.example cho Windows
- [ ] Test backup file integrity
- [ ] Compress backup files (optional)
- [ ] Copy toàn bộ source code

## 💻 Windows Setup

### Cài đặt Software
- [ ] Cài đặt PostgreSQL (v14+ recommended)
  - Download: https://www.postgresql.org/download/windows/
  - Ghi nhớ password cho user `postgres`
  - Port: 5432 (default)
- [ ] Cài đặt Node.js (v16+ LTS)
  - Download: https://nodejs.org/
  - Verify: `node --version` && `npm --version`
- [ ] Cài đặt Git (optional nhưng recommended)
  - Download: https://git-scm.com/download/win
- [ ] Cài đặt VS Code (optional)
  - Download: https://code.visualstudio.com/

### Cấu hình PATH
- [ ] Thêm PostgreSQL bin vào PATH
  - Thường là: `C:\Program Files\PostgreSQL\16\bin`
- [ ] Thêm Node.js vào PATH (auto)
- [ ] Restart Command Prompt để apply PATH

## 📦 File Transfer

### Copy các file sau sang Windows:
- [ ] `/backend/src/database/full_backup_20251118_210248.sql`
- [ ] `/backend/src/database/restore_windows.bat`
- [ ] `/backend/src/database/restore_windows.ps1`
- [ ] `/backend/src/database/RESTORE_GUIDE_WINDOWS.md`
- [ ] `/backend/src/database/README.md`
- [ ] `/backend/src/database/.env.example.windows`
- [ ] Toàn bộ source code (backend + frontend)

## 🗄️ Database Restore

- [ ] Mở Command Prompt với quyền Administrator
- [ ] Navigate tới thư mục database
- [ ] Chạy `restore_windows.bat`
- [ ] Nhập password PostgreSQL
- [ ] Đợi restore hoàn tất
- [ ] Verify tables: `psql -U postgres -d smartfactory_db -c "\dt"`
- [ ] Check users: `SELECT * FROM users LIMIT 5;`
- [ ] Check departments: `SELECT * FROM departments;`
- [ ] Check ideas: `SELECT * FROM ideas LIMIT 5;`
- [ ] Check incidents: `SELECT * FROM incidents LIMIT 5;`
- [ ] Check news: `SELECT * FROM news LIMIT 5;`

## ⚙️ Backend Configuration

### Setup Backend
- [ ] Navigate to backend folder: `cd backend`
- [ ] Copy `.env.example.windows` to `.env`
- [ ] Update `.env` với thông tin database:
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=smartfactory_db
  DB_USER=postgres
  DB_PASSWORD=<your_password>
  ```
- [ ] Install dependencies: `npm install`
- [ ] Create uploads directory: `mkdir uploads`
- [ ] Create logs directory: `mkdir logs`
- [ ] Test database connection
- [ ] Start backend: `npm start`
- [ ] Verify API: http://localhost:3001
- [ ] Check logs for errors

### Backend Health Check
- [ ] API responds at http://localhost:3001
- [ ] Database connection successful
- [ ] No console errors
- [ ] Can access /api routes
- [ ] Auth endpoints working

## 🎨 Frontend Configuration

### Setup Frontend
- [ ] Navigate to frontend folder: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Update API URL (if needed) in config
- [ ] Start dev server: `npm run dev`
- [ ] Verify frontend: http://localhost:5173
- [ ] Check console for errors

### Frontend Health Check
- [ ] Page loads successfully
- [ ] No console errors
- [ ] Can see login page
- [ ] Assets loading correctly
- [ ] No CORS errors

## 🧪 Testing

### Authentication Test
- [ ] Open http://localhost:5173
- [ ] Try login with test account
- [ ] Check if token is received
- [ ] Navigate to dashboard
- [ ] Check if user data loads

### Feature Tests
- [ ] Dashboard loads correctly
- [ ] Departments page works
- [ ] News page works
- [ ] Ideas (White Inbox) works
- [ ] Sensitive feedback (Pink Inbox) works
- [ ] Incidents page works
- [ ] User management works (Admin)
- [ ] Notifications work
- [ ] File upload works
- [ ] Real-time updates work (Socket.io)

### API Tests
- [ ] GET /api/users
- [ ] GET /api/departments
- [ ] GET /api/news
- [ ] GET /api/ideas
- [ ] GET /api/incidents
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] File upload endpoints

## 🔒 Security Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Change JWT_REFRESH_SECRET in .env
- [ ] Update admin password
- [ ] Enable firewall rules if needed
- [ ] Configure CORS properly
- [ ] Review user permissions
- [ ] Test password reset flow

## 🌐 Network Configuration

### Firewall Rules (if needed)
- [ ] Allow port 3001 (Backend)
- [ ] Allow port 5173 (Frontend dev)
- [ ] Allow port 5432 (PostgreSQL) only from localhost
- [ ] Test connections

### For Production (Optional)
- [ ] Setup reverse proxy (nginx/IIS)
- [ ] Configure SSL/TLS
- [ ] Setup domain names
- [ ] Configure production env variables
- [ ] Setup PM2 or Windows Service for backend

## 📊 Performance Check

- [ ] Backend response time < 200ms
- [ ] Frontend loads < 3 seconds
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] No console warnings/errors

## 📝 Documentation

- [ ] Update README with Windows instructions
- [ ] Document any Windows-specific issues
- [ ] Create user manual (if needed)
- [ ] Document admin procedures
- [ ] Create backup schedule document

## 🔄 Backup Strategy

- [ ] Create backup script for Windows
- [ ] Schedule regular backups
- [ ] Test restore procedure
- [ ] Document backup location
- [ ] Setup backup monitoring

## ✅ Final Verification

### Checklist before going live:
- [ ] All features working
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Team trained on new setup
- [ ] Support plan ready

## 🚨 Rollback Plan

### If migration fails:
- [ ] Keep old system running
- [ ] Document all issues
- [ ] Contact support team
- [ ] Review error logs
- [ ] Try restore again
- [ ] Consider consulting expert

## 📞 Support Contacts

**Database Issues**: 
- Check PostgreSQL logs: `C:\Program Files\PostgreSQL\16\data\log`
- Community: https://stackoverflow.com/questions/tagged/postgresql

**Node.js Issues**:
- Check npm logs
- Community: https://stackoverflow.com/questions/tagged/node.js

**Application Issues**:
- Check backend logs: `/backend/logs/`
- Check browser console
- Contact development team

---

## 📈 Post-Migration

### Week 1
- [ ] Monitor performance daily
- [ ] Check logs for errors
- [ ] Gather user feedback
- [ ] Fix any issues

### Week 2-4
- [ ] Optimize based on usage
- [ ] Update documentation
- [ ] Train users on any new features
- [ ] Plan for scaling if needed

---

**Migration Date**: _______________
**Completed By**: _______________
**Verified By**: _______________
**Notes**: 
_______________________________
_______________________________
_______________________________
