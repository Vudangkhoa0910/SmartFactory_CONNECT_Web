// components/news/NewsCard.tsx
import { Pencil, Trash2, Calendar, ChevronRight, FileText, Star } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface Props {
  item: any;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (item: any) => void;
}

export default function NewsCard({ item, onDelete, onEdit, onView }: Props) {
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
    <div className="group relative bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700/50 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:-translate-y-1">
      {item.is_priority && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg z-10 animate-bounce">
          <Star size={14} fill="currentColor" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-grow space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getCategoryColor(item.category)}`}>
              {getCategoryLabel(item.category)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
              <Calendar size={12} />
              {item.publish_at}
            </span>
            {item.attachments && item.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded cursor-help" title={`${item.attachments.length} tệp đính kèm`}>
                <FileText size={10} />
                {item.attachments.length}
              </span>
            )}
          </div>

          <div className="cursor-pointer group/title" onClick={() => onView(item)}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover/title:text-red-500 transition-colors line-clamp-2 leading-tight">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
              {item.excerpt}
            </p>
          </div>

          <button
            onClick={() => onView(item)}
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-all group/btn"
          >
            {t('button.view_details') || "Xem chi tiết"}
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-neutral-700/50 pt-4 md:pt-0 md:pl-5">
          <button
            onClick={() => onEdit(item.id)}
            className="p-2.5 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            title={t('button.edit')}
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title={t('button.delete')}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
