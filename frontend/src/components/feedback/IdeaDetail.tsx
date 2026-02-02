// src/components/feedback/IdeaDetail.tsx

import React, { useState, useEffect, useRef } from "react";
import { PublicIdea, DifficultyLevel } from "./types";
import { IdeaHistory } from "./IdeaHistory";
import { IdeaChat } from "./IdeaChat";
import { Check, X, ArrowUpRight, Send, Save, Paperclip, User, Building2, ThumbsUp, Bell, Star, MessageSquare, Trash2, CheckCircle2, FileText } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import TextArea from "../form/input/TextArea";
import { DifficultyBadge, DifficultySelector } from "./DifficultySelector";
import { toast } from "react-toastify";
import api from "../../services/api";
import MediaViewer from "../common/MediaViewer";
import { StatusWorkflowPanel } from "./StatusWorkflowPanel";
import { ConfirmDialog } from "../common/ConfirmDialog";

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
  showApproveRejectButtons?: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
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
  showApproveRejectButtons = true,
  onDelete,
  canDelete = false,
}) => {
  const { t, language } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [solutionInput, setSolutionInput] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | undefined>(idea.difficulty);
  const [savingDifficulty, setSavingDifficulty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [solution, setSolution] = useState<{
    note: string;
    status: string;
  } | null>(null);

  // Auto-save difficulty when changed
  useEffect(() => {
    // Don't save if same as original or if can't modify
    if (!canModifyDifficulty || difficulty === idea.difficulty || !difficulty) {
      return;
    }

    // Debounce to avoid too many API calls
    const timer = setTimeout(() => {
      handleSaveDifficulty();
    }, 500);

    return () => clearTimeout(timer);
  }, [difficulty]);

  // ===== STATUS-BASED ACTION CONTROL =====
  // Determine which actions are allowed based on current status
  // Status workflow: new/pending → under_review → approved/rejected → implemented
  const canApproveReject = ['new', 'pending', 'under_review'].includes(idea.status);
  const canForward = ['new', 'pending', 'under_review'].includes(idea.status);
  const canModifyDifficulty = !['implemented', 'rejected'].includes(idea.status);

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
    // Gửi status 'under_review' để giữ nguyên trạng thái, chỉ thêm ghi chú
    // Difficulty được gửi kèm nếu có
    onUpdateStatus('under_review', newSolution.note, newSolution.status, difficulty);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/ideas/${idea.id}`);
      toast.success(t('idea.delete_success') || 'Đã xóa thành công');
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error('Delete idea error:', error);
      toast.error(error.response?.data?.message || t('idea.delete_error') || 'Không thể xóa ý tưởng');
    } finally {
      setDeleting(false);
    }
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
    // Luôn gửi difficulty hiện tại (đã auto-save rồi)
    // Send status code 'approved', not translated text
    onUpdateStatus('approved', note, t('status.approved'), difficulty);
  };

  const handleReject = () => {
    const note = solution?.note || solutionInput || t('status.rejected');
    setSolution(null);
    setSolutionInput("");
    // Gửi difficulty hiện tại nếu có (đã auto-save rồi)
    // Send status code 'rejected', not translated text
    onUpdateStatus('rejected', note, t('button.reject'), difficulty);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 transition-colors">
      {/* HEADER + ACTIONS (Không cuộn) */}
      <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center flex-shrink-0 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{idea.content}</h2>
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
              {idea.assignedToName && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-xs font-medium">
                  <User size={12} />
                  {t('label.assigned_to')}: {idea.assignedToName}
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

          {/* Approve/Reject buttons - Only show when status allows and prop is true */}
          {canApproveReject && showApproveRejectButtons && (
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

          {/* Delete button - Show for Admin/Manager or owner */}
          {canDelete && (
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center gap-2 transition-colors disabled:opacity-50"
              title={t('button.delete') || 'Xóa'}
            >
              <Trash2 size={16} /> {deleting ? '...' : t('button.delete') || 'Xóa'}
            </button>
          )}
        </div>
      </div>

      {/* NỘI DUNG (Khu vực có thể cuộn) */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto flex-1 bg-gray-50 dark:bg-neutral-900"
      >
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
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

          {/* FINAL RESOLUTION CARD - Giải pháp đã triển khai */}
          {idea.status === 'implemented' && idea.finalResolution && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-700 shadow-lg">
              {/* Decorative check pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                <div className="w-full h-full bg-green-200/30 dark:bg-green-700/20 rounded-full blur-2xl" />
              </div>

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 p-3 bg-green-500 rounded-full shadow-lg shadow-green-200 dark:shadow-green-900/50">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                      ✅ {language === 'ja' ? '実施済みソリューション' : 'GIẢI PHÁP ĐÃ TRIỂN KHAI'}
                    </h3>
                    {idea.implementedAt && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
                        {language === 'ja' ? '実施日' : 'Triển khai'}: {new Date(idea.implementedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1.5 bg-green-600 text-white text-sm font-bold rounded-full shadow">
                    {t('status.implemented')}
                  </span>
                </div>

                {/* Resolution Content */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border-l-4 border-green-500 shadow-sm">
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {language === 'ja' && idea.finalResolutionJa ? idea.finalResolutionJa : idea.finalResolution}
                  </p>
                </div>

                {/* Resolution Detail - Who approved */}
                {idea.finalResolutionDetail && (
                  <div className="mt-4 flex items-center gap-3 text-sm text-green-700 dark:text-green-400">
                    <User size={14} />
                    <span className="font-medium">
                      {language === 'ja' ? '承認者' : 'Chốt bởi'}: {idea.finalResolutionDetail.responder_name || 'Quản lý'}
                    </span>
                    {idea.finalResolutionDetail.created_at && (
                      <>
                        <span className="text-green-400 dark:text-green-600">•</span>
                        <span className="text-green-600 dark:text-green-500">
                          {new Date(idea.finalResolutionDetail.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border-2 border-red-400 dark:border-red-500">
            <h3 className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400 mb-3 text-lg border-b border-red-200 dark:border-red-800 pb-2">
              <FileText size={20} className="text-red-600 dark:text-red-400" />
              {t('idea.content') || 'Nội dung chi tiết'}
            </h3>
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
              {idea.expectedBenefit || (
                <span className="italic text-gray-400">{t('message.no_description') || "Không có mô tả chi tiết"}</span>
              )}
            </p>

            {idea.actualBenefit && (
              <div className="mt-4 p-4 bg-green-50/50 dark:bg-green-900/10 border-l-4 border-green-400 rounded-r-lg">
                <h4 className="text-sm font-bold text-green-900 dark:text-green-300 flex items-center gap-2 mb-1">
                  <Check size={16} />
                  {t('kaizen.actual_benefit')}
                </h4>
                <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                  {idea.actualBenefit}
                </p>
              </div>
            )}

            {idea.imageUrl && !idea.attachments?.length && (
              <img
                src={idea.imageUrl}
                alt={t('idea.attached_image')}
                className="max-w-lg mt-4 rounded-lg shadow-md border border-gray-200 dark:border-neutral-600"
              />
            )}
          </div>

          {/* MỨC ĐỘ HÀI LÒNG - Star Rating Display - Premium Design */}
          {idea.satisfactionRating && (
            <div className="mt-8 relative overflow-hidden group">
              {/* Decorative background glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500" />

              <div className="relative bg-white dark:bg-neutral-800 border border-amber-100 dark:border-amber-900/40 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-amber-50 dark:divide-amber-900/20">
                  {/* Rating Score Side */}
                  <div className="p-6 md:w-1/3 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-2">
                      {t('kaizen.satisfaction_level')}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-gray-900 dark:text-white leading-none">
                        {idea.satisfactionRating}
                      </span>
                      <span className="text-xl font-bold text-gray-400 dark:text-neutral-500">/ 5</span>
                    </div>
                    <div className="flex gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={24}
                          className={`${s <= idea.satisfactionRating!
                            ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]'
                            : 'text-gray-200 dark:text-neutral-700'
                            } transition-all duration-300 transform group-hover:scale-110`}
                          style={{ transitionDelay: `${s * 50}ms` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment Side */}
                  <div className="p-6 md:w-2/3 bg-white dark:bg-neutral-800 flex flex-col justify-center">
                    <div className="relative">
                      {/* Quote icon background */}
                      <MessageSquare className="absolute -top-4 -left-4 w-12 h-12 text-amber-100 dark:text-amber-900/20 opacity-50" />

                      <div className="relative pl-6">
                        <span className="block text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5 px-0.5">
                          {t('kaizen.satisfaction_comment')}
                        </span>
                        <p className="text-gray-700 dark:text-neutral-300 italic text-lg leading-relaxed font-medium">
                          {idea.satisfactionComment ? `"${idea.satisfactionComment}"` : t('common.no_comment') || "Không có nhận xét"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* ĐÁNH GIÁ ĐỘ KHÓ - Auto-save khi chọn */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <DifficultySelector
              value={difficulty}
              onChange={canModifyDifficulty ? setDifficulty : undefined}
              label={t('difficulty.label')}
              disabled={!canModifyDifficulty}
            />
            {canModifyDifficulty && savingDifficulty && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>{t('difficulty.saving') || 'Đang lưu...'}</span>
              </div>
            )}
            {canModifyDifficulty && !savingDifficulty && difficulty !== idea.difficulty && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <Save size={14} />
                Đã lưu tự động
              </p>
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
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-neutral-700">
            <IdeaHistory history={idea.history} departments={departments} />
          </div>

          {/* Chat trao đổi */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('idea.discussion')}</h3>
            <IdeaChat chat={idea.chat} onSend={onSendChat} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t('idea.delete_title') || t('button.delete') || 'Xóa ý tưởng'}
        message={t('idea.delete_confirm') || 'Bạn có chắc chắn muốn xóa ý tưởng này? Hành động này không thể hoàn tác.'}
        type="danger"
        loading={deleting}
      />
    </div>
  );
};
