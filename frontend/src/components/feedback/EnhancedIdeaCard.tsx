/**
 * EnhancedIdeaCard.tsx
 * Card hiển thị ý tưởng/góp ý với giao diện đẹp hơn
 * Enhanced idea/feedback card with better UI
 * 
 * Features:
 * - Hiển thị trạng thái với màu sắc rõ ràng
 * - Badge độ khó (A/B/C/D)
 * - Số lượt ủng hộ và nhắc nhở
 * - Preview nội dung
 * - Indicator cho tin nhắn/phản hồi
 */
import React from "react";
import {
  Clock,
  User,
  MessageCircle,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Paperclip,
  Eye,
  EyeOff,
  ThumbsUp,
  Bell,
  Play,
  Pause,
  Globe,
  AlertCircle,
  Lightbulb,
  MessageSquareText,
  Star,
} from "lucide-react";
import { PublicIdea, SensitiveMessage } from "./types";
import { DifficultyBadge } from "./DifficultySelector";
import { useTranslation } from "../../contexts/LanguageContext";

// Status configuration - Extended with all workflow statuses
const statusConfig: Record<
  string,
  { color: string; bgColor: string; borderColor: string; icon: React.ReactNode; label: string; labelJa: string }
> = {
  new: {
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-300 dark:border-gray-600",
    icon: <Clock size={14} />,
    label: "Mới",
    labelJa: "新規",
  },
  pending: {
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    icon: <Clock size={14} />,
    label: "Chờ tiếp nhận",
    labelJa: "受付待ち",
  },
  under_review: {
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-300 dark:border-blue-700",
    icon: <Eye size={14} />,
    label: "Đang xem xét",
    labelJa: "確認中",
  },
  approved: {
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-300 dark:border-green-700",
    icon: <CheckCircle2 size={14} />,
    label: "Đã phê duyệt",
    labelJa: "承認済み",
  },
  in_progress: {
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-300 dark:border-orange-700",
    icon: <Play size={14} />,
    label: "Đang triển khai",
    labelJa: "実装中",
  },
  rejected: {
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-300 dark:border-red-700",
    icon: <XCircle size={14} />,
    label: "Đã từ chối",
    labelJa: "却下",
  },
  on_hold: {
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-300 dark:border-gray-600",
    icon: <Pause size={14} />,
    label: "Tạm hoãn",
    labelJa: "保留中",
  },
  forwarded: {
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-300 dark:border-purple-700",
    icon: <ArrowUpRight size={14} />,
    label: "Đã chuyển tiếp",
    labelJa: "転送済み",
  },
  department_responded: {
    color: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    icon: <MessageCircle size={14} />,
    label: "Phòng ban đã phản hồi",
    labelJa: "部署回答済み",
  },
  coordinator_reviewing: {
    color: "text-cyan-700 dark:text-cyan-300",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    borderColor: "border-cyan-300 dark:border-cyan-700",
    icon: <Eye size={14} />,
    label: "Coordinator duyệt",
    labelJa: "コーディネーター確認",
  },
  need_revision: {
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-300 dark:border-orange-700",
    icon: <AlertCircle size={14} />,
    label: "Cần bổ sung",
    labelJa: "修正必要",
  },
  published: {
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-300 dark:border-green-700",
    icon: <Globe size={14} />,
    label: "Đã công khai",
    labelJa: "公開済み",
  },
  implemented: {
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-300 dark:border-red-700",
    icon: <CheckCircle2 size={14} />,
    label: "Đã triển khai",
    labelJa: "実施済み",
  },
};

interface EnhancedIdeaCardProps {
  idea: PublicIdea | SensitiveMessage;
  isSelected?: boolean;
  onClick?: () => void;
  boxType?: "white" | "pink";
  showPreview?: boolean;
  supportCount?: number; // Number of supports
  remindCount?: number; // Number of reminders
}

export const EnhancedIdeaCard: React.FC<EnhancedIdeaCardProps> = ({
  idea,
  isSelected = false,
  onClick,
  boxType = "white",
  showPreview = true,
  supportCount = 0,
  remindCount = 0,
}) => {
  const { language } = useTranslation();

  // Normalize data from both types
  // FE Fix: Use content/description as the Title (per user request)
  // And use expectedBenefit as the Body content
  const title = "content" in idea ? idea.content : idea.fullContent;
  const content = idea.expectedBenefit || "";
  const status = idea.status;
  const difficulty = idea.difficulty;
  const timestamp = idea.timestamp;
  const isAnonymous = "isAnonymous" in idea ? idea.isAnonymous : false;
  const senderName = "senderName" in idea ? idea.senderName : undefined;
  const hasImage = "imageUrl" in idea && idea.imageUrl;
  const chatCount = "chat" in idea ? idea.chat?.length || 0 : "replies" in idea ? idea.replies?.length || 0 : 0;
  const hasAttachments = "attachments" in idea && idea.attachments && idea.attachments.length > 0;
  const whiteboxSubtype = "whiteboxSubtype" in idea ? idea.whiteboxSubtype : undefined;
  const satisfactionRating = "satisfactionRating" in idea ? idea.satisfactionRating : undefined;

  const config = statusConfig[status] || statusConfig.new;
  const primaryColor = "red"; // Always use red for DENSO brand

  // Check if idea is in a "waiting" state (not yet resolved)
  const isWaiting = ['pending', 'under_review', 'forwarded', 'on_hold'].includes(status);

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200
        ${isSelected
          ? `bg-white dark:bg-neutral-800 shadow-lg border-2 border-${primaryColor}-500 scale-[1.01]`
          : "bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600"
        }
      `}
    >
      {/* Colored top bar */}
      <div
        className={`h-1 ${isSelected
          ? "bg-gradient-to-r from-red-500 to-red-600"
          : "bg-transparent"
          }`}
      />

      <div className="p-4">
        {/* Header with status and difficulty */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status badge */}
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full
                ${config.bgColor} ${config.color} ${config.borderColor} border
              `}
            >
              {config.icon}
              {language === "ja" ? config.labelJa : config.label}
            </span>

            {/* Difficulty badge */}
            {difficulty && <DifficultyBadge difficulty={difficulty} />}

            {/* Anonymous indicator for pink box */}
            {boxType === "pink" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400">
                {isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
                {isAnonymous
                  ? language === "ja"
                    ? "匿名"
                    : "Ẩn danh"
                  : language === "ja"
                    ? "記名"
                    : "Có tên"}
              </span>
            )}

            {/* Subtype badge (Idea/Opinion) */}
            {boxType === "white" && whiteboxSubtype && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${whiteboxSubtype === 'idea'
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                }`}>
                {whiteboxSubtype === 'idea' ? <Lightbulb size={12} /> : <MessageSquareText size={12} />}
                {whiteboxSubtype === 'idea'
                  ? (language === 'ja' ? 'アイデア' : 'Ý tưởng')
                  : (language === 'ja' ? '意見' : 'Ý kiến')}
              </span>
            )}

            {/* Satisfaction Star Rating Badge */}
            {satisfactionRating && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                {satisfactionRating}
              </span>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
            <Clock size={12} />
            {timestamp.toLocaleDateString(language === "ja" ? "ja-JP" : "vi-VN")}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-${primaryColor}-600 dark:group-hover:text-${primaryColor}-400 transition-colors`}
        >
          {title}
        </h3>

        {/* Content preview */}
        {showPreview && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {content}
          </p>
        )}

        {/* Support & Remind counts for White Box */}
        {boxType === "white" && (supportCount > 0 || remindCount > 0) && (
          <div className="flex items-center gap-3 mb-3">
            {supportCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <ThumbsUp size={12} />
                {supportCount} {language === "ja" ? "支持" : "ủng hộ"}
              </span>
            )}
            {remindCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                <Bell size={12} />
                {remindCount} {language === "ja" ? "リマインド" : "nhắc nhở"}
              </span>
            )}
          </div>
        )}

        {/* Waiting indicator - Show when idea is pending action */}
        {boxType === "white" && isWaiting && (
          <div className="mb-3 px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <Clock size={12} className="animate-pulse" />
              {language === "ja" ? "処理待ち中..." : "Đang chờ xử lý..."}
            </p>
          </div>
        )}

        {/* Footer with meta info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-700">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {/* Sender info (for white box) */}
            {boxType === "white" && senderName && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {senderName}
              </span>
            )}

            {/* Attachment indicator */}
            {(hasImage || hasAttachments) && (
              <span className="flex items-center gap-1">
                <Paperclip size={12} />
                {language === "ja" ? "添付" : "Đính kèm"}
              </span>
            )}

            {/* Chat/Reply count */}
            {chatCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle size={12} />
                {chatCount}
              </span>
            )}
          </div>

          {/* Arrow indicator */}
          <ChevronRight
            size={18}
            className={`
              text-gray-400 transition-transform duration-200
              ${isSelected ? "translate-x-1" : "group-hover:translate-x-1"}
            `}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedIdeaCard;
