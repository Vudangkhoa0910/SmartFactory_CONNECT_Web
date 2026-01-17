/**
 * StatusWorkflowPanel.tsx
 * Panel hiển thị workflow trạng thái và cho phép cập nhật nhanh
 * Status workflow panel with quick update functionality
 */
import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Send,
  Eye,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bell,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

// Status types
type WorkflowStatus = 
  | 'pending' 
  | 'under_review' 
  | 'forwarded' 
  | 'department_responded' 
  | 'coordinator_reviewing' 
  | 'published' 
  | 'need_revision'
  | 'approved'
  | 'rejected'
  | 'implemented';

interface StatusStep {
  id: string;
  status: WorkflowStatus | WorkflowStatus[];
  icon: React.ReactNode;
  label: { vi: string; ja: string };
  description?: { vi: string; ja: string };
  color: string;
  bgColor: string;
  borderColor: string;
}

interface StatusWorkflowPanelProps {
  currentStatus: string;
  workflowType: 'white' | 'pink' | 'incident';
  onStatusChange?: (newStatus: string, note?: string) => Promise<void>;
  hasNewResponse?: boolean;
  responseCount?: number;
  loading?: boolean;
  compact?: boolean;
}

// Define workflows for different types
const WHITE_BOX_STEPS: StatusStep[] = [
  {
    id: 'new',
    status: 'pending',
    icon: <Clock size={16} />,
    label: { vi: 'Chờ xử lý', ja: '保留中' },
    description: { vi: 'Ý tưởng mới chờ xem xét', ja: '新しいアイデアをレビュー待ち' },
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    id: 'reviewing',
    status: 'under_review',
    icon: <Eye size={16} />,
    label: { vi: 'Đang xem xét', ja: 'レビュー中' },
    description: { vi: 'Đang được đánh giá', ja: '評価中' },
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'approved',
    status: 'approved',
    icon: <CheckCircle2 size={16} />,
    label: { vi: 'Đã duyệt', ja: '承認済み' },
    description: { vi: 'Ý tưởng được chấp thuận', ja: 'アイデアが承認されました' },
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    id: 'implemented',
    status: 'implemented',
    icon: <CheckCircle2 size={16} />,
    label: { vi: 'Đã triển khai', ja: '実装済み' },
    description: { vi: 'Đã áp dụng vào thực tế', ja: '実際に適用されました' },
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
];

const PINK_BOX_STEPS: StatusStep[] = [
  {
    id: 'new',
    status: 'pending',
    icon: <Clock size={16} />,
    label: { vi: 'Mới nhận', ja: '新着' },
    description: { vi: 'Ý kiến ẩn danh mới', ja: '新しい匿名の意見' },
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    id: 'forwarded',
    status: 'forwarded',
    icon: <Send size={16} />,
    label: { vi: 'Đã chuyển tiếp', ja: '転送済み' },
    description: { vi: 'Đã gửi đến phòng ban', ja: '部署に送信済み' },
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'responded',
    status: 'department_responded',
    icon: <MessageCircle size={16} />,
    label: { vi: 'Phòng ban phản hồi', ja: '部署回答済み' },
    description: { vi: 'Đã có phản hồi từ phòng ban', ja: '部署から回答がありました' },
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    id: 'published',
    status: 'published',
    icon: <CheckCircle2 size={16} />,
    label: { vi: 'Đã công khai', ja: '公開済み' },
    description: { vi: 'Phản hồi đã được công khai', ja: '回答が公開されました' },
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
];

const INCIDENT_STEPS: StatusStep[] = [
  {
    id: 'pending',
    status: 'pending',
    icon: <AlertCircle size={16} />,
    label: { vi: 'Mới báo cáo', ja: '新規報告' },
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  {
    id: 'assigned',
    status: ['forwarded', 'under_review'],
    icon: <Send size={16} />,
    label: { vi: 'Đã phân công', ja: '割り当て済み' },
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'resolved',
    status: ['approved', 'implemented'],
    icon: <CheckCircle2 size={16} />,
    label: { vi: 'Đã xử lý', ja: '処理済み' },
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
];

export const StatusWorkflowPanel: React.FC<StatusWorkflowPanelProps> = ({
  currentStatus,
  workflowType,
  onStatusChange,
  hasNewResponse = false,
  responseCount = 0,
  loading = false,
  compact = false,
}) => {
  const { language } = useTranslation();
  const [expanded, setExpanded] = useState(!compact);
  const [updating, setUpdating] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);

  // Get steps based on workflow type
  const getSteps = (): StatusStep[] => {
    switch (workflowType) {
      case 'white': return WHITE_BOX_STEPS;
      case 'pink': return PINK_BOX_STEPS;
      case 'incident': return INCIDENT_STEPS;
      default: return WHITE_BOX_STEPS;
    }
  };

  const steps = getSteps();

  // Find current step index
  const getCurrentStepIndex = (): number => {
    const index = steps.findIndex(step => {
      if (Array.isArray(step.status)) {
        return step.status.includes(currentStatus as WorkflowStatus);
      }
      return step.status === currentStatus;
    });
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  // Handle status update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!onStatusChange || updating) return;
    
    setUpdating(true);
    try {
      await onStatusChange(newStatus, quickNote || undefined);
      setQuickNote('');
      setShowQuickUpdate(false);
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Get available next statuses
  const getNextStatuses = (): { status: string; label: string }[] => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= steps.length) return [];
    
    const nextStep = steps[nextIndex];
    const statuses = Array.isArray(nextStep.status) ? nextStep.status : [nextStep.status];
    
    return statuses.map(s => ({
      status: s,
      label: language === 'ja' ? nextStep.label.ja : nextStep.label.vi
    }));
  };

  const nextStatuses = getNextStatuses();

  if (compact && !expanded) {
    // Compact view - just current status
    const currentStep = steps[currentStepIndex];
    return (
      <div 
        onClick={() => setExpanded(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentStep.bgColor} ${currentStep.borderColor} border`}
      >
        <div className={`p-1 rounded-full ${currentStep.color}`}>
          {currentStep.icon}
        </div>
        <span className={`text-sm font-medium ${currentStep.color}`}>
          {language === 'ja' ? currentStep.label.ja : currentStep.label.vi}
        </span>
        {hasNewResponse && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
            <Bell size={10} />
            {language === 'ja' ? '新着' : 'Mới'}
          </span>
        )}
        <ChevronDown size={16} className="ml-auto text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div 
        className="p-3 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {language === 'ja' ? 'ワークフロー' : 'Luồng trạng thái'}
          </span>
          {hasNewResponse && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
              <Bell size={10} />
              {responseCount > 0 ? responseCount : (language === 'ja' ? '新着' : 'Mới')}
            </span>
          )}
        </div>
        {compact && (
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isFuture = index > currentStepIndex;
            
            return (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? `${step.bgColor} ${step.color} ${step.borderColor} border-2`
                        : 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : step.icon}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                      isActive ? step.color : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                    }`}
                  >
                    {language === 'ja' ? step.label.ja : step.label.vi}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-1 rounded-full transition-colors ${
                        isCompleted
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-neutral-600'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Status Description */}
        {steps[currentStepIndex]?.description && (
          <div className={`mt-4 p-3 rounded-lg ${steps[currentStepIndex].bgColor} ${steps[currentStepIndex].borderColor} border`}>
            <p className={`text-sm ${steps[currentStepIndex].color}`}>
              {language === 'ja' 
                ? steps[currentStepIndex].description.ja 
                : steps[currentStepIndex].description.vi}
            </p>
          </div>
        )}

        {/* Quick Update Section */}
        {onStatusChange && nextStatuses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ja' ? '次のステップへ' : 'Chuyển sang bước tiếp theo'}
              </span>
              <button
                onClick={() => setShowQuickUpdate(!showQuickUpdate)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                {showQuickUpdate 
                  ? (language === 'ja' ? '閉じる' : 'Đóng')
                  : (language === 'ja' ? 'メモを追加' : 'Thêm ghi chú')}
              </button>
            </div>

            {showQuickUpdate && (
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder={language === 'ja' ? 'メモを入力...' : 'Nhập ghi chú...'}
                className="w-full mb-3 px-3 py-2 text-sm border border-gray-200 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={2}
              />
            )}

            <div className="flex flex-wrap gap-2">
              {nextStatuses.map(({ status, label }) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusWorkflowPanel;
