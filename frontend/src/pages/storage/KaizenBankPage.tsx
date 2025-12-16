import { useState, useMemo, useEffect } from "react";
import { 
  Search, Tag, BookOpen, Award, Lightbulb, Loader2, 
  X, TrendingUp, Calendar, DollarSign, Users, 
  MessageSquare, ThumbsUp, Star, CheckCircle2,
  Target, Zap, Clock, FileText, Grid3X3, List
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { getKaizenBank, Idea } from "../../services/idea.service";
import { useTranslation } from "../../contexts/LanguageContext";

// Category icon mapping
const categoryIcons: Record<string, any> = {
  quality_improvement: Star,
  process_improvement: Zap,
  cost_reduction: DollarSign,
  safety_enhancement: CheckCircle2,
  productivity: TrendingUp,
  environment: Lightbulb,
  workplace: Users,
  innovation: Target,
};

// Category color mapping
const categoryColors: Record<string, string> = {
  quality_improvement: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  process_improvement: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cost_reduction: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  safety_enhancement: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  productivity: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  environment: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  workplace: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  innovation: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

// Category translation
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    quality_improvement: "Cải tiến chất lượng",
    process_improvement: "Cải tiến quy trình",
    cost_reduction: "Giảm chi phí",
    safety_enhancement: "An toàn",
    productivity: "Năng suất",
    environment: "Môi trường",
    workplace: "Môi trường làm việc",
    innovation: "Đổi mới sáng tạo",
    other: "Khác",
  };
  return labels[category] || category;
};

export default function KaizenBankPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [kaizenItems, setKaizenItems] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedTags, setFetchedTags] = useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'impact' | 'savings'>('date');
  const [error, setError] = useState<string | null>(null);

  const defaultTags = useMemo(() => [
    "quality_improvement",
    "process_improvement", 
    "cost_reduction",
    "safety_enhancement",
    "productivity",
    "environment",
    "workplace",
    "innovation"
  ], []);

  const allTags = fetchedTags.length > 0 ? fetchedTags : defaultTags;

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("⏱️ Request timeout - stopping loading");
        setLoading(false);
        setError("Timeout: Không thể tải dữ liệu. Vui lòng thử lại.");
      }
    }, 10000); // 10 second timeout

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔄 Fetching Kaizen Bank data...");
        const data = await getKaizenBank({ search: "" });
        
        if (!isMounted) return;
        
        console.log("✅ Kaizen Bank data loaded:", data?.length || 0, "ideas");
        console.log("Sample data:", data?.[0]);
        setKaizenItems(data || []);
        
        const categories = [...new Set((data || []).map(item => item.category).filter(Boolean))];
        if (categories.length > 0) {
          setFetchedTags(categories as string[]);
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        console.error("❌ Failed to fetch Kaizen bank:", error);
        console.error("Error details:", error.response?.data || error.message);
        
        // Determine error message
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError("Vui lòng đăng nhập để xem Ngân hàng Kaizen");
        } else if (error.response?.status === 400) {
          setError("Lỗi khi tải dữ liệu. Vui lòng thử lại sau.");
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          setError("Timeout: Máy chủ phản hồi quá chậm. Vui lòng thử lại.");
        } else {
          setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối.");
        }
        
        setKaizenItems([]);
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const filteredData = useMemo(() => {
    let filtered = kaizenItems.filter((item) => {
      const matchKeyword =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (item.expected_benefit?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchTags =
        selectedTags.length === 0 ||
        (item.category && selectedTags.includes(item.category));

      return matchKeyword && matchTags;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.implemented_at || b.created_at).getTime() - 
               new Date(a.implemented_at || a.created_at).getTime();
      } else if (sortBy === 'impact') {
        return (b.impact_score || 0) - (a.impact_score || 0);
      } else if (sortBy === 'savings') {
        return (b.actual_savings || 0) - (a.actual_savings || 0);
      }
      return 0;
    });

    return filtered;
  }, [search, selectedTags, kaizenItems, sortBy]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const stats = useMemo(() => {
    const total = filteredData.length;
    const totalSavings = filteredData.reduce((sum, item) => sum + (item.actual_savings || 0), 0);
    const avgImpact = filteredData.reduce((sum, item) => sum + (item.impact_score || 0), 0) / (total || 1);
    const avgFeasibility = filteredData.reduce((sum, item) => sum + (item.feasibility_score || 0), 0) / (total || 1);
    
    return { total, totalSavings, avgImpact: avgImpact.toFixed(1), avgFeasibility: avgFeasibility.toFixed(1) };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <span className="text-lg text-gray-600 dark:text-gray-400">Đang tải dữ liệu Kaizen Bank...</span>
        <span className="text-sm text-gray-500 dark:text-gray-500 mt-2">Vui lòng đợi...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Ngân hàng Kaizen"
        description="Kho lưu trữ các ý tưởng cải tiến đã được triển khai thành công"
      />
      <div className="p-6 bg-gray-50 dark:bg-neutral-900 min-h-screen transition-colors">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <BookOpen size={28} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Ngân hàng Kaizen
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Kho tri thức các ý tưởng cải tiến đã được triển khai thành công
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tổng số ý tưởng</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Lightbulb className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tiết kiệm tổng</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {(stats.totalSavings / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Impact TB</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.avgImpact}/10</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Khả thi TB</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.avgFeasibility}/10</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Target className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Search size={20} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm ý tưởng theo tiêu đề, mô tả, lợi ích..."
              className="flex-1 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
            />
            
            {/* View Mode Toggle */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                }`}
              >
                <Grid3X3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                }`}
              >
                <List size={20} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="date">Mới nhất</option>
              <option value="impact">Impact cao nhất</option>
              <option value="savings">Tiết kiệm nhiều nhất</option>
            </select>
          </div>

          {/* Category Filter Tags */}
          <div className="flex gap-2 flex-wrap">
            {allTags.map((tag) => {
              const Icon = categoryIcons[tag] || Tag;
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full border text-sm flex items-center gap-1.5 transition-all duration-200 ${
                    selectedTags.includes(tag)
                      ? "bg-red-600 text-white border-red-600 shadow-md"
                      : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-neutral-600"
                  }`}
                >
                  <Icon size={14} />
                  {getCategoryLabel(tag)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ideas Display - Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredData.map((item) => {
              const CategoryIcon = categoryIcons[item.category || ''] || Lightbulb;
              const categoryColor = categoryColors[item.category || ''] || categoryColors.innovation;
              
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIdea(item)}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-neutral-700 transition-all duration-300 cursor-pointer overflow-hidden group"
                >
                  <div className="p-5 border-b border-gray-100 dark:border-neutral-700 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium flex items-center gap-1 ${categoryColor}`}>
                            <CategoryIcon size={12} />
                            {getCategoryLabel(item.category || '')}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Lightbulb className="text-red-600 dark:text-red-400" size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                      {item.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
                          <TrendingUp className="text-orange-600 dark:text-orange-400" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Impact</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.impact_score || 0}/10</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                          <Target className="text-purple-600 dark:text-purple-400" size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Khả thi</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.feasibility_score || 0}/10</p>
                        </div>
                      </div>
                    </div>

                    {item.actual_savings && item.actual_savings > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
                        <DollarSign className="text-green-600 dark:text-green-400" size={18} />
                        <div className="flex-1">
                          <p className="text-xs text-green-700 dark:text-green-300">Tiết kiệm thực tế</p>
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {item.actual_savings.toLocaleString('vi-VN')} VNĐ/tháng
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-700">
                      <div className="flex items-center gap-2">
                        <Award className="text-red-500" size={16} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.submitter_name || 'Ẩn danh'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        {new Date(item.implemented_at || item.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ideas Display - List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredData.map((item) => {
              const CategoryIcon = categoryIcons[item.category || ''] || Lightbulb;
              const categoryColor = categoryColors[item.category || ''] || categoryColors.innovation;
              
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIdea(item)}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-neutral-700 transition-all duration-300 cursor-pointer p-5 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                      <Lightbulb className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {item.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-medium mt-2 ${categoryColor}`}>
                            <CategoryIcon size={12} />
                            {getCategoryLabel(item.category || '')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Impact</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{item.impact_score || 0}/10</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Khả thi</p>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{item.feasibility_score || 0}/10</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-6 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                          <Award className="text-red-500" size={16} />
                          <span className="text-gray-600 dark:text-gray-400">{item.submitter_name || 'Ẩn danh'}</span>
                        </div>
                        
                        {item.actual_savings && item.actual_savings > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                            <DollarSign className="text-green-600 dark:text-green-400" size={16} />
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {item.actual_savings.toLocaleString('vi-VN')} VNĐ/tháng
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 ml-auto">
                          <Calendar size={14} />
                          {new Date(item.implemented_at || item.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <X size={48} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
              Không thể tải dữ liệu
            </h3>
            <p className="text-red-700 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredData.length === 0 && !loading && (
          <div className="text-center py-16 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700">
            <div className="inline-flex p-4 bg-gray-100 dark:bg-neutral-700 rounded-full mb-4">
              <Lightbulb size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {kaizenItems.length === 0 ? 'Chưa có ý tưởng nào' : 'Không tìm thấy kết quả'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {kaizenItems.length === 0 
                ? 'Hãy bắt đầu thêm các ý tưởng cải tiến đã được triển khai'
                : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'}
            </p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedIdea && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedIdea(null)}>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 p-6 flex items-start justify-between z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Lightbulb className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${categoryColors[selectedIdea.category || ''] || categoryColors.innovation}`}>
                      {getCategoryLabel(selectedIdea.category || '')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedIdea.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-orange-600 dark:text-orange-400" size={20} />
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-300">Impact Score</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{selectedIdea.impact_score || 0}<span className="text-lg">/10</span></p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="text-purple-600 dark:text-purple-400" size={20} />
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Khả thi</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{selectedIdea.feasibility_score || 0}<span className="text-lg">/10</span></p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                      <p className="text-sm font-medium text-green-900 dark:text-green-300">Tiết kiệm</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedIdea.actual_savings ? `${(selectedIdea.actual_savings / 1000000).toFixed(1)}M` : '0'}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Triển khai</p>
                    </div>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {new Date(selectedIdea.implemented_at || selectedIdea.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="text-gray-600 dark:text-gray-400" size={20} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Mô tả chi tiết</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedIdea.description}
                  </p>
                </div>

                {/* Benefits Comparison */}
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedIdea.expected_benefit && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="text-blue-600 dark:text-blue-400" size={20} />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300">Lợi ích dự kiến</h3>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {selectedIdea.expected_benefit}
                      </p>
                    </div>
                  )}

                  {selectedIdea.actual_benefit && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} />
                        <h3 className="font-semibold text-green-900 dark:text-green-300">Lợi ích thực tế</h3>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {selectedIdea.actual_benefit}
                      </p>
                    </div>
                  )}
                </div>

                {/* Implementation Notes */}
                {selectedIdea.implementation_notes && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                      <h3 className="font-semibold text-amber-900 dark:text-amber-300">Ghi chú triển khai</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {selectedIdea.implementation_notes}
                    </p>
                  </div>
                )}

                {/* Contributor Info */}
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-full shadow">
                      <Award className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Người đóng góp</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedIdea.submitter_name || 'Người dùng ẩn danh'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                      <ThumbsUp size={16} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hữu ích</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                      <MessageSquare size={16} />
                      <span className="text-sm font-medium">Phản hồi</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
