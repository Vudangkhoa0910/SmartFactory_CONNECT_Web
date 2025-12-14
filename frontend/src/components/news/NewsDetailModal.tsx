// components/news/NewsDetailModal.tsx
import { X, FileText } from "lucide-react";

interface Props {
  item: any;
  onClose: () => void;
}

export default function NewsDetailModal({ item, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[999999]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 opacity-100">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <p className="text-gray-700 whitespace-pre-wrap">
            {item.content || item.excerpt || "Không có nội dung chi tiết."}
          </p>

          {item.attachments?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-gray-900">Tệp đính kèm:</h4>
              <div className="flex flex-col gap-2">
                {item.attachments.map((file: any, index: number) => {
                  const filePath = file.path || file;
                  const fileName = file.original_name || file.filename || file;
                  // Handle URL construction safely
                  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
                  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
                  const downloadUrl = `${baseUrl}/${cleanPath}`;
                  
                  return (
                    <a
                      key={index}
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:underline"
                    >
                      <FileText size={18} />
                      <span>{fileName}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 text-right text-xs text-gray-500 border-t border-gray-200 rounded-b-xl">
          Ngày đăng: {item.publish_at}
        </div>
      </div>
    </div>
  );
}
