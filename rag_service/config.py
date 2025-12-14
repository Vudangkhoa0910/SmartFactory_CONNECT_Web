"""
RAG Service Configuration
Tất cả cấu hình đọc từ file .env
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env từ thư mục hiện tại
load_dotenv(Path(__file__).parent / '.env')


class Config:
    """Đọc config từ .env file"""

    # Database (BẮT BUỘC trong .env - không có default)
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    # Model
    MODEL_NAME = os.getenv("MODEL_NAME", "phobert-v6-denso")
    MODEL_DIR = os.getenv("MODEL_DIR", "phobert_v6_denso_onnx_compressed")
    VECTOR_DIM = int(os.getenv("VECTOR_DIM", "768"))

    # Search
    DEFAULT_LIMIT = int(os.getenv("DEFAULT_LIMIT", "5"))
    MIN_SIMILARITY = float(os.getenv("MIN_SIMILARITY", "0.1"))

    # Auto-assign
    AUTO_ASSIGN_ENABLED = os.getenv("AUTO_ASSIGN_ENABLED", "true").lower() == "true"
    AUTO_ASSIGN_THRESHOLD = float(os.getenv("AUTO_ASSIGN_THRESHOLD", "0.75"))
    AUTO_ASSIGN_MIN_SAMPLES = int(os.getenv("AUTO_ASSIGN_MIN_SAMPLES", "20"))

    # API
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8001"))

    # Paths
    @classmethod
    def get_model_dir(cls) -> Path:
        return Path(__file__).parent / cls.MODEL_DIR

    @classmethod
    def get_onnx_model_path(cls) -> Path:
        return cls.get_model_dir() / "model.onnx"

    @classmethod
    def get_tokenizer_path(cls) -> Path:
        return cls.get_model_dir()

    @classmethod
    def get_db_url(cls) -> str:
        return f"postgresql://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
