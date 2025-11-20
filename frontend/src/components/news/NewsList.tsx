// components/news/NewsList.tsx
import React, { useState, useEffect } from "react";
import NewsCard from "./NewsCard";
import NewsDetailModal from "./NewsDetailModal";
import api from "../../services/api";
import { toast } from "react-toastify";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  publish_at?: string;
  attachments?: any[];
  created_at?: string;
}

interface BackendNews {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  publish_at: string;
  attachments: string | any[];
  created_at: string;
}

export default function NewsList() {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [news, setNews] = useState<{ today: NewsItem[]; history: NewsItem[] }>({ today: [], history: [] });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/news');
      const allNews = res.data.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      const todayList: NewsItem[] = [];
      const historyList: NewsItem[] = [];

      allNews.forEach((item: BackendNews) => {
        const mappedItem: NewsItem = {
          id: item.id,
          title: item.title,
          content: item.content || '', // List might not have content, will fetch detail later
          excerpt: item.excerpt,
          publish_at: item.publish_at ? new Date(item.publish_at).toLocaleDateString('vi-VN') : '',
          created_at: item.created_at,
          attachments: typeof item.attachments === 'string' ? JSON.parse(item.attachments) : item.attachments
        };

        const itemDate = item.publish_at ? new Date(item.publish_at).toISOString().split('T')[0] : '';
        if (itemDate === today) {
          todayList.push(mappedItem);
        } else {
          historyList.push(mappedItem);
        }
      });

      setNews({ today: todayList, history: historyList });
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá tin tức này?")) return;
    
    try {
      await api.delete(`/news/${id}`);
      
      // Update local state
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
      toast.success("Đã xoá tin tức thành công");
    } catch (error) {
      console.error("Failed to delete news:", error);
      toast.error("Xoá tin tức thất bại");
    }
  };

  const handleEdit = (id: string) => {
    toast.info(`Chức năng SỬA tin (ID: ${id}) đang chờ kết nối API.`);
  };

  const handleViewDetails = async (item: NewsItem) => {
    try {
      // Fetch full details to get content and increment view count
      const res = await api.get(`/news/${item.id}`);
      const detail = res.data.data;
      
      setSelectedNews({
        ...item,
        content: detail.content || item.content || '',
        attachments: detail.attachments ? (typeof detail.attachments === 'string' ? JSON.parse(detail.attachments) : detail.attachments) : []
      });
    } catch (error) {
      console.error("Failed to fetch news details:", error);
      // Fallback to existing item if fetch fails
      setSelectedNews({
        ...item,
        content: item.content || item.excerpt || ''
      });
    }
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
        {loading ? (
          <p className="text-center text-gray-500 py-8">Đang tải tin tức...</p>
        ) : listToDisplay.length > 0 ? (
          listToDisplay.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onView={handleViewDetails}
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
