/**
 * WhiteBoxLanding.tsx - Enhanced Version
 * Giao diện Hòm trắng với thiết kế mới, tối ưu hơn
 * White Box landing page with improved design
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  MessageSquareText,
  Search,
  Mic,
  X,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  Inbox,
  Building2,
  Calendar,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSocketRefresh } from "../../hooks/useSocket";
import { useDepartments } from "../../hooks/useDepartments";
import api from "../../services/api";
import { toast } from "react-toastify";
import { PublicIdea, StatusType } from "../../components/feedback/types";
import { IdeaDetail } from "../../components/feedback/IdeaDetail";
import { FeedbackStatsCards } from "../../components/feedback/FeedbackStatsCards";
import { EnhancedIdeaCard } from "../../components/feedback/EnhancedIdeaCard";
import { WorkflowTimeline, getWhiteBoxWorkflowSteps } from "../../components/feedback/WorkflowTimeline";

// View mode
type ViewMode = "split" | "idea" | "opinion";

// Category mapping
const ideaCategories = [
  "process_improvement",
  "cost_reduction",
  "safety_enhancement",
  "quality_improvement",
];

interface BackendIdea {
  id: string;
  submitter_id: string;
  submitter_name: string;
  department_name: string;
  category: string;
  title: string;
  description: string;
  difficulty?: string;
  attachments: string | null;
  created_at: string;
  status: string;
  history: any[];
  responses: any[];
}

export default function WhiteBoxLanding() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { departments } = useDepartments();
  const isNotAdmin = user?.level !== 1;

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [activeTab, setActiveTab] = useState<"idea" | "opinion">("idea");

  // Data
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [opinions, setOpinions] = useState<PublicIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [selectedOpinionId, setSelectedOpinionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) =>
      setSearchTerm((prev) => (prev ? `${prev} ${text.trim()}` : text.trim())),
  });

  // Map status
  const mapStatus = useCallback((s: string): StatusType => {
    const m: Record<string, StatusType> = {
      pending: "new",
      under_review: "under_review",
      approved: "approved",
      rejected: "rejected",
      implemented: "implemented",
    };
    return m[s] || "new";
  }, []);

  const mapToBackendStatus = (s: string) =>
  ({
    new: "pending",
    under_review: "under_review",
    approved: "approved",
    rejected: "rejected",
    implemented: "implemented",
  }[s] || "under_review");

  // Map item
  const mapItem = useCallback(
    (item: BackendIdea): PublicIdea => {
      let historyArr: any[] = [];
      let responsesArr: any[] = [];

      try {
        if (Array.isArray(item.history)) {
          historyArr = item.history;
        } else if (typeof item.history === "string") {
          historyArr = JSON.parse(item.history);
        }
      } catch (e) {
        historyArr = [];
      }

      try {
        if (Array.isArray(item.responses)) {
          responsesArr = item.responses;
        } else if (typeof item.responses === "string") {
          responsesArr = JSON.parse(item.responses);
        }
      } catch (e) {
        responsesArr = [];
      }

      // Parse attachments with full URL
      const parseAttachments = () => {
        if (!item.attachments) return undefined;
        try {
          const att = typeof item.attachments === 'string'
            ? JSON.parse(item.attachments)
            : item.attachments;
          if (Array.isArray(att) && att.length > 0) {
            const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
            return att.map((a: any) => ({
              file_id: a.file_id || a.fileId,
              filename: a.filename,
              original_name: a.original_name || a.originalName,
              mime_type: a.mime_type || a.mimeType,
              size: a.size,
              path: a.path,
              url: a.path ? `${baseUrl}/${a.path}` : (a.url || ''),
            }));
          }
        } catch (e) {
          console.error("Error parsing attachments", e);
        }
        return undefined;
      };

      const attachments = parseAttachments();

      return {
        id: item.id,
        senderId: item.submitter_id || "",
        senderName: item.submitter_name || "Ẩn danh",
        group: item.department_name || "",
        line: item.category || "",
        title: item.title || "",
        content: item.description || "",
        difficulty: item.difficulty as "A" | "B" | "C" | "D" | undefined,
        attachments: attachments,
        imageUrl: attachments && attachments.length > 0
          ? attachments.find((a: any) => a.mime_type?.startsWith('image/'))?.url
          : undefined,
        timestamp: new Date(item.created_at),
        status: mapStatus(item.status),
        history: historyArr.map((h: any) => ({
          time: new Date(h.created_at),
          by: h.performed_by_name || "System",
          action: h.action || "",
          note:
            typeof h.details === "string"
              ? h.details
              : h.details
                ? JSON.stringify(h.details)
                : "",
        })),
        chat: responsesArr.map((r: any) => ({
          id: r.id,
          sender: r.role === "admin" ? "manager" : "user",
          text: r.response || "",
          time: new Date(r.created_at),
        })),
        isRead: true,
      };
    },
    [mapStatus]
  );

  // Fetch
  const fetchData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setRefreshing(true);
        const res = await api.get("/ideas?ideabox_type=white&limit=1000");
        const all = (res.data.data || []).map(mapItem);
        setIdeas(all.filter((i: PublicIdea) => ideaCategories.includes(i.line)));
        setOpinions(all.filter((i: PublicIdea) => !ideaCategories.includes(i.line)));
      } catch (e) {
        console.error(e);
      } finally {
        if (showLoading) setLoading(false);
        setRefreshing(false);
      }
    },
    [mapItem]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocketRefresh(["idea_created", "idea_updated"], () => fetchData(false), [
    "ideas",
  ]);

  // Calculate stats
  const stats = useMemo(() => {
    const allItems = [...ideas, ...opinions];
    return {
      total: allItems.length,
      pending: allItems.filter((i) => i.status === "new").length,
      inProgress: allItems.filter((i) => i.status === "under_review").length,
      completed: allItems.filter(
        (i) => i.status === "approved" || i.status === "implemented"
      ).length,
      rejected: allItems.filter((i) => i.status === "rejected").length,
    };
  }, [ideas, opinions]);

  // Filter items
  const filterItems = useCallback(
    (items: PublicIdea[]) => {
      return items.filter((item) => {
        // Search filter
        const matchSearch =
          searchTerm === "" ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.senderName.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        // Status filter
        let matchStatus = false;
        if (statusFilter === "all") {
          matchStatus = true;
        } else if (statusFilter === "pending") {
          matchStatus = item.status === "new";
        } else if (statusFilter === "in_progress") {
          matchStatus = item.status === "under_review";
        } else if (statusFilter === "completed") {
          matchStatus = item.status === "approved" || item.status === "implemented";
        } else if (statusFilter === "rejected") {
          matchStatus = item.status === "rejected";
        } else {
          matchStatus = item.status === statusFilter;
        }

        // Category filter (for ideas)
        const matchCategory =
          categoryFilter === "" || item.line === categoryFilter;

        // Date filter
        let matchDate = true;
        const itemDate = new Date(item.timestamp);
        if (dateFrom) {
          matchDate = matchDate && itemDate >= new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          matchDate = matchDate && itemDate <= endDate;
        }

        return matchSearch && matchStatus && matchCategory && matchDate;
      });
    },
    [searchTerm, statusFilter, categoryFilter, dateFrom, dateTo]
  );

  const hasActiveFilters = searchTerm || statusFilter !== "all" || categoryFilter || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const filteredIdeas = useMemo(
    () => filterItems(ideas),
    [ideas, filterItems]
  );
  const filteredOpinions = useMemo(
    () => filterItems(opinions),
    [opinions, filterItems]
  );

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);
  const selectedOpinion = opinions.find((i) => i.id === selectedOpinionId);

  // Handlers
  const handleUpdateStatus = async (
    type: "idea" | "opinion",
    status: string,
    note?: string,
    _?: string,
    difficulty?: string
  ) => {
    const item =
      type === "idea"
        ? ideas.find((i) => i.id === selectedIdeaId)
        : opinions.find((i) => i.id === selectedOpinionId);
    if (!item) return;
    try {
      if (status === "Escalate") {
        await api.post(`/ideas/${item.id}/escalate`, { reason: note });
        type === "idea"
          ? setIdeas((p) => p.filter((x) => x.id !== item.id))
          : setOpinions((p) => p.filter((x) => x.id !== item.id));
        toast.success(language === "ja" ? "転送しました" : "Đã chuyển tiếp");
        return;
      }
      await api.put(`/ideas/${item.id}/review`, {
        status: mapToBackendStatus(status),
        review_notes: note,
        difficulty,
      });
      fetchData(false);
      toast.success(
        language === "ja" ? "更新しました" : "Cập nhật thành công"
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSendChat = async (type: "idea" | "opinion", text: string) => {
    const item =
      type === "idea"
        ? ideas.find((i) => i.id === selectedIdeaId)
        : opinions.find((i) => i.id === selectedOpinionId);
    if (!item || !text.trim()) return;
    try {
      const res = await api.post(`/ideas/${item.id}/responses`, {
        response: text.trim(),
      });
      const msg = {
        id: res.data.data?.id || Date.now().toString(),
        sender: "manager" as const,
        text: text.trim(),
        time: new Date(),
      };
      const update = (p: PublicIdea[]) =>
        p.map((x) => (x.id === item.id ? { ...x, chat: [...x.chat, msg] } : x));
      type === "idea" ? setIdeas(update) : setOpinions(update);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-neutral-900">
        <div className="animate-spin h-10 w-10 border-3 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${language === "ja" ? "ホワイトボックス" : "White Box"} | SmartFactory CONNECT`}
        description=""
      />

      <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-gray-50 dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white shadow-lg">
                <Lightbulb size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === "ja" ? "ホワイトボックス" : "Hòm thư Trắng"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === "ja"
                    ? "アイデアと意見の管理"
                    : "Quản lý ý tưởng và ý kiến cải tiến"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData()}
                disabled={refreshing}
                className="p-2 rounded-lg border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <RefreshCw
                  size={18}
                  className={`text-gray-600 dark:text-gray-400 ${refreshing ? "animate-spin" : ""
                    }`}
                />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${showFilters
                  ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                  : "border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  }`}
              >
                <SlidersHorizontal
                  size={18}
                  className={
                    showFilters
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  }
                />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <FeedbackStatsCards
            stats={stats}
            boxType="white"
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />

          {/* Search and Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
              {/* Search row */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      language === "ja" ? "検索..." : "Tìm kiếm ý tưởng, ý kiến..."
                    }
                    className="w-full pl-10 pr-16 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isSupported && (
                      <button
                        onClick={startListening}
                        className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 ${isListening ? "text-red-500 animate-pulse" : "text-gray-400"
                          }`}
                      >
                        <Mic size={16} />
                      </button>
                    )}
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-400"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced filters row */}
              <div className="flex flex-wrap gap-3">
                {/* Category filter */}
                <div className="min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Filter size={12} />
                    {language === "ja" ? "カテゴリ" : "Phân loại"}
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">{language === "ja" ? "すべて" : "Tất cả"}</option>
                    <option value="process_improvement">
                      {language === "ja" ? "プロセス改善" : "Cải tiến quy trình"}
                    </option>
                    <option value="cost_reduction">
                      {language === "ja" ? "コスト削減" : "Giảm chi phí"}
                    </option>
                    <option value="safety_enhancement">
                      {language === "ja" ? "安全性向上" : "Nâng cao an toàn"}
                    </option>
                    <option value="quality_improvement">
                      {language === "ja" ? "品質改善" : "Cải tiến chất lượng"}
                    </option>
                  </select>
                </div>

                {/* Date from */}
                <div className="min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {language === "ja" ? "開始日" : "Từ ngày"}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Date to */}
                <div className="min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {language === "ja" ? "終了日" : "Đến ngày"}
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <X size={16} />
                      {language === "ja" ? "クリア" : "Xóa bộ lọc"}
                    </button>
                  </div>
                )}
              </div>

              {/* Results count */}
              {hasActiveFilters && (
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {language === "ja"
                    ? `${filteredIdeas.length + filteredOpinions.length} 件の結果`
                    : `Tìm thấy ${filteredIdeas.length + filteredOpinions.length} kết quả`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab buttons for mobile/split view */}
        <div className="shrink-0 flex border-b border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <button
            onClick={() => {
              setActiveTab("idea");
              if (viewMode === "split") setViewMode("idea");
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === "idea"
              ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700"
              }`}
          >
            <Lightbulb size={18} />
            {language === "ja" ? "アイデア" : "Ý tưởng"}
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
              {filteredIdeas.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("opinion");
              if (viewMode === "split") setViewMode("opinion");
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === "opinion"
              ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700"
              }`}
          >
            <MessageSquareText size={18} />
            {language === "ja" ? "意見" : "Ý kiến"}
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
              {filteredOpinions.length}
            </span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List Panel */}
          <div
            className={`
              ${viewMode !== "split" && activeTab !== "idea" && activeTab !== "opinion" ? "hidden" : ""}
              w-full md:w-[400px] shrink-0 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col overflow-hidden
            `}
          >
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeTab === "idea" ? (
                filteredIdeas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <Inbox size={48} className="mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="font-medium">
                      {language === "ja" ? "アイデアがありません" : "Chưa có ý tưởng"}
                    </p>
                  </div>
                ) : (
                  filteredIdeas.map((item) => (
                    <EnhancedIdeaCard
                      key={item.id}
                      idea={item}
                      isSelected={item.id === selectedIdeaId}
                      onClick={() => setSelectedIdeaId(item.id)}
                      boxType="white"
                    />
                  ))
                )
              ) : filteredOpinions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <Inbox size={48} className="mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="font-medium">
                    {language === "ja" ? "意見がありません" : "Chưa có ý kiến"}
                  </p>
                </div>
              ) : (
                filteredOpinions.map((item) => (
                  <EnhancedIdeaCard
                    key={item.id}
                    idea={item}
                    isSelected={item.id === selectedOpinionId}
                    onClick={() => setSelectedOpinionId(item.id)}
                    boxType="white"
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "idea" ? (
              selectedIdea ? (
                <IdeaDetail
                  idea={selectedIdea}
                  onUpdateStatus={(s, n, _, d) =>
                    handleUpdateStatus("idea", s, n, _, d)
                  }
                  onSendChat={(txt) => handleSendChat("idea", txt)}
                  showForwardButton={isNotAdmin}
                  departments={departments}
                  onRefresh={() => fetchData(false)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <Lightbulb size={64} className="mb-4 text-gray-200 dark:text-gray-700" />
                  <p className="text-lg font-medium">
                    {language === "ja"
                      ? "アイデアを選択してください"
                      : "Chọn ý tưởng để xem chi tiết"}
                  </p>
                </div>
              )
            ) : selectedOpinion ? (
              <IdeaDetail
                idea={selectedOpinion}
                onUpdateStatus={(s, n, _, d) =>
                  handleUpdateStatus("opinion", s, n, _, d)
                }
                onSendChat={(txt) => handleSendChat("opinion", txt)}
                showForwardButton={isNotAdmin}
                departments={departments}
                onRefresh={() => fetchData(false)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <MessageSquareText
                  size={64}
                  className="mb-4 text-gray-200 dark:text-gray-700"
                />
                <p className="text-lg font-medium">
                  {language === "ja"
                    ? "意見を選択してください"
                    : "Chọn ý kiến để xem chi tiết"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
