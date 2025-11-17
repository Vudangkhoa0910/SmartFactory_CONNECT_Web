import React from "react";
import { ActionHistory } from "./types";

interface IdeaHistoryProps {
  history: ActionHistory[];
}

export const IdeaHistory: React.FC<IdeaHistoryProps> = ({ history }) => {
  if (history.length === 0)
    return <p className="text-gray-500 dark:text-gray-400">Chưa có lịch sử.</p>;

  return (
    <div className="space-y-3">
      {history.map((h, idx) => (
        <div
          key={idx}
          className="p-2 border rounded-md hover:shadow-sm transition"
        >
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold">{h.by}</span>
            <span className="italic text-gray-500 dark:text-gray-400">
              {h.time.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="mt-1">
            <span className="font-semibold">{h.action}</span>
            {h.note && (
              <p className="mt-0.5 text-gray-600 dark:text-gray-300">
                Phương hướng: {h.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
