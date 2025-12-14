// src/components/KanbanCard.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User } from "lucide-react";
import { Incident } from "../types/index";
import { PriorityBadge } from "./Badges";

export function KanbanCard({ incident }: { incident: Incident }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: incident.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-sm text-gray-900">
          {incident.title}
        </p>
        <PriorityBadge priority={incident.priority} />
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {incident.location}
      </p>
      {incident.assignedTo && (
        <div className="text-xs text-gray-700 font-medium bg-gray-100 px-2 py-1 rounded-md w-fit flex items-center gap-1">
          <User className="w-3 h-3" /> {incident.assignedTo}
        </div>
      )}
    </div>
  );
}
