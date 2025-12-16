// components/news/NewsList.tsx
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import NewsCard from "./NewsCard";
import NewsDetailModal from "./NewsDetailModal";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSocketRefresh } from "../../hooks/useSocket";
import { Mic, Search, X } from "lucide-react";

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [news, setNews] = useState<{ today: NewsItem[]; history: NewsItem[] }>({ today: [], history: [] });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      const cleanText = text.trim().replace(/\.$/, '');
      setSearchTerm((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
    },
  });

  // Fetch news - extracted to useCallback for WebSocket refresh
  const fetchNews = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchNews(true);
  }, [fetchNews]);

  // WebSocket: Auto-refresh without loading indicator when news changes
  const silentRefresh = useCallback(() => {
    fetchNews(false);
  }, [fetchNews]);

  useSocketRefresh(
    ['news_created', 'news_updated', 'news_deleted'],
    silentRefresh,
    ['news']
  );

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

  const listToDisplay = (activeTab === "today" ? news.today : news.history).filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.excerpt && item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800">
      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={t('search.placeholder') || "Tìm kiếm tin tức..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 ${isSupported ? 'pr-20' : 'pr-10'} py-2.5 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isSupported && (
            <button
              onClick={startListening}
              className={`text-gray-400 hover:text-red-500 transition-colors ${isListening ? "text-red-500 animate-pulse" : ""
                }`}
              title="Click to speak"
            >
              <Mic size={16} />
            </button>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 mb-4">
        <button
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === "today"
              ? "border-b-2 border-red-600 text-red-600 dark:text-red-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
        >
          {t('news.recent_news')}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === "history"
              ? "border-b-2 border-red-600 text-red-600 dark:text-red-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
        >
          {t('news.history')}
        </button>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
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
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('news.no_news')}
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
