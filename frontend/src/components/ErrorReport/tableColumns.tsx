// src/config/tableColumns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { Incident } from "../types/index";
import { PriorityBadge, StatusBadge } from "./Badges";
import { MoreHorizontal } from "lucide-react";

const columnHelper = createColumnHelper<Incident>();

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("title", {
    header: "Tiêu đề",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Trạng thái",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("priority", {
    header: "Ưu tiên",
    cell: (info) => <PriorityBadge priority={info.getValue()} />,
  }),
  columnHelper.accessor("assignedTo", {
    header: "Phòng ban xử lý",
    cell: (info) => info.getValue() || "N/A",
  }),
  columnHelper.accessor("location", { header: "Vị trí" }),
  columnHelper.accessor("createdAt", {
    header: "Ngày tạo",
    cell: (info) => info.getValue().toLocaleDateString("vi-VN"),
  }),
  columnHelper.display({
    id: "actions",
    cell: () => (
      <button className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
        <MoreHorizontal size={16} />
      </button>
    ),
  }),
];
