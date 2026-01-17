/**
 * EnhancedIdeaCard.tsx
 * Card hiển thị ý tưởng/góp ý với giao diện đẹp hơn
 * Enhanced idea/feedback card with better UI
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
} from "lucide-react";
import { PublicIdea, SensitiveMessage } from "./types";
import { DifficultyBadge } from "./DifficultySelector";
import { useTranslation } from "../../contexts/LanguageContext";

// Status configuration
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
    label: "Chờ xử lý",
    labelJa: "保留中",
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
  rejected: {
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-300 dark:border-red-700",
    icon: <XCircle size={14} />,
    label: "Đã từ chối",
    labelJa: "却下",
  },
  forwarded: {
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-300 dark:border-red-700",
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
  published: {
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-300 dark:border-red-700",
    icon: <CheckCircle2 size={14} />,
    label: "Đã công khai",
    labelJa: "公開済み",
  },
  implemented: {
    color: "text-teal-700 dark:text-teal-300",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
    borderColor: "border-teal-300 dark:border-teal-700",
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
}

export const EnhancedIdeaCard: React.FC<EnhancedIdeaCardProps> = ({
  idea,
  isSelected = false,
  onClick,
  boxType = "white",
  showPreview = true,
}) => {
  const { language } = useTranslation();

  // Normalize data from both types
  const title = idea.title;
  const content = "content" in idea ? idea.content : idea.fullContent;
  const status = idea.status;
  const difficulty = idea.difficulty;
  const timestamp = idea.timestamp;
  const isAnonymous = "isAnonymous" in idea ? idea.isAnonymous : false;
  const senderName = "senderName" in idea ? idea.senderName : undefined;
  const hasImage = "imageUrl" in idea && idea.imageUrl;
  const chatCount = "chat" in idea ? idea.chat?.length || 0 : "replies" in idea ? idea.replies?.length || 0 : 0;

  const config = statusConfig[status] || statusConfig.new;
  const primaryColor = "red"; // Always use red for DENSO brand

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200
        ${
          isSelected
            ? `bg-white dark:bg-neutral-800 shadow-lg border-2 border-${primaryColor}-500 scale-[1.01]`
            : "bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600"
        }
      `}
    >
      {/* Colored top bar */}
      <div
        className={`h-1 ${
          isSelected
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
            {hasImage && (
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
