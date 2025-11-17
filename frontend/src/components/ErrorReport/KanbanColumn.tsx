// src/components/KanbanColumn.tsx
import React from "react";
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
  "Đã tiếp nhận": <FileClock size={16} className="text-yellow-500" />,
  "Đang xử lý": <PlayCircle size={16} className="text-blue-500" />, // Đổi màu icon
  "Tạm dừng": <PauseCircle size={16} className="text-purple-500" />,
  "Hoàn thành": <CheckCircle size={16} className="text-green-500" />,
  "Đã đóng": <XCircle size={16} className="text-slate-500" />,
};

export function KanbanColumn({
  title,
  incidents,
}: {
  title: Status;
  incidents: Incident[];
}) {
  return (
    <div className="flex-shrink-0 w-72 bg-slate-100 dark:bg-slate-900 rounded-lg">
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {columnIcons[title]}
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            {title}
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5">
          {incidents.length}
        </span>
      </div>
      <SortableContext
        items={incidents.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2 h-[calc(100vh-250px)] overflow-y-auto">
          {incidents.map((incident) => (
            <KanbanCard key={incident.id} incident={incident} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
