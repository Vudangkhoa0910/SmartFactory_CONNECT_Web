// components/news/NewsCard.tsx
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface Props {
  item: any;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (item: any) => void;
}

export default function NewsCard({ item, onDelete, onEdit, onView }: Props) {
  const { t } = useTranslation();
  return (
    <div className="border border-gray-200 p-4 rounded-xl flex justify-between items-start bg-white transition-all hover:shadow-md">
      <div className="cursor-pointer flex-grow" onClick={() => onView(item)}>
        <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{item.excerpt}</p>
        <div className="text-xs mt-2 text-gray-500">
          {t('news.publish_date')}{item.publish_at}
        </div>
      </div>

      <div className="flex gap-3 pl-4">
        <button
          onClick={() => onEdit(item.id)}
          className="text-gray-500 hover:text-red-600 transition-colors"
          aria-label={t('button.edit')}
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="text-gray-500 hover:text-red-600 transition-colors"
          aria-label={t('button.delete')}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
