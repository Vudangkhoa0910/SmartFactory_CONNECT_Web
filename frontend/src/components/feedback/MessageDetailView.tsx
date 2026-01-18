// src/pages/SensitiveInbox/MessageDetailView.tsx
import React, { useState, useEffect } from "react";
import {
  Inbox,
  Send,
  Archive,
  MessageSquare,
  ArrowRight,
  CornerDownRight,
  Save,
  Bell,
} from "lucide-react";
import { SensitiveMessage, HistoryAction, DifficultyLevel } from "./types";
import { ActionPanel } from "./ActionPanel";
import { useTranslation } from "../../contexts/LanguageContext";
import TextArea from '../form/input/TextArea';
import { DifficultyBadge, DifficultySelector } from "./DifficultySelector";
import { toast } from "react-toastify";
import api from "../../services/api";
import { StatusWorkflowPanel } from "./StatusWorkflowPanel";
import MediaViewer from "../common/MediaViewer";

interface Department {
  id: string;
  name: string;
}

interface MessageDetailViewProps {
  message: SensitiveMessage | undefined;
  departments?: Department[];
  loading?: boolean;
  onForward: (messageId: string, departmentId: string, note: string) => Promise<void> | void;
  onReply: (messageId: string, content: string, difficulty?: DifficultyLevel) => void;
  onRefresh?: () => void;
  boxType?: 'white' | 'pink';
}

export const MessageDetailView: React.FC<MessageDetailViewProps> = ({
  message,
  departments = [],
  loading = false,
  onForward,
  onReply,
  onRefresh,
  boxType = 'pink',
}) => {
  const { t, language } = useTranslation();
  const [activePanel, setActivePanel] = useState<"none" | "forward">("none");
  const [replyContent, setReplyContent] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | undefined>(message?.difficulty);
  const [savingDifficulty, setSavingDifficulty] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Reset difficulty khi chuyển sang message khác
  useEffect(() => {
    setDifficulty(message?.difficulty);
  }, [message?.id]);

  // Check if there's a new department response that hasn't been reviewed
  const hasNewDepartmentResponse = message?.departmentResponse?.department_response &&
    !message?.publishedInfo?.is_published;

  // Handle status change from StatusWorkflowPanel
  const handleStatusChange = async (newStatus: string, note?: string) => {
    if (!message) return;

    setUpdatingStatus(true);
    try {
      await api.put(`/ideas/${message.id}/review`, {
        status: newStatus,
        review_notes: note || `Status updated to ${newStatus}`,
      });
      toast.success(language === 'ja' ? 'ステータスを更新しました' : 'Cập nhật trạng thái thành công');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(`${language === 'ja' ? '更新に失敗しました' : 'Cập nhật thất bại'}: ${error.message}`);
      throw error;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveDifficulty = async () => {
    if (!message || !difficulty || difficulty === message.difficulty) {
      toast.info(t('difficulty.no_change'));
      return;
    }

    try {
      setSavingDifficulty(true);
      const payload = {
        status: message.status === 'new' ? 'under_review' : 'under_review',
        review_notes: `Updated difficulty to ${difficulty}`,
        difficulty: difficulty
      };
      await api.put(`/ideas/${message.id}/review`, payload);
      toast.success(t('difficulty.save_success'));
      // Cập nhật message.difficulty để tránh lưu lại
      message.difficulty = difficulty;
    } catch (error: any) {
      console.error('Save difficulty failed:', error);
      toast.error(`${t('difficulty.save_error')}: ${error.response?.data?.message || error.message}`);
    } finally {
      setSavingDifficulty(false);
    }
  };

  if (!message) {
    return (
      <main className="flex-1 flex flex-col min-h-0 items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-900 transition-colors overflow-hidden">
        <Inbox size={64} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-lg">{t('feedback.no_selection')}</p>
      </main>
    );
  }

  const handleForwardWrapper = async (messageId: string, departmentId: string, note: string) => {
    await onForward(messageId, departmentId, note);
    setActivePanel("none");
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    // Chỉ gửi difficulty nếu nó khác với giá trị ban đầu
    const changedDifficulty = difficulty !== message?.difficulty ? difficulty : undefined;
    onReply(message.id, replyContent, changedDifficulty);
    setReplyContent("");
  };

  const getActionIcon = (action: HistoryAction) => {
    switch (action) {
      case "FORWARDED":
        return <ArrowRight size={14} className="text-red-500" />;
      case "REPLIED":
        return <MessageSquare size={14} className="text-red-600" />;
      default:
        return <CornerDownRight size={14} className="text-gray-400" />;
    }
  };

  // Helper function to format history details
  const formatHistoryDetails = (details: string): string => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(details);

      // Build readable message
      const parts: string[] = [];

      const statusMap: Record<string, string> = {
        'new': 'Mới',
        'pending': 'Chờ xử lý',
        'under_review': 'Đang xem xét',
        'approved': 'Đã phê duyệt',
        'rejected': 'Đã từ chối',
        'implemented': 'Đã triển khai',
        'on_hold': 'Tạm dừng',
        'processed': 'Đã xử lý'
      };

      // Handle initial creation log
      if (parsed.status && parsed.ideabox_type && !parsed.old_status) {
        const boxName = parsed.ideabox_type === 'white' ? 'Hòm trắng' : 'Hòm hồng';
        parts.push(`Đã gửi vào ${boxName}`);
      }

      if (parsed.old_status && parsed.new_status) {
        const oldStatus = statusMap[parsed.old_status] || parsed.old_status;
        const newStatus = statusMap[parsed.new_status] || parsed.new_status;
        parts.push(`Chuyển trạng thái: ${oldStatus} → ${newStatus}`);
      }

      if (parsed.difficulty) {
        parts.push(`Đánh giá độ khó: ${parsed.difficulty}`);
      }

      if (parsed.review_notes) {
        // Parse review notes to extract difficulty info
        const diffMatch = parsed.review_notes.match(/Updated difficulty to ([A-D])/);
        if (diffMatch && !parsed.difficulty) {
          parts.push(`Đánh giá độ khó: ${diffMatch[1]}`);
        } else if (!diffMatch) {
          parts.push(parsed.review_notes);
        }
      }

      if (parsed.assigned_to) {
        parts.push(`Phân công cho: ${parsed.assigned_to}`);
      }

      if (parsed.department) {
        parts.push(`Phòng ban: ${parsed.department}`);
      }

      // Handle department_id - lookup department name
      if (parsed.department_id) {
        const dept = departments.find(d => d.id === parsed.department_id);
        if (dept) {
          parts.push(`Phân công phòng ban: ${dept.name}`);
        } else {
          parts.push(`Phân công phòng ban: ${parsed.department_id}`);
        }
      }

      return parts.length > 0 ? parts.join(' • ') : details;
    } catch (e) {
      // If not JSON or parse fails, return as-is
      return details;
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-neutral-900 relative transition-colors overflow-hidden">
      <header className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {message.title}
          </h2>
          {message.difficulty && <DifficultyBadge difficulty={message.difficulty} />}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-gray-700 dark:text-gray-300">
            <Archive size={14} /> {t('feedback.archive')}
          </button>
          <button
            onClick={() => setActivePanel("forward")}
            className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1.5 transition-colors"
          >
            <Send size={14} /> {t('feedback.forward')}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Workflow Panel - NEW */}
          <StatusWorkflowPanel
            currentStatus={message.status}
            workflowType={boxType}
            onStatusChange={handleStatusChange}
            hasNewResponse={!!hasNewDepartmentResponse}
            loading={updatingStatus}
            difficulty={difficulty}
            requireDifficultyForApproval={true}
          />

          {/* New Response Notification */}
          {hasNewDepartmentResponse && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                <Bell size={20} className="text-red-600 dark:text-red-400 animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-700 dark:text-red-300">
                  {language === 'ja' ? '部署からの新しい回答があります！' : 'Có phản hồi mới từ phòng ban!'}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                  {language === 'ja'
                    ? '内容を確認し、公開するかどうかを決定してください'
                    : 'Vui lòng xem xét nội dung và quyết định công khai'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{message.fullContent}</p>

            {/* Media Attachments - Images, Videos, Audio */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-4">
                <MediaViewer
                  attachments={message.attachments}
                  baseUrl=""
                />
              </div>
            )}

            {/* Fallback for legacy imageUrl only */}
            {!message.attachments?.length && message.imageUrl && (
              <img
                src={message.imageUrl}
                className="max-w-lg rounded-lg mt-4 border border-gray-200 dark:border-neutral-600"
                alt="Attachment"
              />
            )}
          </div>
          <div className="space-y-4">
            {message.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  {reply.author.charAt(0)}
                </div>
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{reply.author}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {reply.timestamp.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
            <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">{t('feedback.reply_title')}</h4>

            {/* Đánh giá độ khó */}
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-neutral-700">
              <DifficultySelector
                value={difficulty}
                onChange={setDifficulty}
                label="Đánh giá độ khó xử lý"
              />
              {difficulty !== message?.difficulty && (
                <button
                  onClick={handleSaveDifficulty}
                  disabled={savingDifficulty}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors text-sm"
                >
                  <Save size={16} />
                  {savingDifficulty ? t('difficulty.saving') : t('difficulty.save_button')}
                </button>
              )}
            </div>

            <TextArea
              value={replyContent}
              onChange={(value) => setReplyContent(value)}
              rows={4}
              placeholder={t('feedback.reply_placeholder')}
              className="bg-gray-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
              enableSpeech={true}
            />
            <div className="text-right mt-3">
              <button
                onClick={handleReply}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-neutral-700 transition-colors"
                disabled={!replyContent.trim()}
              >
                {t('feedback.send_reply')}
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
            <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">{t('feedback.history_title')}</h4>
            <ul className="space-y-3">
              {message.history.map((entry, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-700 hover:shadow-sm transition-shadow">
                  <div className="mt-1 flex-shrink-0">{getActionIcon(entry.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{entry.actor}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {entry.timestamp.toLocaleString("vi-VN", {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      {formatHistoryDetails(entry.details)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {activePanel === "forward" && (
        <ActionPanel
          message={message}
          departments={departments}
          loading={loading}
          onClose={() => setActivePanel("none")}
          onForward={handleForwardWrapper}
        />
      )}
    </main>
  );
};
