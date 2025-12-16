"""
Database Service - Multi-table RAG Support
Hỗ trợ vector search cho: incidents, ideas, news
"""
import numpy as np
from typing import List, Dict, Optional, Literal
from contextlib import contextmanager
from enum import Enum

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, execute_values, Json
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False
    print("[WARN] psycopg2 not installed. Run: pip install psycopg2-binary")

try:
    from pgvector.psycopg2 import register_vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    print("[WARN] pgvector not installed. Run: pip install pgvector")

from config import Config


# ============================================
# CONSTANTS
# ============================================
class ContentType(str, Enum):
    """Loại nội dung hỗ trợ RAG"""
    INCIDENT = "incident"
    IDEA = "idea"
    NEWS = "news"


# Cấu hình cho từng loại content
TABLE_CONFIG = {
    ContentType.INCIDENT: {
        "table": "incidents",
        "text_fields": ["description"],  # Chỉ embedding tiếng Việt
        "join_dept": "LEFT JOIN departments d ON t.assigned_department_id = d.id",
        "dept_field": "assigned_department_id",
        "extra_fields": ["title", "description", "location", "incident_type", "priority", "status", "assigned_department_id"],
    },
    ContentType.IDEA: {
        "table": "ideas",
        "text_fields": ["title", "description", "expected_benefit"],  # Tiếng Việt
        "join_dept": "LEFT JOIN departments d ON t.department_id = d.id",
        "dept_field": "department_id",
        "extra_fields": ["title", "category", "ideabox_type", "status"],
    },
    ContentType.NEWS: {
        "table": "news",
        "text_fields": ["title", "content"],  # Tiếng Việt
        "join_dept": "",  # News không có department trực tiếp
        "dept_field": None,
        "extra_fields": ["title", "category", "excerpt", "status", "is_priority"],
    },
}


class Database:
    """Database connection và vector operations cho multi-table"""
    _instance: Optional['Database'] = None
    _conn = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._connect()
        return cls._instance

    def _connect(self):
        """Kết nối database và đăng ký vector type"""
        if not HAS_PSYCOPG2:
            raise ImportError("psycopg2 not installed")

        print(f"Connecting to PostgreSQL: {Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}")
        try:
            self._conn = psycopg2.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                database=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD
            )
            if HAS_PGVECTOR:
                register_vector(self._conn)
                print("[OK] Connected to PostgreSQL with pgvector support")
            else:
                print("[WARN] Connected but pgvector python package not installed")
        except psycopg2.OperationalError as e:
            print(f"[ERROR] Database connection failed: {e}")
            raise

    def reconnect(self):
        """Reconnect nếu connection bị mất"""
        if self._conn:
            try:
                self._conn.close()
            except:
                pass
        self._connect()

    @contextmanager
    def cursor(self):
        """Context manager cho cursor với auto-commit/rollback"""
        cur = self._conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cur
            self._conn.commit()
        except Exception as e:
            self._conn.rollback()
            raise e
        finally:
            cur.close()

    # ============================================
    # SCHEMA MANAGEMENT
    # ============================================
    def check_extension(self) -> bool:
        """Kiểm tra pgvector extension"""
        try:
            with self.cursor() as cur:
                cur.execute("SELECT * FROM pg_extension WHERE extname = 'vector'")
                result = cur.fetchone()
                if result:
                    print(f"[OK] pgvector extension version: {result['extversion']}")
                    return True
                print("[ERROR] pgvector extension not installed!")
                return False
        except Exception as e:
            print(f"[ERROR] Error checking extension: {e}")
            return False

    def setup_schema(self) -> bool:
        """Tạo/cập nhật schema cho tất cả tables"""
        dim = Config.VECTOR_DIM
        success = True

        for content_type, config in TABLE_CONFIG.items():
            table = config["table"]
            print(f"\nSetting up embedding for {table}...")

            try:
                with self.cursor() as cur:
                    # Check table exists
                    cur.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables WHERE table_name = %s
                        )
                    """, (table,))
                    if not cur.fetchone()['exists']:
                        print(f"[WARN] Table '{table}' does not exist, skipping")
                        continue

                    # Check/create embedding column
                    cur.execute("""
                        SELECT atttypmod FROM pg_attribute 
                        WHERE attrelid = %s::regclass AND attname = 'embedding'
                    """, (table,))
                    result = cur.fetchone()

                    if result is None:
                        print(f"[INFO] Creating embedding column (dim={dim})")
                        cur.execute(f"ALTER TABLE {table} ADD COLUMN embedding vector({dim})")
                    elif result['atttypmod'] != dim:
                        print(f"[WARN] Dimension mismatch, recreating column...")
                        cur.execute(f"DROP INDEX IF EXISTS idx_{table}_embedding_hnsw")
                        cur.execute(f"ALTER TABLE {table} DROP COLUMN embedding")
                        cur.execute(f"ALTER TABLE {table} ADD COLUMN embedding vector({dim})")
                    else:
                        print(f"[OK] Embedding column exists with dim={dim}")

                    # Create HNSW index
                    cur.execute(f"""
                        CREATE INDEX IF NOT EXISTS idx_{table}_embedding_hnsw
                        ON {table} USING hnsw (embedding vector_cosine_ops)
                        WITH (m = 16, ef_construction = 64)
                    """)

                print(f"[OK] {table} schema ready")

            except Exception as e:
                print(f"[ERROR] Failed to setup {table}: {e}")
                success = False

        return success

    # ============================================
    # EMBEDDING OPERATIONS (Generic)
    # ============================================
    def save_embedding(
        self,
        content_type: ContentType,
        record_id: str,
        embedding: np.ndarray
    ) -> bool:
        """Lưu embedding cho một record"""
        table = TABLE_CONFIG[content_type]["table"]
        try:
            with self.cursor() as cur:
                cur.execute(f"""
                    UPDATE {table} SET embedding = %s WHERE id = %s::uuid
                """, (embedding.tolist(), str(record_id)))
            return True
        except Exception as e:
            print(f"[ERROR] Error saving embedding for {table}/{record_id}: {e}")
            return False

    def save_embeddings_batch(
        self,
        content_type: ContentType,
        data: List[Dict]
    ) -> int:
        """Lưu nhiều embeddings cùng lúc"""
        if not data:
            return 0

        table = TABLE_CONFIG[content_type]["table"]
        try:
            with self.cursor() as cur:
                values = [(str(d['id']), d['embedding'].tolist()) for d in data]
                execute_values(cur, f"""
                    UPDATE {table} AS t SET embedding = v.embedding::vector
                    FROM (VALUES %s) AS v(id, embedding)
                    WHERE t.id = v.id::uuid
                """, values, template="(%s, %s)")
            print(f"[OK] Saved {len(data)} embeddings to {table}")
            return len(data)
        except Exception as e:
            print(f"[ERROR] Error saving batch embeddings to {table}: {e}")
            return 0

    # ============================================
    # VECTOR SEARCH
    # ============================================
    def find_similar(
        self,
        content_type: ContentType,
        query_embedding: np.ndarray,
        limit: int = None,
        min_similarity: float = None,
        filters: Dict = None
    ) -> List[Dict]:
        """
        Tìm records tương tự nhất với query embedding
        Hỗ trợ filter theo status, category, date range, etc.
        """
        limit = limit or Config.DEFAULT_LIMIT
        min_similarity = min_similarity or Config.MIN_SIMILARITY
        config = TABLE_CONFIG[content_type]
        table = config["table"]

        # Build extra fields
        extra_fields = ", ".join([f"t.{f}" for f in config["extra_fields"]])
        dept_join = config["join_dept"]
        dept_select = ", d.name as department_name" if dept_join else ""

        # Build WHERE clause
        where_conditions = [
            "t.embedding IS NOT NULL",
            f"1 - (t.embedding <=> %s::vector) >= {min_similarity}"
        ]
        params = [query_embedding.tolist()]

        if filters:
            if filters.get("status"):
                where_conditions.append("t.status = %s")
                params.append(filters["status"])
            if filters.get("category"):
                where_conditions.append("t.category = %s")
                params.append(filters["category"])
            if filters.get("department_id") and config["dept_field"]:
                where_conditions.append(f"t.{config['dept_field']} = %s::uuid")
                params.append(filters["department_id"])

        where_clause = " AND ".join(where_conditions)
        # params order: WHERE, SELECT similarity, ORDER BY, LIMIT
        params.extend([query_embedding.tolist(), query_embedding.tolist(), limit])

        try:
            with self.cursor() as cur:
                cur.execute(f"""
                    SELECT
                        t.id,
                        t.{config['text_fields'][0]} as main_text,
                        {extra_fields},
                        1 - (t.embedding <=> %s::vector) as similarity
                        {dept_select}
                    FROM {table} t
                    {dept_join}
                    WHERE {where_clause}
                    ORDER BY t.embedding <=> %s::vector
                    LIMIT %s
                """, tuple(params))
                return cur.fetchall()
        except Exception as e:
            print(f"[ERROR] Error finding similar in {table}: {e}")
            return []

    def unified_search(
        self,
        query_embedding: np.ndarray,
        content_types: List[ContentType] = None,
        limit: int = 10,
        min_similarity: float = None,
        filters: Dict = None
    ) -> Dict:
        """
        Tìm kiếm xuyên suốt trên nhiều loại content
        Trả về kết quả gộp, sắp xếp theo similarity
        """
        if content_types is None:
            content_types = list(ContentType)

        all_results = []
        stats = {}

        for ct in content_types:
            results = self.find_similar(
                content_type=ct,
                query_embedding=query_embedding,
                limit=limit,
                min_similarity=min_similarity,
                filters=filters
            )
            # Add type info
            for r in results:
                r['content_type'] = ct.value
            all_results.extend(results)
            stats[ct.value] = len(results)

        # Sort by similarity và limit
        all_results.sort(key=lambda x: x['similarity'], reverse=True)
        return {
            "results": all_results[:limit],
            "stats": stats,
            "total": len(all_results)
        }

    # ============================================
    # STATISTICS
    # ============================================
    def count_embeddings(self, content_type: ContentType = None) -> Dict:
        """Đếm số records đã có embedding"""
        if content_type:
            return self._count_single_table(content_type)

        # Count all tables
        result = {"total": 0, "with_embedding": 0, "by_type": {}}
        for ct in ContentType:
            counts = self._count_single_table(ct)
            result["by_type"][ct.value] = counts
            result["total"] += counts["total"]
            result["with_embedding"] += counts["with_embedding"]

        result["percentage"] = (
            result["with_embedding"] / result["total"] * 100
            if result["total"] > 0 else 0
        )
        return result

    def _count_single_table(self, content_type: ContentType) -> Dict:
        """Đếm embeddings cho một table"""
        table = TABLE_CONFIG[content_type]["table"]
        try:
            with self.cursor() as cur:
                # Check column exists
                cur.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = %s AND column_name = 'embedding'
                    )
                """, (table,))
                if not cur.fetchone()['exists']:
                    cur.execute(f"SELECT COUNT(*) as total FROM {table}")
                    total = cur.fetchone()['total']
                    return {'total': total, 'with_embedding': 0, 'without_embedding': total, 'percentage': 0.0}

                cur.execute(f"""
                    SELECT COUNT(*) as total, COUNT(embedding) as with_embedding FROM {table}
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
            print(f"[ERROR] Error counting {table}: {e}")
            return {'total': 0, 'with_embedding': 0, 'without_embedding': 0, 'percentage': 0.0}

    def get_records_without_embedding(
        self,
        content_type: ContentType,
        limit: int = 100
    ) -> List[Dict]:
        """Lấy danh sách records chưa có embedding"""
        config = TABLE_CONFIG[content_type]
        table = config["table"]
        text_field = config["text_fields"][0]

        try:
            with self.cursor() as cur:
                cur.execute(f"""
                    SELECT id, {', '.join(config['text_fields'])}
                    FROM {table}
                    WHERE embedding IS NULL
                      AND {text_field} IS NOT NULL
                      AND LENGTH(TRIM({text_field})) > 5
                    LIMIT %s
                """, (limit,))
                return cur.fetchall()
        except Exception as e:
            print(f"[ERROR] Error getting {table} without embedding: {e}")
            return []

    # ============================================
    # STATISTICS FOR CHATBOT
    # ============================================
    def get_stats_overview(self) -> Dict:
        """Thống kê tổng quan cho chatbot"""
        try:
            with self.cursor() as cur:
                # Incidents stats - dùng đúng enum values
                cur.execute("""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status IN ('pending', 'assigned') THEN 1 END) as pending,
                        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                        COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) as resolved,
                        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week
                    FROM incidents
                """)
                incidents = dict(cur.fetchone())

                # Ideas stats
                cur.execute("""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                        COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented,
                        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week
                    FROM ideas
                """)
                ideas = dict(cur.fetchone())

                # News stats
                cur.execute("""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
                        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week
                    FROM news
                """)
                news = dict(cur.fetchone())

                # Departments count
                cur.execute("SELECT COUNT(*) as total FROM departments")
                departments = dict(cur.fetchone())

                # Return format cho rag.service.js
                return {
                    "success": True,
                    "stats": {
                        "total_incidents": incidents['total'],
                        "pending_incidents": incidents['pending'],
                        "in_progress_incidents": incidents['in_progress'],
                        "resolved_incidents": incidents['resolved'],
                        "incidents_this_week": incidents['this_week'],
                        "total_ideas": ideas['total'],
                        "pending_ideas": ideas['pending'],
                        "approved_ideas": ideas['approved'],
                        "implemented_ideas": ideas['implemented'],
                        "ideas_this_week": ideas['this_week'],
                        "total_news": news['total'],
                        "published_news": news['published'],
                        "news_this_week": news['this_week'],
                        "total_departments": departments['total']
                    },
                    "details": {
                        "incidents": incidents,
                        "ideas": ideas,
                        "news": news
                    }
                }
        except Exception as e:
            print(f"[ERROR] Error getting overview stats: {e}")
            return {"success": False, "error": str(e)}

    def get_stats_by_department(self) -> List[Dict]:
        """Thống kê theo phòng ban"""
        try:
            with self.cursor() as cur:
                cur.execute("""
                    SELECT 
                        d.id,
                        d.name,
                        COUNT(DISTINCT i.id) as incident_count,
                        COUNT(DISTINCT CASE WHEN i.status = 'resolved' THEN i.id END) as resolved_count,
                        AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/3600) as avg_resolve_hours
                    FROM departments d
                    LEFT JOIN incidents i ON i.assigned_department_id = d.id
                    GROUP BY d.id, d.name
                    ORDER BY incident_count DESC
                """)
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            print(f"[ERROR] Error getting department stats: {e}")
            return []

    def get_stats_trends(self, days: int = 30) -> Dict:
        """Xu hướng theo thời gian"""
        try:
            with self.cursor() as cur:
                # Incidents by day
                cur.execute("""
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as count,
                        incident_type
                    FROM incidents
                    WHERE created_at >= NOW() - INTERVAL '%s days'
                    GROUP BY DATE(created_at), incident_type
                    ORDER BY date
                """, (days,))
                incidents_trend = [dict(r) for r in cur.fetchall()]

                # Top incident types
                cur.execute("""
                    SELECT incident_type, COUNT(*) as count
                    FROM incidents
                    WHERE created_at >= NOW() - INTERVAL '%s days'
                    GROUP BY incident_type
                    ORDER BY count DESC
                    LIMIT 5
                """, (days,))
                top_types = [dict(r) for r in cur.fetchall()]

                # Top locations
                cur.execute("""
                    SELECT location, COUNT(*) as count
                    FROM incidents
                    WHERE created_at >= NOW() - INTERVAL '%s days'
                      AND location IS NOT NULL
                    GROUP BY location
                    ORDER BY count DESC
                    LIMIT 5
                """, (days,))
                top_locations = [dict(r) for r in cur.fetchall()]

                return {
                    "period_days": days,
                    "incidents_trend": incidents_trend,
                    "top_incident_types": top_types,
                    "top_locations": top_locations
                }
        except Exception as e:
            print(f"[ERROR] Error getting trends: {e}")
            return {}

    # ============================================
    # RAG SETTINGS (backward compatible)
    # ============================================
    def get_rag_settings(self) -> Dict:
        """Lấy RAG settings từ .env (Config)"""
        return {
            'enabled': Config.AUTO_ASSIGN_ENABLED,
            'threshold': Config.AUTO_ASSIGN_THRESHOLD,
            'min_samples': Config.AUTO_ASSIGN_MIN_SAMPLES
        }

    def should_auto_assign(self, confidence: float) -> Dict:
        """Kiểm tra xem có nên auto-assign không"""
        settings = self.get_rag_settings()
        stats = self._count_single_table(ContentType.INCIDENT)

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

    # ============================================
    # RECORD RETRIEVAL (for creating embeddings)
    # ============================================
    def get_record_for_embedding(
        self,
        content_type: ContentType,
        record_id: str
    ) -> Optional[Dict]:
        """Lấy record để tạo embedding"""
        config = TABLE_CONFIG[content_type]
        table = config["table"]
        text_fields = ", ".join(config["text_fields"])

        try:
            with self.cursor() as cur:
                cur.execute(f"""
                    SELECT id, {text_fields}
                    FROM {table}
                    WHERE id = %s::uuid
                """, (record_id,))
                return cur.fetchone()
        except Exception as e:
            print(f"[ERROR] Error getting record {table}/{record_id}: {e}")
            return None

    def get_text_for_embedding(
        self,
        content_type: ContentType,
        record: Dict
    ) -> str:
        """Ghép các text fields thành một string để embedding"""
        config = TABLE_CONFIG[content_type]
        texts = []
        for field in config["text_fields"]:
            if record.get(field):
                texts.append(str(record[field]).strip())
        return " ".join(texts)


# Singleton instance
db = Database()
