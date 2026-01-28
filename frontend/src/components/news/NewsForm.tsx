// components/news/NewsForm.tsx
import { useState, DragEvent, useEffect } from "react";
import { UploadCloud, FileText, X, Search, Users, Building2, UserPlus, Send, Tag, Info, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { useLocation } from "react-router";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useTranslation } from "../../contexts/LanguageContext";
import Input from '../form/input/InputField';
import TextArea from '../form/input/TextArea';
import { Department, User } from "../../services/user.service";

interface NewsItem {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  is_priority: boolean;
  attachments: (File | string)[];
  target_audience: 'all' | 'departments' | 'users';
  target_departments: string[];
  target_users: string[];
}

interface NewsFormProps {
  editId?: string | null;
  onSuccess?: () => void;
}

export default function NewsForm({ editId, onSuccess }: NewsFormProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [news, setNews] = useState<NewsItem>({
    title: "",
    excerpt: "",
    content: "",
    category: "company_announcement",
    is_priority: false,
    attachments: [],
    target_audience: 'all',
    target_departments: [],
    target_users: [],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Load departments and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, userRes] = await Promise.all([
          api.get('/departments'),
          api.get('/users')
        ]);
        setDepartments(deptRes.data.data || []);
        setUsers(userRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch departments/users:', error);
      }
    };
    fetchData();
  }, []);

  // Handle Edit Mode - Fetch individual news record
  useEffect(() => {
    if (editId) {
      const fetchNewsDetail = async () => {
        try {
          setFetchingData(true);
          const res = await api.get(`/news/${editId}`);
          const data = res.data.data;

          setNews({
            title: data.title || "",
            excerpt: data.excerpt || "",
            content: data.content || "",
            category: data.category || "company_announcement",
            is_priority: !!data.is_priority,
            attachments: data.attachments ? (typeof data.attachments === 'string' ? JSON.parse(data.attachments) : data.attachments) : [],
            target_audience: data.target_audience || 'all',
            target_departments: data.target_departments || [],
            target_users: data.target_users || [],
          });
        } catch (error) {
          console.error('Failed to fetch news detail:', error);
          toast.error("Không thể tải thông tin tin tức");
        } finally {
          setFetchingData(false);
        }
      };
      fetchNewsDetail();
    } else {
      // Reset form if editId becomes null
      setNews({
        title: "",
        excerpt: "",
        content: "",
        category: "company_announcement",
        is_priority: false,
        attachments: [],
        target_audience: 'all',
        target_departments: [],
        target_users: [],
      });
    }
  }, [editId]);

  useEffect(() => {
    if (userSearch.trim()) {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.employee_code.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [userSearch, users]);

  useEffect(() => {
    if (location.state && !editId) {
      setNews(prev => ({
        ...prev,
        title: location.state.title || prev.title,
        content: location.state.content || prev.content,
        category: location.state.category || prev.category
      }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state, editId]);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg"
  ];

  const categories = [
    { value: "company_announcement", label: t('news.category_company_announcement'), icon: Info, color: 'text-blue-500' },
    { value: "safety_alert", label: t('news.category_safety_alert'), icon: AlertTriangle, color: 'text-red-500' },
    { value: "event", label: t('news.category_event'), icon: Tag, color: 'text-purple-500' },
    { value: "production_update", label: t('news.category_production_update'), icon: CheckCircle, color: 'text-green-500' },
    { value: "maintenance", label: t('news.category_maintenance'), icon: Tag, color: 'text-orange-500' },
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

    if (news.target_audience === 'departments' && news.target_departments.length === 0) {
      toast.warning(t('news.target_departments_required') || 'Vui lòng chọn ít nhất một phòng ban');
      return;
    }
    if (news.target_audience === 'users' && news.target_users.length === 0) {
      toast.warning(t('news.target_users_required') || 'Vui lòng chọn ít nhất một người dùng');
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
      formData.append("target_audience", news.target_audience);

      if (news.target_audience === 'departments') {
        formData.append("target_departments", JSON.stringify(news.target_departments));
      } else if (news.target_audience === 'users') {
        formData.append("target_users", JSON.stringify(news.target_users));
      }

      // If editing, we keep the original publish date unless explicitly changed
      // For creation, we set it to now
      if (!editId) {
        formData.append("publish_at", new Date().toISOString());
        formData.append("status", "published");
      }

      // Separate existing attachments from new files
      const existingAttachments = news.attachments.filter(a => typeof a === 'string');
      const newFiles = news.attachments.filter(a => a instanceof File) as File[];

      formData.append("existing_attachments", JSON.stringify(existingAttachments));
      newFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (editId) {
        await api.put(`/news/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(t('news.update_success') || "Cập nhật tin tức thành công!");
      } else {
        await api.post("/news", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(t('news.post_success'));
      }

      if (onSuccess) onSuccess();

      // Reset form if not editing (or even if editing, depending on UX)
      if (!editId) {
        setNews({
          title: "",
          excerpt: "",
          content: "",
          category: "company_announcement",
          is_priority: false,
          attachments: [],
          target_audience: 'all',
          target_departments: [],
          target_users: []
        });
        setUserSearch("");
      }

    } catch (error: any) {
      console.error("Failed to save news:", error);
      toast.error(`${editId ? 'Cập nhật' : 'Đăng'} tin tức thất bại: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 overflow-hidden transition-all duration-300 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 ${editId ? 'bg-blue-500' : 'bg-red-500'} rounded-xl flex items-center justify-center shadow-lg ${editId ? 'shadow-blue-500/20' : 'shadow-red-500/20'}`}>
          {editId ? <Save size={20} className="text-white" /> : <Send size={20} className="text-white" />}
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
            {editId ? t('news.edit_title') : t('news.create_title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
            {editId ? t('news.edit_subtitle') : t('news.create_subtitle')}
          </p>
        </div>
      </div>

      <div className="space-y-5 animate-fade-in">
        {/* Category Selection */}
        <div className="grid grid-cols-1 gap-3">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase tracking-tight">
            <Tag size={14} className="text-red-500" /> {t('news.classification_priority')}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border-none bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-4 focus:ring-red-500/10 transition-all appearance-none cursor-pointer"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Tag size={16} />
                </div>
              </div>
            </div>
            <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-neutral-800 rounded-xl transition-all cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 group">
              <label className="flex items-center cursor-pointer w-full">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-none bg-gray-200 dark:bg-neutral-700 transition-all"
                  checked={news.is_priority}
                  onChange={(e) => setNews({ ...news, is_priority: e.target.checked })}
                  disabled={loading}
                />
                <span className="ml-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-red-600 transition-colors">
                  {t('news.priority')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <Input
            type="text"
            label={t('news.title')}
            placeholder={t('news.title_placeholder')}
            className="bg-gray-50 dark:bg-neutral-800 border-none rounded-xl font-bold focus:ring-4 focus:ring-red-500/10 py-2.5"
            value={news.title}
            onChange={(e) => setNews({ ...news, title: e.target.value })}
            disabled={loading}
            enableSpeech={true}
          />

          <Input
            type="text"
            label={t('news.excerpt')}
            placeholder={t('news.excerpt_placeholder')}
            className="bg-gray-50 dark:bg-neutral-800 border-none rounded-xl font-bold focus:ring-4 focus:ring-red-500/10 py-2.5"
            value={news.excerpt}
            onChange={(e) => setNews({ ...news, excerpt: e.target.value })}
            disabled={loading}
            enableSpeech={true}
          />

          <TextArea
            label={t('news.content')}
            placeholder={t('news.content_placeholder')}
            className="h-32 bg-gray-50 dark:bg-neutral-800 border-none rounded-2xl font-medium focus:ring-4 focus:ring-red-500/10 py-2.5"
            value={news.content}
            onChange={(value) => setNews({ ...news, content: value })}
            disabled={loading}
            enableSpeech={true}
          />
        </div>

        {/* Audience Selection */}
        <div className="p-5 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 transition-all">
          <h3 className="text-xs font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Users size={14} className="text-red-500" /> {t('news.target_audience')}
          </h3>

          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { id: 'all', label: t('news.target_all'), icon: Users },
              { id: 'departments', label: t('news.target_departments'), icon: Building2 },
              { id: 'users', label: t('news.target_users'), icon: UserPlus }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setNews({ ...news, target_audience: type.id as any, target_departments: [], target_users: [] })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${news.target_audience === type.id
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  }`}
              >
                <type.icon size={12} />
                {type.label}
              </button>
            ))}
          </div>

          {news.target_audience === 'departments' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2 pt-1">
                {departments.map((dept) => (
                  <label key={dept.id} className={`flex items-center p-2.5 rounded-xl cursor-pointer transition-all border ${news.target_departments.includes(dept.id)
                    ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                    : "bg-white dark:bg-neutral-900 border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
                    }`}>
                    <input
                      type="checkbox"
                      checked={news.target_departments.includes(dept.id)}
                      onChange={(e) => {
                        if (e.target.checked) setNews({ ...news, target_departments: [...news.target_departments, dept.id] });
                        else setNews({ ...news, target_departments: news.target_departments.filter(id => id !== dept.id) });
                      }}
                      className="w-4 h-4 text-red-600 border-none bg-gray-200 dark:bg-neutral-700 rounded focus:ring-red-500"
                    />
                    <span className="ml-2.5 text-xs font-bold text-gray-700 dark:text-gray-200">{dept.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {news.target_audience === 'users' && (
            <div className="space-y-3 animate-fade-in-up">
              <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  placeholder={t('news.user_search_placeholder')}
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 300)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border-none text-gray-900 dark:text-white font-bold text-xs focus:ring-4 focus:ring-red-500/10 transition-all"
                />

                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto custom-scrollbar p-2">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!news.target_users.includes(user.id)) setNews({ ...news, target_users: [...news.target_users, user.id] });
                          setUserSearch("");
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors mb-1 last:mb-0 disabled:opacity-50"
                        disabled={news.target_users.includes(user.id)}
                      >
                        <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{user.full_name}</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">{user.email} • {user.department_name || 'N/A'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {news.target_users.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {news.target_users.map((userId) => {
                    const user = users.find(u => u.id === userId);
                    if (!user) return null;
                    return (
                      <div key={userId} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-red-100 dark:border-red-950 rounded-xl text-[10px] font-bold animate-scale-in">
                        <span className="text-gray-700 dark:text-gray-200">{user.full_name}</span>
                        <button onClick={() => setNews({ ...news, target_users: news.target_users.filter(id => id !== userId) })} className="text-red-500 hover:text-red-700">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Upload */}
        <div
          className="group relative border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl p-6 text-center hover:border-red-500 dark:hover:border-red-500 transition-all cursor-pointer bg-gray-50/50 dark:bg-neutral-900/30"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm mx-auto mb-3 group-hover:scale-110 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-all">
            <UploadCloud className="text-gray-400 group-hover:text-red-500 transition-colors" size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{t('news.upload_attachments')}</h4>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{t('news.upload_hint')}</p>
          <input id="file-upload" type="file" multiple className="hidden" accept={allowedTypes.join(",")} onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {/* File List */}
        {news.attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
            {news.attachments.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 shadow-sm animate-scale-in">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-red-500" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate truncate-all">
                    {typeof file === 'string' ? file.split('/').pop() : file.name}
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full relative group h-12 bg-red-600 text-white rounded-xl font-black text-base overflow-hidden transition-all hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/30 disabled:bg-gray-200 dark:disabled:bg-neutral-800 disabled:text-gray-400 mt-2"
        >
          <div className="relative z-10 flex items-center justify-center gap-2 font-outfit uppercase tracking-widest text-sm">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {editId ? <Save size={16} /> : <Send size={16} />}
                {editId ? t('news.update_button') : t('news.post_button')}
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"></div>
        </button>
      </div>
    </div>
  );
}
