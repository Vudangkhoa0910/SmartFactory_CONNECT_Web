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
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <p className="font-semibold text-sm text-gray-900 flex-1 min-w-0 line-clamp-2">
          {incident.title}
        </p>
        <PriorityBadge priority={incident.priority} />
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {incident.location}
      </p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {incident.assignedTo && (
          <div className="text-xs text-gray-700 font-medium bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
            <User className="w-3 h-3" /> {incident.assignedTo}
          </div>
        )}
        <div className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {formatTime(incident.createdAt)}
        </div>
      </div>
    </div>
  );
}
