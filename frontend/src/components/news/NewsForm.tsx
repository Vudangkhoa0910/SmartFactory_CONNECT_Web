import { useState, DragEvent, useEffect } from "react";
import { UploadCloud, FileText, X, Search, Users, Building2, UserPlus } from "lucide-react";
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
  attachments: File[];
  target_audience: 'all' | 'departments' | 'users';
  target_departments: string[];
  target_users: string[];
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
    target_audience: 'all',
    target_departments: [],
    target_users: [],
  });

  // Departments and Users data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Fetch departments and users
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

  // Filter users based on search
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

    // Validate target audience
    if (news.target_audience === 'departments' && news.target_departments.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một phòng ban');
      return;
    }
    if (news.target_audience === 'users' && news.target_users.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một người dùng');
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
      
      // Add target departments or users based on audience type
      if (news.target_audience === 'departments') {
        formData.append("target_departments", JSON.stringify(news.target_departments));
      } else if (news.target_audience === 'users') {
        formData.append("target_users", JSON.stringify(news.target_users));
      }
      
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
        attachments: [],
        target_audience: 'all',
        target_departments: [],
        target_users: []
      });
      setUserSearch("");
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

      {/* Target Audience Selection */}
      <div className="mb-5 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Users size={16} /> Đối tượng nhận tin
        </h3>
        
        {/* Audience Type Selection */}
        <div className="flex gap-3 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="target_audience"
              value="all"
              checked={news.target_audience === 'all'}
              onChange={(e) => setNews({ ...news, target_audience: 'all', target_departments: [], target_users: [] })}
              className="w-4 h-4 text-red-600 border-gray-300 dark:border-neutral-600 focus:ring-red-500"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Tất cả mọi người</span>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="target_audience"
              value="departments"
              checked={news.target_audience === 'departments'}
              onChange={(e) => setNews({ ...news, target_audience: 'departments', target_users: [] })}
              className="w-4 h-4 text-red-600 border-gray-300 dark:border-neutral-600 focus:ring-red-500"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Building2 size={14} /> Theo phòng ban
            </span>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="target_audience"
              value="users"
              checked={news.target_audience === 'users'}
              onChange={(e) => setNews({ ...news, target_audience: 'users', target_departments: [] })}
              className="w-4 h-4 text-red-600 border-gray-300 dark:border-neutral-600 focus:ring-red-500"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <UserPlus size={14} /> Chọn người dùng
            </span>
          </label>
        </div>

        {/* Department Selection */}
        {news.target_audience === 'departments' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Chọn phòng ban (có thể chọn nhiều):
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-white dark:bg-neutral-900 rounded border border-gray-200 dark:border-neutral-700">
              {departments.map((dept) => (
                <label key={dept.id} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={news.target_departments.includes(dept.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNews({ ...news, target_departments: [...news.target_departments, dept.id] });
                      } else {
                        setNews({ ...news, target_departments: news.target_departments.filter(id => id !== dept.id) });
                      }
                    }}
                    className="w-4 h-4 text-red-600 border-gray-300 dark:border-neutral-600 rounded focus:ring-red-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{dept.name}</span>
                </label>
              ))}
            </div>
            {news.target_departments.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Đã chọn: {news.target_departments.length} phòng ban
              </div>
            )}
          </div>
        )}

        {/* User Selection */}
        {news.target_audience === 'users' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tìm kiếm và chọn người dùng:
            </label>
            
            {/* Search Input */}
            <div className="relative">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email hoặc mã nhân viên..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 300)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  disabled={loading}
                />
              </div>
              
              {/* User Dropdown */}
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        if (!news.target_users.includes(user.id)) {
                          setNews({ ...news, target_users: [...news.target_users, user.id] });
                        }
                        setUserSearch("");
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-700 border-b border-gray-100 dark:border-neutral-700 last:border-0"
                      disabled={news.target_users.includes(user.id)}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email} • {user.department_name || 'N/A'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Users */}
            {news.target_users.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Đã chọn: {news.target_users.length} người dùng
                </div>
                <div className="flex flex-wrap gap-2">
                  {news.target_users.map((userId) => {
                    const user = users.find(u => u.id === userId);
                    if (!user) return null;
                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-200">{user.full_name}</span>
                        <button
                          type="button"
                          onClick={() => setNews({ ...news, target_users: news.target_users.filter(id => id !== userId) })}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          disabled={loading}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
