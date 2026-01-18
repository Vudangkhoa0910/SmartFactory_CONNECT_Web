import React from "react";

interface StatusBadgeProps {
  status: string;
}

// Status display labels (Vietnamese)
const statusLabels: Record<string, string> = {
  // Backend status codes
  'new': 'Mới',
  'pending': 'Chờ xử lý',
  'under_review': 'Đang xem xét',
  'approved': 'Đã phê duyệt',
  'rejected': 'Đã từ chối',
  'implemented': 'Đã triển khai',
  'completed': 'Đã hoàn tất',
  'forwarded': 'Đã chuyển tiếp',
  'escalated': 'Đã chuyển cấp trên',
  // Legacy labels (for backward compatibility)
  'Mới': 'Mới',
  'Đang xem xét': 'Đang xem xét',
  'Đã duyệt': 'Đã phê duyệt',
  'Đã từ chối': 'Đã từ chối',
  'Đã chuyển Manager': 'Đã chuyển cấp trên',
  'Đã triển khai': 'Đã triển khai',
  'Đã hoàn tất': 'Đã hoàn tất',
};

// Status colors by code and legacy labels
const statusColors: Record<string, string> = {
  // Backend status codes
  'new': 'text-gray-700 dark:text-gray-300 border-gray-400 bg-gray-50 dark:bg-gray-900/30',
  'pending': 'text-yellow-700 dark:text-yellow-400 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
  'under_review': 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-900/30',
  'approved': 'text-green-700 dark:text-green-400 border-green-500 bg-green-50 dark:bg-green-900/30',
  'rejected': 'text-red-700 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-900/30',
  'implemented': 'text-teal-700 dark:text-teal-400 border-teal-500 bg-teal-50 dark:bg-teal-900/30',
  'completed': 'text-indigo-700 dark:text-indigo-400 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
  'forwarded': 'text-purple-600 dark:text-purple-400 border-purple-500 bg-purple-50 dark:bg-purple-900/30',
  'escalated': 'text-orange-600 dark:text-orange-400 border-orange-500 bg-orange-50 dark:bg-orange-900/30',
  // Legacy labels
  'Mới': 'text-gray-700 dark:text-gray-300 border-gray-400 bg-gray-50 dark:bg-gray-900/30',
  'Đang xem xét': 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-900/30',
  'Đã duyệt': 'text-green-700 dark:text-green-400 border-green-500 bg-green-50 dark:bg-green-900/30',
  'Đã từ chối': 'text-red-700 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-900/30',
  'Đã chuyển Manager': 'text-orange-600 dark:text-orange-400 border-orange-500 bg-orange-50 dark:bg-orange-900/30',
  'Đã triển khai': 'text-teal-700 dark:text-teal-400 border-teal-500 bg-teal-50 dark:bg-teal-900/30',
  'Đã hoàn tất': 'text-indigo-700 dark:text-indigo-400 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const displayLabel = statusLabels[status] || status;
  const colorClass = statusColors[status] || 'text-gray-700 dark:text-gray-300 border-gray-400 bg-gray-50 dark:bg-gray-900/30';

  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass}`}
    >
      {displayLabel}
    </span>
  );
};
