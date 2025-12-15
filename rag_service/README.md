# RAG Unified Search Service

## Giới thiệu

**RAG (Retrieval-Augmented Generation)** Service cung cấp tìm kiếm semantic thống nhất cho toàn bộ hệ thống SmartFactory CONNECT:

- **Incidents** (Sự cố)
- **Ideas** (Góp ý - Hòm thư trắng/hồng)  
- **News** (Tin tức/Thông báo)

Service này được thiết kế để tích hợp với **Chatbot AI** trong tương lai.

---

## Tính năng

### ✅ 1. Unified Search
Tìm kiếm xuyên suốt trên tất cả loại content bằng một API duy nhất.

### ✅ 2. Incident Routing
Tự động gợi ý phòng ban xử lý sự cố dựa trên lịch sử.

### ✅ 3. Statistics API
Thống kê nhanh cho Chatbot: sự cố, góp ý, tin tức, phòng ban.

### ✅ 4. Duplicate Detection
Phát hiện nội dung trùng lặp trước khi tạo mới.

### ✅ 5. Related Content
Tìm nội dung liên quan đến một record cụ thể.

### ✅ 6. Multi-language Support
Hỗ trợ tiếng Việt với PhoBERT model.

---

## Kiến trúc

```
┌────────────────────────────────────────────────────────────────┐
│                     CHATBOT AI (Future)                        │
│                   (LLM + Function Calling)                     │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                    RAG SERVICE v3.0                            │
│                      (Port 8001)                               │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   UNIFIED   │  │   STATS     │  │  INCIDENT   │             │
│  │   SEARCH    │  │   SERVICE   │  │   ROUTER    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌──────┴────────────────┴────────────────┴──────┐             │
│  │              EMBEDDING SERVICE                │             │
│  │           (PhoBERT ONNX - 768 dim)           │             │
│  └───────────────────────────────────────────────┘             │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────┐             │
│  │              POSTGRESQL + pgvector            │             │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │             │
│  │  │incidents │ │  ideas   │ │   news   │      │             │
│  │  │+embedding│ │+embedding│ │+embedding│      │             │
│  │  └──────────┘ └──────────┘ └──────────┘      │             │
│  └───────────────────────────────────────────────┘             │
└────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Health Check
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Health check cơ bản |
| GET | `/health` | Health check chi tiết |

### Search APIs
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/search` | **Unified search** - Tìm kiếm xuyên suốt |
| POST | `/search/incidents` | Tìm sự cố tương tự |
| POST | `/search/ideas` | Tìm ý tưởng tương tự |
| POST | `/search/news` | Tìm tin tức liên quan |
| POST | `/check-duplicate` | Kiểm tra trùng lặp |
| GET | `/related/{type}/{id}` | Tìm nội dung liên quan |

### Incident Routing (Backward Compatible)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/suggest` | Gợi ý phòng ban xử lý |
| GET | `/similar` | Tìm incidents tương tự |
| POST | `/auto-fill` | Tự động điền form |

### Statistics APIs
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/stats/overview` | Thống kê tổng quan |
| GET | `/stats/incidents` | Thống kê sự cố |
| GET | `/stats/ideas` | Thống kê góp ý |
| GET | `/stats/news` | Thống kê tin tức |
| GET | `/stats/departments` | Thống kê theo phòng ban |
| GET | `/stats/trends` | Xu hướng theo thời gian |
| GET | `/stats/embeddings` | Thống kê embeddings |

### Embedding Management
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/embeddings/create` | Tạo embedding cho record |
| POST | `/embeddings/batch` | Tạo embeddings hàng loạt |
| POST | `/create-embedding/{id}` | Tạo embedding (backward compatible) |

### Admin
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/config` | Cấu hình hiện tại |
| GET | `/model-info` | Thông tin model |
| GET | `/settings/rag` | Lấy cấu hình RAG |
| PUT | `/settings/rag` | Cập nhật cấu hình RAG |

---

## Cách sử dụng

### 1. Cài đặt

```bash
cd rag_service
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Cấu hình

Tạo file `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartfactory
DB_USER=postgres
DB_PASSWORD=your_password

# API
API_HOST=0.0.0.0
API_PORT=8001

# Model
MODEL_NAME=phobert-v6-denso
MODEL_DIR=phobert_v6_denso_onnx_compressed
VECTOR_DIM=768

# Auto-assign
AUTO_ASSIGN_ENABLED=true
AUTO_ASSIGN_THRESHOLD=0.75
AUTO_ASSIGN_MIN_SAMPLES=20
```

### 3. Chạy Migration

```bash
# Chạy SQL migration để thêm embedding columns
psql -U postgres -d smartfactory -f migrations/001_add_embeddings.sql
```

### 4. Tạo Embeddings

```bash
# Tạo embeddings cho tất cả content types
python batch_processor.py all

# Hoặc cho từng loại
python batch_processor.py incident
python batch_processor.py idea
python batch_processor.py news
```

### 5. Khởi động Server

```bash
python main.py
# Hoặc
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

### 6. Truy cập API Docs

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

---

## Ví dụ sử dụng

### Unified Search

```bash
curl -X POST "http://localhost:8001/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Máy CNC bị lỗi động cơ",
    "content_types": ["incident", "idea"],
    "limit": 10
  }'
```

### Check Duplicate

```bash
curl -X POST "http://localhost:8001/check-duplicate" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "idea",
    "title": "Tiết kiệm điện năng",
    "description": "Đề xuất lắp cảm biến tự động tắt đèn",
    "threshold": 0.85
  }'
```

### Statistics

```bash
# Thống kê sự cố tuần này
curl "http://localhost:8001/stats/incidents?time_range=week"

# Thống kê theo phòng ban
curl "http://localhost:8001/stats/departments"
```

### Create Embedding

```bash
curl -X POST "http://localhost:8001/embeddings/create" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "idea",
    "record_id": "uuid-of-idea"
  }'
```

---

## Cấu trúc thư mục

```
rag_service/
├── api.py                 # FastAPI endpoints
├── main.py                # Entry point
├── config.py              # Configuration
├── database.py            # Database operations (multi-table)
├── embedding_service.py   # PhoBERT embedding
├── incident_router.py     # Incident routing logic
├── unified_search.py      # Unified search service
├── stats_service.py       # Statistics service
├── batch_processor.py     # Batch embedding creation
├── migrations/
│   └── 001_add_embeddings.sql  # Database migration
├── phobert_v6_denso_onnx_compressed/
│   ├── model.onnx         # ONNX model
│   └── ...                # Tokenizer files
├── requirements.txt
└── README.md
```

---

## Content Types

| Type | Table | Text Fields (Tiếng Việt) |
|------|-------|--------------------------|
| incident | incidents | description |
| idea | ideas | title, description, expected_benefit |
| news | news | title, content |

---

## Chatbot Integration (Future)

### Ví dụ câu hỏi Chatbot → API

| User hỏi | API Call |
|----------|----------|
| "Có sự cố nào về máy CNC không?" | `POST /search {"query": "máy CNC", "content_types": ["incident"]}` |
| "Tuần này có bao nhiêu sự cố?" | `GET /stats/incidents?time_range=week` |
| "Đã có ai đề xuất tiết kiệm điện chưa?" | `POST /search {"query": "tiết kiệm điện", "content_types": ["idea"]}` |
| "Phòng nào xử lý nhiều nhất?" | `GET /stats/departments` |
| "Thông báo mới nhất về an toàn?" | `POST /search/news {"query": "an toàn"}` |

---

## Changelog

### v3.0.0 (2024-12-15)
- ✅ **Unified Search**: Tìm kiếm xuyên suốt incidents, ideas, news
- ✅ **Statistics APIs**: Thống kê chi tiết cho chatbot
- ✅ **Multi-table Support**: Hỗ trợ embedding cho cả 3 loại content
- ✅ **Duplicate Detection**: Phát hiện nội dung trùng lặp
- ✅ **Related Content**: Tìm nội dung liên quan
- ✅ **Backward Compatible**: Giữ nguyên API cũ cho incident routing

### v2.0.0
- Multi-field matching cho incidents
- Auto-assign với voting algorithm

### v1.0.0
- Basic incident routing với PhoBERT

---

## Files Changed (For Commit)

### New Files
- `migrations/001_add_embeddings.sql` - Migration thêm embedding columns
- `unified_search.py` - Service tìm kiếm thống nhất
- `stats_service.py` - Service thống kê cho chatbot

### Modified Files
- `database.py` - Refactor hỗ trợ multi-table (incidents, ideas, news)
- `api.py` - Thêm endpoints mới (search, stats, embeddings)
- `incident_router.py` - Cập nhật sử dụng ContentType
- `batch_processor.py` - Hỗ trợ xử lý nhiều loại content
- `README.md` - Document đầy đủ v3.0

---

## License

Internal use only - DENSO Vietnam
