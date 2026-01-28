import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import NewsForm from "../../components/news/NewsForm";
import NewsList from "../../components/news/NewsList";
import { Plus, Minus, Send, Newspaper } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export default function NewsPage() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleNewsEdit = (id: string) => {
    setEditingId(id);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
  };

  return (
    <>
      <PageMeta
        title={`${t('news.title')} | SmartFactory CONNECT`}
        description={t('news.description')}
      />

      <div className="py-2 sm:py-4 lg:py-6 px-1 sm:px-2 lg:px-4 font-sans">
        {/* Dynamic Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-600 font-bold uppercase tracking-widest text-xs mb-2">
              <Newspaper size={16} />
              <span>{t('news.news_updates')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight font-outfit">
              {t('news.title')}
            </h1>
          </div>
          <button
            onClick={isFormVisible ? handleCloseForm : () => setIsFormVisible(true)}
            className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 animate-fade-in-up delay-100 ${isFormVisible
              ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-gray-200/50 dark:shadow-black/20"
              : "bg-red-600 text-white shadow-red-500/30 hover:bg-red-700"
              }`}
          >
            {isFormVisible ? (
              <>
                <Minus size={22} />
                <span>{t('news.close_form')}</span>
              </>
            ) : (
              <>
                <Send size={22} />
                <span>{t('news.create')}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* Main Content Area */}
          <div className={`${isFormVisible ? "col-span-12 lg:col-span-7 xl:col-span-8" : "col-span-12"} transition-all duration-500`}>
            <NewsList onEdit={handleNewsEdit} />
          </div>

          {/* Sidebar Form Area */}
          {isFormVisible && (
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 animate-scale-in origin-right lg:sticky lg:top-24">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-neutral-800">
                <NewsForm
                  editId={editingId}
                  onSuccess={() => {
                    if (editingId) setEditingId(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
