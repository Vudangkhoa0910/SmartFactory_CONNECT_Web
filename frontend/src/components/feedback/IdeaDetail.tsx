// src/components/feedback/IdeaDetail.tsx

import React, { useState, useEffect, useRef } from "react";
import { PublicIdea, DifficultyLevel } from "./types";
import { IdeaList, IdeaHistory } from "./IdeaHistory";
import { IdeaChat } from "./IdeaChat";
import { Check, X, ArrowUpRight, Send, Save, Paperclip } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import TextArea from "../form/input/TextArea";
import { DifficultyBadge, DifficultySelector } from "./DifficultySelector";
import { toast } from "react-toastify";
import api from "../../services/api";
import { MediaViewer } from "../common/MediaViewer";

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
}

export const IdeaDetail: React.FC<IdeaDetailProps> = ({
  idea,
  onUpdateStatus,
  onSendChat,
  showForwardButton = true,
  departments = [],
  onRefresh,
}) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [solutionInput, setSolutionInput] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | undefined>(idea.difficulty);
  const [savingDifficulty, setSavingDifficulty] = useState(false);
  const [solution, setSolution] = useState<{
    note: string;
    status: string;
  } | null>(null);

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
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{idea.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('idea.sender')}: {idea.senderName} • {idea.senderId}
            </p>
          </div>
          {idea.difficulty && <DifficultyBadge difficulty={idea.difficulty} />}
        </div>
        <div className="flex items-center gap-2">
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
          {showForwardButton && (
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
          {/* Nội dung chính */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <p className="leading-relaxed text-gray-700 dark:text-gray-300">{idea.content}</p>
            {idea.imageUrl && (
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

          {/* ĐÁNH GIÁ ĐỘ KHÓ - Độc lập */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <DifficultySelector
              value={difficulty}
              onChange={setDifficulty}
              label={t('difficulty.label')}
            />
            {difficulty !== idea.difficulty && (
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

          {/* ĐỀ XUẤT HƯỚNG GIẢI QUYẾT */}
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
                  className={`ml-4 font-semibold text-sm px-3 py-1 rounded-full ${
                    solution.status === t('status.pending')
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
