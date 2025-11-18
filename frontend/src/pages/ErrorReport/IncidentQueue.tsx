import React, { useState, useMemo } from "react";
import { BellRing } from "lucide-react";

// GIẢ ĐỊNH: Bạn cần cập nhật định nghĩa type của Incident
// Thêm `status` và `history` vào file types.ts của bạn
/*
export type IncidentStatus = "Chờ tiếp nhận" | "Đang xử lý" | "Đã xử lý";

export interface HistoryEntry {
  timestamp: Date;
  action: string;
  details: string;
}

export interface Incident {
  // ... các trường cũ
  status: IncidentStatus;
  history: HistoryEntry[];
}
*/
import { Incident, Priority } from "../../components/ErrorReport/index";
import {
  INITIAL_INCIDENTS, // <-- Cần cập nhật data mẫu để có status và history
  DEPARTMENTS,
} from "../../components/ErrorReport/data";
import IncidentListItem from "../../components/ErrorReport/IncidentListItem";
import IncidentDetailView from "../../components/ErrorReport/IncidentDetailView";

const IncidentWorkspace: React.FC = () => {
  // Thêm status và history cho dữ liệu ban đầu
  const [incidents, setIncidents] = useState<Incident[]>(
    INITIAL_INCIDENTS.map((inc) => ({
      ...inc,
      status: "Chờ tiếp nhận",
      history: [
        {
          timestamp: inc.timestamp,
          action: "Tạo mới",
          details: "Sự cố đã được ghi nhận vào hệ thống.",
        },
      ],
    }))
  );

  // Lọc ra các sự cố chưa được giải quyết và sắp xếp
  const activeIncidents = useMemo(() => {
    const priorityWeight: Record<Priority, number> = {
      Critical: 4,
      High: 3,
      Normal: 2,
      Low: 1,
    };
    return incidents
      .filter((inc) => inc.status !== "Đã xử lý")
      .sort((a, b) => {
        const priorityDiff =
          priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime(); // Mới nhất lên đầu
      });
  }, [incidents]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    activeIncidents.length > 0 ? activeIncidents[0] : null
  );

  // Hàm cập nhật sự cố
  const updateIncident = (
    id: string,
    updates: Partial<Incident>,
    historyEntry: { action: string; details: string }
  ) => {
    setIncidents((prevIncidents) =>
      prevIncidents.map((inc) => {
        if (inc.id === id) {
          const newHistory = [
            ...inc.history,
            { ...historyEntry, timestamp: new Date() },
          ];
          return { ...inc, ...updates, history: newHistory };
        }
        return inc;
      })
    );
    // Cập nhật lại selectedIncident để view được re-render với data mới
    setSelectedIncident((prev) =>
      prev && prev.id === id ? incidents.find((i) => i.id === id)! : prev
    );
  };

  const handleAssign = (id: string, department: string) => {
    console.log(`[PHÂN CÔNG] Sự cố ${id} đã được gán cho ${department}`);
    updateIncident(
      id,
      { status: "Đang xử lý" },
      { action: "Phân công", details: `Giao cho phòng ban: ${department}` }
    );
  };

  const handleAcknowledge = (id: string, feedback: string) => {
    console.log(`[TIẾP NHẬN] Sự cố ${id} đã được tiếp nhận.`);
    updateIncident(
      id,
      { status: "Đang xử lý" },
      { action: "Tiếp nhận", details: `Phản hồi: ${feedback}` }
    );
  };

  const handleResolve = (id: string) => {
    console.log(`[XỬ LÝ XONG] Sự cố ${id} đã được đóng.`);
    updateIncident(
      id,
      { status: "Đã xử lý" },
      { action: "Hoàn thành", details: "Sự cố đã được xác nhận xử lý và đóng." }
    );
    // Sau khi xử lý xong, chọn sự cố tiếp theo trong danh sách
    const currentIndex = activeIncidents.findIndex((inc) => inc.id === id);
    const nextIncidents = activeIncidents.filter((inc) => inc.id !== id);
    if (nextIncidents.length > 0) {
      setSelectedIncident(
        nextIncidents[Math.min(currentIndex, nextIncidents.length - 1)]
      );
    } else {
      setSelectedIncident(null);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Hàng đợi Sự cố
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 px-3 py-1 rounded-full">
              <BellRing size={16} />
              <span>{activeIncidents.length} sự cố đang chờ</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Chọn một sự cố để xem chi tiết và xử lý.
          </p>
        </header>

        {/* Main Layout: 2 Columns */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT PANE: LIST */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2 px-2">
              Danh sách sự cố
            </h2>
            <div className="space-y-2">
              {activeIncidents.length > 0 ? (
                activeIncidents.map((incident) => (
                  <IncidentListItem
                    key={incident.id}
                    incident={incident}
                    isSelected={selectedIncident?.id === incident.id}
                    onClick={() =>
                      setSelectedIncident(
                        incidents.find((i) => i.id === incident.id)!
                      )
                    }
                  />
                ))
              ) : (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                  Không có sự cố nào.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT PANE: DETAIL */}
          <div className="lg:col-span-2">
            <IncidentDetailView
              incident={incidents.find((i) => i.id === selectedIncident?.id)}
              departments={DEPARTMENTS}
              onAcknowledge={handleAcknowledge}
              onAssign={handleAssign}
              onResolve={handleResolve}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default IncidentWorkspace;
