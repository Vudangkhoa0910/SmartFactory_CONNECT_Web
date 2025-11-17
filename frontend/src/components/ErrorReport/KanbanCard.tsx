// src/components/KanbanCard.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
      className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
          {incident.title}
        </p>
        <PriorityBadge priority={incident.priority} />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        {incident.location}
      </p>
      {incident.assignedTo && (
        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded w-fit">
          👤 {incident.assignedTo}
        </div>
      )}
    </div>
  );
}
