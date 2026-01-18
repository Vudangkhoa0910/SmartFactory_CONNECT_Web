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
  MapPin,
  Building2,
} from "lucide-react";
import { Incident } from "../types"; // <-- Nhớ cập nhật type này
import { PriorityBadge } from "./Badges";

import { useTranslation } from "../../contexts/LanguageContext";
import TextArea from '../form/input/TextArea';
import MediaViewer from '../common/MediaViewer';

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

      {/* Status Progression Stepper */}
      <div className="mb-6 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 p-4 rounded-xl border border-gray-100 dark:border-neutral-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tiến trình xử lý</h4>
        <div className="flex items-center justify-between">
          {['new', 'assigned', 'in_progress', 'resolved'].map((status, index) => {
            const isActive = incident.status === status;
            const isPassed = ['new', 'assigned', 'in_progress', 'resolved'].indexOf(incident.status) > index;
            const statusLabels: Record<string, string> = {
              new: 'Mới',
              assigned: 'Đã phân',
              in_progress: 'Xử lý',
              resolved: 'Hoàn tất'
            };

            return (
              <div key={status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive
                    ? 'bg-red-500 text-white ring-4 ring-red-100 dark:ring-red-900/30 scale-110'
                    : isPassed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-neutral-700 text-gray-400'
                    }`}>
                    {isPassed ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {statusLabels[status]}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${isPassed ? 'bg-green-500' : 'bg-gray-200 dark:bg-neutral-700'
                    }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignee Info Card */}
      {incident.assignedTo && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-neutral-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Người xử lý</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{incident.assignedTo}</p>
            </div>
            <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Đang xử lý</span>
            </div>
          </div>
        </div>
      )}

      {/* Meta Info - Enhanced with cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-100 dark:border-neutral-700">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Clock size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Thời gian tạo</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {incident.timestamp?.toLocaleString("vi-VN") || new Date(incident.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        {(incident.source || incident.reporter) && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-100 dark:border-neutral-700">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ShieldAlert size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nguồn báo cáo</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {incident.source || incident.reporter}
              </p>
            </div>
          </div>
        )}
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

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-neutral-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Thời gian phản hồi</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(() => {
              const diffHours = (new Date().getTime() - (incident.timestamp || incident.createdAt).getTime()) / (1000 * 60 * 60);
              if (diffHours < 1) return `${Math.round(diffHours * 60)} phút`;
              if (diffHours < 24) return `${Math.round(diffHours)} giờ`;
              return `${Math.round(diffHours / 24)} ngày`;
            })()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-neutral-800 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-2 mb-1">
            <History size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Cập nhật</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {incident.history?.length || 0} lần
          </p>
        </div>
      </div>

      {/* Additional Info Cards - Location & Department */}
      {(incident.location || incident.department) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {incident.location && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-100 dark:border-neutral-700">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <MapPin size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Vị trí</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {incident.location}
                </p>
              </div>
            </div>
          )}

          {incident.department && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-100 dark:border-neutral-700">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Building2 size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Phòng ban</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {incident.department}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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
