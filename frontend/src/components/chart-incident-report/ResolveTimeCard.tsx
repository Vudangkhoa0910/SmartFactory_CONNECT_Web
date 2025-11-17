import React from "react";

const ResolveTimeCard: React.FC = () => {
  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
        Thời gian xử lý
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Thời gian trung bình để hoàn tất xử lý sự cố.
      </p>

      <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
        45 phút
      </div>
    </div>
  );
};

export default ResolveTimeCard;
