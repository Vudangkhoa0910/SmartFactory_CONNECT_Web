"""
Embedding Service
Tạo embeddings từ text sử dụng ONNX Runtime

Model: PhoBERT-v6-Denso (Custom trained for Denso factory)
- Vietnamese word segmentation với pyvi
- ONNX optimized (2x faster than PyTorch)
"""
import time
import numpy as np
from typing import List, Union
from pathlib import Path

from config import Config

# ========================================
# Import dependencies
# ========================================

# ONNX Runtime
try:
    import onnxruntime as ort
    print(f"[OK] ONNX Runtime: {ort.__version__}")
except ImportError:
    raise ImportError("onnxruntime not installed. Run: pip install onnxruntime")

# Tokenizer
try:
    from transformers import AutoTokenizer
except ImportError:
    raise ImportError("transformers not installed. Run: pip install transformers")

# Vietnamese word segmentation (required for PhoBERT)
try:
    from pyvi.ViTokenizer import tokenize as vi_tokenize
    HAS_PYVI = True
    print("[OK] pyvi loaded for Vietnamese word segmentation")
except ImportError:
    HAS_PYVI = False
    print("[WARN] pyvi not installed. Vietnamese segmentation disabled. Run: pip install pyvi")


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
    Sử dụng PhoBERT-v6-Denso model với ONNX Runtime
    """
    _instance = None
    _onnx_session = None
    _tokenizer = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        """Load ONNX model and tokenizer"""
        print(f"Loading model: {Config.MODEL_NAME}...")
        print(f"Vietnamese word segmentation: {'enabled' if HAS_PYVI else 'disabled'}")

        start = time.time()

        onnx_path = Config.get_onnx_model_path()
        tokenizer_path = Config.get_tokenizer_path()

        # Check model files exist
        if not onnx_path.exists():
            raise FileNotFoundError(
                f"ONNX model not found at {onnx_path}\n"
                "Please ensure the model files are in place."
            )

        if not tokenizer_path.exists():
            raise FileNotFoundError(
                f"Tokenizer not found at {tokenizer_path}\n"
                "Please ensure the tokenizer files are in place."
            )

        # Load ONNX model
        providers = ['CPUExecutionProvider']
        self._onnx_session = ort.InferenceSession(
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

        elapsed = time.time() - start
        print(f"[OK] Model ready in {elapsed:.2f}s (dim={Config.VECTOR_DIM})")

    def _mean_pooling(self, last_hidden_state: np.ndarray, attention_mask: np.ndarray) -> np.ndarray:
        """Mean pooling over sequence dimension"""
        mask_expanded = np.expand_dims(attention_mask, -1).astype(np.float32)
        sum_embeddings = np.sum(last_hidden_state * mask_expanded, axis=1)
        sum_mask = np.sum(mask_expanded, axis=1)
        return sum_embeddings / np.maximum(sum_mask, 1e-9)

    def encode(self, text: Union[str, List[str]], is_query: bool = False) -> np.ndarray:
        """
        Tạo embedding từ text.
        
        Args:
            text: Text hoặc list of texts
            is_query: True nếu là query (không dùng cho model này)
            
        Returns:
            numpy array of embeddings (normalized)
        """
        start = time.time()
        
        # Prepare texts
        is_single = isinstance(text, str)
        texts = [text] if is_single else text

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
        input_names = [inp.name for inp in self._onnx_session.get_inputs()]
        if "token_type_ids" in input_names:
            inputs["token_type_ids"] = np.zeros_like(encoded["input_ids"]).astype(np.int64)
        
        # Run inference
        outputs = self._onnx_session.run(None, inputs)
        embeddings = self._mean_pooling(outputs[0], encoded["attention_mask"])
        
        # Normalize
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        embeddings = embeddings / np.maximum(norms, 1e-9)

        elapsed = time.time() - start
        print(f"Encoded {len(texts)} text(s) in {elapsed*1000:.1f}ms")
        
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
            'model_name': Config.MODEL_NAME,
            'vector_dim': Config.VECTOR_DIM,
            'vietnamese_segmentation': HAS_PYVI,
            'onnx_optimized': True
        }


# Singleton instance
embedding_service = EmbeddingService()
