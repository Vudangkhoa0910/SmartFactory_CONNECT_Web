// components/news/NewsDetailModal.tsx
import { X, FileText, Calendar, Download, Clock } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface Props {
  item: any;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_URL.replace(/\/api$/, '') || 'http://localhost:3000';

export default function NewsDetailModal({ item, onClose }: Props) {
  const { t } = useTranslation();

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "company_announcement": return t("news.category_company_announcement");
      case "safety_alert": return t("news.category_safety_alert");
      case "event": return t("news.category_event");
      case "production_update": return t("news.category_production_update");
      case "maintenance": return t("news.category_maintenance");
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "company_announcement": return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "safety_alert": return "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case "event": return "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "production_update": return "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "maintenance": return "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
      default: return "bg-gray-50 text-gray-600 dark:bg-neutral-700 dark:text-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-in">
        {/* Header/Banner Area */}
        <div className="relative h-24 bg-gradient-to-r from-red-600 to-red-500 p-6 flex items-start justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="z-10 flex flex-wrap gap-2 items-center">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${getCategoryColor(item.category || 'company_announcement')}`}>
              {getCategoryLabel(item.category || 'company_announcement')}
            </span>
            {item.is_priority && (
              <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/20">
                {t('news.priority') || "Ưu tiên"}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="z-10 p-2 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-8 pb-8 -mt-6 relative z-10">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-neutral-800">
            <div className="flex flex-col gap-4 mb-8">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight font-outfit">
                {item.title}
              </h2>
              <div className="flex flex-wrap gap-4 items-center text-sm font-bold text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-neutral-700">
                  <Calendar size={16} className="text-red-500" />
                  {item.publish_at}
                </div>
                {item.created_at && (
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-neutral-700">
                    <Clock size={16} className="text-red-500" />
                    {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {item.content || item.excerpt || t('news.no_content')}
              </p>
            </div>

            {item.attachments?.length > 0 && (
              <div className="mt-10 pt-10 border-t border-gray-100 dark:border-neutral-800">
                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <FileText size={18} className="text-red-500" /> {t('news.attachments')}
                </h4>

                {/* Image Gallery Preview */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {item.attachments.map((file: any, index: number) => {
                    const filePath = typeof file === 'string' ? file : (file.path || file.url || "");
                    const fileName = typeof file === 'string' ? file.split('/').pop() : (file.original_name || file.filename || "");

                    if (!filePath) return null;

                    const mimeType = file.mime_type || file.mimeType || file.contentType || "";
                    const isImage = mimeType.startsWith('image/') ||
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath) ||
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

                    if (!isImage) return null;

                    const imageUrl = filePath.startsWith('http')
                      ? filePath
                      : `${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;

                    return (
                      <div key={`img-${index}`} className="relative group rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 shadow-md hover:shadow-xl transition-all h-32 w-48 bg-gray-100 dark:bg-neutral-800">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Download size={20} className="text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Document Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {item.attachments.map((file: any, index: number) => {
                    const filePath = typeof file === 'string' ? file : (file.path || file.url || "");
                    const fileName = typeof file === 'string' ? file.split('/').pop() : (file.original_name || file.filename || "Attachment");

                    if (!filePath || typeof filePath !== 'string') return null;

                    const mimeType = file.mime_type || file.mimeType || file.contentType || "";
                    const isImage = mimeType.startsWith('image/') ||
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath) ||
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

                    if (isImage) return null; // Already shown in gallery

                    const downloadUrl = filePath.startsWith('http')
                      ? filePath
                      : `${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;

                    return (
                      <a
                        key={index}
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 transition-all font-bold"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{fileName}</span>
                        </div>
                        <Download size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50/50 dark:bg-neutral-900/50 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all"
          >
            {t('common.close') || "Đóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
