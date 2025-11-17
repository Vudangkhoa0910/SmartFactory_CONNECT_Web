// src/features/incident-workspace/IncidentWorkspace.tsx

import React, { useState, useMemo } from "react";
import { BellRing } from "lucide-react";

import { Incident, Priority } from "../../components/ErrorReport/index";
import {
  INITIAL_INCIDENTS,
  DEPARTMENTS,
} from "../../components/ErrorReport/data";
import IncidentListItem from "../../components/ErrorReport/IncidentListItem";
import IncidentDetailView from "../../components/ErrorReport/IncidentDetailView";

const IncidentWorkspace: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);

  // Sắp xếp danh sách sự cố theo độ ưu tiên và thời gian
  const sortedIncidents = useMemo(() => {
    const priorityWeight: Record<Priority, number> = {
      Critical: 4,
      High: 3,
      Normal: 2,
      Low: 1,
    };
    return [...incidents].sort((a, b) => {
      const priorityDiff =
        priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime(); // Mới nhất lên đầu
    });
  }, [incidents]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    sortedIncidents.length > 0 ? sortedIncidents[0] : null
  );

  // Hàm xử lý chung sau khi một sự cố được "xử lý" (tiếp nhận hoặc phân công)
  const handleAction = (id: string) => {
    // Tìm vị trí của sự cố hiện tại trong danh sách đã sắp xếp
    const currentIndex = sortedIncidents.findIndex((inc) => inc.id === id);
    // Lọc bỏ sự cố đã xử lý khỏi danh sách gốc
    const remainingIncidents = incidents.filter((inc) => inc.id !== id);
    setIncidents(remainingIncidents);

    // Tự động chọn sự cố tiếp theo một cách thông minh
    if (remainingIncidents.length === 0) {
      setSelectedIncident(null);
    } else {
      // Ưu tiên chọn mục ngay sau mục vừa xóa, nếu không thì chọn mục cuối cùng
      const nextIndex =
        currentIndex >= remainingIncidents.length
          ? remainingIncidents.length - 1
          : currentIndex;
      // Cần tìm lại sự cố trong danh sách đã sắp xếp MỚI
      const newSorted = remainingIncidents.sort((a, b) => {
        const priorityWeight: Record<Priority, number> = {
          Critical: 4,
          High: 3,
          Normal: 2,
          Low: 1,
        };
        const priorityDiff =
          priorityWeight[b.priority] - priorityWeight[a.priority];
        return priorityDiff !== 0
          ? priorityDiff
          : b.timestamp.getTime() - a.timestamp.getTime();
      });
      setSelectedIncident(newSorted[nextIndex]);
    }
  };

  const handleAssign = (id: string, department: string) => {
    console.log(`[PHÂN CÔNG] Sự cố ${id} đã được gán cho ${department}`);
    handleAction(id);
  };

  const handleAcknowledge = (id: string) => {
    console.log(`[TIẾP NHẬN] Sự cố ${id} đã được tiếp nhận.`);
    handleAction(id);
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
              <span>{incidents.length} sự cố đang chờ</span>
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
              {sortedIncidents.length > 0 ? (
                sortedIncidents.map((incident) => (
                  <IncidentListItem
                    key={incident.id}
                    incident={incident}
                    isSelected={selectedIncident?.id === incident.id}
                    onClick={() => setSelectedIncident(incident)}
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
              incident={selectedIncident}
              departments={DEPARTMENTS}
              onAcknowledge={handleAcknowledge}
              onAssign={handleAssign}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default IncidentWorkspace;
