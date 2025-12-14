"""
FastAPI Application - RAG Incident Router
REST API endpoints cho viec routing incidents tu dong bang AI
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from config import Config
from incident_router import router
from database import db
from embedding_service import embedding_service
from batch_processor import processor


# FastAPI App
app = FastAPI(
    title="RAG Incident Router API",
    description="API cho viec routing incidents tu dong bang AI",
    version="2.0.0",
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


# === Pydantic Models ===
class SuggestRequest(BaseModel):
    """Request body cho suggest endpoint - ho tro multi-field"""
    description: str = Field(..., min_length=5, description="Mo ta su co")
    location: Optional[str] = Field(None, description="Vi tri xay ra su co")
    incident_type: Optional[str] = Field(None, description="Loai su co (equipment, safety, quality, other)")
    priority: Optional[str] = Field(None, description="Muc do uu tien (high, medium, low)")


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


class AutoFillRequest(BaseModel):
    description: str = Field(..., min_length=5)


class AutoFillResponse(BaseModel):
    success: bool
    suggestions: Dict[str, Any]
    confidence: float
    reference_incident_id: Optional[str]


class RAGSettingsRequest(BaseModel):
    enabled: bool = Field(description="Bat/tat auto-assign")
    threshold: float = Field(ge=0.3, le=1.0, description="Nguong confidence (0.3-1.0)")
    min_samples: int = Field(ge=0, description="So mau toi thieu")


class RAGSettingsResponse(BaseModel):
    enabled: bool
    threshold: float
    min_samples: int
    current_samples: int
    recommendation: str


# === API Endpoints ===
@app.get("/", tags=["Health"])
async def root():
    return {"service": "RAG Incident Router", "version": "2.0.0", "status": "running"}


@app.get("/health", tags=["Health"])
async def health_check():
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


@app.post("/suggest", response_model=SuggestResponse, tags=["Routing"])
async def suggest_department(request: SuggestRequest):
    """
    Goi y department cho incident moi.
    Su dung Multi-field matching + Voting/Average.
    """
    result = router.suggest_department(
        description=request.description,
        location=request.location,
        incident_type=request.incident_type,
        priority=request.priority
    )
    return SuggestResponse(**result)


@app.post("/auto-fill", response_model=AutoFillResponse, tags=["Routing"])
async def auto_fill_form(request: AutoFillRequest):
    """Tu dong dien form dua tren mo ta"""
    result = router.auto_fill_form(request.description)
    return AutoFillResponse(**result)


@app.get("/similar", tags=["Search"])
async def find_similar_incidents(
    description: str = Query(..., min_length=5),
    limit: int = Query(5, ge=1, le=20)
):
    """Tim cac incidents tuong tu"""
    return router.find_similar_incidents(description, limit=limit)


@app.get("/stats", tags=["Admin"])
async def get_embedding_stats():
    """Thong ke so luong embeddings"""
    return db.count_embeddings()


@app.post("/process-batch", tags=["Admin"])
async def process_batch(
    batch_size: int = Query(50, ge=10, le=200),
    max_records: Optional[int] = Query(None, ge=1)
):
    """Tao embeddings cho cac incidents chua co"""
    return processor.process_all(batch_size=batch_size, max_records=max_records)


@app.post("/create-embedding/{incident_id}", tags=["Webhook"])
async def create_embedding_for_incident(incident_id: str):
    """
    Tao embedding sau khi incident duoc RESOLVE.
    Chi tao embedding cho incident da hoan thanh -> ground truth cho RAG.
    Goi tu backend Node.js sau khi resolve incident.
    """
    try:
        with db.cursor() as cur:
            cur.execute("""
                SELECT id, description, assigned_department_id, status
                FROM incidents WHERE id = %s::uuid
            """, (incident_id,))
            incident = cur.fetchone()

        if not incident:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
        if not incident["description"]:
            raise HTTPException(status_code=400, detail="Incident has no description")
        if not incident["assigned_department_id"]:
            raise HTTPException(status_code=400, detail="Incident chua duoc gan phong ban xu ly")

        # Create embedding from description
        embedding = embedding_service.encode(incident["description"])
        success = db.save_embedding(incident_id, embedding)

        if success:
            return {
                "success": True, 
                "incident_id": incident_id, 
                "message": "Embedding created for resolved incident",
                "assigned_department_id": incident["assigned_department_id"]
            }
        raise HTTPException(status_code=500, detail="Failed to save embedding")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-info", tags=["Utils"])
async def get_model_info():
    """Thong tin model embedding"""
    return embedding_service.get_model_info()


@app.get("/config", tags=["Admin"])
async def get_config():
    """Cấu hình hiện tại"""
    return {
        "model": {"name": Config.MODEL_NAME, "vector_dim": Config.VECTOR_DIM},
        "search": {"min_similarity": Config.MIN_SIMILARITY, "auto_assign_threshold": Config.AUTO_ASSIGN_THRESHOLD}
    }


@app.get("/settings/rag", response_model=RAGSettingsResponse, tags=["Admin"])
async def get_rag_settings():
    """Lay cau hinh RAG auto-assign"""
    settings = db.get_rag_settings()
    stats = db.count_embeddings()
    current = stats["with_embedding"]
    
    if current < settings["min_samples"]:
        rec = f"Can them {settings['min_samples'] - current} mau"
    elif not settings["enabled"]:
        rec = "Du dieu kien bat auto-assign"
    else:
        rec = "Auto-assign dang hoat dong"

    return RAGSettingsResponse(
        enabled=settings["enabled"],
        threshold=settings["threshold"],
        min_samples=settings["min_samples"],
        current_samples=current,
        recommendation=rec
    )


@app.put("/settings/rag", response_model=RAGSettingsResponse, tags=["Admin"])
async def update_rag_settings(request: RAGSettingsRequest):
    """Cap nhat cau hinh RAG auto-assign"""
    settings = {"enabled": request.enabled, "threshold": request.threshold, "min_samples": request.min_samples}
    
    if not db.save_rag_settings(settings):
        raise HTTPException(status_code=500, detail="Failed to save settings")

    stats = db.count_embeddings()
    current = stats["with_embedding"]
    
    if current < request.min_samples:
        rec = f"Can them {request.min_samples - current} mau"
    elif not request.enabled:
        rec = "Du dieu kien bat auto-assign"
    else:
        rec = "Auto-assign dang hoat dong"

    return RAGSettingsResponse(
        enabled=request.enabled,
        threshold=request.threshold,
        min_samples=request.min_samples,
        current_samples=current,
        recommendation=rec
    )


# === Startup/Shutdown ===
@app.on_event("startup")
async def startup_event():
    print("\n" + "=" * 50)
    print("RAG Incident Router API v2.0")
    print("=" * 50)
    db.check_extension()
    db.setup_schema()
    info = embedding_service.get_model_info()
    stats = db.count_embeddings()
    print(f"Model: {info['model_name']} (dim={info['vector_dim']})")
    print(f"Embeddings: {stats['with_embedding']}/{stats['total']}")
    print(f"Docs: http://localhost:{Config.API_PORT}/docs")
    print("=" * 50 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    print("\nShutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host=Config.API_HOST, port=Config.API_PORT, reload=True)

