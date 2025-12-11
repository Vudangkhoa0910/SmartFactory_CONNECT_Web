# 🧪 HƯỚNG DẪN TEST TRANSLATION GEMINI API

## 🚀 Bước 1: Cài đặt Dependencies

```bash
# Backend - Install Gemini SDK
cd backend
npm install

# Frontend
cd frontend
npm install
```

## 📝 Bước 2: Cấu hình API Key

API Key đã được cấu hình sẵn trong code:
```
GEMINI_API_KEY=AIzaSyBGjtr63SefTQ-DRRD8NDn0LVqmZqXJJ4g
```

Hoặc tạo file `.env` trong thư mục `backend/`:
```env
GEMINI_API_KEY=AIzaSyBGjtr63SefTQ-DRRD8NDn0LVqmZqXJJ4g
TRANSLATION_PRIMARY=gemini
TRANSLATION_FALLBACK=google_free
ENABLE_TRANSLATION_CACHE=true
```

## 🗄️ Bước 3: Chạy Database Migration (Optional)

Nếu muốn sử dụng cache:
```bash
psql -U postgres -d smartfactory_db -f backend/src/database/migrations/add_translation_tables.sql
```

## 🎯 Bước 4: Start Servers

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Backend chạy tại: http://localhost:3000

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Frontend chạy tại: http://localhost:5173

## 🧪 Bước 5: Test Translation

### Option 1: Truy cập UI Test Page
```
http://localhost:5173/translation-test
```

Giao diện test có:
- ✅ Input/Output text areas
- ✅ Chọn ngôn ngữ nguồn và đích
- ✅ Đổi ngôn ngữ nhanh
- ✅ 5 mẫu câu cho mỗi ngôn ngữ
- ✅ Hiển thị thời gian dịch
- ✅ Hiển thị phương thức dịch (gemini/google_free/cache)
- ✅ Copy kết quả

### Option 2: Test bằng API trực tiếp

```bash
# Test với curl
curl -X POST http://localhost:3000/api/translations/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Báo cáo sự cố nghiêm trọng tại Line 1",
    "sourceLang": "vi",
    "targetLang": "ja",
    "useMock": false
  }'
```

### Option 3: Chạy Test Script tự động

```bash
cd backend
node test-translation.js
```

## 📊 Kết quả mong đợi

### Vietnamese → Japanese:
```
Input:  "Báo cáo sự cố nghiêm trọng tại Line 1"
Output: "ライン1で重大なインシデントを報告"
Method: gemini
Time:   ~500-1000ms
```

### Japanese → Vietnamese:
```
Input:  "改善により生産性が20%向上"
Output: "Cải tiến Kaizen giúp tăng năng suất 20%"
Method: gemini
Time:   ~500-1000ms
```

## 🎨 Screenshot Giao diện Test

```
┌────────────────────────────────────────────────────────────┐
│  🌐 Translation Test - Gemini API                          │
│  Test tính năng dịch thuật Việt - Nhật sử dụng Gemini     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  🇻🇳 Tiếng Việt                    🇯🇵 日本語              │
│  ┌─────────────────────┐  ⇄  ┌─────────────────────┐      │
│  │ Nhập văn bản...     │      │ Kết quả dịch...     │      │
│  │                     │      │                     │      │
│  │                     │      │                     │      │
│  │                     │      │                     │      │
│  └─────────────────────┘      └─────────────────────┘      │
│                                                             │
│  Văn bản mẫu:                                              │
│  • Báo cáo sự cố nghiêm trọng tại Line 1                   │
│  • Cải tiến Kaizen giúp tăng năng suất 20%                 │
│                                                             │
│               [ 🌐 Dịch ngay ]                              │
│                                                             │
│  💡 Powered by Google Gemini 1.5 Flash                     │
│  • Context-aware translation                               │
│  • FREE tier: 15 req/min, 1,500 req/day                    │
└────────────────────────────────────────────────────────────┘
```

## 🔍 Kiểm tra hoạt động

### Backend Console:
```
[Gemini] API initialized successfully
[Gemini] Translated: "Báo cáo sự cố..." → "ライン1で重大な..."
```

### Frontend Console:
```
[i18n] Language switched to ja
Translation success: gemini (850ms)
```

### Network Tab:
```
POST /api/translations/translate
Status: 200 OK
Response: {
  "success": true,
  "data": {
    "original": "Báo cáo sự cố...",
    "translated": "ライン1で...",
    "method": "gemini"
  }
}
```

## ⚠️ Troubleshooting

### Lỗi: "Gemini API not initialized"
```bash
# Kiểm tra API key
echo $GEMINI_API_KEY

# Restart backend
cd backend
npm run dev
```

### Lỗi: "Cannot connect to backend"
```bash
# Kiểm tra backend đang chạy
curl http://localhost:3000/health

# Kiểm tra port
lsof -i :3000
```

### Translation chậm
- Lần đầu: ~1-2s (chưa cache)
- Lần sau: <100ms (đã cache trong DB)
- Gemini API: ~500-1000ms
- Google Free: ~300-500ms

## 📝 Test Cases

### Test Case 1: Dịch văn bản ngắn
```
Input:  "Xin chào"
Expect: "こんにちは"
```

### Test Case 2: Dịch thuật ngữ kỹ thuật
```
Input:  "Kaizen cải tiến quy trình"
Expect: "改善によるプロセス改良"
```

### Test Case 3: Dịch câu dài
```
Input:  "Yêu cầu kiểm tra chất lượng sản phẩm tại Line 1 do phát hiện lỗi trong quá trình sản xuất"
Expect: Câu dài tự nhiên tiếng Nhật
```

### Test Case 4: Swap languages
```
1. Dịch VI → JA
2. Click nút đổi ngôn ngữ
3. Dịch JA → VI
Expect: Kết quả gần với bản gốc
```

## 🎯 Features đã implement

✅ Gemini API integration
✅ Context-aware translation
✅ Technical terminology support
✅ Fallback to Google Translate Free
✅ Database caching
✅ Beautiful UI with Tailwind
✅ Language switcher
✅ Sample texts
✅ Copy to clipboard
✅ Real-time translation
✅ Loading states
✅ Error handling
✅ Performance metrics

## 🚀 Next Steps

Sau khi test xong, có thể:
1. Apply translation cho các pages khác (Incidents, Ideas, News)
2. Add batch translation cho nhiều records
3. Implement auto-translate khi tạo mới record
4. Add translation history/audit log
5. Optimize caching strategy

---

Chúc bạn test thành công! 🎉
