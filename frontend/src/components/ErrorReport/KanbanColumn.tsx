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

const columnIcons: Record<Status, React.ReactElement> = {
  Mới: <Box size={16} className="text-gray-500" />,
  "Đã tiếp nhận": <FileClock size={16} className="text-red-400" />,
  "Đang xử lý": <PlayCircle size={16} className="text-red-500" />,
  "Tạm dừng": <PauseCircle size={16} className="text-gray-500" />,
  "Hoàn thành": <CheckCircle size={16} className="text-red-600" />,
  "Đã đóng": <XCircle size={16} className="text-gray-400" />,
};

export function KanbanColumn({
  title,
  incidents,
}: {
  title: Status;
  incidents: Incident[];
}) {
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
            {title}
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
