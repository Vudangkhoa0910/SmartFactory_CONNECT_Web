// components/news/NewsList.tsx
import React, { useState } from "react";
import NewsCard from "./NewsCard";
import NewsDetailModal from "./NewsDetailModal";

interface NewsItem {
  id: string;
  title: string;
  content: string; // Thêm content để xem chi tiết
  excerpt?: string;
  publish_at?: string;
  attachments?: string[];
}

// Dữ liệu mẫu
const todayNews: NewsItem[] = [
  {
    id: "1",
    title: "Thông báo bảo trì hệ thống định kỳ",
    content:
      "Chi tiết nội dung bảo trì hệ thống sẽ diễn ra từ 22:00 đến 23:00 ngày 20/11/2025. Mong các bạn lưu ý.",
    excerpt: "Hệ thống sẽ bảo trì lúc 22:00...",
    publish_at: "2025-11-20",
    attachments: ["BaoTri.pdf"],
  },
  {
    id: "2",
    title: "Cải tiến quy trình lắp ráp sản phẩm mới",
    content:
      "Để nâng cao hiệu suất, công đoạn XYZ trong quy trình lắp ráp sẽ được tối ưu hóa bằng công nghệ tự động hóa mới.",
    excerpt: "Công đoạn XYZ sẽ được tối ưu...",
    publish_at: "2025-11-19",
  },
];

const historyNews: NewsItem[] = [
  {
    id: "3",
    title: "Thông báo nghỉ lễ 20/11",
    content: "Toàn thể nhân viên được nghỉ lễ ngày 20/11/2025.",
    excerpt: "Toàn thể nhân viên được nghỉ...",
    publish_at: "2025-11-15",
  },
  {
    id: "4",
    title: "Tối ưu hệ thống Quản lý Chất lượng (QC)",
    content:
      "Hệ thống QC đã được nâng cấp để theo dõi lỗi sản phẩm theo thời gian thực.",
    excerpt: "Nâng cấp hệ thống QC...",
    publish_at: "2025-11-05",
  },
];

export default function NewsList() {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [news, setNews] = useState({ today: todayNews, history: historyNews });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const handleDelete = (id: string) => {
    // Logic xoá tin tức (cần cập nhật state cho đúng tab)
    if (activeTab === "today") {
      setNews((prev) => ({
        ...prev,
        today: prev.today.filter((item) => item.id !== id),
      }));
    } else {
      setNews((prev) => ({
        ...prev,
        history: prev.history.filter((item) => item.id !== id),
      }));
    }
    console.log(`Đã xoá tin tức với ID: ${id}`);
  };

  const handleEdit = (id: string) => {
    alert(`Chức năng SỬA tin (ID: ${id}) đang chờ kết nối API.`);
  };

  const handleViewDetails = (item: NewsItem) => {
    setSelectedNews(item);
  };

  const listToDisplay = activeTab === "today" ? news.today : news.history;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "today"
              ? "border-b-2 border-red-500 text-red-500"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Tin tức gần đây
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-red-500 text-red-500"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Lịch sử
        </button>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {listToDisplay.length > 0 ? (
          listToDisplay.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onView={null}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            Không có tin tức nào.
          </p>
        )}
      </div>

      {/* Modal xem chi tiết */}
      {selectedNews && (
        <NewsDetailModal
          item={selectedNews}
          onClose={() => setSelectedNews(null)}
        />
      )}
    </div>
  );
}
