import React, { useState, DragEvent } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

interface NewsItem {
  title: string;
  content: string;
  attachments: File[];
}

export default function NewsForm() {
  const [news, setNews] = useState<NewsItem>({
    title: "",
    content: "",
    attachments: [],
  });

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) =>
      allowedTypes.includes(f.type)
    );

    setNews((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...valid],
    }));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (i: number) => {
    setNews({
      ...news,
      attachments: news.attachments.filter((_, index) => index !== i),
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-5">Tạo Tin Tức</h2>

      {/* Title */}
      <input
        type="text"
        placeholder="Tiêu đề"
        className="w-full px-4 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 mb-3"
        value={news.title}
        onChange={(e) => setNews({ ...news, title: e.target.value })}
      />

      {/* Content */}
      <textarea
        placeholder="Nội dung"
        className="w-full px-4 py-2 rounded-md border dark:bg-gray-700 dark:border-gray-600 h-32 mb-5"
        value={news.content}
        onChange={(e) => setNews({ ...news, content: e.target.value })}
      />

      {/* Upload Section */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <UploadCloud className="w-10 h-10 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">
          Kéo thả file vào đây
        </p>
        <p className="text-xs opacity-70">Chỉ nhận PDF / DOC / DOCX</p>

        <input
          type="file"
          id="fileInput"
          accept=".pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview Files */}
      {news.attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {news.attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Button */}
      <button className="mt-5 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">
        Đăng Tin
      </button>
    </div>
  );
}
