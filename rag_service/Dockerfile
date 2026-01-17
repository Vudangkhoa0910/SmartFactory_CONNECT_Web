# RAG Service - Lightweight Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Minimal dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY *.py ./

EXPOSE 8001

# Simple health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8001/ || exit 1

ENV USE_HUGGINGFACE=true
ENV MODEL_NAME=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
ENV VECTOR_DIM=384

CMD ["python", "main.py"]
