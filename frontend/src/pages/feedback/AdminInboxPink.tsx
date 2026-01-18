/**
 * AdminInboxPinkV2.tsx - Enhanced Version
 * Giao diện Admin Inbox Hòm hồng với thiết kế mới, tối ưu hơn
 * Pink Box Admin Inbox with improved design
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router";
import {
  Shield,
  Search,
  Mic,
  X,
  RefreshCw,
  SlidersHorizontal,
  Inbox,
  Eye,
  ArrowUpRight,
  Building2,
  Globe,
  Calendar,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../services/api";
import { useDepartments } from "../../hooks/useDepartments";
import { toast } from "react-toastify";
import {
  CURRENT_USER,
  SensitiveMessage,
  MessageStatus,
} from "../../components/feedback/types";
import { MessageDetailView } from "../../components/feedback/MessageDetailView";
import { useTranslation } from "../../contexts/LanguageContext";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSocketRefresh } from "../../hooks/useSocket";
import { FeedbackStatsCards } from "../../components/feedback/FeedbackStatsCards";
import { EnhancedIdeaCard } from "../../components/feedback/EnhancedIdeaCard";
import { DepartmentLinkPanel } from "../../components/feedback/DepartmentLinkPanel";
import { ForwardToDepartmentModal } from "../../components/feedback/ForwardToDepartmentModal";
import { CoordinatorReviewModal } from "../../components/feedback/CoordinatorReviewModal";

// Helper to map API status to UI status
const mapStatus = (apiStatus: string): MessageStatus => {
  switch (apiStatus) {
    case "pending":
      return "new";
    case "under_review":
      return "under_review";
    case "forwarded":
      return "forwarded";
    case "department_responded":
      return "department_responded";
    case "coordinator_reviewing":
      return "coordinator_reviewing";
    case "published":
      return "published";
    case "need_revision":
      return "need_revision";
    case "approved":
    case "rejected":
    case "implemented":
      return "processed";
    default:
      return "new";
  }
};

// Helper to map API response to SensitiveMessage
const mapIdeaToMessage = (idea: any): SensitiveMessage => {
  // Parse attachments array with full URL
  const parseAttachments = () => {
    if (!idea.attachments) return undefined;
    try {
      const att = typeof idea.attachments === 'string' 
        ? JSON.parse(idea.attachments) 
        : idea.attachments;
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
    id: idea.id,
    isAnonymous: idea.is_anonymous,
    senderName:
      idea.submitter_name || (idea.is_anonymous ? "Ẩn danh" : "Unknown"),
    senderId: idea.submitter_code,
    title: idea.title,
    fullContent: idea.description,
    difficulty: idea.difficulty,
    attachments: attachments,
    imageUrl: attachments && attachments.length > 0 
      ? attachments.find((a: any) => a.mime_type?.startsWith('image/'))?.url 
      : undefined,
    timestamp: new Date(idea.created_at),
    status: mapStatus(idea.status),
    history: (idea.history || []).map((h: any) => ({
      action:
        h.action === "submitted"
          ? "CREATED"
          : h.action === "assigned"
          ? "FORWARDED"
          : h.action === "forwarded"
          ? "FORWARDED"
          : h.action === "department_responded"
          ? "DEPARTMENT_RESPONDED"
          : h.action === "published"
          ? "PUBLISHED"
          : h.action === "revision_requested"
          ? "REVISION_REQUESTED"
          : h.action === "responded"
          ? "REPLIED"
          : "CREATED",
      timestamp: new Date(h.created_at),
      details: h.details
        ? typeof h.details === "string"
          ? h.details
          : JSON.stringify(h.details)
        : "",
      actor: h.performed_by_name || "System",
    })),
    replies: (idea.responses || []).map((r: any) => ({
      id: r.id,
      author: r.responder_name || "Admin",
      content: r.response,
      timestamp: new Date(r.created_at),
    })),
    // Extended fields for Pink Box workflow
    forwardInfo: idea.forwarded_to_department_id
      ? {
          forwarded_to_department_id: idea.forwarded_to_department_id,
          forwarded_to_department_name: idea.forwarded_to_department_name,
          forwarded_at: idea.forwarded_at
            ? new Date(idea.forwarded_at)
            : undefined,
          forwarded_by: idea.forwarded_by_name,
          forwarded_note: idea.forwarded_note,
          forwarded_note_ja: idea.forwarded_note_ja,
        }
      : undefined,
    departmentResponse: idea.department_response
      ? {
          department_response: idea.department_response,
          department_response_ja: idea.department_response_ja,
          department_responded_at: idea.department_responded_at
            ? new Date(idea.department_responded_at)
            : undefined,
          department_responded_by: idea.department_responded_by_name,
        }
      : undefined,
    publishedInfo: {
      published_response: idea.published_response,
      published_response_ja: idea.published_response_ja,
      published_at: idea.published_at ? new Date(idea.published_at) : undefined,
      is_published: idea.is_published || false,
    },
  };
};

export default function SensitiveInboxPageV2() {
  const [messages, setMessages] = useState<SensitiveMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<
    string | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { departments, loading: deptLoading } = useDepartments();
  const { t, language } = useTranslation();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      const cleanText = text.trim().replace(/\.$/, "");
      setSearchTerm((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
    },
  });

  // Fetch ideas
  const fetchIdeas = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);
      const res = await api.get("/ideas?ideabox_type=pink");
      const ideasData = res.data.data || [];
      const mappedIdeas = ideasData.map(mapIdeaToMessage);
      setMessages(mappedIdeas);
      if (mappedIdeas.length > 0 && !selectedMessageId) {
        setSelectedMessageId(mappedIdeas[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch ideas:", error);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMessageId]);

  useEffect(() => {
    fetchIdeas(true);
  }, [fetchIdeas]);

  // WebSocket refresh
  const silentRefresh = useCallback(() => {
    fetchIdeas(false);
  }, [fetchIdeas]);

  useSocketRefresh(
    ["idea_created", "idea_updated", "idea_response"],
    silentRefresh,
    ["ideas"]
  );

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: messages.length,
      pending: messages.filter((m) => m.status === "new").length,
      inProgress: messages.filter(
        (m) => m.status === "under_review" || m.status === "forwarded"
      ).length,
      completed: messages.filter((m) => m.status === "published").length,
      forwarded: messages.filter((m) => m.status === "forwarded").length,
      published: messages.filter((m) => m.status === "published").length,
    };
  }, [messages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Search filter
      const matchSearch =
        searchTerm === "" ||
        msg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.fullContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.senderName || "").toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchStatus = statusFilter === "all";
      if (statusFilter === "pending") matchStatus = msg.status === "new";
      if (statusFilter === "in_progress")
        matchStatus =
          msg.status === "under_review" ||
          msg.status === "forwarded" ||
          msg.status === "department_responded";
      if (statusFilter === "completed") matchStatus = msg.status === "published";
      if (statusFilter === "forwarded") matchStatus = msg.status === "forwarded";
      if (statusFilter === "published") matchStatus = msg.status === "published";

      // Department filter
      const matchDepartment = 
        departmentFilter === "" || 
        msg.forwardInfo?.forwarded_to_department_name?.toLowerCase().includes(departmentFilter.toLowerCase());

      // Date filter
      let matchDate = true;
      const msgDate = new Date(msg.timestamp);
      if (dateFrom) {
        matchDate = matchDate && msgDate >= new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchDate = matchDate && msgDate <= endDate;
      }

      return matchSearch && matchStatus && matchDepartment && matchDate;
    });
  }, [messages, searchTerm, statusFilter, departmentFilter, dateFrom, dateTo]);

  const hasActiveFilters = searchTerm || statusFilter !== "all" || departmentFilter || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  // Handlers
  const handleForward = async (
    messageId: string,
    departmentId: string,
    note: string
  ) => {
    try {
      setLoading(true);
      await api.put(`/ideas/${messageId}/assign`, {
        department_id: departmentId,
        review_notes: note,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                status: "forwarded" as MessageStatus,
                history: [
                  ...m.history,
                  {
                    action: "FORWARDED" as const,
                    timestamp: new Date(),
                    details: `${t("feedback.forward_to")} ${
                      departments.find((d) => d.id === departmentId)?.name
                    }`,
                    actor: CURRENT_USER,
                  },
                ],
              }
            : m
        )
      );

      toast.success(t("feedback.messages.forward_success"));
    } catch (error: any) {
      console.error("Forward failed:", error);
      toast.error(
        `${t("feedback.messages.forward_fail")}: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (
    messageId: string,
    content: string,
    difficulty?: string
  ) => {
    try {
      setLoading(true);

      if (difficulty) {
        const selectedMsg = messages.find((m) => m.id === messageId);
        if (selectedMsg) {
          await api.put(`/ideas/${messageId}/review`, {
            status: "under_review",
            review_notes: `Updated difficulty to ${difficulty}`,
            difficulty: difficulty,
          });
        }
      }

      const res = await api.post(`/ideas/${messageId}/responses`, {
        response: content,
      });
      const newResponse = res.data.data;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              status: "processed" as MessageStatus,
              replies: [
                ...m.replies,
                {
                  id: newResponse.id,
                  author: newResponse.responder_name || CURRENT_USER,
                  content: newResponse.response,
                  timestamp: new Date(newResponse.created_at),
                },
              ],
              history: [
                ...m.history,
                {
                  action: "REPLIED" as const,
                  timestamp: new Date(),
                  details: t("feedback.replied"),
                  actor: CURRENT_USER,
                },
              ],
            };
          }
          return m;
        })
      );

      toast.success(t("feedback.messages.reply_success"));
    } catch (error: any) {
      console.error("Reply failed:", error);
      toast.error(
        `${t("feedback.messages.reply_fail")}: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForwardSuccess = () => {
    setShowForwardModal(false);
    fetchIdeas(false);
  };

  const handlePublishSuccess = () => {
    setShowReviewModal(false);
    fetchIdeas(false);
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${language === "ja" ? "ピンクボックス" : "Pink Box"} | SmartFactory CONNECT`}
        description=""
      />

      <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-gray-50 dark:bg-neutral-900 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-500 rounded-xl text-white shadow-lg">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === "ja" ? "ピンクボックス" : "Pink Box"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === "ja"
                    ? "匿名フィードバックの処理"
                    : "Xử lý ý kiến ẩn danh và phối hợp phòng ban"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchIdeas()}
                disabled={refreshing}
                className="p-2 rounded-lg border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <RefreshCw
                  size={18}
                  className={`text-gray-600 dark:text-gray-400 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${
                  showFilters
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
            boxType="pink"
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
                      language === "ja"
                        ? "検索..."
                        : "Tìm kiếm ý kiến ẩn danh..."
                    }
                    className="w-full pl-10 pr-16 py-2.5 border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isSupported && (
                      <button
                        onClick={startListening}
                        className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 ${
                          isListening
                            ? "text-red-500 animate-pulse"
                            : "text-gray-400"
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
                {/* Department filter */}
                <div className="min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Building2 size={12} />
                    {language === "ja" ? "部門" : "Phòng ban"}
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">{language === "ja" ? "すべて" : "Tất cả"}</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
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
                    ? `${filteredMessages.length} 件の結果`
                    : `Tìm thấy ${filteredMessages.length} kết quả`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="shrink-0 flex gap-2 p-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
          <button
            onClick={() => setShowForwardModal(true)}
            disabled={!selectedMessage}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpRight size={16} />
            {language === "ja" ? "部署へ転送" : "Chuyển tiếp đến Phòng ban"}
          </button>
          <button
            onClick={() => setShowReviewModal(true)}
            disabled={
              !selectedMessage || !selectedMessage.departmentResponse?.department_response
            }
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Eye size={16} />
            {language === "ja" ? "回答を確認して公開" : "Xem xét và Công khai"}
          </button>
          <Link
            to="/feedback/published"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
          >
            <Globe size={16} />
            {language === "ja" ? "公開ボードを見る" : "Xem bảng công khai"}
          </Link>
          <Link
            to="/feedback/published-management"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors ml-auto"
          >
            <Eye size={16} />
            {language === "ja" ? "公開回答を管理" : "Quản lý phản hồi công khai"}
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List Panel */}
          <div className="w-[400px] shrink-0 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <Inbox
                    size={48}
                    className="mb-3 text-gray-300 dark:text-gray-600"
                  />
                  <p className="font-medium">
                    {language === "ja"
                      ? "メッセージがありません"
                      : "Chưa có ý kiến nào"}
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <EnhancedIdeaCard
                    key={msg.id}
                    idea={msg}
                    isSelected={msg.id === selectedMessageId}
                    onClick={() => setSelectedMessageId(msg.id)}
                    boxType="pink"
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Main Detail */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <MessageDetailView
                message={selectedMessage}
                departments={departments}
                loading={deptLoading}
                onForward={handleForward}
                onReply={handleReply}
                onRefresh={() => fetchIdeas(false)}
                boxType="pink"
              />
            </div>

            {/* Department Link Panel (Right sidebar) */}
            {selectedMessage && (
              <div className="w-[320px] shrink-0 p-4 overflow-y-auto bg-gray-50 dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-700">
                <DepartmentLinkPanel
                  forwardInfo={selectedMessage.forwardInfo}
                  departmentResponse={selectedMessage.departmentResponse}
                  publishedInfo={selectedMessage.publishedInfo}
                  departments={departments}
                  onForward={() => setShowForwardModal(true)}
                  onPublish={() => setShowReviewModal(true)}
                  canForward={!selectedMessage.forwardInfo?.forwarded_to_department_id}
                  canPublish={
                    !!selectedMessage.departmentResponse?.department_response &&
                    !selectedMessage.publishedInfo?.is_published
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forward Modal */}
      {showForwardModal && selectedMessage && (
        <ForwardToDepartmentModal
          message={selectedMessage}
          departments={departments}
          loading={loading}
          onClose={() => setShowForwardModal(false)}
          onSuccess={handleForwardSuccess}
        />
      )}

      {/* Review/Publish Modal */}
      {showReviewModal && selectedMessage && (
        <CoordinatorReviewModal
          message={selectedMessage}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handlePublishSuccess}
        />
      )}
    </>
  );
}
