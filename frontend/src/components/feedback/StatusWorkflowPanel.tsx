/**
 * StatusWorkflowPanel.tsx
 * Panel hiển thị workflow trạng thái và cho phép cập nhật nhanh
 * Status workflow panel with quick update functionality
 * 
 * WHITE BOX WORKFLOW (Hòm trắng):
 * ===============================
 * 1. Chờ tiếp nhận (pending) → Ý tưởng/ý kiến mới được gửi lên
 * 2. Đang xem xét (under_review) → Người phụ trách đang đánh giá
 * 3. Đã duyệt (approved) → Ý tưởng được chấp thuận, chờ triển khai
 * 4. Đang triển khai (in_progress) → Đang thực hiện
 * 5. Đã triển khai (implemented) → Hoàn thành
 * 
 * Nhánh phụ:
 * - Từ chối (rejected) → Không phù hợp
 * - Tạm hoãn (on_hold) → Chờ thêm thông tin
 * 
 * PINK BOX WORKFLOW (Hòm hồng - Ẩn danh):
 * =======================================
 * 1. Mới nhận (pending) → Ý kiến ẩn danh mới
 * 2. Coordinator xem xét (under_review) → Coordinator đánh giá
 * 3. Chuyển phòng ban (forwarded) → Gửi đến bộ phận liên quan
 * 4. Phòng ban phản hồi (department_responded) → Có câu trả lời
 * 5. Coordinator duyệt (coordinator_reviewing) → Kiểm tra phản hồi
 * 6. Công khai (published) → Đăng lên bảng tin
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
  XCircle,
  Pause,
  Play,
  ThumbsUp,
  Building2,
  UserCheck,
  Globe,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { toast } from "react-toastify";

// Status types - Extended for complete workflow
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
  | 'implemented'
  | 'in_progress'
  | 'on_hold';

interface StatusStep {
  id: string;
  status: WorkflowStatus | WorkflowStatus[];
  icon: React.ReactNode;
  label: { vi: string; ja: string };
  description?: { vi: string; ja: string };
  color: string;
  bgColor: string;
  borderColor: string;
  allowedActions?: { status: string; label: { vi: string; ja: string }; variant: 'primary' | 'secondary' | 'danger' }[];
}

interface StatusWorkflowPanelProps {
  currentStatus: string;
  workflowType: 'white' | 'pink' | 'incident';
  onStatusChange?: (newStatus: string, note?: string) => Promise<void>;
  hasNewResponse?: boolean;
  responseCount?: number;
  loading?: boolean;
  compact?: boolean;
  difficulty?: string; // Current difficulty level
  requireDifficultyForApproval?: boolean; // If true, require difficulty before approving
  supportCount?: number; // Number of supports for this idea
  remindCount?: number; // Number of reminders for this idea
  onSupport?: () => void; // Handler for support action
  onRemind?: () => void; // Handler for remind action
}

// Define workflows for different types - WHITE BOX with complete flow
const WHITE_BOX_STEPS: StatusStep[] = [
  {
    id: 'new',
    status: 'pending',
    icon: <Clock size={16} />,
    label: { vi: 'Chờ tiếp nhận', ja: '受付待ち' },
    description: { vi: 'Ý tưởng/ý kiến mới chờ được xem xét', ja: '新しいアイデア/意見がレビュー待ち' },
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    allowedActions: [
      { status: 'under_review', label: { vi: 'Bắt đầu xem xét', ja: 'レビュー開始' }, variant: 'primary' },
      { status: 'rejected', label: { vi: 'Từ chối', ja: '却下' }, variant: 'danger' },
    ],
  },
  {
    id: 'reviewing',
    status: 'under_review',
    icon: <Eye size={16} />,
    label: { vi: 'Đang xem xét', ja: 'レビュー中' },
    description: { vi: 'Người phụ trách đang đánh giá ý tưởng', ja: '担当者がアイデアを評価中' },
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    allowedActions: [
      { status: 'approved', label: { vi: 'Phê duyệt', ja: '承認' }, variant: 'primary' },
      { status: 'rejected', label: { vi: 'Từ chối', ja: '却下' }, variant: 'danger' },
      { status: 'on_hold', label: { vi: 'Tạm hoãn', ja: '保留' }, variant: 'secondary' },
    ],
  },
  {
    id: 'approved',
    status: 'approved',
    icon: <ThumbsUp size={16} />,
    label: { vi: 'Đã phê duyệt', ja: '承認済み' },
    description: { vi: 'Ý tưởng được chấp thuận, sẵn sàng triển khai', ja: 'アイデアが承認され、実装準備完了' },
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    allowedActions: [
      { status: 'in_progress', label: { vi: 'Bắt đầu triển khai', ja: '実装開始' }, variant: 'primary' },
    ],
  },
  {
    id: 'in_progress',
    status: 'in_progress',
    icon: <Play size={16} />,
    label: { vi: 'Đang triển khai', ja: '実装中' },
    description: { vi: 'Ý tưởng đang được thực hiện', ja: 'アイデアを実装中' },
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    allowedActions: [
      { status: 'implemented', label: { vi: 'Hoàn thành', ja: '完了' }, variant: 'primary' },
    ],
  },
  {
    id: 'implemented',
    status: 'implemented',
    icon: <CheckCircle2 size={16} />,
    label: { vi: 'Đã triển khai', ja: '実装済み' },
    description: { vi: 'Ý tưởng đã được áp dụng vào thực tế', ja: 'アイデアが実際に適用されました' },
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
];

// Side statuses for White Box (not in main flow)
const WHITE_BOX_SIDE_STATUSES: StatusStep[] = [
  {
    id: 'rejected',
    status: 'rejected',
    icon: <XCircle size={16} />,
    label: { vi: 'Đã từ chối', ja: '却下済み' },
    description: { vi: 'Ý tưởng không phù hợp hoặc không khả thi', ja: 'アイデアが不適切または実現不可能' },
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  {
    id: 'on_hold',
    status: 'on_hold',
    icon: <Pause size={16} />,
    label: { vi: 'Tạm hoãn', ja: '保留中' },
    description: { vi: 'Chờ thêm thông tin hoặc nguồn lực', ja: '追加情報またはリソース待ち' },
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    allowedActions: [
      { status: 'under_review', label: { vi: 'Tiếp tục xem xét', ja: 'レビュー再開' }, variant: 'primary' },
      { status: 'rejected', label: { vi: 'Từ chối', ja: '却下' }, variant: 'danger' },
    ],
  },
];

// PINK BOX workflow - Complete anonymous feedback flow
const PINK_BOX_STEPS: StatusStep[] = [
  {
    id: 'new',
    status: 'pending',
    icon: <Clock size={16} />,
    label: { vi: 'Mới nhận', ja: '新着' },
    description: { vi: 'Ý kiến ẩn danh mới chờ xử lý', ja: '新しい匿名の意見が処理待ち' },
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    allowedActions: [
      { status: 'under_review', label: { vi: 'Tiếp nhận', ja: '受付' }, variant: 'primary' },
    ],
  },
  {
    id: 'coordinator_review',
    status: 'under_review',
    icon: <UserCheck size={16} />,
    label: { vi: 'Coordinator xem xét', ja: 'コーディネーター確認' },
    description: { vi: 'Coordinator đang đánh giá và phân loại', ja: 'コーディネーターが評価・分類中' },
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    allowedActions: [
      { status: 'forwarded', label: { vi: 'Chuyển phòng ban', ja: '部署へ転送' }, variant: 'primary' },
      { status: 'rejected', label: { vi: 'Từ chối', ja: '却下' }, variant: 'danger' },
    ],
  },
  {
    id: 'forwarded',
    status: 'forwarded',
    icon: <Building2 size={16} />,
    label: { vi: 'Chuyển phòng ban', ja: '部署へ転送' },
    description: { vi: 'Đã gửi đến phòng ban liên quan', ja: '関連部署に送信済み' },
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    id: 'responded',
    status: 'department_responded',
    icon: <MessageCircle size={16} />,
    label: { vi: 'Phòng ban phản hồi', ja: '部署回答済み' },
    description: { vi: 'Phòng ban đã gửi câu trả lời', ja: '部署から回答がありました' },
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    allowedActions: [
      { status: 'coordinator_reviewing', label: { vi: 'Duyệt phản hồi', ja: '回答を確認' }, variant: 'primary' },
      { status: 'need_revision', label: { vi: 'Yêu cầu bổ sung', ja: '修正要求' }, variant: 'secondary' },
    ],
  },
  {
    id: 'coordinator_reviewing',
    status: 'coordinator_reviewing',
    icon: <Eye size={16} />,
    label: { vi: 'Coordinator duyệt', ja: 'コーディネーター承認' },
    description: { vi: 'Coordinator kiểm tra phản hồi trước khi công khai', ja: 'コーディネーターが公開前に回答を確認' },
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    allowedActions: [
      { status: 'published', label: { vi: 'Công khai', ja: '公開' }, variant: 'primary' },
      { status: 'need_revision', label: { vi: 'Yêu cầu sửa đổi', ja: '修正要求' }, variant: 'secondary' },
    ],
  },
  {
    id: 'published',
    status: 'published',
    icon: <Globe size={16} />,
    label: { vi: 'Đã công khai', ja: '公開済み' },
    description: { vi: 'Phản hồi đã được đăng lên bảng tin', ja: '回答が掲示板に公開されました' },
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
];

// Side statuses for Pink Box
const PINK_BOX_SIDE_STATUSES: StatusStep[] = [
  {
    id: 'need_revision',
    status: 'need_revision',
    icon: <AlertCircle size={16} />,
    label: { vi: 'Cần bổ sung', ja: '修正必要' },
    description: { vi: 'Phòng ban cần bổ sung thêm thông tin', ja: '部署が追加情報を提供する必要があります' },
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    allowedActions: [
      { status: 'department_responded', label: { vi: 'Gửi lại phản hồi', ja: '回答を再送信' }, variant: 'primary' },
    ],
  },
  {
    id: 'rejected',
    status: 'rejected',
    icon: <XCircle size={16} />,
    label: { vi: 'Đã từ chối', ja: '却下済み' },
    description: { vi: 'Ý kiến không phù hợp để xử lý', ja: '意見が処理に適していません' },
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
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
  difficulty,
  requireDifficultyForApproval = false,
  supportCount = 0,
  remindCount = 0,
  onSupport,
  onRemind,
}) => {
  const { t, language } = useTranslation();
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

  // Get side statuses based on workflow type
  const getSideStatuses = (): StatusStep[] => {
    switch (workflowType) {
      case 'white': return WHITE_BOX_SIDE_STATUSES;
      case 'pink': return PINK_BOX_SIDE_STATUSES;
      default: return [];
    }
  };

  const steps = getSteps();
  const sideStatuses = getSideStatuses();

  // Check if current status is a side status (rejected, on_hold, need_revision)
  const isSideStatus = (): boolean => {
    return sideStatuses.some(step => {
      if (Array.isArray(step.status)) {
        return step.status.includes(currentStatus as WorkflowStatus);
      }
      return step.status === currentStatus;
    });
  };

  // Find current step index (check main steps first, then side statuses)
  const getCurrentStepIndex = (): number => {
    // First check main steps
    const mainIndex = steps.findIndex(step => {
      if (Array.isArray(step.status)) {
        return step.status.includes(currentStatus as WorkflowStatus);
      }
      return step.status === currentStatus;
    });
    if (mainIndex >= 0) return mainIndex;

    // If not found in main steps, it's a side status - return the last completed main step
    // For rejected/on_hold from under_review, return index 1 (under_review)
    // For need_revision from department_responded, return index 3
    if (currentStatus === 'rejected' || currentStatus === 'on_hold') {
      return 1; // under_review step
    }
    if (currentStatus === 'need_revision') {
      return 3; // department_responded step
    }
    return 0;
  };

  // Get current side status step if applicable
  const getCurrentSideStatus = (): StatusStep | null => {
    return sideStatuses.find(step => {
      if (Array.isArray(step.status)) {
        return step.status.includes(currentStatus as WorkflowStatus);
      }
      return step.status === currentStatus;
    }) || null;
  };

  const currentStepIndex = getCurrentStepIndex();
  const currentSideStatus = getCurrentSideStatus();
  const isInSideStatus = isSideStatus();

  // Handle status update
  const handleUpdateStatus = async (newStatus: string) => {
    if (!onStatusChange || updating) return;

    // Validate: Bắt buộc chọn độ khó trước khi duyệt (approved)
    if (requireDifficultyForApproval && newStatus === 'approved' && !difficulty) {
      toast.error(t('difficulty.required_for_approve') || 'Vui lòng chọn độ khó trước khi duyệt');
      return;
    }

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

  // Get allowed actions for current status
  const getAllowedActions = (): { status: string; label: string; variant: 'primary' | 'secondary' | 'danger' }[] => {
    // Check side status first
    if (currentSideStatus?.allowedActions) {
      return currentSideStatus.allowedActions.map(action => ({
        status: action.status,
        label: language === 'ja' ? action.label.ja : action.label.vi,
        variant: action.variant,
      }));
    }

    // Check main steps
    const currentStep = steps[currentStepIndex];
    if (currentStep?.allowedActions) {
      return currentStep.allowedActions.map(action => ({
        status: action.status,
        label: language === 'ja' ? action.label.ja : action.label.vi,
        variant: action.variant,
      }));
    }

    return [];
  };

  const allowedActions = getAllowedActions();

  if (compact && !expanded) {
    // Compact view - just current status
    const displayStep = currentSideStatus || steps[currentStepIndex];
    return (
      <div
        onClick={() => setExpanded(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${displayStep.bgColor} ${displayStep.borderColor} border`}
      >
        <div className={`p-1 rounded-full ${displayStep.color}`}>
          {displayStep.icon}
        </div>
        <span className={`text-sm font-medium ${displayStep.color}`}>
          {language === 'ja' ? displayStep.label.ja : displayStep.label.vi}
        </span>
        {hasNewResponse && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
            <Bell size={10} />
            {language === 'ja' ? '新着' : 'Mới'}
          </span>
        )}
        {/* Support/Remind counts for White Box */}
        {workflowType === 'white' && (supportCount > 0 || remindCount > 0) && (
          <div className="flex items-center gap-2 ml-2">
            {supportCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                <ThumbsUp size={10} />
                {supportCount}
              </span>
            )}
            {remindCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                <Bell size={10} />
                {remindCount}
              </span>
            )}
          </div>
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
            const isActive = index === currentStepIndex && !isInSideStatus;
            const isCompleted = index < currentStepIndex || (isInSideStatus && index <= currentStepIndex);

            return (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? `${step.bgColor} ${step.color} ${step.borderColor} border-2`
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500'
                      }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : step.icon}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center max-w-[80px] ${isActive ? step.color : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                      }`}
                  >
                    {language === 'ja' ? step.label.ja : step.label.vi}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-1 rounded-full transition-colors ${isCompleted
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

        {/* Side Status Alert (if in rejected, on_hold, need_revision) */}
        {isInSideStatus && currentSideStatus && (
          <div className={`mt-4 p-3 rounded-lg ${currentSideStatus.bgColor} ${currentSideStatus.borderColor} border`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${currentSideStatus.color}`}>
                {currentSideStatus.icon}
              </div>
              <div>
                <p className={`font-medium ${currentSideStatus.color}`}>
                  {language === 'ja' ? currentSideStatus.label.ja : currentSideStatus.label.vi}
                </p>
                {currentSideStatus.description && (
                  <p className={`text-xs mt-0.5 ${currentSideStatus.color} opacity-80`}>
                    {language === 'ja' ? currentSideStatus.description.ja : currentSideStatus.description.vi}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Support & Remind Section for White Box */}
        {workflowType === 'white' && !['implemented', 'rejected'].includes(currentStatus) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Support count */}
                <div className="flex items-center gap-2">
                  <ThumbsUp size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {supportCount} {language === 'ja' ? '人が支持' : 'người ủng hộ'}
                  </span>
                </div>
                {/* Remind count */}
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {remindCount} {language === 'ja' ? '件のリマインダー' : 'lần nhắc'}
                  </span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {onSupport && (
                  <button
                    onClick={onSupport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <ThumbsUp size={14} />
                    {language === 'ja' ? '支持' : 'Ủng hộ'}
                  </button>
                )}
                {onRemind && (
                  <button
                    onClick={onRemind}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                  >
                    <Bell size={14} />
                    {language === 'ja' ? 'リマインド' : 'Nhắc nhở'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Update Section - Using allowedActions */}
        {onStatusChange && allowedActions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'ja' ? 'アクション' : 'Hành động'}
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
              {allowedActions.map(({ status, label, variant }) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  disabled={updating}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    variant === 'primary'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : variant === 'danger'
                      ? 'bg-gray-100 dark:bg-neutral-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {updating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : variant === 'primary' ? (
                    <ArrowRight size={14} />
                  ) : variant === 'danger' ? (
                    <XCircle size={14} />
                  ) : (
                    <Pause size={14} />
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
