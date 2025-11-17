// src/components/Badges.tsx
import React from "react";
import { Priority, Status } from "../types/index";

// Cải tiến: Đổi màu "Đang xử lý" sang xanh dương để thân thiện hơn
export const StatusBadge = ({ status }: { status: Status }) => {
  const styles: Record<Status, string> = {
    Mới: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    "Đã tiếp nhận":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Đang xử lý":
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", // Thay đổi từ màu đỏ
    "Tạm dừng":
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Hoàn thành":
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Đã đóng":
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 line-through",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md inline-flex items-center gap-1.5 ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles: Record<Priority, string> = {
    Critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    Normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    Low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[priority]}`}
    >
      {priority}
    </span>
  );
};
