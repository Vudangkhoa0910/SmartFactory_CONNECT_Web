import React, { useState, useEffect } from "react";
import {
  Clock,
  Check,
  Users,
  ShieldAlert,
  FileText,
  Send,
  History,
  Paperclip,
} from "lucide-react";
import { Incident } from "../types"; // <-- Nhớ cập nhật type này
import { PriorityBadge } from "./Badges";

import { useTranslation } from "../../contexts/LanguageContext";
import TextArea from '../form/input/TextArea';
import { MediaViewer } from '../common/MediaViewer';

interface IncidentDetailViewProps {
  incident: Incident | null;
  departments: string[];
  onAcknowledge: (id: string, feedback: string) => void;
  onAssign: (id: string, department: string) => void;
}

const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  departments,
  onAcknowledge,
  onAssign,
}) => {
  const { t } = useTranslation();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Reset state nội bộ khi sự cố được chọn thay đổi
  useEffect(() => {
    setIsAssigning(false);
    setSelectedDepartment(null);
    setShowFeedbackInput(false);
    setFeedback("");
  }, [incident?.id]);

  if (!incident) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-neutral-800 rounded-xl p-6 text-center border border-gray-200 dark:border-neutral-700">
        <div className="inline-block p-4 rounded-full mb-4 bg-gray-50 dark:bg-neutral-700">
          <Check size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t('error_report.empty_queue')}
        </h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {t('error_report.select_incident')}
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
      className="bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-gray-200 dark:border-neutral-700 p-6 animate-in fade-in"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-neutral-700">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {incident.title}
          </h3>
          <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
            {t('error_report.id')}: {incident.id}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PriorityBadge priority={incident.priority} />
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${incident.status === "pending"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
              : incident.status === "in_progress"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              }`}
          >
            {t(`error_report.status.${incident.status}`)}
          </span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span>{incident.timestamp?.toLocaleString("vi-VN") || new Date(incident.createdAt).toLocaleString("vi-VN")}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-gray-400" />
          <span>Nguồn: {incident.source}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-2">
          <FileText size={16} /> Mô tả chi tiết
        </h4>
        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed bg-gray-50 dark:bg-neutral-900 p-4 rounded-md border border-gray-100 dark:border-neutral-700">
          {incident.description}
        </p>
      </div>

      {/* Attachments Section */}
      {incident.attachments && incident.attachments.length > 0 && (
        <div className="mb-6">
          <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-3">
            <Paperclip size={16} /> Đính kèm ({incident.attachments.length})
          </h4>
          <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg border border-gray-100 dark:border-neutral-700">
            <MediaViewer 
              attachments={incident.attachments} 
              baseUrl={import.meta.env.VITE_API_URL || 'http://localhost:3000'}
            />
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="mb-6">
        <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white mb-2">
          <History size={16} /> Lịch sử xử lý
        </h4>
        <div className="border-l-2 border-gray-200 dark:border-neutral-700 ml-2 pl-4 space-y-4">
          {incident.history
            ?.map((entry, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[23px] top-1.5 w-3 h-3 bg-gray-300 dark:bg-neutral-600 rounded-full"></div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {(entry as any).timestamp?.toLocaleString?.("vi-VN") ||
                    ((entry as any).created_at ? new Date((entry as any).created_at).toLocaleString("vi-VN") : '')}
                </p>
                <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                  {entry.action}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(entry as any).details || ''}
                </p>
              </div>
            ))
            .reverse()}
        </div>
      </div>

      {/* Actions */}
      {incident.status !== "processed" && (
        <>
          <div className="flex items-start gap-3">
            {/* Nút hành động cho pending và in_progress */}
            {(incident.status === "pending" || incident.status === "in_progress") && (
              <>
                {/* Assign */}
                <div className="relative">
                  <button
                    onClick={() => setIsAssigning(!isAssigning)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-600 text-sm font-semibold transition-colors focus:ring-2 focus:ring-red-500"
                  >
                    <Users size={16} /> <span>Phân công</span>
                  </button>
                  {isAssigning && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg z-10 animate-in fade-in zoom-in-95">
                      <div className="p-2 max-h-64 overflow-y-auto">
                        {departments.map((dept) => (
                          <button
                            key={dept}
                            onClick={() => setSelectedDepartment(dept)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${selectedDepartment === dept
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium border border-red-200 dark:border-red-800'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700'
                              }`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                      {selectedDepartment && (
                        <div className="p-2 border-t border-gray-200 dark:border-neutral-700 flex gap-2">
                          <button
                            onClick={() => {
                              onAssign(incident.id, selectedDepartment);
                              setIsAssigning(false);
                              setSelectedDepartment(null);
                            }}
                            className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => {
                              setIsAssigning(false);
                              setSelectedDepartment(null);
                            }}
                            className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded text-sm"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Acknowledge - chỉ hiện cho pending */}
                {incident.status === "pending" && (
                  <button
                    onClick={() => setShowFeedbackInput(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={showFeedbackInput}
                  >
                    <Check size={16} /> <span>Tiếp nhận</span>
                  </button>
                )}
              </>
            )}

          </div>

          {/* Feedback Input Form */}
          {showFeedbackInput && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg animate-in fade-in border border-gray-100 dark:border-neutral-700">
              <label
                htmlFor="feedback"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Phản hồi tiếp nhận
              </label>
              <TextArea
                rows={3}
                value={feedback}
                onChange={(value) => setFeedback(value)}
                className="bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-600"
                placeholder="Nhập phản hồi của bạn về sự cố này..."
                enableSpeech={true}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowFeedbackInput(false)}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-md"
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
