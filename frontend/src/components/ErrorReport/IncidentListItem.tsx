import React from "react";
import { ChevronRight } from "lucide-react";
import { Incident } from "../types";
import PriorityBadge from "./PriorityBadge";
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
  const timeAgo = Math.round(
    (Date.now() - incident.timestamp.getTime()) / 60000
  );
  const displayTime =
    timeAgo < 1
      ? t("error_report.just_now")
      : `${timeAgo} ${t("error_report.minutes_ago")}`;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg transition-all duration-200
        border-l-4
        ${
          isSelected
            ? "bg-red-50 dark:bg-neutral-800 border-red-500 shadow-sm"
            : "bg-transparent hover:bg-gray-50 dark:hover:bg-neutral-800/50 border-transparent"
        }
      `}
    >
      <div className="flex justify-between items-center mb-1">
        <h4 className={`font-semibold truncate pr-2 ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
          {incident.title}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
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
