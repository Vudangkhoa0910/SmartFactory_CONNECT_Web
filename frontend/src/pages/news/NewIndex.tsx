import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import NewsForm from "../../components/news/NewsForm";
import NewsList from "../../components/news/NewsList";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export default function NewsPage() {
  const [isFormVisible, setIsFormVisible] = useState(true);
  const { t } = useTranslation();

  return (
    <>
      <PageMeta
        title={`${t('news.title')} | SmartFactory CONNECT`}
        description={t('news.description')}
      />

      <div className="p-4 grid grid-cols-12 gap-4">
        {/* Cột chính hiển thị danh sách tin tức */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <NewsList />
        </div>

        {/* Cột phụ cho form tạo tin tức */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="w-full flex justify-between items-center p-4 text-xl font-semibold text-gray-900 hover:bg-gray-50 rounded-t-xl transition-colors"
            >
              <span>{t('news.create')}</span>
              {isFormVisible ? <Minus size={22} className="text-red-600" /> : <Plus size={22} className="text-red-600" />}
            </button>

            {/* Hiệu ứng trượt xuống */}
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isFormVisible ? "max-h-screen" : "max-h-0"
              }`}
            >
              <div className="p-4 border-t border-gray-100">
                <NewsForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
