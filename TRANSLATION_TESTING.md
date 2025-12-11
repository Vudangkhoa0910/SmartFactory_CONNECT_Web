# Translation System Testing Guide

## 🚀 Quick Start

### 1. Run Database Migration

```bash
# Connect to your database
psql -U your_username -d smartfactory_db

# Run migration
\i backend/src/database/migrations/add_translation_tables.sql

# Or use command line:
psql -U your_username -d smartfactory_db -f backend/src/database/migrations/add_translation_tables.sql
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend should be running on http://localhost:3000

### 3. Run Translation API Tests

```bash
# In a new terminal, while backend is running
cd backend
node test-translation.js
```

Expected output:
```
✅ Test 1: Get Vietnamese static translations - 50+ translations loaded
✅ Test 2: Get Japanese static translations - 50+ translations loaded
✅ Test 3: Translate single text (mock mode)
✅ Test 4: Batch translate multiple texts
✅ Test 5: Test real Google Translate API
✅ Test 6: Get translation cache statistics
```

### 4. Start Frontend & Test UI

```bash
cd frontend
npm run dev
```

Frontend will be on http://localhost:5173

### 5. Test Language Switching

1. Open http://localhost:5173
2. Look at the header - you should see: **🇻🇳 VI | 🇯🇵 JA**
3. Click **🇯🇵 JA** to switch to Japanese
4. Click **🇻🇳 VI** to switch back to Vietnamese
5. Check browser console for logs: `[i18n] Language switched to ja`

---

## 📋 Manual API Testing with curl

### Get Vietnamese translations:
```bash
curl http://localhost:3000/api/translations/vi
```

### Get Japanese translations:
```bash
curl http://localhost:3000/api/translations/ja
```

### Translate text (mock mode):
```bash
curl -X POST http://localhost:3000/api/translations/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Sự cố nghiêm trọng",
    "sourceLang": "vi",
    "targetLang": "ja",
    "useMock": true
  }'
```

### Test real Google Translate:
```bash
curl http://localhost:3000/api/translations/test/api
```

### Get translation statistics:
```bash
curl http://localhost:3000/api/translations/stats/overview
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Database migration successful
- [ ] Backend server starts without errors
- [ ] `/api/translations/vi` returns Vietnamese translations
- [ ] `/api/translations/ja` returns Japanese translations
- [ ] Translation service works in mock mode
- [ ] Can translate single text
- [ ] Can batch translate multiple texts
- [ ] Translation cache working (after DB migration)

### Frontend Tests
- [ ] Language switcher visible in header
- [ ] Can click VI button
- [ ] Can click JA button
- [ ] Selected language highlighted
- [ ] Language stored in localStorage
- [ ] Page doesn't reload when switching
- [ ] Console shows language change logs
- [ ] UI labels change when switching (once implemented)

---

## 🔍 Troubleshooting

### Backend not starting
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Check PostgreSQL connection
psql -U your_username -d smartfactory_db -c "SELECT 1"
```

### Database migration errors
```bash
# Check if tables already exist
psql -U your_username -d smartfactory_db -c "\dt translation*"

# If tables exist, you can skip migration or drop them first:
# psql -U your_username -d smartfactory_db -c "DROP TABLE IF EXISTS translations CASCADE"
```

### Frontend not loading translations
```bash
# Check browser console for errors
# Check Network tab for API calls to /api/translations/vi or /ja
# Verify backend is running and accessible
```

### Language not persisting after refresh
```bash
# Check browser localStorage:
# Open DevTools → Application → Local Storage
# Look for key: "language" with value "vi" or "ja"
```

---

## 📊 Expected Results

### Mock Translation Mode (useMock: true)
- Vietnamese → Japanese: Adds `[JA]` prefix
- Example: "Báo cáo sự cố" → "[JA] Báo cáo sự cố"

### Real Google Translate API (useMock: false)
- Vietnamese → Japanese: Real translation
- Example: "Xin chào" → "こんにちは"
- Requires internet connection

---

## 🎯 Current Implementation Status

✅ **Completed:**
- Translation service with mock data
- Database schema for translations
- API endpoints for translation
- Language Context (React)
- Language Switcher component
- Integration with App.tsx and AppHeader

🔄 **Next Steps (when testing passes):**
1. Implement translation hooks in components
2. Add translation support to Incident pages
3. Add translation support to Ideas pages
4. Add translation support to News pages
5. Switch from mock to real Google Translate API

---

## 📝 Notes

- **Mock mode** is default for testing - no internet required
- **Real API** mode requires internet connection
- **Database migration** is required for cache functionality
- **localStorage** persists language preference
- All static translations are loaded on language change
- Dynamic content (incidents, ideas, news) will need additional implementation

---

## 🆘 Need Help?

If tests fail, check:
1. Backend console logs
2. Frontend browser console
3. Network tab in DevTools
4. PostgreSQL connection
5. Port availability (3000 for backend, 5173 for frontend)
