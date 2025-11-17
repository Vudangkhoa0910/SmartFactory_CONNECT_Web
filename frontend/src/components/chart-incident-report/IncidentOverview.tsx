import React from "react";

const IncidentOverview: React.FC = () => {
  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
        Tổng quan sự cố
      </h2>

      <ul className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
        <li>• Tổng số sự cố: 23</li>
        <li>• Đang chờ xét duyệt: 5</li>
        <li>• Đã xử lý: 18</li>
        <li>• Vi phạm SLA: 2</li>
      </ul>
    </div>
  );
};

export default IncidentOverview;
