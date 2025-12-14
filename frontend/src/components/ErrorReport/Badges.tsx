// src/components/Badges.tsx
import React from "react";
import { Priority, Status } from "../types/index";
import { useTranslation } from "../../contexts/LanguageContext";

// DENSO Theme: Red-white color scheme
export const StatusBadge = ({ status }: { status: Status }) => {
  const { t } = useTranslation();
  const styles: Record<Status, string> = {
    new: "bg-gray-100 text-gray-700",
    assigned: "bg-red-50 text-red-600",
    in_progress: "bg-red-100 text-red-700",
    on_hold: "bg-gray-200 text-gray-600",
    resolved: "bg-red-600 text-white",
    closed: "bg-gray-100 text-gray-500 line-through",
    processed: "bg-red-600 text-white",
    pending: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${styles[status]}`}
    >
      {t(`error_report.status.${status}`)}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const { t } = useTranslation();
  const styles: Record<Priority, string> = {
    Critical: "bg-red-600 text-white",
    High: "bg-red-100 text-red-700",
    Normal: "bg-gray-100 text-gray-700",
    Low: "bg-gray-50 text-gray-500",
  };
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[priority]}`}
    >
      {t(`error_report.priority.${priority}`)}
    </span>
  );
};
