import PageMeta from "../../components/common/PageMeta";
import FeedbackMetrics from "../../components/feadback-chart/FeedbackMetrics";
import FeedbackTagChart from "../../components/feadback-chart/FeedbackTagChart";
import FeedbackRatingChart from "../../components/feadback-chart/FeedbackRatingChart";
import FeedbackDifficultyChart from "../../components/feadback-chart/FeedbackDifficultyChart";

export default function FeedbackDashboard() {
  return (
    <>
      <PageMeta
        title="Feedback Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="Trang tổng quan thống kê và phân tích các ý kiến đóng góp."
      />

      {/* Sử dụng flex-col và gap để tạo khoảng cách nhất quán giữa các hàng */}
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Hàng 1: Các chỉ số chính (Không thay đổi) */}
        <FeedbackMetrics />

        {/* Hàng 2: Hai biểu đồ tròn nằm cạnh nhau */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Cột trái: Phân loại theo Tag */}
          <div className="col-span-1">
            <FeedbackTagChart />
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
