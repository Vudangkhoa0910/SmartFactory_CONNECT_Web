"""
Embedding Service
Tạo embeddings từ text sử dụng ONNX Runtime hoặc HuggingFace Sentence Transformers

Supports:
1. PhoBERT-v6-Denso (Custom trained ONNX model for Denso factory)
2. HuggingFace sentence-transformers (multilingual support)

Vietnamese word segmentation với pyvi (optional)
"""
import os
import time
import logging
import numpy as np
from typing import List, Union
from pathlib import Path

# Suppress verbose logging from transformers/sentence-transformers/tqdm
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TQDM_DISABLE"] = "1"  # Tắt tqdm progress bar
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"  # Tắt HuggingFace progress bars
os.environ["SAFETENSORS_FAST_GPU"] = "1"  # Tắt progress khi load safetensors

logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("safetensors").setLevel(logging.ERROR)
logging.getLogger("tqdm").setLevel(logging.ERROR)

from config import Config

# ========================================
# Configuration
# ========================================
USE_HUGGINGFACE = os.getenv("USE_HUGGINGFACE", "false").lower() == "true"

# ========================================
# Import dependencies
# ========================================

HAS_ONNX = False
HAS_SENTENCE_TRANSFORMERS = False

# Try ONNX Runtime first
try:
    import onnxruntime as ort
    HAS_ONNX = True
except ImportError:
    pass

# Try Sentence Transformers
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    pass

# Tokenizer (for ONNX mode)
try:
    from transformers import AutoTokenizer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False

# Vietnamese word segmentation (optional, for PhoBERT)
try:
    from pyvi.ViTokenizer import tokenize as vi_tokenize
    HAS_PYVI = True
except ImportError:
    HAS_PYVI = False


def tokenize_vietnamese(text: str) -> str:
    """
    Word segment Vietnamese text using pyvi.
    Required for PhoBERT-based models.
    Example: "hóa chất rò rỉ" -> "hóa_chất rò_rỉ"
    """
    if not HAS_PYVI or not text:
        return text
    try:
        return vi_tokenize(text)
    except Exception:
        return text


class EmbeddingService:
    """
    Service tạo embeddings từ text
    Supports: 
    - ONNX model (PhoBERT-v6-Denso)
    - HuggingFace sentence-transformers
    """
    _instance = None
    _model = None
    _tokenizer = None
    _use_huggingface = False
    _model_name = None
    _vector_dim = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        """Load model based on configuration"""
        self._use_huggingface = USE_HUGGINGFACE
        
        if self._use_huggingface and HAS_SENTENCE_TRANSFORMERS:
            self._load_huggingface_model()
        elif HAS_ONNX and HAS_TRANSFORMERS:
            self._load_onnx_model()
        elif HAS_SENTENCE_TRANSFORMERS:
            # Fallback to HuggingFace if ONNX not available
            self._use_huggingface = True
            self._load_huggingface_model()
        else:
            raise ImportError(
                "No embedding backend available. Install either:\n"
                "- sentence-transformers (recommended): pip install sentence-transformers\n"
                "- onnxruntime + transformers: pip install onnxruntime transformers"
            )

    def _load_huggingface_model(self):
        """Load HuggingFace sentence-transformers model"""
        model_name = os.getenv("MODEL_NAME", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        rerank_model_name = os.getenv("RERANK_MODEL_NAME", "")

        start = time.time()
        # show_progress_bar=False tắt log "Loading weights..."
        self._model = SentenceTransformer(model_name, device="cuda")
        
        # Load Reranker (nếu có config và đủ VRAM)
        self._reranker = None
        
        if rerank_model_name:
            try:
                from sentence_transformers import CrossEncoder
                print(f"[INFO] Loading Reranker: {rerank_model_name}...")
                self._reranker = CrossEncoder(rerank_model_name, device="cuda", max_length=512)
                print(f"[OK] Reranker loaded")
            except Exception as e:
                print(f"[WARN] Reranker disabled: {e}")

        self._model_name = model_name
        self._vector_dim = self._model.get_sentence_embedding_dimension()
        
        elapsed = time.time() - start
        print(f"[OK] HuggingFace model loaded in {elapsed:.2f}s (dim={self._vector_dim})")

    def rerank(self, query: str, documents: List[str]) -> List[float]:
        """
        Rerank documents based on query using CrossEncoder.
        Returns list of scores.
        """
        if not hasattr(self, '_reranker') or not self._reranker:
            return [0.0] * len(documents)
        
        if not documents:
            return []
        
        # Vietnamese word segmentation
        if HAS_PYVI:
            query = tokenize_vietnamese(query)
            documents = [tokenize_vietnamese(doc) for doc in documents]
        
        pairs = [[query, doc] for doc in documents]
        scores = self._reranker.predict(pairs)
        return scores.tolist()

    def _load_onnx_model(self):
        """Load ONNX model and tokenizer"""
        print(f"Loading ONNX model: {Config.MODEL_NAME}...")
        print(f"Vietnamese word segmentation: {'enabled' if HAS_PYVI else 'disabled'}")

        start = time.time()

        onnx_path = Config.get_onnx_model_path()
        tokenizer_path = Config.get_tokenizer_path()

        # Check model files exist
        if not onnx_path.exists():
            print(f"[WARN] ONNX model not found at {onnx_path}")
            print("[INFO] Falling back to HuggingFace model...")
            if HAS_SENTENCE_TRANSFORMERS:
                self._use_huggingface = True
                self._load_huggingface_model()
                return
            else:
                raise FileNotFoundError(
                    f"ONNX model not found at {onnx_path}\n"
                    "Please ensure the model files are in place or install sentence-transformers."
                )

        # Load ONNX model
        providers = ['CPUExecutionProvider']
        self._model = ort.InferenceSession(
            str(onnx_path), 
            providers=providers
        )
        print(f"[OK] ONNX model loaded from {onnx_path}")

        # Load tokenizer
        self._tokenizer = AutoTokenizer.from_pretrained(
            str(tokenizer_path), 
            local_files_only=True
        )
        print(f"[OK] Tokenizer loaded")
        
        self._model_name = Config.MODEL_NAME
        self._vector_dim = Config.VECTOR_DIM

        elapsed = time.time() - start
        print(f"[OK] ONNX model ready in {elapsed:.2f}s (dim={self._vector_dim})")

    def _mean_pooling(self, last_hidden_state: np.ndarray, attention_mask: np.ndarray) -> np.ndarray:
        """Mean pooling over sequence dimension (for ONNX mode)"""
        mask_expanded = np.expand_dims(attention_mask, -1).astype(np.float32)
        sum_embeddings = np.sum(last_hidden_state * mask_expanded, axis=1)
        sum_mask = np.sum(mask_expanded, axis=1)
        return sum_embeddings / np.maximum(sum_mask, 1e-9)

    def encode(self, text: Union[str, List[str]], is_query: bool = False) -> np.ndarray:
        """
        Tạo embedding từ text.
        
        Args:
            text: Text hoặc list of texts
            is_query: True nếu là query
            
        Returns:
            numpy array of embeddings (normalized)
        """
        start = time.time()
        
        # Prepare texts
        is_single = isinstance(text, str)
        texts = [text] if is_single else text
        
        if self._use_huggingface:
            # Vietnamese word segmentation - CHỈ dùng cho PhoBERT, KHÔNG dùng cho E5, AITeamVN
            # E5 multilingual model không cần và sẽ bị ảnh hưởng xấu bởi word segmentation
            is_phobert = "phobert" in self._model_name.lower() and "aiteamvn" not in self._model_name.lower()
            if HAS_PYVI and is_phobert:
                texts = [tokenize_vietnamese(t) for t in texts]
            
            # E5 models cần prefix "query:" hoặc "passage:" để hoạt động tốt
            if "e5" in self._model_name.lower():
                if is_query:
                    texts = [f"query: {t}" for t in texts]
                else:
                    texts = [f"passage: {t}" for t in texts]
            
            # Use sentence-transformers
            embeddings = self._model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=False
            )
        else:
            # Use ONNX model
            # Vietnamese word segmentation (required for PhoBERT)
            texts = [tokenize_vietnamese(t) for t in texts]

            # Tokenize
            encoded = self._tokenizer(
                texts,
                padding=True,
                truncation=True,
                max_length=256,
                return_tensors="np"
            )
            
            # Prepare inputs
            inputs = {
                "input_ids": encoded["input_ids"].astype(np.int64),
                "attention_mask": encoded["attention_mask"].astype(np.int64),
            }
            
            # Add token_type_ids if model expects it
            input_names = [inp.name for inp in self._model.get_inputs()]
            if "token_type_ids" in input_names:
                inputs["token_type_ids"] = np.zeros_like(encoded["input_ids"]).astype(np.int64)
            
            # Run inference
            outputs = self._model.run(None, inputs)
            embeddings = self._mean_pooling(outputs[0], encoded["attention_mask"])
            
            # Normalize
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / np.maximum(norms, 1e-9)

        elapsed = time.time() - start
        # print(f"Encoded {len(texts)} text(s) in {elapsed*1000:.1f}ms")  # Disabled verbose log
        
        return embeddings[0] if is_single else embeddings

    def similarity(self, text1: str, text2: str) -> float:
        """Tính cosine similarity giữa 2 text"""
        emb1 = self.encode(text1)
        emb2 = self.encode(text2)

        dot = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)

        return float(dot / (norm1 * norm2))

    def get_model_info(self) -> dict:
        """Trả về thông tin model"""
        return {
            'model_name': self._model_name,
            'vector_dim': self._vector_dim,
            'vietnamese_segmentation': HAS_PYVI and not self._use_huggingface,
            'backend': 'huggingface' if self._use_huggingface else 'onnx'
        }


# Singleton instance
embedding_service = EmbeddingService()
