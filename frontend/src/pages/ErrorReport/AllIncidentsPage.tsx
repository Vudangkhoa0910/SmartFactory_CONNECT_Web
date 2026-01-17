// src/pages/AllIncidentsPage.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
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
import { toast } from "react-toastify";
import { Filter, ChevronDown, X, Search, ArrowUpDown, AlertTriangle, AlertCircle, Activity, CheckCircle2 } from "lucide-react";

import { Incident, Status, Priority } from "../../components/types/index";
import { KANBAN_COLUMNS } from "../../components/ErrorReport/appConstants";

import { PageHeader } from "../../components/ErrorReport/PageHeader";
import { KanbanColumn } from "../../components/ErrorReport/KanbanColumn";
import { KanbanCard } from "../../components/ErrorReport/KanbanCard";
import { ListView } from "../../components/ErrorReport/ListView";
import { StatisticsCard } from "../../components/ErrorReport/StatisticsCard";
import api from "../../services/api";

import { useTranslation } from "../../contexts/LanguageContext";
import { useSocketRefresh } from "../../hooks/useSocket";

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
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<Status[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

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
      'pending': 'new',
      'assigned': 'assigned',
      'in_progress': 'in_progress',
      'on_hold': 'on_hold',
      'resolved': 'resolved',
      'closed': 'closed'
    };
    return map[backendStatus] || 'new';
  };

  const mapToBackendStatus = (frontendStatus: Status): string => {
    const map: Record<Status, string> = {
      'new': 'pending',
      'assigned': 'assigned',
      'in_progress': 'in_progress',
      'on_hold': 'on_hold',
      'resolved': 'resolved',
      'closed': 'closed',
      'processed': 'resolved',
      'pending': 'pending'
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper functions for multi-select
  const togglePriority = (priority: Priority) => {
    setFilterPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const toggleStatus = (status: Status) => {
    setFilterStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterPriorities([]);
    setFilterStatuses([]);
  };

  // Fetch data from API - extracted to useCallback for WebSocket refresh
  const fetchIncidents = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
            assignedTo: item.assigned_to_name || t('error_report.unassigned'),
            location: item.location || t('error_report.na'),
            createdAt: new Date(item.created_at)
          });
        });
      });

      setIncidents(flatList);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [t]);

  // Initial fetch on mount
  useEffect(() => {
    fetchIncidents(true);
  }, [fetchIncidents]);

  // WebSocket: Auto-refresh without loading indicator when incidents change
  const silentRefresh = useCallback(() => {
    fetchIncidents(false);
  }, [fetchIncidents]);

  useSocketRefresh(
    ['incident_created', 'incident_updated'],
    silentRefresh,
    ['incidents']
  );

  // Cải tiến: Lọc dữ liệu dựa trên searchTerm, priority và status
  const filteredIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        // Filter by search term
        const matchesSearch = searchTerm === "" ||
          incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Filter by priority (multi-select)
        if (filterPriorities.length > 0 && !filterPriorities.includes(incident.priority)) return false;

        // Filter by status (multi-select)
        if (filterStatuses.length > 0 && !filterStatuses.includes(incident.status)) return false;

        return true;
      })
        .sort((a, b) => {
          const aTime = a.createdAt.getTime();
          const bTime = b.createdAt.getTime();
          return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
        }),
    [incidents, searchTerm, filterPriorities, filterStatuses, sortOrder]
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
        toast.error(t('error_report.update_status_failed'));
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

  const handleExport = async () => {
    try {
      const response = await api.get('/incidents/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `incidents_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('error_report.export_success'));
    } catch (error) {
      console.error("Failed to export incidents:", error);
      toast.error(t('error_report.export_failed'));
    }
  };

  return (
    <>
      <PageMeta
        title={t('error_report.page_title')}
        description={t('error_report.page_description')}
      />
      <div className="p-4 h-[calc(100vh-4rem)] flex flex-col font-sans overflow-hidden gap-4">
        {/* Header Section */}
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm shrink-0">
          <PageHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onExport={handleExport}
          />

          {/* Statistics Dashboard */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatisticsCard
                title="Tổng sự cố"
                value={filteredIncidents.length}
                icon={<AlertTriangle size={20} />}
                color="gray"
                subtitle={`Trong ${incidents.length} sự cố`}
              />
              <StatisticsCard
                title="Nghiêm trọng"
                value={filteredIncidents.filter(i => i.priority === 'Critical').length}
                icon={<AlertCircle size={20} />}
                color="red"
              />
              <StatisticsCard
                title="Đang xử lý"
                value={filteredIncidents.filter(i => i.status === 'in_progress').length}
                icon={<Activity size={20} />}
                color="blue"
              />
              <StatisticsCard
                title="Đã giải quyết"
                value={filteredIncidents.filter(i => i.status === 'resolved' || i.status === 'closed').length}
                icon={<CheckCircle2 size={20} />}
                color="green"
              />
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-700">
            <div className="flex flex-col md:flex-row gap-3 transition-all duration-300 ease-out">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={t('error_report.search_placeholder') || 'Tìm kiếm...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Priority Filter - Multi Select */}
              <div className="relative" ref={priorityDropdownRef}>
                <button
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  className="flex items-center justify-between gap-2 pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-w-[160px] w-full md:w-auto"
                >
                  <Filter size={16} className="absolute left-3 text-gray-400" />
                  <span className="flex-1 text-left">
                    {filterPriorities.length === 0
                      ? 'Mức độ'
                      : `Mức độ (${filterPriorities.length})`}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showPriorityDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPriorityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 overflow-hidden">
                    {[
                      { value: 'Critical' as Priority, label: 'Nghiêm trọng', color: 'text-red-600' },
                      { value: 'High' as Priority, label: 'Cao', color: 'text-orange-600' },
                      { value: 'Normal' as Priority, label: 'Bình thường', color: 'text-green-700' },
                      { value: 'Low' as Priority, label: 'Thấp', color: 'text-gray-600' },
                    ].map((priority) => (
                      <label
                        key={priority.value}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filterPriorities.includes(priority.value)}
                          onChange={() => togglePriority(priority.value)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className={`text-sm font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Filter - Multi Select */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center justify-between gap-2 pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-w-[180px] w-full md:w-auto"
                >
                  <Filter size={16} className="absolute left-3 text-gray-400" />
                  <span className="flex-1 text-left">
                    {filterStatuses.length === 0
                      ? 'Trạng thái'
                      : `Trạng thái (${filterStatuses.length})`}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {KANBAN_COLUMNS.map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filterStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          {t(`error_report.status.${status}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Button */}
              <button
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
                title={sortOrder === 'newest' ? 'Mới nhất trước' : 'Cũ nhất trước'}
              >
                <ArrowUpDown size={16} />
                {sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
              </button>

              {/* Clear Filters Button */}
              <button
                onClick={clearAllFilters}
                disabled={!searchTerm && filterPriorities.length === 0 && filterStatuses.length === 0}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-300 ease-out ${searchTerm || filterPriorities.length > 0 || filterStatuses.length > 0
                  ? 'opacity-100 translate-x-0 pointer-events-auto text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                  : 'opacity-0 translate-x-4 pointer-events-none bg-gray-100'
                  }`}
              >
                Xóa bộ lọc
              </button>
            </div>

            {/* Active Filters Display */}
            <div
              className={`flex flex-wrap gap-2 overflow-hidden transition-all duration-300 ease-in-out ${filterPriorities.length > 0 || filterStatuses.length > 0
                ? 'mt-3 pt-3 border-t border-gray-200 max-h-40 opacity-100'
                : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0'
                }`}
            >
              {filterPriorities.map((priority) => (
                <span
                  key={priority}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                >
                  {priority}
                  <button
                    onClick={() => togglePriority(priority)}
                    className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {filterStatuses.map((status) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                >
                  {t(`error_report.status.${status}`)}
                  <button
                    onClick={() => toggleStatus(status)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <main className="flex-1 overflow-hidden bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
            </div>
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
    </>
  );
}
