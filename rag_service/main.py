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
    """In banner khoi dong"""
    banner = """
================================================================
                                                               
   RAG INCIDENT ROUTER SERVICE                              
                                                               
   Tu dong goi y department cho incident moi                   
   Ho tro da ngon ngu: Tieng Viet, Tieng Nhat, English         
                                                               
================================================================
"""
    print(banner)


def startup_checks():
    """Kiem tra truoc khi start"""
    print("=" * 60)
    print("Running Startup Checks...")
    print("=" * 60)
    
    # 1. Database connection
    print("\n1. Database Connection")
    print(f"    Host: {Config.DB_HOST}:{Config.DB_PORT}")
    print(f"    Database: {Config.DB_NAME}")
    
    # 2. pgvector extension
    print("\n2. pgvector Extension")
    if not db.check_extension():
        print("    [ERROR] Extension not installed!")
        print("    Run: CREATE EXTENSION vector;")
        return False
    
    # 3. Schema setup
    print("\n3. Database Schema")
    if not db.setup_schema():
        print("    [WARN] Schema setup had issues (table may not exist)")
    
    # 4. Embedding model
    print("\n4. Embedding Model")
    info = embedding_service.get_model_info()
    print(f"    Model: {info['model_name']}")
    print(f"    Vector Dim: {info['vector_dim']}")
    print(f"    Vietnamese Segmentation: {'enabled' if info['vietnamese_segmentation'] else 'disabled'}")
    
    # 5. Current stats
    print("\n5. Embedding Statistics")
    stats = db.count_embeddings()
    print(f"    Total incidents: {stats['total']}")
    print(f"    With embedding: {stats['with_embedding']} ({stats['percentage']:.1f}%)")
    print(f"    Without embedding: {stats['without_embedding']}")
    
    if stats['without_embedding'] > 0 and stats['total'] > 0:
        print(f"\n    Tip: Run 'python batch_processor.py' to create missing embeddings")
    
    # 6. Search settings
    print("\n6. Search Settings")
    print(f"    Min Similarity: {Config.MIN_SIMILARITY * 100:.0f}%")
    print(f"    Auto-assign Threshold: {Config.AUTO_ASSIGN_THRESHOLD * 100:.0f}%")
    print(f"    Default Limit: {Config.DEFAULT_LIMIT}")
    
    print("\n" + "=" * 60)
    print("[OK] All checks passed!")
    print("=" * 60)
    
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
