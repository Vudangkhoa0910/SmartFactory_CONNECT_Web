import React from "react";
import { ChevronRight } from "lucide-react";
import { Incident } from "../types";
import { PriorityBadge } from "./Badges";
import { useTranslation } from "../../contexts/LanguageContext";

interface IncidentListItemProps {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}

const IncidentListItem: React.FC<IncidentListItemProps> = ({
  incident,
  isSelected,
  onClick,
}) => {
  const { t } = useTranslation();

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const incidentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - incidentDate.getTime()) / 86400000);

    // Nếu trong ngày hôm nay, hiển thị giờ
    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Nếu hôm qua
    if (diffDays === 1) {
      return 'Hôm qua';
    }

    // Nếu trong tuần này (dưới 7 ngày)
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }

    // Nếu lâu hơn, hiển thị ngày tháng
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const displayTime = formatTime(incident.createdAt);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg transition-all duration-200
        border-l-4
        ${isSelected
          ? "bg-red-50 dark:bg-neutral-700 border-red-500 shadow-sm"
          : "bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 border-transparent"
        }
      `}
    >
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-semibold text-gray-800 dark:text-white truncate pr-2">
          {incident.title}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">
          {displayTime}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={incident.priority} />
        {isSelected && <ChevronRight size={16} className="text-red-500" />}
      </div>
    </button>
  );
};

export default IncidentListItem;
