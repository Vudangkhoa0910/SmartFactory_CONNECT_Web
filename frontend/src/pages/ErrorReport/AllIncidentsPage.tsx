// src/pages/AllIncidentsPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { Incident, Status, Priority } from "../../components/types/index";
import { KANBAN_COLUMNS } from "../../components/ErrorReport/appConstants";

import { PageHeader } from "../../components/ErrorReport/PageHeader";
import { KanbanColumn } from "../../components/ErrorReport/KanbanColumn";
import { KanbanCard } from "../../components/ErrorReport/KanbanCard";
import { ListView } from "../../components/ErrorReport/ListView";
import api from "../../services/api";

interface BackendIncident {
  id: string;
  title: string;
  priority: string;
  status: string;
  assigned_to_name: string;
  location: string;
  created_at: string;
}

export default function AllIncidentsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Helper mappings
  const mapStatus = (backendStatus: string): Status => {
    const map: Record<string, Status> = {
      'pending': 'Mới',
      'assigned': 'Đã tiếp nhận',
      'in_progress': 'Đang xử lý',
      'on_hold': 'Tạm dừng',
      'resolved': 'Hoàn thành',
      'closed': 'Đã đóng'
    };
    return map[backendStatus] || 'Mới';
  };

  const mapToBackendStatus = (frontendStatus: Status): string => {
    const map: Record<Status, string> = {
      'Mới': 'pending',
      'Đã tiếp nhận': 'assigned',
      'Đang xử lý': 'in_progress',
      'Tạm dừng': 'on_hold',
      'Hoàn thành': 'resolved',
      'Đã đóng': 'closed'
    };
    return map[frontendStatus] || 'pending';
  };

  const mapPriority = (backendPriority: string): Priority => {
    const map: Record<string, Priority> = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Normal',
      'low': 'Low'
    };
    return map[backendPriority] || 'Normal';
  };

  // Fetch data from API
  const fetchIncidents = async () => {
    try {
      setLoading(true);
      // Use kanban endpoint to get grouped data, then flatten it
      const res = await api.get('/incidents/kanban');
      const groupedData = res.data.data;
      
      const flatList: Incident[] = [];
      
      Object.keys(groupedData).forEach((key) => {
        const items = groupedData[key];
        items.forEach((item: BackendIncident) => {
          flatList.push({
            id: item.id,
            title: item.title,
            priority: mapPriority(item.priority),
            status: mapStatus(item.status),
            assignedTo: item.assigned_to_name || "Unassigned",
            location: item.location || "N/A",
            createdAt: new Date(item.created_at)
          });
        });
      });

      setIncidents(flatList);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cải tiến: Lọc dữ liệu dựa trên searchTerm
  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) =>
        incident.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [incidents, searchTerm]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeIncident = incidents.find((i) => i.id === active.id);
    if (!activeIncident) return;

    // Tìm cột mới dựa trên ID của item bị kéo đè lên hoặc chính ID của cột
    let newStatus: Status | undefined;
    for (const col of KANBAN_COLUMNS) {
      const itemsInCol = incidents.filter((i) => i.status === col);
      if (itemsInCol.some((i) => i.id === over.id) || col === over.id) {
        newStatus = col;
        break;
      }
    }

    // Nếu kéo sang cột khác -> Cập nhật trạng thái
    if (newStatus && activeIncident.status !== newStatus) {
      const oldStatus = activeIncident.status;
      
      // Optimistic update
      setIncidents((prev) =>
        prev.map((i) => (i.id === active.id ? { ...i, status: newStatus! } : i))
      );

      try {
        const backendStatus = mapToBackendStatus(newStatus);
        await api.patch(`/incidents/${active.id}/move`, {
          new_status: backendStatus
        });
      } catch (error) {
        console.error("Failed to update status:", error);
        // Revert on failure
        setIncidents((prev) =>
          prev.map((i) => (i.id === active.id ? { ...i, status: oldStatus } : i))
        );
        alert("Cập nhật trạng thái thất bại");
      }
    }
    // Nếu kéo trong cùng một cột -> Sắp xếp lại vị trí
    else if (active.id !== over.id) {
      setIncidents((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const kanbanData = useMemo(() => {
    return KANBAN_COLUMNS.reduce((acc, status) => {
      acc[status] = filteredIncidents.filter((i) => i.status === status);
      return acc;
    }, {} as Record<Status, Incident[]>);
  }, [filteredIncidents]);

  const activeIncident = activeId ? incidents.find((i) => i.id === activeId) : null;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col font-sans overflow-hidden gap-4">
      {/* Header Section */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <PageHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Content Section */}
      <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        {loading ? (
          <div className="text-center py-10">Đang tải dữ liệu...</div>
        ) : viewMode === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto h-full pb-2 items-start">
              {KANBAN_COLUMNS.map((status) => (
                <KanbanColumn
                  key={status}
                  title={status}
                  incidents={kanbanData[status]}
                />
              ))}
            </div>
            <DragOverlay>
              {activeIncident ? (
                <div className="opacity-80 rotate-3 cursor-grabbing">
                  <KanbanCard incident={activeIncident} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="h-full overflow-auto">
            <ListView data={filteredIncidents} />
          </div>
        )}
      </main>
    </div>
  );
}
