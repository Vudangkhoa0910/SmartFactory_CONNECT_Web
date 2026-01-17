/**
 * FeedbackStatsCards.tsx
 * Component hiển thị thống kê tổng quan cho Hòm trắng/hồng
 * Stats overview cards for White Box / Pink Box
 */
import React from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Users,
  Zap,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface StatsData {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  forwarded?: number;
  published?: number;
}

interface FeedbackStatsCardsProps {
  stats: StatsData;
  boxType: "white" | "pink";
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
}

export const FeedbackStatsCards: React.FC<FeedbackStatsCardsProps> = ({
  stats,
  boxType,
  onFilterChange,
  activeFilter = "all",
}) => {
  const { language } = useTranslation();

  const isWhiteBox = boxType === "white";

  const cards = [
    {
      id: "all",
      icon: Inbox,
      label: language === "ja" ? "全件" : "Tổng cộng",
      value: stats.total,
      color: "bg-gradient-to-br from-gray-500 to-gray-600",
      iconBg: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-600 dark:text-gray-400",
    },
    {
      id: "pending",
      icon: Clock,
      label: language === "ja" ? "未処理" : "Chờ xử lý",
      value: stats.pending,
      color: "bg-gradient-to-br from-yellow-400 to-orange-500",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      id: "in_progress",
      icon: Zap,
      label: language === "ja" ? "処理中" : "Đang xử lý",
      value: stats.inProgress,
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "completed",
      icon: CheckCircle2,
      label: language === "ja" ? "完了" : "Hoàn thành",
      value: stats.completed,
      color: "bg-gradient-to-br from-green-400 to-emerald-600",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
  ];

  // Add forwarded/published for pink box
  if (!isWhiteBox) {
    cards.push({
      id: "forwarded",
      icon: ArrowUpRight,
      label: language === "ja" ? "転送済" : "Đã chuyển tiếp",
      value: stats.forwarded || 0,
      color: "bg-gradient-to-br from-red-500 to-red-600",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    });
    cards.push({
      id: "published",
      icon: Users,
      label: language === "ja" ? "公開済" : "Đã công khai",
      value: stats.published || 0,
      color: "bg-gradient-to-br from-red-400 to-red-500",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            onClick={() => onFilterChange?.(card.id)}
            className={`
              relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200
              ${
                isActive
                  ? `${card.color} text-white shadow-lg scale-[1.02]`
                  : "bg-white dark:bg-neutral-800 hover:shadow-md hover:scale-[1.01] border border-gray-200 dark:border-neutral-700"
              }
            `}
          >
            {/* Background decoration */}
            <div
              className={`absolute -right-4 -top-4 w-16 h-16 rounded-full ${
                isActive ? "bg-white/10" : card.iconBg
              } blur-xl`}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p
                  className={`text-xs font-medium mb-1 ${
                    isActive
                      ? "text-white/80"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isActive ? "text-white" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {card.value}
                </p>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  isActive ? "bg-white/20" : card.iconBg
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-white" : card.iconColor}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default FeedbackStatsCards;
