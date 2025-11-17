import React from "react";
import { Clock } from "lucide-react";

export default function NewsHistory() {
  const history = [
    { date: "2025-11-15", title: "Thông báo nghỉ lễ 20/11" },
    { date: "2025-11-10", title: "Cải tiến kho NVL" },
    { date: "2025-11-05", title: "Tối ưu hệ thống QC" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mt-6">
      <h2 className="text-xl font-semibold mb-4">Lịch sử Tin đã đăng</h2>

      <div className="space-y-3">
        {history.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border p-3 rounded-lg dark:border-gray-700"
          >
            <Clock className="text-gray-500 dark:text-gray-300" size={20} />

            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs opacity-70">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
