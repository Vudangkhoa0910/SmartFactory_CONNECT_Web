import React from "react";
import { ChevronRight } from "lucide-react";
import { Incident } from "../types";
import PriorityBadge from "./PriorityBadge";

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
  const timeAgo = Math.round(
    (Date.now() - incident.timestamp.getTime()) / 60000
  );
  const displayTime = timeAgo < 1 ? "Vừa xong" : `${timeAgo} phút`;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg transition-all duration-200
        border-l-4
        ${
          isSelected
            ? "bg-red-50 dark:bg-slate-700/50 border-red-500 shadow-sm"
            : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/30 border-transparent"
        }
      `}
    >
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate pr-2">
          {incident.title}
        </h4>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
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
