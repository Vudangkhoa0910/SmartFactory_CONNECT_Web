// src/components/KanbanColumn.tsx
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Incident, Status } from "../types/index";
import { KanbanCard } from "./KanbanCard";
import { EmptyState } from "./EmptyState";
import {
  Box,
  CheckCircle,
  FileClock,
  PauseCircle,
  PlayCircle,
  XCircle,
  Inbox,
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

const emptyMessages: Record<Status, { title: string; description: string }> = {
  new: { title: "Không có sự cố mới", description: "Chưa có sự cố mới nào được báo cáo" },
  assigned: { title: "Chưa phân công", description: "Không có sự cố nào đang chờ phân công" },
  in_progress: { title: "Không có công việc", description: "Không có sự cố nào đang được xử lý" },
  on_hold: { title: "Không có tạm dừng", description: "Không có sự cố nào đang tạm dừng" },
  resolved: { title: "Chưa giải quyết", description: "Chưa có sự cố nào được giải quyết" },
  closed: { title: "Chưa đóng", description: "Không có sự cố nào đã đóng" },
  processed: { title: "Chưa xử lý xong", description: "Không có sự cố nào đã xử lý xong" },
  pending: { title: "Không có chờ xử lý", description: "Không có sự cố nào đang chờ" },
};

export function KanbanColumn({
  title,
  incidents,
}: {
  title: Status;
  incidents: Incident[];
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: title,
  });

  const emptyMessage = emptyMessages[title];

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-gray-50 dark:bg-neutral-800 rounded-xl flex flex-col h-full border-2 transition-all duration-200 ${isOver
          ? 'border-red-400 dark:border-red-500 shadow-lg bg-red-50/50 dark:bg-red-900/10'
          : 'border-gray-200 dark:border-neutral-700'
        }`}
    >
      <div className="p-3 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {columnIcons[title]}
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white">
            {t(`error_report.status.${title}`)}
          </h3>
        </div>
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-neutral-700 rounded-full px-2.5 py-1 min-w-[28px] text-center">
          {incidents.length}
        </span>
      </div>
      <SortableContext
        items={incidents.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          {incidents.length === 0 ? (
            <EmptyState
              title={emptyMessage.title}
              description={emptyMessage.description}
              icon={<Inbox size={24} />}
              size="sm"
            />
          ) : (
            incidents.map((incident) => (
              <KanbanCard key={incident.id} incident={incident} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
