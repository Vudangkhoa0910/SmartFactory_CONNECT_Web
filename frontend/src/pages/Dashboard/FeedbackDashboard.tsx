import { useState, useEffect } from "react";
import api from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import FeedbackMetrics from "../../components/feadback-chart/FeedbackMetrics";
import FeedbackTagChart from "../../components/feadback-chart/FeedbackTagChart";
import FeedbackRatingChart from "../../components/feadback-chart/FeedbackRatingChart";
import FeedbackDifficultyChart from "../../components/feadback-chart/FeedbackDifficultyChart";

export default function FeedbackDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/ideas/stats');
        setStats(res.data.data);
      } catch (error) {
        console.error("Failed to fetch feedback stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-rose-600">Đang tải thống kê...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Thống kê Ý kiến | SmartFactory CONNECT"
        description="Trang tổng quan thống kê và phân tích các ý kiến đóng góp."
      />

      {/* Sử dụng flex-col và gap để tạo khoảng cách nhất quán giữa các hàng */}
      <div className="p-4 flex flex-col gap-4">
        {/* Hàng 1: Các chỉ số chính */}
        <FeedbackMetrics data={stats?.overall} />

        {/* Hàng 2: Hai biểu đồ tròn nằm cạnh nhau */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Cột trái: Phân loại theo Tag */}
          <div className="col-span-1">
            <FeedbackTagChart data={stats?.by_category} />
          </div>

          {/* Cột phải: Đánh giá người ý kiến */}
          <div className="col-span-1">
            <FeedbackRatingChart />
          </div>
        </div>

        {/* Hàng 3: Biểu đồ Mức độ khó chiếm toàn bộ chiều rộng */}
        <div>
          <FeedbackDifficultyChart />
        </div>
      </div>
    </>
  );
}
