"""
Database Service
Ket noi PostgreSQL voi pgvector extension
"""
import numpy as np
from typing import List, Dict, Optional
from contextlib import contextmanager

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, execute_values
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

try:
    from pgvector.psycopg2 import register_vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False

from config import Config


class Database:
    """Database connection va vector operations"""
    _instance: Optional['Database'] = None
    _conn = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._connect()
        return cls._instance

    def _connect(self):
        """Ket noi database va dang ky vector type"""
        if not HAS_PSYCOPG2:
            raise ImportError("psycopg2 not installed")

        try:
            self._conn = psycopg2.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                database=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD
            )

            if HAS_PGVECTOR:
                try:
                    register_vector(self._conn)
                except psycopg2.ProgrammingError:
                    pass  # Will be fixed in setup_schema()
        except psycopg2.OperationalError as e:
            print(f"[ERROR] Database connection failed: {e}")
            raise

    def reconnect(self):
        """Reconnect neu connection bi mat"""
        if self._conn:
            try:
                self._conn.close()
            except:
                pass
        self._connect()

    @contextmanager
    def cursor(self):
        """Context manager cho cursor voi auto-commit/rollback"""
        cur = self._conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cur
            self._conn.commit()
        except Exception as e:
            self._conn.rollback()
            raise e
        finally:
            cur.close()

    def check_extension(self) -> bool:
        """Kiem tra pgvector extension"""
        try:
            with self.cursor() as cur:
                cur.execute("SELECT * FROM pg_extension WHERE extname = 'vector'")
                result = cur.fetchone()
                return result is not None
        except Exception as e:
            print(f"[ERROR] Error checking extension: {e}")
            return False

    def get_extension_version(self) -> str:
        """Lay version cua pgvector extension"""
        try:
            with self.cursor() as cur:
                cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
                result = cur.fetchone()
                return result['extversion'] if result else "unknown"
        except Exception:
            return "unknown"

    def setup_schema(self) -> bool:
        """Tao schema cho vector search - tu dong cap nhat dimension neu khac"""
        dim = Config.VECTOR_DIM
        column_name = "embedding"

        print(f"Setting up schema for {column_name} (dim={dim})...")

        try:
            with self.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                
                # Re-register vector type for current connection
                if HAS_PGVECTOR:
                    try:
                        register_vector(self._conn)
                    except Exception as e:
                        print(f"[WARN] Failed to register vector type: {e}")

                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'incidents'
                    )
                """)
                if not cur.fetchone()['exists']:
                    print("[WARN] Table 'incidents' does not exist.")
                    return False

                cur.execute("""
                    SELECT atttypmod 
                    FROM pg_attribute 
                    WHERE attrelid = 'incidents'::regclass 
                    AND attname = 'embedding'
                """)
                result = cur.fetchone()
                
                if result is None:
                    print(f"[INFO] Creating embedding column with dim={dim}")
                    cur.execute(f"ALTER TABLE incidents ADD COLUMN embedding vector({dim})")
                else:
                    current_dim = result['atttypmod']
                    if current_dim != dim:
                        print(f"[WARN] Dimension mismatch: current={current_dim}, expected={dim}")
                        print(f"[INFO] Dropping and recreating embedding column...")
                        cur.execute("DROP INDEX IF EXISTS idx_incidents_embedding_hnsw")
                        cur.execute("ALTER TABLE incidents DROP COLUMN embedding")
                        cur.execute(f"ALTER TABLE incidents ADD COLUMN embedding vector({dim})")
                        print(f"[OK] Column recreated with dim={dim}")
                    else:
                        print(f"[OK] Embedding column exists with correct dim={dim}")

                cur.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_incidents_{column_name}_hnsw
                    ON incidents USING hnsw ({column_name} vector_cosine_ops)
                    WITH (m = 16, ef_construction = 64)
                """)

            print("[OK] Schema setup complete!")
            return True

        except Exception as e:
            print(f"[ERROR] Schema setup failed: {e}")
            return False

    def save_embedding(self, incident_id: str, embedding: np.ndarray) -> bool:
        """Luu embedding cho 1 incident"""
        try:
            with self.cursor() as cur:
                cur.execute("""
                    UPDATE incidents
                    SET embedding = %s
                    WHERE id = %s::uuid
                """, (embedding.tolist(), str(incident_id)))
            return True
        except Exception as e:
            print(f"[ERROR] Error saving embedding for incident {incident_id}: {e}")
            return False

    def save_embeddings_batch(self, data: List[Dict]) -> int:
        """Luu nhieu embeddings cung luc"""
        if not data:
            return 0

        try:
            with self.cursor() as cur:
                values = [(str(d['id']), d['embedding'].tolist()) for d in data]

                execute_values(cur, """
                    UPDATE incidents AS t SET
                        embedding = v.embedding::vector
                    FROM (VALUES %s) AS v(id, embedding)
                    WHERE t.id = v.id::uuid
                """, values, template="(%s, %s)")

            print(f"[OK] Saved {len(data)} embeddings")
            return len(data)

        except Exception as e:
            print(f"[ERROR] Error saving batch embeddings: {e}")
            return 0

    def find_similar(
        self,
        query_embedding: np.ndarray,
        limit: int = None,
        min_similarity: float = None
    ) -> List[Dict]:
        """
        Tim cac incidents tuong tu nhat voi query
        Tra ve ca location, incident_type, priority, title, resolution_notes de multi-field matching
        """
        limit = limit or Config.DEFAULT_LIMIT
        min_similarity = min_similarity or Config.MIN_SIMILARITY

        try:
            with self.cursor() as cur:
                cur.execute("""
                    SELECT
                        i.id,
                        i.title,
                        i.description,
                        i.location,
                        i.incident_type,
                        i.priority,
                        i.status,
                        i.resolution_notes,
                        i.assigned_department_id,
                        d.name as department_name,
                        1 - (embedding <=> %s::vector) as similarity
                    FROM incidents i
                    LEFT JOIN departments d ON i.assigned_department_id = d.id
                    WHERE embedding IS NOT NULL
                      AND i.assigned_department_id IS NOT NULL
                      AND 1 - (embedding <=> %s::vector) >= %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                """, (
                    query_embedding.tolist(),
                    query_embedding.tolist(),
                    min_similarity,
                    query_embedding.tolist(),
                    limit
                ))

                return cur.fetchall()

        except Exception as e:
            print(f"[ERROR] Error finding similar incidents: {e}")
            return []

    def get_department_suggestion(self, query_embedding: np.ndarray) -> Dict:
        """
        Goi y department dua tren embedding (voting + weighted confidence)
        """
        similar = self.find_similar(query_embedding, limit=5)

        if not similar:
            return {
                'department_id': None,
                'department_name': None,
                'confidence': 0.0,
                'similar_incidents': [],
                'auto_assign': False
            }

        dept_counts: Dict[str, int] = {}
        dept_similarities: Dict[str, List[float]] = {}
        dept_names: Dict[str, str] = {}

        for item in similar:
            dept_id = str(item['assigned_department_id']) if item['assigned_department_id'] else None
            if dept_id:
                dept_counts[dept_id] = dept_counts.get(dept_id, 0) + 1
                if dept_id not in dept_similarities:
                    dept_similarities[dept_id] = []
                dept_similarities[dept_id].append(float(item['similarity']))
                dept_names[dept_id] = item['department_name']

        if not dept_counts:
            return {
                'department_id': None,
                'department_name': None,
                'confidence': 0.0,
                'similar_incidents': [dict(s) for s in similar],
                'auto_assign': False
            }

        best_dept = max(dept_counts, key=dept_counts.get)
        sims = dept_similarities[best_dept]

        weights = [1.0, 0.7, 0.5, 0.3, 0.2][:len(sims)]
        sims_sorted = sorted(sims, reverse=True)

        weighted_sum = sum(s * w for s, w in zip(sims_sorted, weights))
        weight_total = sum(weights[:len(sims)])
        weighted_avg = weighted_sum / weight_total if weight_total > 0 else 0

        total_matches = len(similar)
        dept_matches = dept_counts[best_dept]
        consistency = dept_matches / total_matches if total_matches > 0 else 0

        consistency_bonus = consistency * 0.10
        top_similarity = max(sims) if sims else 0
        final_confidence = (0.6 * weighted_avg) + (0.4 * top_similarity) + consistency_bonus
        final_confidence = min(final_confidence, 1.0)

        return {
            'department_id': best_dept,
            'department_name': dept_names.get(best_dept),
            'confidence': float(final_confidence),
            'similar_incidents': [dict(s) for s in similar],
            'auto_assign': final_confidence >= Config.AUTO_ASSIGN_THRESHOLD,
            '_debug': {
                'weighted_avg': weighted_avg,
                'top_similarity': top_similarity,
                'consistency': consistency,
                'consistency_bonus': consistency_bonus
            }
        }

    def count_embeddings(self) -> Dict:
        """Dem so incidents da co embedding"""
        try:
            with self.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'incidents'
                        AND column_name = 'embedding'
                    )
                """)
                if not cur.fetchone()['exists']:
                    cur.execute("SELECT COUNT(*) as total FROM incidents")
                    total = cur.fetchone()['total']
                    return {'total': total, 'with_embedding': 0, 'without_embedding': total, 'percentage': 0.0}

                cur.execute("""
                    SELECT
                        COUNT(*) as total,
                        COUNT(embedding) as with_embedding
                    FROM incidents
                """)
                result = cur.fetchone()
                total = result['total']
                with_emb = result['with_embedding']

                return {
                    'total': total,
                    'with_embedding': with_emb,
                    'without_embedding': total - with_emb,
                    'percentage': (with_emb / total * 100) if total > 0 else 0.0
                }

        except Exception as e:
            print(f"[ERROR] Error counting embeddings: {e}")
            return {'total': 0, 'with_embedding': 0, 'without_embedding': 0, 'percentage': 0.0}

    def get_incidents_without_embedding(self, limit: int = 100) -> List[Dict]:
        """Lay danh sach incidents chua co embedding"""
        try:
            with self.cursor() as cur:
                cur.execute("""
                    SELECT id, description
                    FROM incidents
                    WHERE embedding IS NULL
                      AND description IS NOT NULL
                      AND LENGTH(TRIM(description)) > 5
                    LIMIT %s
                """, (limit,))
                return cur.fetchall()

        except Exception as e:
            print(f"[ERROR] Error getting incidents: {e}")
            return []

    def get_rag_settings(self) -> Dict:
        """Lay RAG settings tu database."""
        default_settings = {
            'enabled': Config.AUTO_ASSIGN_ENABLED,
            'threshold': Config.AUTO_ASSIGN_THRESHOLD,
            'min_samples': Config.AUTO_ASSIGN_MIN_SAMPLES
        }

        try:
            with self.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_name = 'system_settings'
                    )
                """)
                if not cur.fetchone()['exists']:
                    return default_settings

                cur.execute("""
                    SELECT value FROM system_settings
                    WHERE key = 'rag_auto_assign'
                """)
                result = cur.fetchone()

                if result and result['value']:
                    settings = result['value']
                    return {
                        'enabled': settings.get('enabled', default_settings['enabled']),
                        'threshold': settings.get('threshold', default_settings['threshold']),
                        'min_samples': settings.get('min_samples', default_settings['min_samples'])
                    }

                return default_settings

        except Exception as e:
            print(f"[WARN] Error getting RAG settings: {e}")
            return default_settings

    def save_rag_settings(self, settings: Dict) -> bool:
        """Luu RAG settings vao database."""
        try:
            with self.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS system_settings (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        key VARCHAR(100) UNIQUE NOT NULL,
                        value JSONB NOT NULL,
                        description TEXT,
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                """)

                cur.execute("""
                    INSERT INTO system_settings (key, value, description)
                    VALUES ('rag_auto_assign', %s, 'Cau hinh tu dong gan phong ban bang AI')
                    ON CONFLICT (key) DO UPDATE SET
                        value = EXCLUDED.value,
                        updated_at = NOW()
                """, (psycopg2.extras.Json(settings),))

            print(f"[OK] RAG settings saved: {settings}")
            return True

        except Exception as e:
            print(f"[ERROR] Error saving RAG settings: {e}")
            return False

    def should_auto_assign(self, confidence: float) -> Dict:
        """Kiem tra xem co nen auto-assign hay khong."""
        settings = self.get_rag_settings()
        stats = self.count_embeddings()

        enabled = settings['enabled']
        threshold = settings['threshold']
        min_samples = settings['min_samples']
        current_samples = stats['with_embedding']

        reasons = []

        if not enabled:
            reasons.append("Auto-assign is disabled")

        if current_samples < min_samples:
            reasons.append(f"Not enough samples ({current_samples}/{min_samples})")

        if confidence < threshold:
            reasons.append(f"Confidence too low ({confidence*100:.0f}% < {threshold*100:.0f}%)")

        should_auto = enabled and current_samples >= min_samples and confidence >= threshold

        return {
            'auto_assign': should_auto,
            'confidence': confidence,
            'threshold': threshold,
            'enabled': enabled,
            'current_samples': current_samples,
            'min_samples': min_samples,
            'reasons': reasons if not should_auto else ["All conditions met"]
        }


# Singleton instance
db = Database()

