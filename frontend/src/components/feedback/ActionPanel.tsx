// src/pages/SensitiveInbox/ActionPanel.tsx
import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { SensitiveMessage } from "./data";

interface Department {
  id: string;
  name: string;
}

interface ActionPanelProps {
  message: SensitiveMessage;
  departments?: Department[];
  loading?: boolean;
  onClose: () => void;
  onForward: (messageId: string, departmentId: string, note: string) => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  message,
  departments = [],
  loading = false,
  onClose,
  onForward,
}) => {
  const [departmentId, setDepartmentId] = useState("");
  const [note, setNote] = useState("");

  const handleForward = () => {
    if (!departmentId) {
      alert("Vui lòng chọn phòng ban để chuyển tiếp.");
      return;
    }
    onForward(message.id, departmentId, note);
  };

  return (
    <div
      className="absolute top-0 right-0 h-full w-[350px] bg-white dark:bg-gray-800 border-l dark:border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out"
      style={{ transform: "translateX(0%)" }}
    >
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Chuyển tiếp Góp ý
        </h3>
        <button
          onClick={onClose}
          disabled={loading}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-5 overflow-y-auto flex-1">
        <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
          Góp ý:{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            "{message.title}"
          </span>
        </p>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Chuyển đến phòng ban
        </label>
        <select
          onChange={(e) => setDepartmentId(e.target.value)}
          value={departmentId}
          disabled={loading}
          className="w-full p-2 border dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">-- Chọn phòng ban --</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium mt-4 mb-1 text-gray-700 dark:text-gray-300">
          Ghi chú (không bắt buộc)
        </label>
        <textarea
          rows={4}
          onChange={(e) => setNote(e.target.value)}
          disabled={loading}
          className="w-full p-2 border dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
      <div className="px-5 py-3 flex justify-end gap-3 border-t dark:border-gray-700 flex-shrink-0">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={handleForward}
          disabled={loading}
          className={`px-4 py-2 text-sm text-white bg-gradient-to-r from-rose-600 to-rose-500 rounded-md hover:from-rose-700 hover:to-rose-600 flex items-center gap-2 transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Send size={16} /> {loading ? "Đang xử lý..." : "Xác nhận"}
        </button>
      </div>
    </div>
  );
};
