// src/components/feedback/IdeaDetail.tsx

import React, { useState, useEffect, useRef } from "react";
import { PublicIdea, DifficultyLevel } from "./types";
import { IdeaHistory } from "./IdeaHistory";
import { IdeaChat } from "./IdeaChat";
import { Check, X, ArrowUpRight, Send, Save, Paperclip, User, Building2, ThumbsUp, Bell } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import TextArea from "../form/input/TextArea";
import { DifficultyBadge, DifficultySelector } from "./DifficultySelector";
import { toast } from "react-toastify";
import api from "../../services/api";
import MediaViewer from "../common/MediaViewer";
import { StatusWorkflowPanel } from "./StatusWorkflowPanel";

interface Department {
  id: string;
  name: string;
}

interface IdeaDetailProps {
  idea: PublicIdea;
  onUpdateStatus: (
    status: string,
    note?: string,
    solutionStatus?: string,
    difficulty?: DifficultyLevel
  ) => void;
  onSendChat: (text: string) => void;
  showForwardButton?: boolean;
  departments?: Department[];
  onRefresh?: () => void;
  supportCount?: number;
  remindCount?: number;
  onSupport?: () => void;
  onRemind?: () => void;
}

export const IdeaDetail: React.FC<IdeaDetailProps> = ({
  idea,
  onUpdateStatus,
  onSendChat,
  showForwardButton = true,
  departments = [],
  onRefresh,
  supportCount = 0,
  remindCount = 0,
  onSupport,
  onRemind,
}) => {
  const { t, language } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [solutionInput, setSolutionInput] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | undefined>(idea.difficulty);
  const [savingDifficulty, setSavingDifficulty] = useState(false);
  const [solution, setSolution] = useState<{
    note: string;
    status: string;
  } | null>(null);

  // ===== STATUS-BASED ACTION CONTROL =====
  // Determine which actions are allowed based on current status
  // Status workflow: new/pending → under_review → approved/rejected → implemented
  const canApproveReject = ['new', 'pending', 'under_review'].includes(idea.status);
  const canForward = ['new', 'pending', 'under_review'].includes(idea.status);
  const canModifyDifficulty = !['implemented', 'rejected'].includes(idea.status);
  const isFinalized = ['approved', 'rejected', 'implemented'].includes(idea.status);

  // Reset scroll position về đầu khi chuyển sang idea khác
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Reset các state khác khi chuyển idea
    setDifficulty(idea.difficulty);
    setSolution(null);
    setSolutionInput("");
  }, [idea.id]);

  const handleSaveDifficulty = async () => {
    if (!difficulty) {
      toast.info(t('difficulty.no_change'));
      return;
    }

    // Kiểm tra xem có thay đổi không (bao gồm cả trường hợp undefined -> giá trị mới)
    if (difficulty === idea.difficulty) {
      toast.info(t('difficulty.no_change'));
      return;
    }

    try {
      setSavingDifficulty(true);

      console.log('Current idea.status:', idea.status);

      // Map frontend status to backend status
      // Backend accepts: 'under_review', 'approved', 'rejected', 'implemented', 'on_hold'
      const statusMap: Record<string, string> = {
        'new': 'under_review',
        'pending': 'under_review',
        'under_review': 'under_review',
        'approved': 'approved',
        'rejected': 'rejected',
        'implemented': 'implemented',
        'on_hold': 'on_hold'
      };
      const backendStatus = statusMap[idea.status] || 'under_review';

      console.log('Mapped backend status:', backendStatus);

      const payload = {
        status: backendStatus,
        review_notes: `Updated difficulty to ${difficulty}`,
        difficulty: difficulty
      };

      console.log('Saving difficulty:', payload);
      const response = await api.put(`/ideas/${idea.id}/review`, payload);
      console.log('Save difficulty response:', response.data);
      toast.success(t('difficulty.save_success'));

      // Refresh data to get updated history
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Save difficulty failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error details:', error.response?.data?.errors);
      toast.error(`${t('difficulty.save_error')}: ${error.response?.data?.message || error.message}`);
    } finally {
      setSavingDifficulty(false);
    }
  };

  const handleSendSolution = () => {
    if (!solutionInput.trim()) return;
    const newSolution = {
      note: solutionInput.trim(),
      status: t('status.pending'),
    };
    setSolution(newSolution);
    setSolutionInput("");
    // Chỉ gửi difficulty nếu nó khác với giá trị ban đầu
    const changedDifficulty = difficulty !== idea.difficulty ? difficulty : undefined;
    onUpdateStatus(t('idea.solution_proposal'), newSolution.note, newSolution.status, changedDifficulty);
  };

  const handleApprove = () => {
    // Bắt buộc chọn độ khó trước khi duyệt
    if (!difficulty) {
      toast.error(t('difficulty.required_for_approve') || 'Vui lòng chọn độ khó trước khi duyệt');
      return;
    }

    const note = solution?.note || solutionInput || t('status.approved');
    const updatedSolution = { note, status: t('status.approved') };
    setSolution(updatedSolution);
    // Chỉ gửi difficulty nếu nó khác với giá trị ban đầu
    const changedDifficulty = difficulty !== idea.difficulty ? difficulty : undefined;
    // Send status code 'approved', not translated text
    onUpdateStatus('approved', note, t('status.approved'), changedDifficulty);
  };

  const handleReject = () => {
    const note = solution?.note || solutionInput || t('status.rejected');
    setSolution(null);
    setSolutionInput("");
    // Chỉ gửi difficulty nếu nó khác với giá trị ban đầu
    const changedDifficulty = difficulty !== idea.difficulty ? difficulty : undefined;
    // Send status code 'rejected', not translated text
    onUpdateStatus('rejected', note, t('button.reject'), changedDifficulty);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 transition-colors">
      {/* HEADER + ACTIONS (Không cuộn) */}
      <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center flex-shrink-0 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{idea.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <User size={14} />
                {idea.senderName || 'Ẩn danh'}
              </span>
              {idea.group && (
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {idea.group}
                </span>
              )}
            </div>
          </div>
          {idea.difficulty && <DifficultyBadge difficulty={idea.difficulty} />}
        </div>
        <div className="flex items-center gap-2">
          {/* Status Badge - Always show current status */}
          <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${idea.status === 'approved' || idea.status === 'implemented'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : idea.status === 'rejected'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : idea.status === 'under_review'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300'
            }`}>
            {t(`status.${idea.status}`) || idea.status}
          </span>

          {/* Approve/Reject buttons - Only show when status allows */}
          {canApproveReject && (
            <>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
              >
                <Check size={16} /> {t('button.approve')}
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
              >
                <X size={16} /> {t('button.reject')}
              </button>
            </>
          )}

          {/* Forward button - Only show when status allows */}
          {showForwardButton && canForward && (
            <button
              onClick={() => onUpdateStatus("Escalate")}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors text-gray-700 dark:text-gray-300"
            >
              <ArrowUpRight size={16} /> {t('feedback.forward')}
            </button>
          )}
        </div>
      </div>

      {/* NỘI DUNG (Khu vực có thể cuộn) */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto flex-1 bg-gray-50 dark:bg-neutral-900"
      >
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {/* Status Workflow Panel - Thanh trạng thái */}
          <StatusWorkflowPanel
            currentStatus={idea.status}
            workflowType="white"
            onStatusChange={async (newStatus, note) => {
              onUpdateStatus(newStatus, note);
            }}
            loading={false}
            compact={false}
            difficulty={difficulty}
            requireDifficultyForApproval={true}
            supportCount={supportCount}
            remindCount={remindCount}
            onSupport={onSupport}
            onRemind={onRemind}
          />

          {/* Support & Remind Summary Card - For non-resolved ideas */}
          {!['implemented', 'rejected'].includes(idea.status) && (supportCount > 0 || remindCount > 0) && (
            <div className="bg-gradient-to-r from-green-50 to-orange-50 dark:from-green-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {supportCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
                        <ThumbsUp size={18} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">{supportCount}</p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          {language === 'ja' ? '人が支持' : 'người ủng hộ'}
                        </p>
                      </div>
                    </div>
                  )}
                  {remindCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                        <Bell size={18} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{remindCount}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-500">
                          {language === 'ja' ? '件のリマインダー' : 'lần nhắc nhở'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {onSupport && (
                    <button
                      onClick={onSupport}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ThumbsUp size={16} />
                      {language === 'ja' ? '支持する' : 'Ủng hộ'}
                    </button>
                  )}
                  {onRemind && (
                    <button
                      onClick={onRemind}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Bell size={16} />
                      {language === 'ja' ? 'リマインド' : 'Nhắc nhở'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nội dung chính */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">{idea.content}</p>
            {idea.imageUrl && !idea.attachments?.length && (
              <img
                src={idea.imageUrl}
                alt={t('idea.attached_image')}
                className="max-w-lg mt-4 rounded-lg shadow-md border border-gray-200 dark:border-neutral-600"
              />
            )}
          </div>

          {/* Attachments Section */}
          {idea.attachments && idea.attachments.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-4">
                <Paperclip size={18} /> Đính kèm ({idea.attachments.length})
              </h3>
              <MediaViewer
                attachments={idea.attachments}
                baseUrl={import.meta.env.VITE_API_URL || 'http://localhost:3000'}
              />
            </div>
          )}

          {/* ĐÁNH GIÁ ĐỘ KHÓ - Độc lập - Only editable when not finalized */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <DifficultySelector
              value={difficulty}
              onChange={canModifyDifficulty ? setDifficulty : undefined}
              label={t('difficulty.label')}
              disabled={!canModifyDifficulty}
            />
            {canModifyDifficulty && difficulty !== idea.difficulty && (
              <button
                onClick={handleSaveDifficulty}
                disabled={savingDifficulty}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors text-sm"
              >
                <Save size={16} />
                {savingDifficulty ? t('difficulty.saving') : t('difficulty.save_button')}
              </button>
            )}
            {!canModifyDifficulty && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                {t('difficulty.readonly_note') || 'Không thể thay đổi độ khó sau khi đã phê duyệt/từ chối'}
              </p>
            )}
          </div>

          {/* ĐỀ XUẤT HƯỚNG GIẢI QUYẾT - Only show when can still take action */}
          {canApproveReject && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
              <label className="block mb-3 font-semibold text-gray-900 dark:text-white">
                {t('idea.solution_proposal')}
              </label>

              {!solution ? (
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <TextArea
                      value={solutionInput}
                      onChange={(value) => setSolutionInput(value)}
                      rows={3}
                      placeholder={t('idea.solution_placeholder')}
                      enableSpeech={true}
                      className="bg-gray-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-700"
                    />
                  </div>
                  <button
                    onClick={handleSendSolution}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors h-fit mt-1"
                  >
                    <Send size={16} /> {t('button.submit')}
                  </button>
                </div>
              ) : (
                <div className="p-4 border-l-4 border-red-600 bg-red-50 dark:bg-red-900/20 rounded-r-lg flex justify-between items-start">
                  <p className="text-gray-700 dark:text-gray-300">
                    {solution.note}
                  </p>
                  <span
                    className={`ml-4 font-semibold text-sm px-3 py-1 rounded-full ${solution.status === t('status.pending')
                      ? "text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30"
                      : solution.status === t('status.approved')
                        ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                        : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
                      }`}
                  >
                    {solution.status}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Lịch sử hành động */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <IdeaHistory history={idea.history} departments={departments} />
          </div>

          {/* Chat trao đổi */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('idea.discussion')}</h3>
            <IdeaChat chat={idea.chat} onSend={onSendChat} />
          </div>
        </div>
      </div>
    </div>
  );
};
