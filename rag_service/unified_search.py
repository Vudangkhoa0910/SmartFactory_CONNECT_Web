"""
Unified Search Service
Tìm kiếm semantic xuyên suốt cho: incidents, ideas, news
Phục vụ cho Chatbot AI
"""
from typing import Dict, List, Optional
from collections import defaultdict
import datetime

from database import db, ContentType, TABLE_CONFIG
from embedding_service import embedding_service
from config import Config


class UnifiedSearchService:
    """
    Service tìm kiếm thống nhất trên nhiều loại content.
    Kết hợp semantic search với multi-field matching.
    """

    def search(
        self,
        query: str,
        content_types: List[str] = None,
        limit: int = 10,
        min_similarity: float = None,
        filters: Dict = None
    ) -> Dict:
        """
        Tìm kiếm xuyên suốt trên nhiều loại content.

        Args:
            query: Câu query tìm kiếm (tiếng Việt)
            content_types: List các loại content ["incident", "idea", "news"]
            limit: Số kết quả tối đa
            min_similarity: Ngưỡng similarity tối thiểu
            filters: Bộ lọc bổ sung {status, category, department_id, date_from, date_to}

        Returns:
            Dict với results, stats, total
        """
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        print(f"\n[{ts}] ========== UNIFIED SEARCH ==========")
        print(f"[{ts}] Query: {query[:80]}...")
        print(f"[{ts}] Types: {content_types or 'all'}")

        # Validate query
        if not query or len(query.strip()) < 3:
            return {
                "success": False,
                "message": "Query quá ngắn (tối thiểu 3 ký tự)",
                "results": [],
                "stats": {},
                "total": 0
            }

        # Parse content types
        types_to_search = self._parse_content_types(content_types)
        if not types_to_search:
            return {
                "success": False,
                "message": "Loại content không hợp lệ",
                "results": [],
                "stats": {},
                "total": 0
            }

        # Tạo embedding từ query
        query_embedding = embedding_service.encode(query, is_query=True)

        # Tìm kiếm trên từng loại content
        all_results = []
        stats = {}

        for ct in types_to_search:
            results = db.find_similar(
                content_type=ct,
                query_embedding=query_embedding,
                limit=limit,
                min_similarity=min_similarity or Config.MIN_SIMILARITY,
                filters=filters
            )

            # Enrich results với type info (không hiển thị similarity cho AI)
            for r in results:
                r['content_type'] = ct.value
                # Giữ similarity để sort, sẽ xóa trước khi trả về
                r['_similarity'] = float(r['similarity'])
                del r['similarity']

            all_results.extend(results)
            stats[ct.value] = len(results)

        # Sort by similarity (internal use only)
        all_results.sort(key=lambda x: x['_similarity'], reverse=True)
        final_results = all_results[:limit]

        # Xóa _similarity trước khi trả về (không cần hiển thị cho AI)
        clean_results = []
        for r in final_results:
            result = dict(r)
            if '_similarity' in result:
                del result['_similarity']
            clean_results.append(result)

        print(f"[{ts}] Found: {len(final_results)} results")
        for ct_val, count in stats.items():
            print(f"[{ts}]   - {ct_val}: {count}")
        print(f"[{ts}] =====================================\n")

        return {
            "success": True,
            "message": f"Tìm thấy {len(clean_results)} kết quả",
            "results": clean_results,
            "stats": stats,
            "total": len(all_results)
        }

    def search_incidents(
        self,
        query: str,
        limit: int = 10,
        filters: Dict = None
    ) -> Dict:
        """Tìm kiếm sự cố tương tự"""
        return self.search(
            query=query,
            content_types=["incident"],
            limit=limit,
            filters=filters
        )

    def search_ideas(
        self,
        query: str,
        limit: int = 10,
        filters: Dict = None
    ) -> Dict:
        """Tìm kiếm ý tưởng tương tự"""
        return self.search(
            query=query,
            content_types=["idea"],
            limit=limit,
            filters=filters
        )

    def search_news(
        self,
        query: str,
        limit: int = 10,
        filters: Dict = None
    ) -> Dict:
        """Tìm kiếm tin tức liên quan"""
        return self.search(
            query=query,
            content_types=["news"],
            limit=limit,
            filters=filters
        )

    def find_duplicates(
        self,
        content_type: str,
        title: str,
        description: str,
        threshold: float = 0.85
    ) -> Dict:
        """
        Tìm nội dung trùng lặp trước khi tạo mới.
        Dùng để cảnh báo user khi submit idea/incident tương tự đã có.
        """
        # Ghép title và description
        full_text = f"{title} {description}".strip()

        ct = self._parse_content_types([content_type])
        if not ct:
            return {"success": False, "duplicates": [], "message": "Invalid content type"}

        query_embedding = embedding_service.encode(full_text, is_query=True)
        results = db.find_similar(
            content_type=ct[0],
            query_embedding=query_embedding,
            limit=5,
            min_similarity=threshold
        )

        # Lọc và xóa similarity khỏi kết quả
        duplicates = []
        for r in results:
            if r['similarity'] >= threshold:
                dup = dict(r)
                del dup['similarity']  # Không hiển thị % cho AI
                duplicates.append(dup)

        return {
            "success": True,
            "has_duplicates": len(duplicates) > 0,
            "duplicates": duplicates,
            "message": f"Tìm thấy {len(duplicates)} nội dung tương tự" if duplicates else "Không có trùng lặp"
        }

    def get_related_content(
        self,
        content_type: str,
        record_id: str,
        include_types: List[str] = None,
        limit: int = 5
    ) -> Dict:
        """
        Tìm nội dung liên quan đến một record cụ thể.
        Dùng cho: "Xem thêm các sự cố tương tự", "Ý tưởng liên quan"
        """
        ct = self._parse_content_types([content_type])
        if not ct:
            return {"success": False, "related": [], "message": "Invalid content type"}

        # Lấy record gốc
        record = db.get_record_for_embedding(ct[0], record_id)
        if not record:
            return {"success": False, "related": [], "message": "Record không tồn tại"}

        # Tạo text để tìm kiếm
        text = db.get_text_for_embedding(ct[0], record)
        if not text:
            return {"success": False, "related": [], "message": "Record không có nội dung"}

        # Tìm kiếm
        search_types = include_types or [content_type]
        result = self.search(
            query=text,
            content_types=search_types,
            limit=limit + 1  # +1 để loại bỏ chính nó
        )

        # Loại bỏ record gốc khỏi kết quả
        related = [r for r in result["results"] if str(r["id"]) != record_id][:limit]

        return {
            "success": True,
            "source_id": record_id,
            "source_type": content_type,
            "related": related,
            "count": len(related)
        }

    def _parse_content_types(self, types: List[str] = None) -> List[ContentType]:
        """Parse string types thành ContentType enum"""
        if not types:
            return list(ContentType)

        result = []
        for t in types:
            t_lower = t.lower().strip()
            if t_lower in ["incident", "incidents"]:
                result.append(ContentType.INCIDENT)
            elif t_lower in ["idea", "ideas"]:
                result.append(ContentType.IDEA)
            elif t_lower in ["news"]:
                result.append(ContentType.NEWS)
        return result


# Singleton instance
unified_search = UnifiedSearchService()


