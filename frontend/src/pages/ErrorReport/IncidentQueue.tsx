// src/components/IncidentQueue.tsx (UI/UX Refined + Dark Mode + Red Theme)

import React, { useState, useMemo } from "react";
import { BellRing, Clock, Check, Users, ShieldAlert } from "lucide-react";

// =================================================================
// 1. TYPES
// =================================================================
type Priority = "Critical" | "High" | "Normal" | "Low";

interface Incident {
  id: string;
  title: string;
  priority: Priority;
  timestamp: Date;
  source: string;
}

interface IncidentItemProps {
  incident: Incident;
  departments: string[];
  onAcknowledge: (id: string) => void;
  onAssign: (id: string, department: string) => void;
}

// =================================================================
// 2. HELPER: PRIORITY BADGE
// =================================================================
const getPriorityBadgeStyles = (priority: Priority) => {
  switch (priority) {
    case "Critical":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800";
    case "High":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800";
  }
};

// =================================================================
// 3. INCIDENT ITEM (CARD UI / DARK MODE READY)
// =================================================================
const IncidentItem: React.FC<IncidentItemProps> = ({
  incident,
  departments,
  onAcknowledge,
  onAssign,
}) => {
  const [isAssigning, setIsAssigning] = useState(false);

  const timeAgo = Math.round(
    (Date.now() - incident.timestamp.getTime()) / 60000
  );
  const displayTime = timeAgo < 1 ? "Vừa xong" : `${timeAgo} phút trước`;

  return (
    <div
      className="
        bg-white dark:bg-slate-800 
        rounded-xl shadow-md border border-slate-200 dark:border-slate-700
        p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px]
      "
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 pr-4">
          {incident.title}
        </h3>

        <span
          className={`
            text-xs font-bold uppercase px-2.5 py-1 rounded-full border 
            ${getPriorityBadgeStyles(incident.priority)}
          `}
        >
          {incident.priority}
        </span>
      </div>

      {/* Sub info */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-400 mb-5">
        <div className="flex items-center gap-2">
          <Clock size={14} />
          <span>{displayTime}</span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldAlert size={14} />
          <span>Nguồn: {incident.source}</span>
        </div>

        <span className="font-mono text-xs opacity-70">ID: {incident.id}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Assign */}
        <div className="relative">
          <button
            onClick={() => setIsAssigning(!isAssigning)}
            className="
              flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700
              border border-slate-300 dark:border-slate-600 
              text-slate-700 dark:text-slate-200
              rounded-md hover:bg-slate-50 dark:hover:bg-slate-600
              text-sm font-semibold transition-colors
              focus:ring-2 focus:ring-red-500
            "
          >
            <Users size={16} />
            <span>Phân công</span>
          </button>

          {isAssigning && (
            <div
              className="
                absolute left-0 bottom-full mb-2 w-56 
                bg-white dark:bg-slate-700 
                border border-slate-200 dark:border-slate-600 
                rounded-md shadow-lg z-10
                animate-in fade-in zoom-in-95
              "
            >
              <div className="p-2">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      onAssign(incident.id, dept);
                      setIsAssigning(false);
                    }}
                    className="
                      w-full text-left px-3 py-1.5 text-sm 
                      text-slate-700 dark:text-slate-200 
                      hover:bg-slate-100 dark:hover:bg-slate-600 
                      rounded
                    "
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
          className="
            flex items-center gap-2 px-4 py-2 
            bg-red-600 text-white rounded-md 
            hover:bg-red-700 
            text-sm font-semibold shadow-sm 
            transition-colors
            focus:ring-2 focus:ring-offset-2 focus:ring-red-500
          "
        >
          <Check size={16} />
          <span>Tiếp nhận</span>
        </button>
      </div>
    </div>
  );
};

// =================================================================
// 4. MAIN COMPONENT
// =================================================================
const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-7845",
    title: "Mất kết nối máy chủ Database chính",
    priority: "Critical",
    timestamp: new Date(Date.now() - 1 * 60000),
    source: "Hệ thống giám sát",
  },
  {
    id: "INC-7846",
    title: "Lỗi API thanh toán của đối tác VNPAY",
    priority: "High",
    timestamp: new Date(Date.now() - 5 * 60000),
    source: "Báo cáo người dùng",
  },
  {
    id: "INC-7847",
    title: "Máy in tầng 3 không hoạt động",
    priority: "Normal",
    timestamp: new Date(Date.now() - 15 * 60000),
    source: "IT Helpdesk",
  },
  {
    id: "INC-7848",
    title: "Website tải chậm bất thường",
    priority: "High",
    timestamp: new Date(Date.now() - 30 * 60000),
    source: "Hệ thống giám sát",
  },
];

const DEPARTMENTS = [
  "Tổ Vận hành (MA)",
  "Phòng Kỹ thuật (Dev)",
  "IT Helpdesk",
  "An ninh mạng",
];

const IncidentQueue: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);

  const sortedIncidents = useMemo(() => {
    const weight: Record<Priority, number> = {
      Critical: 4,
      High: 3,
      Normal: 2,
      Low: 1,
    };
    return [...incidents].sort((a, b) => {
      const diff = weight[b.priority] - weight[a.priority];
      return diff !== 0 ? diff : b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [incidents]);

  const handleAcknowledge = (id: string) =>
    setIncidents((prev) => prev.filter((inc) => inc.id !== id));

  const handleAssign = (id: string, department: string) => {
    console.log(`[PHÂN CÔNG] ${id} → ${department}`);
    setIncidents((prev) => prev.filter((inc) => inc.id !== id));
  };

  return (
    <div className="min-h-screen  p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Hàng đợi Sự cố
            </h1>

            <div
              className="
              flex items-center gap-2 text-sm font-medium 
              bg-red-100 text-red-700 
              dark:bg-red-900/40 dark:text-red-200
              px-3 py-1 rounded-full
            "
            >
              <BellRing size={16} />
              <span>{incidents.length} sự cố đang chờ</span>
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Các sự cố mới và khẩn cấp cần được xử lý ngay lập tức.
          </p>
        </header>

        {/* List */}
        <main className="space-y-4">
          {sortedIncidents.length > 0 ? (
            sortedIncidents.map((incident) => (
              <IncidentItem
                key={incident.id}
                incident={incident}
                departments={DEPARTMENTS}
                onAcknowledge={handleAcknowledge}
                onAssign={handleAssign}
              />
            ))
          ) : (
            <div
              className="
              text-center py-20 px-6 
              bg-white dark:bg-slate-800
              rounded-lg border-2 border-dashed 
              border-slate-200 dark:border-slate-600
            "
            >
              <div className="inline-block bg-green-100 dark:bg-green-900/40 p-4 rounded-full">
                <Check
                  size={40}
                  className="text-green-600 dark:text-green-300"
                />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
                Tất cả đã được xử lý!
              </h3>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Hiện không có sự cố mới nào trong hàng đợi.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default IncidentQueue;
