// src/pages/AllIncidentsPage.tsx
import React, { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { Incident, Status } from "../../components/types/index";
import { ALL_INCIDENTS_DATA } from "../../components/ErrorReport/mockData";
import { KANBAN_COLUMNS } from "../../components/ErrorReport/appConstants";

import { PageHeader } from "../../components/ErrorReport/PageHeader";
import { KanbanColumn } from "../../components/ErrorReport/KanbanColumn";
import { ListView } from "../../components/ErrorReport/ListView";

export default function AllIncidentsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [incidents, setIncidents] = useState<Incident[]>(ALL_INCIDENTS_DATA);
  const [searchTerm, setSearchTerm] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Cải tiến: Lọc dữ liệu dựa trên searchTerm
  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) =>
        incident.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [incidents, searchTerm]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
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
      setIncidents((prev) =>
        prev.map((i) => (i.id === active.id ? { ...i, status: newStatus } : i))
      );
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

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-full mx-auto">
        <PageHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSearchChange={setSearchTerm}
        />
        <main>
          {viewMode === "kanban" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map((status) => (
                  <KanbanColumn
                    key={status}
                    title={status}
                    incidents={kanbanData[status]}
                  />
                ))}
              </div>
            </DndContext>
          ) : (
            <ListView data={filteredIncidents} />
          )}
        </main>
      </div>
    </div>
  );
}
