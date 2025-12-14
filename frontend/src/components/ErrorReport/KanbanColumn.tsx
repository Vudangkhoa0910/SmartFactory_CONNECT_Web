// src/components/KanbanColumn.tsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Incident, Status } from "../types/index";
import { KanbanCard } from "./KanbanCard";
import {
  Box,
  CheckCircle,
  FileClock,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

const columnIcons: Record<Status, React.ReactElement> = {
  new: <Box size={16} className="text-gray-500" />,
  assigned: <FileClock size={16} className="text-red-400" />,
  in_progress: <PlayCircle size={16} className="text-red-500" />,
  on_hold: <PauseCircle size={16} className="text-gray-500" />,
  resolved: <CheckCircle size={16} className="text-red-600" />,
  closed: <XCircle size={16} className="text-gray-400" />,
  processed: <CheckCircle size={16} className="text-red-600" />,
  pending: <Box size={16} className="text-gray-500" />,
};

export function KanbanColumn({
  title,
  incidents,
}: {
  title: Status;
  incidents: Incident[];
}) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({
    id: title,
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex-shrink-0 w-72 bg-gray-50 rounded-xl flex flex-col h-full border border-gray-200"
    >
      <div className="p-3 border-b border-gray-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {columnIcons[title]}
          <h3 className="font-semibold text-sm text-gray-800">
            {t(`error_report.status.${title}`)}
          </h3>
        </div>
        <span className="text-xs font-bold text-gray-600 bg-gray-200 rounded-full px-2 py-0.5">
          {incidents.length}
        </span>
      </div>
      <SortableContext
        items={incidents.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          {incidents.map((incident) => (
            <KanbanCard key={incident.id} incident={incident} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
