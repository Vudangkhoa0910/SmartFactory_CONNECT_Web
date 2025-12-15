"""
Statistics Service
Thống kê nhanh cho Chatbot AI
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from database import db, ContentType


class StatsService:
    """
    Service thống kê cho Chatbot.
    Cung cấp các API để chatbot trả lời các câu hỏi thống kê.
    """

    def get_overview(self) -> Dict:
        """
        Thống kê tổng quan hệ thống.
        Chatbot query: "Tình hình chung thế nào?", "Tổng quan hệ thống?"
        """
        return db.get_stats_overview()

    def get_incidents_stats(
        self,
        time_range: str = "all",
        incident_type: str = None,
        department_id: str = None
    ) -> Dict:
        """
        Thống kê sự cố chi tiết.
        Chatbot query: "Tuần này có bao nhiêu sự cố?", "Sự cố an toàn tháng này?"
        """
        try:
            with db.cursor() as cur:
                # Build WHERE clause
                conditions = []
                params = []

                if time_range != "all":
                    interval = self._parse_time_range(time_range)
                    if interval:
                        conditions.append("created_at >= NOW() - INTERVAL %s")
                        params.append(interval)

                if incident_type:
                    conditions.append("incident_type = %s")
                    params.append(incident_type)

                if department_id:
                    conditions.append("assigned_department_id = %s::uuid")
                    params.append(department_id)

                where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

                # Main stats (using correct enum values)
                cur.execute(f"""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
                        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
                        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
                        COUNT(CASE WHEN status IN ('escalated', 'on_hold') THEN 1 END) as on_hold,
                        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
                        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
                        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
                    FROM incidents
                    {where_clause}
                """, tuple(params))
                main_stats = dict(cur.fetchone())

                # By type
                cur.execute(f"""
                    SELECT incident_type, COUNT(*) as count
                    FROM incidents
                    {where_clause}
                    GROUP BY incident_type
                    ORDER BY count DESC
                """, tuple(params))
                by_type = [dict(r) for r in cur.fetchall()]

                # By location (top 5)
                cur.execute(f"""
                    SELECT location, COUNT(*) as count
                    FROM incidents
                    {where_clause}
                    {"AND" if conditions else "WHERE"} location IS NOT NULL
                    GROUP BY location
                    ORDER BY count DESC
                    LIMIT 5
                """, tuple(params))
                by_location = [dict(r) for r in cur.fetchall()]

                # Resolution rate
                total = main_stats['total']
                resolved = main_stats['resolved'] + main_stats.get('closed', 0)
                resolution_rate = (resolved / total * 100) if total > 0 else 0

                return {
                    "success": True,
                    "time_range": time_range,
                    "stats": main_stats,
                    "by_type": by_type,
                    "by_location": by_location,
                    "resolution_rate": round(resolution_rate, 1),
                    "summary": self._generate_incidents_summary(main_stats, time_range)
                }

        except Exception as e:
            print(f"[ERROR] Error getting incidents stats: {e}")
            return {"success": False, "error": str(e)}

    def get_ideas_stats(
        self,
        time_range: str = "all",
        category: str = None,
        ideabox_type: str = None
    ) -> Dict:
        """
        Thống kê góp ý chi tiết.
        Chatbot query: "Có bao nhiêu ý tưởng được duyệt?", "Góp ý tháng này?"
        """
        try:
            with db.cursor() as cur:
                # Build WHERE clause
                conditions = []
                params = []

                if time_range != "all":
                    interval = self._parse_time_range(time_range)
                    if interval:
                        conditions.append("created_at >= NOW() - INTERVAL %s")
                        params.append(interval)

                if category:
                    conditions.append("category = %s")
                    params.append(category)

                if ideabox_type:
                    conditions.append("ideabox_type = %s")
                    params.append(ideabox_type)

                where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

                # Main stats
                cur.execute(f"""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
                        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                        COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented,
                        COUNT(CASE WHEN ideabox_type = 'white' THEN 1 END) as white_box,
                        COUNT(CASE WHEN ideabox_type = 'pink' THEN 1 END) as pink_box
                    FROM ideas
                    {where_clause}
                """, tuple(params))
                main_stats = dict(cur.fetchone())

                # By category
                cur.execute(f"""
                    SELECT category, COUNT(*) as count
                    FROM ideas
                    {where_clause}
                    GROUP BY category
                    ORDER BY count DESC
                """, tuple(params))
                by_category = [dict(r) for r in cur.fetchall()]

                # Approval rate
                total = main_stats['total']
                approved = main_stats['approved'] + main_stats['implemented']
                approval_rate = (approved / total * 100) if total > 0 else 0

                return {
                    "success": True,
                    "time_range": time_range,
                    "stats": main_stats,
                    "by_category": by_category,
                    "approval_rate": round(approval_rate, 1),
                    "summary": self._generate_ideas_summary(main_stats, time_range)
                }

        except Exception as e:
            print(f"[ERROR] Error getting ideas stats: {e}")
            return {"success": False, "error": str(e)}

    def get_news_stats(self, time_range: str = "all") -> Dict:
        """
        Thống kê tin tức.
        Chatbot query: "Có bao nhiêu tin mới?", "Tin tức tuần này?"
        """
        try:
            with db.cursor() as cur:
                # Build WHERE clause
                conditions = []
                params = []

                if time_range != "all":
                    interval = self._parse_time_range(time_range)
                    if interval:
                        conditions.append("created_at >= NOW() - INTERVAL %s")
                        params.append(interval)

                where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

                # Main stats
                cur.execute(f"""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
                        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
                        COUNT(CASE WHEN is_priority = true THEN 1 END) as priority_news
                    FROM news
                    {where_clause}
                """, tuple(params))
                main_stats = dict(cur.fetchone())

                # By category
                cur.execute(f"""
                    SELECT category, COUNT(*) as count
                    FROM news
                    {where_clause}
                    GROUP BY category
                    ORDER BY count DESC
                """, tuple(params))
                by_category = [dict(r) for r in cur.fetchall()]

                # Most viewed (top 5)
                cur.execute("""
                    SELECT n.id, n.title, COUNT(nv.id) as view_count
                    FROM news n
                    LEFT JOIN news_views nv ON nv.news_id = n.id
                    WHERE n.status = 'published'
                    GROUP BY n.id, n.title
                    ORDER BY view_count DESC
                    LIMIT 5
                """)
                most_viewed = [dict(r) for r in cur.fetchall()]

                return {
                    "success": True,
                    "time_range": time_range,
                    "stats": main_stats,
                    "by_category": by_category,
                    "most_viewed": most_viewed
                }

        except Exception as e:
            print(f"[ERROR] Error getting news stats: {e}")
            return {"success": False, "error": str(e)}

    def get_department_stats(self) -> Dict:
        """
        Thống kê theo phòng ban.
        Chatbot query: "Phòng nào xử lý nhiều nhất?", "Hiệu suất các phòng ban?"
        """
        try:
            departments = db.get_stats_by_department()

            # Calculate rankings
            if departments:
                # Sort by incident count
                by_workload = sorted(departments, key=lambda x: x['incident_count'] or 0, reverse=True)

                # Sort by resolution rate
                for d in departments:
                    total = d['incident_count'] or 0
                    resolved = d['resolved_count'] or 0
                    d['resolution_rate'] = (resolved / total * 100) if total > 0 else 0

                by_performance = sorted(departments, key=lambda x: x['resolution_rate'], reverse=True)

                return {
                    "success": True,
                    "departments": departments,
                    "top_workload": by_workload[:3],
                    "top_performance": by_performance[:3],
                    "total_departments": len(departments)
                }

            return {
                "success": True,
                "departments": [],
                "message": "Không có dữ liệu phòng ban"
            }

        except Exception as e:
            print(f"[ERROR] Error getting department stats: {e}")
            return {"success": False, "error": str(e)}

    def get_trends(self, days: int = 30) -> Dict:
        """
        Phân tích xu hướng.
        Chatbot query: "Xu hướng tháng này?", "Vấn đề gì đang tăng?"
        """
        return db.get_stats_trends(days)

    def get_embedding_stats(self) -> Dict:
        """
        Thống kê RAG embeddings.
        Chatbot query: "Trạng thái RAG?", "Độ phủ dữ liệu?"
        """
        return db.count_embeddings()

    # ============================================
    # HELPER METHODS
    # ============================================
    def _parse_time_range(self, time_range: str) -> Optional[str]:
        """Chuyển time range thành PostgreSQL interval"""
        mapping = {
            "today": "1 day",
            "yesterday": "2 days",
            "this_week": "7 days",
            "week": "7 days",
            "last_week": "14 days",
            "this_month": "30 days",
            "month": "30 days",
            "last_month": "60 days",
            "quarter": "90 days",
            "year": "365 days",
        }
        return mapping.get(time_range.lower())

    def _generate_incidents_summary(self, stats: Dict, time_range: str) -> str:
        """Tạo summary text cho chatbot"""
        total = stats['total']
        if total == 0:
            return f"Khong co su co nao trong khoang thoi gian {time_range}"

        pending = stats.get('pending', 0)
        assigned = stats.get('assigned', 0)
        in_progress = stats.get('in_progress', 0)
        resolved = stats.get('resolved', 0)
        high_priority = stats.get('high_priority', 0)

        parts = [f"Tong cong {total} su co"]
        if pending > 0:
            parts.append(f"{pending} dang cho xu ly")
        if assigned > 0:
            parts.append(f"{assigned} da phan cong")
        if in_progress > 0:
            parts.append(f"{in_progress} dang xu ly")
        if resolved > 0:
            parts.append(f"{resolved} da giai quyet")
        if high_priority > 0:
            parts.append(f"{high_priority} uu tien cao")

        return ", ".join(parts) + "."

    def _generate_ideas_summary(self, stats: Dict, time_range: str) -> str:
        """Tạo summary text cho chatbot"""
        total = stats['total']
        if total == 0:
            return f"Khong co gop y nao trong khoang thoi gian {time_range}"

        pending = stats.get('pending', 0)
        approved = stats.get('approved', 0)
        implemented = stats.get('implemented', 0)

        parts = [f"Tong cong {total} gop y"]
        if pending > 0:
            parts.append(f"{pending} dang cho duyet")
        if approved > 0:
            parts.append(f"{approved} da duoc chap nhan")
        if implemented > 0:
            parts.append(f"{implemented} da trien khai")

        return ", ".join(parts) + "."


# Singleton instance
stats_service = StatsService()

