import React, { useState } from "react";
import { Clock, Check, Users, ShieldAlert, FileText } from "lucide-react";
import { Incident } from "../types";
import PriorityBadge from "./PriorityBadge";

interface IncidentDetailViewProps {
  incident: Incident | null;
  departments: string[];
  onAcknowledge: (id: string) => void;
  onAssign: (id: string, department: string) => void;
}

const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  departments,
  onAcknowledge,
  onAssign,
}) => {
  const [isAssigning, setIsAssigning] = useState(false);

  // Giao diện khi không có sự cố nào được chọn
  if (!incident) {
    return (
      <div className="h-full flex flex-col items-center justify-center dark:bg-slate-800/50 rounded-xl p-6 text-center">
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

  // Giao diện chi tiết sự cố
  return (
    <div
      key={incident.id} // <-- key giúp React reset state (như isAssigning) khi incident thay đổi
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
        <PriorityBadge priority={incident.priority} />
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

      {/* Actions */}
      <div className="flex items-center gap-3">
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
          onClick={() => onAcknowledge(incident.id)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Check size={16} /> <span>Tiếp nhận</span>
        </button>
      </div>
    </div>
  );
};

export default IncidentDetailView;
