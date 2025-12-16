import { useState, DragEvent, useEffect } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { useLocation } from "react-router";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useTranslation } from "../../contexts/LanguageContext";
import Input from '../form/input/InputField';
import TextArea from '../form/input/TextArea';

interface NewsItem {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  is_priority: boolean;
  attachments: File[];
}

export default function NewsForm() {
  const { t } = useTranslation();
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
    { value: "company_announcement", label: t('news.category_company_announcement') },
    { value: "safety_alert", label: t('news.category_safety_alert') },
    { value: "event", label: t('news.category_event') },
    { value: "production_update", label: t('news.category_production_update') },
    { value: "maintenance", label: t('news.category_maintenance') },
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
      toast.warning(t('news.validation_title_content'));
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

      toast.success(t('news.post_success'));
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
      toast.error(`${t('news.post_failed')}${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 transition-colors">
      <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-gray-100">{t('news.create_title')}</h2>

      {/* Category & Priority */}
      <div className="flex gap-4 mb-3">
        <div className="flex-1">
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300 dark:border-neutral-600 dark:bg-neutral-900"
              checked={news.is_priority}
              onChange={(e) => setNews({ ...news, is_priority: e.target.checked })}
              disabled={loading}
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('news.priority')}
            </span>
          </label>
        </div>
      </div>

      {/* Title */}
      <Input
        type="text"
        placeholder={t('news.title_placeholder')}
        className="mb-3 bg-white dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700"
        value={news.title}
        onChange={(e) => setNews({ ...news, title: e.target.value })}
        disabled={loading}
        enableSpeech={true}
      />

      {/* Excerpt */}
      <Input
        type="text"
        placeholder={t('news.excerpt_placeholder')}
        className="mb-3 bg-white dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700"
        value={news.excerpt}
        onChange={(e) => setNews({ ...news, excerpt: e.target.value })}
        disabled={loading}
        enableSpeech={true}
      />

      {/* Content */}
      <TextArea
        placeholder={t('news.content_placeholder')}
        className="h-32 mb-5 bg-white dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-700"
        value={news.content}
        onChange={(value) => setNews({ ...news, content: value })}
        disabled={loading}
        enableSpeech={true}
      />

      {/* File Upload */}
      <div
        className="border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-xl p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-colors cursor-pointer mb-5 bg-gray-50 dark:bg-neutral-900"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('news.drag_drop')}
        </p>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          accept={allowedTypes.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={loading}
        />
      </div>

      {/* File List */}
      {news.attachments.length > 0 && (
        <div className="space-y-2 mb-5">
          {news.attachments.map((file, i) => (
            <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-100 dark:border-neutral-700"
                >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-red-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                disabled={loading}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-neutral-700 transition-colors shadow-sm"
      >
        {loading ? t('news.posting') : t('news.post_button')}
      </button>
    </div>
  );
}
