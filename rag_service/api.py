"""
FastAPI Application - RAG Unified Search Service
REST API cho tìm kiếm semantic và thống kê: incidents, ideas, news
Phục vụ cho Chatbot AI và các ứng dụng khác
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from config import Config
from database import db, ContentType
from embedding_service import embedding_service
from incident_router import router
from unified_search import unified_search
from stats_service import stats_service
from batch_processor import processor


# ============================================
# FASTAPI APP
# ============================================
app = FastAPI(
    title="RAG Unified Search API",
    description="""
    API tìm kiếm semantic và thống kê cho SmartFactory CONNECT.
    
    ## Tính năng chính:
    - **Unified Search**: Tìm kiếm xuyên suốt trên incidents, ideas, news
    - **Incident Routing**: Gợi ý phòng ban xử lý sự cố
    - **Statistics**: Thống kê nhanh cho Chatbot AI
    - **Embeddings Management**: Quản lý vector embeddings
    """,
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# PYDANTIC MODELS
# ============================================

# --- Search Models ---
class UnifiedSearchRequest(BaseModel):
    """Request cho unified search"""
    query: str = Field(..., min_length=3, description="Câu query tìm kiếm (tiếng Việt)")
    content_types: Optional[List[str]] = Field(
        None,
        description="Loại content: ['incident', 'idea', 'news']. Mặc định: tất cả"
    )
    limit: int = Field(10, ge=1, le=50, description="Số kết quả tối đa")
    min_similarity: Optional[float] = Field(None, ge=0.0, le=1.0, description="Ngưỡng similarity")
    filters: Optional[Dict[str, Any]] = Field(None, description="Bộ lọc bổ sung")


class SearchResponse(BaseModel):
    """Response cho search"""
    success: bool
    message: str
    results: List[Dict[str, Any]]
    stats: Dict[str, int]
    total: int


class DuplicateCheckRequest(BaseModel):
    """Request kiểm tra trùng lặp"""
    content_type: str = Field(..., description="incident, idea, hoặc news")
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    threshold: float = Field(0.85, ge=0.5, le=1.0)


# --- Incident Router Models (backward compatible) ---
class SuggestRequest(BaseModel):
    """Request body cho suggest endpoint - hỗ trợ multi-field"""
    description: str = Field(..., min_length=5, description="Mô tả sự cố")
    location: Optional[str] = Field(None, description="Vị trí xảy ra sự cố")
    incident_type: Optional[str] = Field(None, description="Loại sự cố")
    priority: Optional[str] = Field(None, description="Mức độ ưu tiên")


class DepartmentSuggestion(BaseModel):
    department_id: str
    department_name: str
    confidence: float = Field(ge=0, le=1)
    vote_count: int
    auto_assign: bool


class SuggestResponse(BaseModel):
    success: bool
    suggestion: Optional[DepartmentSuggestion]
    similar_incidents: List[Dict[str, Any]]
    message: str
    auto_assign_info: Optional[Dict[str, Any]] = None
    department_scores: Optional[Dict[str, Any]] = None


# --- Settings Models ---
class RAGSettingsRequest(BaseModel):
    enabled: bool = Field(description="Bật/tắt auto-assign")
    threshold: float = Field(ge=0.3, le=1.0, description="Ngưỡng confidence")
    min_samples: int = Field(ge=0, description="Số mẫu tối thiểu")


class RAGSettingsResponse(BaseModel):
    enabled: bool
    threshold: float
    min_samples: int
    current_samples: int
    recommendation: str


# --- Embedding Models ---
class CreateEmbeddingRequest(BaseModel):
    """Request tạo embedding"""
    content_type: str = Field(..., description="incident, idea, hoặc news")
    record_id: str = Field(..., description="ID của record")


# ============================================
# HEALTH CHECK ENDPOINTS
# ============================================
@app.get("/", tags=["Health"])
async def root():
    """Health check cơ bản"""
    return {
        "service": "RAG Unified Search",
        "version": "3.0.0",
        "status": "running",
        "features": ["incidents", "ideas", "news", "statistics"]
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check chi tiết"""
    try:
        stats = db.count_embeddings()
        model_info = embedding_service.get_model_info()
        return {
            "status": "healthy",
            "database": "connected",
            "model": model_info["model_name"],
            "embeddings": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# UNIFIED SEARCH ENDPOINTS
# ============================================
@app.post("/search", response_model=SearchResponse, tags=["Search"])
async def search(request: UnifiedSearchRequest):
    """
    Tìm kiếm xuyên suốt trên nhiều loại content.
    
    - **query**: Câu tìm kiếm bằng tiếng Việt
    - **content_types**: ['incident', 'idea', 'news'] - mặc định tất cả
    - **limit**: Số kết quả tối đa (1-50)
    - **filters**: Bộ lọc {status, category, department_id}
    """
    result = unified_search.search(
        query=request.query,
        content_types=request.content_types,
        limit=request.limit,
        min_similarity=request.min_similarity,
        filters=request.filters
    )
    return SearchResponse(**result)


@app.post("/search/incidents", tags=["Search"])
async def search_incidents(
    query: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
    status: Optional[str] = None,
    incident_type: Optional[str] = None
):
    """Tìm kiếm sự cố tương tự"""
    filters = {}
    if status:
        filters["status"] = status
    if incident_type:
        filters["category"] = incident_type

    return unified_search.search_incidents(query, limit, filters if filters else None)


@app.post("/search/ideas", tags=["Search"])
async def search_ideas(
    query: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
    status: Optional[str] = None,
    category: Optional[str] = None
):
    """Tìm kiếm ý tưởng tương tự"""
    filters = {}
    if status:
        filters["status"] = status
    if category:
        filters["category"] = category

    return unified_search.search_ideas(query, limit, filters if filters else None)


@app.post("/search/news", tags=["Search"])
async def search_news(
    query: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = None
):
    """Tìm kiếm tin tức liên quan"""
    filters = {"category": category} if category else None
    return unified_search.search_news(query, limit, filters)


@app.post("/check-duplicate", tags=["Search"])
async def check_duplicate(request: DuplicateCheckRequest):
    """
    Kiểm tra nội dung trùng lặp trước khi tạo mới.
    Dùng để cảnh báo user khi submit idea/incident tương tự đã có.
    """
    return unified_search.find_duplicates(
        content_type=request.content_type,
        title=request.title,
        description=request.description,
        threshold=request.threshold
    )


@app.get("/related/{content_type}/{record_id}", tags=["Search"])
async def get_related_content(
    content_type: str,
    record_id: str,
    include_types: Optional[str] = None,
    limit: int = Query(5, ge=1, le=20)
):
    """
    Tìm nội dung liên quan đến một record cụ thể.
    
    - **content_type**: incident, idea, hoặc news
    - **record_id**: ID của record nguồn
    - **include_types**: Các loại content muốn tìm (comma-separated)
    """
    types = include_types.split(",") if include_types else None
    return unified_search.get_related_content(content_type, record_id, types, limit)


# ============================================
# INCIDENT ROUTING ENDPOINTS (Backward Compatible)
# ============================================
@app.post("/suggest", response_model=SuggestResponse, tags=["Incident Routing"])
async def suggest_department(request: SuggestRequest):
    """
    Gợi ý department cho incident mới.
    Sử dụng Multi-field matching + Voting/Average.
    """
    result = router.suggest_department(
        description=request.description,
        location=request.location,
        incident_type=request.incident_type,
        priority=request.priority
    )
    return SuggestResponse(**result)


@app.get("/similar", tags=["Incident Routing"])
async def find_similar_incidents(
    description: str = Query(..., min_length=5),
    limit: int = Query(5, ge=1, le=20)
):
    """Tìm các incidents tương tự (backward compatible)"""
    return router.find_similar_incidents(description, limit=limit)


@app.post("/auto-fill", tags=["Incident Routing"])
async def auto_fill_form(description: str = Query(..., min_length=5)):
    """Tự động điền form dựa trên mô tả"""
    return router.auto_fill_form(description)


# ============================================
# STATISTICS ENDPOINTS
# ============================================
@app.get("/stats/overview", tags=["Statistics"])
async def get_overview_stats():
    """
    Thống kê tổng quan hệ thống.
    Chatbot query: "Tình hình chung thế nào?"
    """
    return stats_service.get_overview()


@app.get("/stats/incidents", tags=["Statistics"])
async def get_incidents_stats(
    time_range: str = Query("all", description="today, week, month, year, all"),
    incident_type: Optional[str] = None,
    department_id: Optional[str] = None
):
    """
    Thống kê sự cố chi tiết.
    Chatbot query: "Tuần này có bao nhiêu sự cố?"
    """
    return stats_service.get_incidents_stats(time_range, incident_type, department_id)


@app.get("/stats/ideas", tags=["Statistics"])
async def get_ideas_stats(
    time_range: str = Query("all", description="today, week, month, year, all"),
    category: Optional[str] = None,
    ideabox_type: Optional[str] = None
):
    """
    Thống kê góp ý chi tiết.
    Chatbot query: "Có bao nhiêu ý tưởng được duyệt?"
    """
    return stats_service.get_ideas_stats(time_range, category, ideabox_type)


@app.get("/stats/news", tags=["Statistics"])
async def get_news_stats(
    time_range: str = Query("all", description="today, week, month, year, all")
):
    """Thống kê tin tức"""
    return stats_service.get_news_stats(time_range)


@app.get("/stats/departments", tags=["Statistics"])
async def get_department_stats():
    """
    Thống kê theo phòng ban.
    Chatbot query: "Phòng nào xử lý nhiều nhất?"
    """
    return stats_service.get_department_stats()


@app.get("/stats/trends", tags=["Statistics"])
async def get_trends(days: int = Query(30, ge=7, le=365)):
    """
    Phân tích xu hướng.
    Chatbot query: "Xu hướng tháng này?", "Vấn đề gì đang tăng?"
    """
    return stats_service.get_trends(days)


@app.get("/stats/embeddings", tags=["Statistics"])
async def get_embedding_stats():
    """Thống kê RAG embeddings theo từng loại content"""
    return stats_service.get_embedding_stats()


# ============================================
# EMBEDDING MANAGEMENT ENDPOINTS
# ============================================
@app.post("/embeddings/create", tags=["Embeddings"])
async def create_embedding(request: CreateEmbeddingRequest):
    """
    Tạo embedding cho một record bất kỳ (incident, idea, news).
    Gọi từ backend Node.js sau khi record được approve/resolve.
    """
    try:
        # Parse content type
        ct_map = {"incident": ContentType.INCIDENT, "idea": ContentType.IDEA, "news": ContentType.NEWS}
        content_type = ct_map.get(request.content_type.lower())
        if not content_type:
            raise HTTPException(status_code=400, detail=f"Invalid content_type: {request.content_type}")

        # Get record
        record = db.get_record_for_embedding(content_type, request.record_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Record not found: {request.record_id}")

        # Get text for embedding
        text = db.get_text_for_embedding(content_type, record)
        if not text or len(text.strip()) < 5:
            raise HTTPException(status_code=400, detail="Record has no valid text content")

        # Create and save embedding
        embedding = embedding_service.encode(text)
        success = db.save_embedding(content_type, request.record_id, embedding)

        if success:
            return {
                "success": True,
                "content_type": request.content_type,
                "record_id": request.record_id,
                "text_length": len(text),
                "message": "Embedding created successfully"
            }

        raise HTTPException(status_code=500, detail="Failed to save embedding")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embeddings/batch", tags=["Embeddings"])
async def create_embeddings_batch(
    content_type: str = Query(..., description="incident, idea, hoặc news"),
    batch_size: int = Query(50, ge=10, le=200),
    max_records: Optional[int] = Query(None, ge=1)
):
    """Tạo embeddings hàng loạt cho các records chưa có embedding"""
    ct_map = {"incident": ContentType.INCIDENT, "idea": ContentType.IDEA, "news": ContentType.NEWS}
    ct = ct_map.get(content_type.lower())
    if not ct:
        raise HTTPException(status_code=400, detail=f"Invalid content_type: {content_type}")

    # Get records without embedding
    records = db.get_records_without_embedding(ct, limit=max_records or 1000)
    if not records:
        return {"success": True, "processed": 0, "message": "No records need embedding"}

    # Process in batches
    processed = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        data = []
        for record in batch:
            text = db.get_text_for_embedding(ct, record)
            if text and len(text.strip()) >= 5:
                embedding = embedding_service.encode(text)
                data.append({"id": record["id"], "embedding": embedding})

        if data:
            processed += db.save_embeddings_batch(ct, data)

    return {
        "success": True,
        "content_type": content_type,
        "processed": processed,
        "total_found": len(records)
    }


# Backward compatible endpoint
@app.post("/create-embedding/{incident_id}", tags=["Embeddings"])
async def create_embedding_for_incident(incident_id: str):
    """
    Tạo embedding sau khi incident được RESOLVE (backward compatible).
    """
    try:
        record = db.get_record_for_embedding(ContentType.INCIDENT, incident_id)
        if not record:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

        text = db.get_text_for_embedding(ContentType.INCIDENT, record)
        if not text:
            raise HTTPException(status_code=400, detail="Incident has no description")

        embedding = embedding_service.encode(text)
        success = db.save_embedding(ContentType.INCIDENT, incident_id, embedding)

        if success:
            return {"success": True, "incident_id": incident_id, "message": "Embedding created"}

        raise HTTPException(status_code=500, detail="Failed to save embedding")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ADMIN ENDPOINTS
# ============================================
@app.get("/stats", tags=["Admin"])
async def get_legacy_stats():
    """Thống kê số lượng embeddings (backward compatible)"""
    return db.count_embeddings(ContentType.INCIDENT)


@app.post("/process-batch", tags=["Admin"])
async def process_batch(
    batch_size: int = Query(50, ge=10, le=200),
    max_records: Optional[int] = Query(None, ge=1)
):
    """Tạo embeddings cho các incidents chưa có (backward compatible)"""
    return processor.process_all(batch_size=batch_size, max_records=max_records)


@app.get("/model-info", tags=["Admin"])
async def get_model_info():
    """Thông tin model embedding"""
    return embedding_service.get_model_info()


@app.get("/config", tags=["Admin"])
async def get_config():
    """Cấu hình hiện tại"""
    return {
        "model": {"name": Config.MODEL_NAME, "vector_dim": Config.VECTOR_DIM},
        "search": {"min_similarity": Config.MIN_SIMILARITY, "auto_assign_threshold": Config.AUTO_ASSIGN_THRESHOLD},
        "supported_types": ["incident", "idea", "news"]
    }


@app.get("/settings/rag", response_model=RAGSettingsResponse, tags=["Admin"])
async def get_rag_settings():
    """Lấy cấu hình RAG auto-assign"""
    settings = db.get_rag_settings()
    stats = db.count_embeddings(ContentType.INCIDENT)
    current = stats["with_embedding"]

    if current < settings["min_samples"]:
        rec = f"Cần thêm {settings['min_samples'] - current} mẫu"
    elif not settings["enabled"]:
        rec = "Đủ điều kiện bật auto-assign"
    else:
        rec = "Auto-assign đang hoạt động"

    return RAGSettingsResponse(
        enabled=settings["enabled"],
        threshold=settings["threshold"],
        min_samples=settings["min_samples"],
        current_samples=current,
        recommendation=rec
    )


@app.put("/settings/rag", response_model=RAGSettingsResponse, tags=["Admin"])
async def update_rag_settings(request: RAGSettingsRequest):
    """Cập nhật cấu hình RAG auto-assign"""
    settings = {"enabled": request.enabled, "threshold": request.threshold, "min_samples": request.min_samples}

    if not db.save_rag_settings(settings):
        raise HTTPException(status_code=500, detail="Failed to save settings")

    stats = db.count_embeddings(ContentType.INCIDENT)
    current = stats["with_embedding"]

    if current < request.min_samples:
        rec = f"Cần thêm {request.min_samples - current} mẫu"
    elif not request.enabled:
        rec = "Đủ điều kiện bật auto-assign"
    else:
        rec = "Auto-assign đang hoạt động"

    return RAGSettingsResponse(
        enabled=request.enabled,
        threshold=request.threshold,
        min_samples=request.min_samples,
        current_samples=current,
        recommendation=rec
    )


# ============================================
# STARTUP/SHUTDOWN
# ============================================
@app.on_event("startup")
async def startup_event():
    print("\n" + "=" * 60)
    print("RAG UNIFIED SEARCH API v3.0")
    print("=" * 60)
    db.check_extension()
    db.setup_schema()
    info = embedding_service.get_model_info()
    stats = db.count_embeddings()
    print(f"Model: {info['model_name']} (dim={info['vector_dim']})")
    print(f"Total Embeddings: {stats['with_embedding']}/{stats['total']}")
    print(f"  - Incidents: {stats['by_type'].get('incident', {}).get('with_embedding', 0)}")
    print(f"  - Ideas: {stats['by_type'].get('idea', {}).get('with_embedding', 0)}")
    print(f"  - News: {stats['by_type'].get('news', {}).get('with_embedding', 0)}")
    print(f"Docs: http://localhost:{Config.API_PORT}/docs")
    print("=" * 60 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    print("\nShutting down RAG Service...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host=Config.API_HOST, port=Config.API_PORT, reload=True)
