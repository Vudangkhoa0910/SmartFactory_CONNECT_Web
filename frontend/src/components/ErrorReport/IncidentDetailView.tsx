import React, { useState, useEffect } from "react";
import {
  Clock,
  Check,
  Users,
  ShieldAlert,
  FileText,
  Send,
  History,
  CheckCircle,
} from "lucide-react";
import { Incident } from "../types"; // <-- Nhớ cập nhật type này
import PriorityBadge from "./PriorityBadge";

interface IncidentDetailViewProps {
  incident: Incident | null;
  departments: string[];
  onAcknowledge: (id: string, feedback: string) => void;
  onAssign: (id: string, department: string) => void;
  onResolve: (id: string) => void; // <-- Thêm prop mới
}

const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  departments,
  onAcknowledge,
  onAssign,
  onResolve,
}) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Reset state nội bộ khi sự cố được chọn thay đổi
  useEffect(() => {
    setIsAssigning(false);
    setShowFeedbackInput(false);
    setFeedback("");
  }, [incident?.id]);

  if (!incident) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-xl p-6 text-center border border-slate-200 dark:border-slate-700">
        <div className="inline-block p-4 rounded-full mb-4">
          <Check size={40} className="text-green-600 dark:text-green-300" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Hàng đợi trống
        </h3>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Chọn một sự cố từ danh sách để xem chi tiết.
        </p>
      </div>
    );
  }

  const handleSendFeedback = () => {
    if (feedback.trim()) {
      onAcknowledge(incident.id, feedback);
    }
  };

  return (
    <div
      key={incident.id}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 animate-in fade-in"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {incident.title}
          </h3>
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
            ID: {incident.id}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PriorityBadge priority={incident.priority} />
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              incident.status === "Chờ tiếp nhận"
                ? "bg-yellow-100 text-yellow-800"
                : incident.status === "Đang xử lý"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {incident.status}
          </span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300 mb-6">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-400" />
          <span>{incident.timestamp.toLocaleString("vi-VN")}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-slate-400" />
          <span>Nguồn: {incident.source}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 mb-2">
          <FileText size={16} /> Mô tả chi tiết
        </h4>
        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md">
          {incident.description}
        </p>
      </div>

      {/* History Section */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 mb-2">
          <History size={16} /> Lịch sử xử lý
        </h4>
        <div className="border-l-2 border-slate-200 dark:border-slate-600 ml-2 pl-4 space-y-4">
          {incident.history
            ?.map((entry, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[23px] top-1.5 w-3 h-3 bg-slate-300 dark:bg-slate-500 rounded-full"></div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {entry.timestamp.toLocaleString("vi-VN")}
                </p>
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                  {entry.action}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {entry.details}
                </p>
              </div>
            ))
            .reverse()}
        </div>
      </div>

      {/* Actions */}
      {incident.status !== "Đã xử lý" && (
        <>
          <div className="flex items-start gap-3">
            {/* Nút hành động cho trạng thái "Chờ tiếp nhận" */}
            {incident.status === "Chờ tiếp nhận" && (
              <>
                {/* Assign */}
                <div className="relative">
                  <button
                    onClick={() => setIsAssigning(!isAssigning)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-semibold transition-colors focus:ring-2 focus:ring-red-500"
                  >
                    <Users size={16} /> <span>Phân công</span>
                  </button>
                  {isAssigning && (
                    <div className="absolute left-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg z-10 animate-in fade-in zoom-in-95">
                      <div className="p-2">
                        {departments.map((dept) => (
                          <button
                            key={dept}
                            onClick={() => {
                              onAssign(incident.id, dept);
                              setIsAssigning(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Acknowledge */}
                <button
                  onClick={() => setShowFeedbackInput(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={showFeedbackInput}
                >
                  <Check size={16} /> <span>Tiếp nhận</span>
                </button>
              </>
            )}

            {/* Nút hành động cho trạng thái "Đang xử lý" */}
            {incident.status === "Đang xử lý" && (
              <button
                onClick={() => onResolve(incident.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle size={16} /> <span>Xác nhận xử lý</span>
              </button>
            )}
          </div>

          {/* Feedback Input Form */}
          {showFeedbackInput && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-in fade-in">
              <label
                htmlFor="feedback"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2"
              >
                Phản hồi tiếp nhận
              </label>
              <textarea
                id="feedback"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500"
                placeholder="Nhập phản hồi của bạn về sự cố này..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowFeedbackInput(false)}
                  className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSendFeedback}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold shadow-sm"
                  disabled={!feedback.trim()}
                >
                  <Send size={14} /> Gửi phản hồi
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IncidentDetailView;
