// src/components/KanbanCard.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, Clock } from "lucide-react";
import { Incident } from "../types/index";
import { PriorityBadge } from "./Badges";

export function KanbanCard({ incident }: { incident: Incident }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: incident.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

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

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-white dark:bg-neutral-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-600 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <p className="font-semibold text-sm text-gray-900 dark:text-white flex-1 min-w-0 line-clamp-2">
          {incident.title}
        </p>
        <PriorityBadge priority={incident.priority} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {incident.location}
      </p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {incident.assignedTo && (
          <div className="text-xs text-gray-700 dark:text-gray-200 font-medium bg-gray-100 dark:bg-neutral-600 px-2 py-1 rounded-md flex items-center gap-1">
            <User className="w-3 h-3" /> {incident.assignedTo}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {formatTime(incident.createdAt)}
        </div>
      </div>
    </div>
  );
}
