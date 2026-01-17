// src/config/tableColumns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { Incident } from "../types/index";
import { PriorityBadge, StatusBadge } from "./Badges";
import { MoreHorizontal } from "lucide-react";
import { TFunction } from "i18next";

const columnHelper = createColumnHelper<Incident>();

export const getColumns = (t: TFunction) => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("title", {
    header: t("error_report.table.title"),
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: t("error_report.table.status"),
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("priority", {
    header: t("error_report.table.priority"),
    cell: (info) => <PriorityBadge priority={info.getValue()} />,
  }),
  columnHelper.accessor("assignedTo", {
    header: t("error_report.table.department"),
    cell: (info) => info.getValue() || "N/A",
  }),
  columnHelper.accessor("location", { header: t("error_report.location") }),
  columnHelper.accessor("createdAt", {
    header: t("error_report.table.created_at"),
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
