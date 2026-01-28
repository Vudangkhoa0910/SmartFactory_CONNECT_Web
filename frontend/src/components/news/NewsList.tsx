// components/news/NewsList.tsx
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import NewsCard from "./NewsCard";
import NewsDetailModal from "./NewsDetailModal";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSocketRefresh } from "../../hooks/useSocket";
import { Mic, Search, X, AlertCircle, History, LayoutGrid } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  publish_at?: string;
  attachments?: any[];
  created_at?: string;
  category: string;
  is_priority: boolean;
}

interface BackendNews {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  publish_at: string;
  attachments: string | any[];
  created_at: string;
  category: string;
  is_priority: boolean;
}

interface NewsListProps {
  onEdit?: (id: string) => void;
}

export default function NewsList({ onEdit }: NewsListProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [news, setNews] = useState<{ today: NewsItem[]; history: NewsItem[] }>({ today: [], history: [] });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      const cleanText = text.trim().replace(/\.$/, '');
      setSearchTerm((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
    },
  });

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
          content: item.content || '',
          excerpt: item.excerpt,
          publish_at: item.publish_at ? new Date(item.publish_at).toLocaleDateString('vi-VN') : '',
          created_at: item.created_at,
          attachments: typeof item.attachments === 'string' ? JSON.parse(item.attachments) : item.attachments,
          category: item.category,
          is_priority: item.is_priority
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

  useEffect(() => {
    fetchNews(true);
  }, [fetchNews]);

  const silentRefresh = useCallback(() => {
    fetchNews(false);
  }, [fetchNews]);

  useSocketRefresh(
    ['news_created', 'news_updated', 'news_deleted'],
    silentRefresh,
    ['news']
  );

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await api.delete(`/news/${deleteConfirmId}`);

      setNews((prev) => ({
        today: prev.today.filter((item) => item.id !== deleteConfirmId),
        history: prev.history.filter((item) => item.id !== deleteConfirmId),
      }));

      toast.success(t('news.delete_success') || "Đã xoá tin tức thành công");
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete news:", error);
      toast.error(t('news.delete_failed') || "Xoá tin tức thất bại");
    }
  };

  const handleEdit = (id: string) => {
    if (onEdit) onEdit(id);
  };

  const handleViewDetails = async (item: NewsItem) => {
    try {
      const res = await api.get(`/news/${item.id}`);
      const detail = res.data.data;

      setSelectedNews({
        ...item,
        content: detail.content || item.content || '',
        attachments: detail.attachments ? (typeof detail.attachments === 'string' ? JSON.parse(detail.attachments) : detail.attachments) : []
      });
    } catch (error) {
      console.error("Failed to fetch news details:", error);
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
    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-300">
      {/* Header section with Stats */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 font-outfit">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black mb-2">{t('news.title')}</h1>
            <p className="text-red-100 text-sm font-medium opacity-90">{t('news.description')}</p>
          </div>
          <div className="flex items-center gap-4 animate-fade-in-up delay-100">
            <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
              <span className="block text-2xl font-black leading-none">{news.today.length}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">{t('news.today')}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <span className="block text-2xl font-black leading-none">{news.history.length}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">{t('news.history')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search & Tabs Row */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
          {/* Custom Modern Tabs */}
          <div className="flex p-1 bg-gray-100 dark:bg-neutral-800 rounded-2xl w-full xl:w-auto self-start">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === "today"
                ? "bg-white dark:bg-neutral-700 text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
              <LayoutGrid size={16} />
              {t('news.recent_news')}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === "history"
                ? "bg-white dark:bg-neutral-700 text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
              <History size={16} />
              {t('news.history')}
            </button>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative w-full xl:w-96 group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors"
            />
            <input
              type="text"
              placeholder={t('search.placeholder') || "Tìm kiếm tin tức..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-neutral-800 border-none rounded-2xl text-sm focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSupported && (
                <button
                  onClick={startListening}
                  className={`p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${isListening ? "text-red-500 animate-pulse bg-red-50 dark:bg-red-900/20" : ""}`}
                >
                  <Mic size={16} />
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* News Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-red-100 dark:border-neutral-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">{t('common.loading') || "Đang tải tin tức..."}</p>
            </div>
          ) : listToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 animate-fade-in">
              {listToDisplay.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onEdit={handleEdit}
                  onView={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
              <div className="w-24 h-24 bg-gray-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <Search size={40} className="text-gray-300 dark:text-neutral-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('news.no_news')}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
                {searchTerm
                  ? t('news.search_no_results', { term: searchTerm })
                  : (t('news.no_recent_updates') || "Hiện tại chưa có tin tức nào mới được cập nhật.")}
              </p>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="mt-6 text-red-500 font-black hover:underline tracking-tight uppercase text-xs">
                  {t('news.clear_search')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modern Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('news.delete_confirm_title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">
              {t('news.delete_confirm_message')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 px-6 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
              >
                {t('button.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 px-6 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all"
              >
                {t('button.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNews && (
        <NewsDetailModal
          item={selectedNews}
          onClose={() => setSelectedNews(null)}
        />
      )}
    </div>
  );
}
