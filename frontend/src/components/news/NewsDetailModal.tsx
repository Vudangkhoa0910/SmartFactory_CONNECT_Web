// components/news/NewsDetailModal.tsx
import { X, FileText } from "lucide-react";

interface Props {
  item: any;
  onClose: () => void;
}

export default function NewsDetailModal({ item, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">{item.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {item.content}
          </p>

          {item.attachments?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Tệp đính kèm:</h4>
              <div className="flex flex-col gap-2">
                {item.attachments.map((file: any, index: number) => {
                  const filePath = file.path || file;
                  const fileName = file.original_name || file.filename || file;
                  const downloadUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${filePath}`;
                  
                  return (
                    <a
                      key={index}
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
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
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 text-right text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700">
          Ngày đăng: {item.publish_at}
        </div>
      </div>
    </div>
  );
}
