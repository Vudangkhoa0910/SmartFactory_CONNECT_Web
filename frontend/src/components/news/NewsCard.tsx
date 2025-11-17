// components/news/NewsCard.tsx
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  item: any;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (item: any) => void;
}

export default function NewsCard({ item, onDelete, onEdit, onView }: Props) {
  return (
    <div className="border p-4 rounded-xl flex justify-between items-start dark:border-gray-700 transition-all hover:shadow-md dark:hover:bg-gray-700/50">
      <div className="cursor-pointer flex-grow" onClick={() => onView(item)}>
        <h3 className="font-semibold text-lg">{item.title}</h3>
        <p className="text-sm opacity-70 mt-1">{item.excerpt}</p>
        <div className="text-xs mt-2 opacity-60">
          Ngày đăng: {item.publish_at}
        </div>
      </div>

      <div className="flex gap-3 pl-4">
        <button
          onClick={() => onEdit(item.id)}
          className="text-blue-600 hover:text-blue-800"
          aria-label="Chỉnh sửa"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-600 hover:text-red-800"
          aria-label="Xoá"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
