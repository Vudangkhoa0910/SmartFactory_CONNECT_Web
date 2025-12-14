"""
SmartFactory CONNECT - RAG Service Package

Model: PhoBERT-v6-Denso (Custom trained for Denso factory context)
"""
from .config import Config
from .embedding_service import embedding_service, EmbeddingService
from .database import db, Database
from .incident_router import router, IncidentRouter
from .batch_processor import processor, BatchProcessor

__all__ = [
    'Config',
    'embedding_service',
    'EmbeddingService',
    'db',
    'Database',
    'router',
    'IncidentRouter',
    'processor',
    'BatchProcessor',
]

__version__ = '2.0.0'
