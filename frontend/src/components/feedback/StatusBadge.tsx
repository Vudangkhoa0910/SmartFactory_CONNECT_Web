import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colors: Record<string, string> = {
    Mới: "text-gray-700 dark:text-gray-300 border-gray-400",
    "Đang xem xét": "text-blue-600 dark:text-blue-400 border-blue-600",
    "Đã duyệt": "text-green-700 dark:text-green-400 border-green-600",
    "Đã từ chối": "text-red-700 dark:text-red-400 border-red-600",
    "Đã chuyển Manager":
      "text-red-600 dark:text-red-400 border-red-600",
    "Đã triển khai": "text-teal-700 dark:text-teal-400 border-teal-600",
    "Đã hoàn tất": "text-indigo-700 dark:text-indigo-400 border-indigo-600",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${colors[status]}`}
    >
      {status}
    </span>
  );
};
