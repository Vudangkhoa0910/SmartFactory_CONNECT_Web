import React, { useState, DragEvent, useEffect } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { useLocation } from "react-router";
import api from "../../services/api";
import { toast } from "react-toastify";

interface NewsItem {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  is_priority: boolean;
  attachments: File[];
}

export default function NewsForm() {
  const location = useLocation();
  const [news, setNews] = useState<NewsItem>({
    title: "",
    excerpt: "",
    content: "",
    category: "company_announcement",
    is_priority: false,
    attachments: [],
  });

  // Auto-fill from navigation state (e.g. from Chat Assistant)
  useEffect(() => {
    if (location.state) {
      setNews(prev => ({
        ...prev,
        title: location.state.title || prev.title,
        content: location.state.content || prev.content,
        category: location.state.category || prev.category
      }));
      // Optional: Clear state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [loading, setLoading] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg"
  ];

  const categories = [
    { value: "company_announcement", label: "Thông báo công ty" },
    { value: "safety_alert", label: "Cảnh báo an toàn" },
    { value: "event", label: "Sự kiện" },
    { value: "production_update", label: "Cập nhật sản xuất" },
    { value: "maintenance", label: "Bảo trì" },
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

  const handleSubmit = async () => {
    if (!news.title.trim() || !news.content.trim()) {
      toast.warning("Vui lòng nhập tiêu đề và nội dung!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", news.title);
      formData.append("excerpt", news.excerpt);
      formData.append("content", news.content);
      formData.append("category", news.category);
      formData.append("is_priority", String(news.is_priority));
      formData.append("target_audience", "all"); // Default audience
      formData.append("publish_at", new Date().toISOString()); // Publish immediately
      formData.append("status", "published"); // Explicitly set status

      news.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await api.post("/news", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Đăng tin thành công!");
      // Reset form
      setNews({ 
        title: "", 
        excerpt: "",
        content: "", 
        category: "company_announcement",
        is_priority: false,
        attachments: [] 
      });
      // Reload page or trigger list update (optional, for now user can refresh)
      window.location.reload(); 
    } catch (error: any) {
      console.error("Failed to create news:", error);
      toast.error(`Đăng tin thất bại: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-5 text-gray-900">Tạo Tin Tức</h2>

      {/* Category & Priority */}
      <div className="flex gap-4 mb-3">
        <div className="flex-1">
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={news.category}
            onChange={(e) => setNews({ ...news, category: e.target.value })}
            disabled={loading}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300"
              checked={news.is_priority}
              onChange={(e) => setNews({ ...news, is_priority: e.target.checked })}
              disabled={loading}
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Tin quan trọng
            </span>
          </label>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Tiêu đề"
        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        value={news.title}
        onChange={(e) => setNews({ ...news, title: e.target.value })}
        disabled={loading}
      />

      {/* Excerpt */}
      <input
        type="text"
        placeholder="Mô tả ngắn (hiển thị trên danh sách)"
        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        value={news.excerpt}
        onChange={(e) => setNews({ ...news, excerpt: e.target.value })}
        disabled={loading}
      />

      {/* Content */}
      <textarea
        placeholder="Nội dung"
        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white h-32 mb-5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        value={news.content}
        onChange={(e) => setNews({ ...news, content: e.target.value })}
        disabled={loading}
      />

      {/* Upload Section */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 hover:border-red-300 transition"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <UploadCloud className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 font-medium mb-1">
          Kéo thả file vào đây
        </p>
        <p className="text-xs text-gray-400">PDF / DOC / DOCX / JPG / PNG</p>

        <input
          type="file"
          id="fileInput"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={loading}
        />
      </div>

      {/* Preview Files */}
      {news.attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {news.attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="w-5 h-5" />
                <span className="text-sm">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Button */}
      <button 
        onClick={handleSubmit}
        disabled={loading}
        className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Đang xử lý..." : "Đăng Tin"}
      </button>
    </div>
  );
}
