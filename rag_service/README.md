# RAG Incident Router Service

## Giới thiệu

**RAG (Retrieval-Augmented Generation)** là phương pháp AI kết hợp giữa **truy xuất dữ liệu** và **sinh kết quả**. Thay vì để AI "đoán" câu trả lời, RAG tìm kiếm trong cơ sở dữ liệu thực để đưa ra gợi ý chính xác hơn.

Trong hệ thống SmartFactory CONNECT, RAG Service tự động gợi ý **phòng ban xử lý** cho các sự cố dựa trên lịch sử các sự cố tương tự đã được xử lý trước đó.

---

## RAG là gì?

### Vấn đề với AI truyền thống

AI thông thường (như ChatGPT) được huấn luyện trên dữ liệu cố định → không biết về dữ liệu riêng của doanh nghiệp.

### Giải pháp: RAG

RAG giải quyết bằng cách:
1. **Lưu trữ knowledge** → Chuyển văn bản thành vectors (embeddings) và lưu vào database
2. **Truy xuất (Retrieval)** → Khi có câu hỏi/sự cố mới, tìm các cases tương tự nhất
3. **Tổng hợp (Generation)** → Đưa ra gợi ý dựa trên những cases đã tìm được

---

## Tích hợp trong dự án SmartFactory CONNECT

### Kiến trúc tích hợp

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Mobile App     │        │  Node.js Backend │        │   RAG Service    │
│   Flutter        │───────►│   (Port 3001)    │───────►│   (Port 8001)    │
└──────────────────┘        └──────────────────┘        └──────────────────┘
       │                             │                           │
       │                             ▼                           ▼
       │                    ┌──────────────────┐        ┌──────────────────┐
       │                    │   PostgreSQL     │◄───────│   PhoBERT Model  │
       │                    │   + pgvector     │        │   (ONNX)         │
       │                    └──────────────────┘        └──────────────────┘
       │                             │
       ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│   Frontend Web   │        │   FCM (Firebase) │
│   React          │        │   Push Notify    │
└──────────────────┘        └──────────────────┘
```

### Điểm tích hợp trong Backend

| File | Chức năng |
|------|-----------|
| `incident.controller.js` | Gọi RAG `/suggest` khi tạo incident mới |
| `settings.controller.js` | Bật/tắt tính năng auto-assign |
| `anomaly.controller.js` | Gọi RAG `/similar` để phát hiện pattern mới |

---

## Chức năng đã triển khai

### ✅ 1. Auto-suggest Department

Khi user báo cáo sự cố → RAG tự động gợi ý phòng ban xử lý dựa trên mô tả.

**Flow:**
```
User tạo incident → Backend gọi RAG → Gợi ý phòng ban
                                           ↓
                                   confidence >= 75%?
                                       ↓          ↓
                                      YES         NO
                                       ↓          ↓
                              Tự động gán    Chờ Leader duyệt
```

### ✅ 2. Similar Incidents Search

Tìm các sự cố tương tự trong lịch sử → Giúp tra cứu cách xử lý trước đó.

### ✅ 3. Multi-field Matching

Kết hợp nhiều trường để tăng độ chính xác:
- Description (60%)
- Location (20%)
- Incident Type (15%)
- Priority (5%)

### ✅ 4. Auto-assign Toggle

Admin/Manager có thể bật/tắt tính năng auto-assign từ Web/App.

### ✅ 5. Anomaly Detection - New Pattern

Phát hiện sự cố hoàn toàn mới (không giống bất kỳ sự cố nào trong lịch sử).

---

## Chức năng có thể mở rộng

### 🔮 1. Auto-fill Form

**Hiện có API:** `POST /auto-fill`

**Ý tưởng:** Khi user mô tả sự cố, tự động điền các trường:
- Priority (dựa trên pattern)
- Incident Type
- Location (nếu nhận diện được từ mô tả)

### 🔮 2. Resolution Suggestion

**Ý tưởng:** Gợi ý cách xử lý dựa trên các sự cố tương tự đã resolve:
- Hiển thị `resolution_notes` của incidents tương tự
- Gợi ý `corrective_actions` phổ biến

### 🔮 3. Smart Escalation

**Ý tưởng:** Tự động đề xuất escalation nếu:
- Sự cố tương tự trong quá khứ thường phải escalate
- Thời gian xử lý thường vượt SLA

### 🔮 4. Predictive Maintenance

**Ý tưởng:** Dựa trên patterns sự cố để dự đoán:
- Thiết bị nào có nguy cơ hỏng
- Thời điểm nào hay xảy ra sự cố

### 🔮 5. Root Cause Analysis

**Ý tưởng:** Phân tích và gợi ý root cause:
- Cluster các sự cố tương tự
- Tìm common root causes từ lịch sử

### 🔮 6. Chatbot Integration

**Ý tưởng:** Kết hợp RAG với AI chatbot:
- User hỏi "Cách xử lý lỗi XYZ?"
- RAG tìm incidents tương tự
- AI tổng hợp thành câu trả lời

### 🔮 7. Quality Suggestions (Ideas)

**Mở rộng sang module Ideas:**
- Gợi ý ý tưởng tương tự đã có
- Tránh duplicate ideas
- Gợi ý phòng ban review phù hợp

---

## Cách hoạt động

### Bước 1: Học từ lịch sử (Training)

Khi một sự cố được **resolve thành công**, hệ thống sẽ:

```
Mô tả sự cố → PhoBERT Model → 768-dimension vector → Lưu vào DB
```

Vector này đại diện cho "ý nghĩa ngữ nghĩa" của mô tả. Càng nhiều sự cố được resolve → database càng "thông minh".

### Bước 2: Gợi ý cho sự cố mới (Inference)

```
1. EMBEDDING      - Mô tả sự cố mới → Vector 768 chiều
2. RETRIEVAL      - Tìm top 20 sự cố gần nhất (cosine similarity)
3. MULTI-FIELD    - Kết hợp điểm từ các trường khác
4. VOTING         - Phòng ban nào có nhiều matches nhất
5. AUTO-ASSIGN    - Confidence >= 75% → Tự động gán
```

---

## Thuật toán

### Vector Search với pgvector

Sử dụng **cosine similarity** để tìm vectors tương tự:
- similarity = 1.0 → Hoàn toàn giống nhau
- similarity = 0.0 → Không liên quan

**HNSW Index** giúp tìm kiếm trong milliseconds.

### Voting Algorithm

1. Nhóm theo phòng ban đã xử lý
2. Tính điểm mỗi phòng ban = Trung bình điểm của top 3 matches
3. Chọn phòng ban cao nhất

### Confidence Calculation

```
final_confidence = 60% × weighted_avg 
                 + 40% × top_similarity 
                 + consistency_bonus (tối đa 10%)
```

---

## Cấu hình

| Config | Mô tả | Mặc định |
|--------|-------|----------|
| `AUTO_ASSIGN_ENABLED` | Bật/tắt auto-assign | true |
| `AUTO_ASSIGN_THRESHOLD` | Ngưỡng confidence | 0.75 (75%) |
| `AUTO_ASSIGN_MIN_SAMPLES` | Số embeddings tối thiểu | 20 |
| `MIN_SIMILARITY` | Ngưỡng similarity | 0.1 |

---

## API Endpoints

| Endpoint | Mô tả | Sử dụng bởi |
|----------|-------|-------------|
| `POST /suggest` | Gợi ý phòng ban | incident.controller.js |
| `GET /similar` | Tìm incidents tương tự | anomaly.controller.js |
| `POST /create-embedding/{id}` | Tạo embedding sau resolve | incident.controller.js |
| `GET /settings/rag` | Lấy cấu hình | settings.controller.js |

---

## Tại sao chọn RAG?

| Phương pháp | Ưu điểm | Nhược điểm |
|-------------|---------|------------|
| **Rule-based** | Đơn giản | Cứng nhắc |
| **ML Classification** | Tự động học | Cần nhiều data |
| **RAG** | Linh hoạt, giải thích được | Cần database tốt |

RAG phù hợp vì:
- ✅ Giải thích được (hiển thị incidents tương tự)
- ✅ Học từ ít data ban đầu
- ✅ Tự cải thiện khi có thêm data
- ✅ Không cần re-train model
- ✅ Hỗ trợ tiếng Việt tốt với PhoBERT
