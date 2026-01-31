"""
RAG Incident Router Service
Main Entry Point

Chay service voi: python main.py
API docs tai: http://localhost:8001/docs
"""
import uvicorn

from config import Config
from api import app
from database import db
from embedding_service import embedding_service


def print_banner():
    """In banner khoi dong - minimal"""
    pass  # Disabled verbose banner


def startup_checks():
    """Kiem tra truoc khi start - Compact version"""
    
    # 1. pgvector extension
    if not db.check_extension():
        print("[ERROR] pgvector extension not installed!")
        return False
    print(f"[OK] pgvector extension version: {db.get_extension_version()}")
    
    # 2. Schema setup
    db.setup_schema()
    
    # 3. Embedding model info
    info = embedding_service.get_model_info()
    stats = db.count_embeddings()
    
    # 4. Compact summary
    print(f"""
==================================================
RAG Incident Router API v2.0
==================================================
Model: {info['model_name']} (dim={info['vector_dim']})
Embeddings: {stats['with_embedding']}/{stats['total']}
Docs: http://localhost:{Config.API_PORT}/docs
==================================================""")
    
    return True


def main():
    """Main entry point"""
    print_banner()
    
    # Run startup checks
    if not startup_checks():
        print("\n[ERROR] Startup checks failed. Please fix issues above.")
        return
    
    # Print API info
    print(f"""
================================================================
  API Server Starting...                                    
                                                               
  URL:      http://{Config.API_HOST}:{Config.API_PORT}                              
  Docs:     http://localhost:{Config.API_PORT}/docs                        
  ReDoc:    http://localhost:{Config.API_PORT}/redoc                       
                                                               
  Press CTRL+C to stop                                         
================================================================
""")
    
    # Start server
    uvicorn.run(
        "api:app",
        host=Config.API_HOST,
        port=Config.API_PORT,
        reload=True,  # Auto-reload for development
        log_level="info"
    )


if __name__ == "__main__":
    main()
