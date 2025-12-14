// src/components/Badges.tsx
import React from "react";
import { Priority, Status } from "../types/index";

// DENSO Theme: Red-white color scheme
export const StatusBadge = ({ status }: { status: Status }) => {
  const styles: Record<Status, string> = {
    Mới: "bg-gray-100 text-gray-700",
    "Đã tiếp nhận": "bg-red-50 text-red-600",
    "Đang xử lý": "bg-red-100 text-red-700",
    "Tạm dừng": "bg-gray-200 text-gray-600",
    "Hoàn thành": "bg-red-600 text-white",
    "Đã đóng": "bg-gray-100 text-gray-500 line-through",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
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
      {priority}
    </span>
  );
};
