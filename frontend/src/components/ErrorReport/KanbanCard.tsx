// src/components/KanbanCard.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, MapPin } from "lucide-react";
import { Incident } from "../types/index";
import { PriorityBadge } from "./Badges";
import { TimelineBadge } from "./TimelineBadge";

export function KanbanCard({ incident }: { incident: Incident }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: incident.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // Priority color for left border
  const priorityColors = {
    Critical: 'border-l-red-600',
    High: 'border-l-orange-500',
    Normal: 'border-l-green-600',
    Low: 'border-l-gray-400',
  };

  // Check if incident is assigned
  const isAssigned = (incident.department && incident.department !== 'N/A' && incident.department !== 'Chưa có') ||
    (incident.assignedTo && incident.assignedTo !== 'Chưa phân công' && incident.assignedTo !== 'Unassigned');

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`bg-white dark:bg-neutral-700 p-3 rounded-lg shadow-sm border-l-4 border-t border-r border-b border-gray-200 dark:border-neutral-600 ${priorityColors[incident.priority]} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 rotate-2' : ''
        }`}
    >
      {/* Header with title and priority */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <p className="font-semibold text-sm text-gray-900 dark:text-white flex-1 min-w-0 line-clamp-2 leading-tight">
          {incident.title}
        </p>
        <PriorityBadge priority={incident.priority} />
      </div>

      {/* Location */}
      {incident.location && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{incident.location}</span>
        </div>
      )}

      {/* Footer with assignee/department and time */}
      <div className="flex items-center justify-between gap-2 flex-wrap mt-3 pt-2 border-t border-gray-100 dark:border-neutral-600">
        {incident.department && incident.department !== 'N/A' && incident.department !== 'Chưa có' ? (
          <div className="text-xs text-gray-700 dark:text-gray-200 font-medium bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{incident.department}</span>
          </div>
        ) : incident.assignedTo && incident.assignedTo !== 'Chưa phân công' && incident.assignedTo !== 'Unassigned' ? (
          <div className="text-xs text-gray-700 dark:text-gray-200 font-medium bg-gray-100 dark:bg-neutral-600 px-2 py-1 rounded-md flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{incident.assignedTo}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
            Chưa phân công
          </div>
        )}
        <TimelineBadge createdAt={incident.createdAt} priority={incident.priority} />
      </div>
    </div>
  );
}
