import React from "react";
import { ActionHistory } from "./types";

interface IdeaHistoryProps {
  history: ActionHistory[];
}

export const IdeaHistory: React.FC<IdeaHistoryProps> = ({ history }) => {
  if (history.length === 0)
    return <p className="text-gray-500">Chưa có lịch sử.</p>;

  return (
    <div>
      <h3 className="font-semibold mb-3 text-gray-900">Lịch sử hành động</h3>
      <div className="space-y-3">
        {history.map((h, idx) => (
          <div
            key={idx}
            className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition bg-gray-50"
          >
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-900">{h.by}</span>
              <span className="text-gray-500 text-xs">
                {h.time.toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="mt-1">
              <span className="font-medium text-red-600">{h.action}</span>
              {h.note && (
                <p className="mt-1 text-gray-600 text-sm">
                  Phương hướng: {h.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
