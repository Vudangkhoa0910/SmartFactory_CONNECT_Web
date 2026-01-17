import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { BellRing, Search, Filter, X, ChevronDown, ArrowUpDown, Calendar, AlertTriangle, AlertCircle, Clock, TrendingUp } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSocketRefresh } from "../../hooks/useSocket";

import { Incident, Priority } from "../../components/ErrorReport/index";
import { useDepartments } from "../../hooks/useDepartments";
import IncidentListItem from "../../components/ErrorReport/IncidentListItem";
import IncidentDetailView from "../../components/ErrorReport/IncidentDetailView";
import { StatisticsCard } from "../../components/ErrorReport/StatisticsCard";

const IncidentWorkspace: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [filterDepartments, setFilterDepartments] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const departmentDropdownRef = useRef<HTMLDivElement>(null);
  const detailViewRef = useRef<HTMLDivElement>(null);
  const { departments } = useDepartments();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Get department names for UI
  const departmentNames = departments.map(d => d.name);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
        setShowDepartmentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch queue data - extracted to useCallback for WebSocket refresh
  const fetchQueue = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/incidents/queue');
      const mappedIncidents = (res.data.data || []).map((item: any) => {
        // Safely parse attachments - handle invalid JSON
        let images: string[] = [];
        if (item.attachments) {
          try {
            const parsed = typeof item.attachments === 'string'
              ? JSON.parse(item.attachments)
              : item.attachments;
            if (Array.isArray(parsed)) {
              images = parsed.map((a: any) => a.path).filter(Boolean);
            }
          } catch (e) {
            console.warn('Could not parse attachments for incident:', item.id);
          }
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          location: item.location,
          createdAt: new Date(item.created_at),
          timestamp: new Date(item.created_at),
          priority: mapPriority(item.priority),
          status: mapStatus(item.status),
          reporter: item.reporter_name || 'Unknown',
          department: item.department_name || 'General',
          history: [],
          images
        };
      });
      setIncidents(mappedIncidents);
    } catch (error) {
      console.error("Failed to fetch incident queue:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchQueue(true); // Show loading only on initial load
  }, [fetchQueue]);

  // WebSocket: Auto-refresh without loading indicator when incidents change
  const silentRefresh = useCallback(() => {
    fetchQueue(false); // Silent refresh - no loading indicator
  }, [fetchQueue]);

  useSocketRefresh(
    ['incident_created', 'incident_updated'],
    silentRefresh,
    ['incidents']
  );

  // Load auto-assign setting (admin only)
  useEffect(() => {
    if (!isAdmin) return;

    const loadAutoAssignSetting = async () => {
      try {
        const res = await api.get('/settings/auto-assign');
        setAutoAssignEnabled(res.data.enabled);
      } catch (error) {
        console.error("Failed to load auto-assign setting:", error);
      }
    };
    loadAutoAssignSetting();
  }, [isAdmin]);

  // Toggle auto-assign handler
  const handleToggleAutoAssign = async () => {
    setAutoAssignLoading(true);
    try {
      const res = await api.patch('/settings/auto-assign', {
        enabled: !autoAssignEnabled
      });
      setAutoAssignEnabled(res.data.enabled);
      toast.success(res.data.enabled
        ? 'Đã bật tự động điều phối'
        : 'Đã tắt tự động điều phối'
      );
    } catch (error) {
      console.error("Failed to toggle auto-assign:", error);
      toast.error('Không thể thay đổi cài đặt');
    } finally {
      setAutoAssignLoading(false);
    }
  };

  const mapPriority = (p: string): Priority => {
    const map: Record<string, Priority> = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Normal',
      'low': 'Low'
    };
    return map[p] || 'Normal';
  };

  const mapStatus = (s: string) => {
    const map: Record<string, string> = {
      'pending': 'pending',
      'assigned': 'in_progress', // Map assigned to processing for this view
      'in_progress': 'in_progress',
      'resolved': 'processed',
      'closed': 'processed'
    };
    return map[s] || 'pending';
  };

  // Lọc ra các sự cố chưa được giải quyết, áp dụng tìm kiếm và lọc, sau đó sắp xếp
  const activeIncidents = useMemo(() => {
    const priorityWeight: Record<Priority, number> = {
      Critical: 4,
      High: 3,
      Normal: 2,
      Low: 1,
    };
    return incidents
      .filter((inc) => {
        // Filter by status
        if (inc.status === "processed") return false;

        // Filter by search term
        const matchesSearch = searchTerm === "" ||
          inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inc.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inc.reporter?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Filter by priority (multi-select)
        if (filterPriorities.length > 0 && !filterPriorities.includes(inc.priority)) return false;

        // Filter by department (multi-select)
        if (filterDepartments.length > 0 && !filterDepartments.includes(inc.department || '')) return false;

        // Filter by date range
        const incDate = inc.timestamp || inc.createdAt;
        if (dateFrom) {
          if (incDate < new Date(dateFrom)) return false;
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (incDate > endDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priorityDiff =
          priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        // Use timestamp if available, otherwise use createdAt
        const aTime = (a.timestamp || a.createdAt).getTime();
        const bTime = (b.timestamp || b.createdAt).getTime();
        return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
      });
  }, [incidents, searchTerm, filterPriorities, filterDepartments, dateFrom, dateTo, sortOrder]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Helper functions for multi-select
  const togglePriority = (priority: Priority) => {
    setFilterPriorities(prev => {
      const newFilters = prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority];
      console.log('Toggle priority:', priority, 'New filters:', newFilters);
      return newFilters;
    });
  };

  const toggleDepartment = (department: string) => {
    setFilterDepartments(prev => {
      const newFilters = prev.includes(department)
        ? prev.filter(d => d !== department)
        : [...prev, department];
      console.log('Toggle department:', department, 'New filters:', newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterPriorities([]);
    setFilterDepartments([]);
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = searchTerm || filterPriorities.length > 0 || filterDepartments.length > 0 || dateFrom || dateTo;

  // Helper to scroll detail view into view on mobile
  const scrollToDetail = () => {
    if (window.innerWidth < 1024 && detailViewRef.current) {
      detailViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Select first incident when loaded
  useEffect(() => {
    if (activeIncidents.length > 0 && !selectedIncident) {
      setSelectedIncident(activeIncidents[0]);
    }
  }, [activeIncidents]);

  // Handler for selecting incident with smooth scroll
  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incidents.find((i) => i.id === incident.id)!);
    scrollToDetail();
  };

  const handleAssign = async (id: string, department: string) => {
    try {
      // Find department  ID from departments hook
      const dept = departments.find(d => d.name === department);
      if (!dept) {
        toast.error('Không tìm thấy phòng ban');
        return;
      }

      // Optimistic update
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, status: "in_progress", department: department } : inc
        )
      );

      // Call API
      await api.post(`/incidents/${id}/quick-assign`, {
        department_id: dept.id
      });

      toast.success(`Đã phân công sự cố cho ${department}`);
      fetchQueue(false);

    } catch (error) {
      console.error("Assign failed", error);
      toast.error('Không thể phân công sự cố');
      fetchQueue(false);
    }
  };

  const handleAcknowledge = async (id: string, feedback: string) => {
    try {
      await api.post(`/incidents/${id}/acknowledge`);

      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, status: "in_progress" } : inc
        )
      );

      // If feedback provided, add comment
      if (feedback) {
        await api.post(`/incidents/${id}/comments`, { comment: feedback });
      }
      toast.success(t('error_report.acknowledge_success'));
    } catch (error) {
      console.error("Acknowledge failed", error);
      toast.error(t('error_report.acknowledge_failed'));
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.put(`/incidents/${id}/resolution`, {
        resolution_notes: t('error_report.resolved_via_command_room'),
        root_cause: "N/A",
        corrective_actions: "N/A"
      });

      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, status: "processed" } : inc
        )
      );

      // Select next
      const currentIndex = activeIncidents.findIndex((inc) => inc.id === id);
      const nextIncidents = activeIncidents.filter((inc) => inc.id !== id);
      if (nextIncidents.length > 0) {
        setSelectedIncident(
          nextIncidents[Math.min(currentIndex, nextIncidents.length - 1)]
        );
      } else {
        setSelectedIncident(null);
      }
      toast.success(t('error_report.resolve_success'));
    } catch (error) {
      console.error("Resolve failed", error);
      toast.error(t('error_report.resolve_failed'));
    }
  };

  return (
    <>
      <PageMeta
        title={`${t('menu.queue')} | SmartFactory CONNECT`}
        description={t('incident.queue_description')}
      />
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('menu.queue')}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('incident.select_to_process')}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-Assign Toggle - Admin only */}
              {isAdmin && (
                <button
                  onClick={handleToggleAutoAssign}
                  disabled={autoAssignLoading}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${autoAssignEnabled
                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    } ${autoAssignLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {autoAssignLoading
                    ? 'Đang xử lý...'
                    : autoAssignEnabled
                      ? 'Tự động điều phối: BẬT'
                      : 'Tự động điều phối: TẮT'
                  }
                </button>
              )}
              <div className="flex items-center gap-2 text-sm font-medium bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
                <BellRing size={16} />
                <span>{activeIncidents.length} {t('incident.waiting')}</span>
              </div>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="mb-4 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatisticsCard
                title="Chờ xử lý"
                value={activeIncidents.length}
                icon={<BellRing size={20} />}
                color="red"
              />
              <StatisticsCard
                title="Nghiêm trọng"
                value={activeIncidents.filter(i => i.priority === 'Critical').length}
                icon={<AlertCircle size={20} />}
                color="red"
              />
              <StatisticsCard
                title="Cao"
                value={activeIncidents.filter(i => i.priority === 'High').length}
                icon={<AlertTriangle size={20} />}
                color="yellow"
              />
              <StatisticsCard
                title="Thời gian TB"
                value={activeIncidents.length > 0
                  ? `${Math.round(activeIncidents.reduce((acc, inc) => {
                    const diffHours = (new Date().getTime() - (inc.timestamp || inc.createdAt).getTime()) / (1000 * 60 * 60);
                    return acc + diffHours;
                  }, 0) / activeIncidents.length)}h`
                  : '0h'
                }
                icon={<Clock size={20} />}
                color="blue"
                subtitle="Thời gian chờ trung bình"
              />
            </div>
          </div>

          {/* Search and Filter Controls - Fixed */}
          <div className="mb-4 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-4">
            <div className="flex flex-col md:flex-row gap-3 transition-all duration-300 ease-out">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={t('error_report.search_placeholder') || 'Tìm kiếm theo tiêu đề, mô tả, vị trí...'}
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

              {/* Department Filter - Multi Select */}
              <div className="relative" ref={departmentDropdownRef}>
                <button
                  onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  className="flex items-center justify-between gap-2 pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors min-w-[180px] w-full md:w-auto"
                >
                  <Filter size={16} className="absolute left-3 text-gray-400" />
                  <span className="flex-1 text-left">
                    {filterDepartments.length === 0
                      ? 'Phòng ban'
                      : `Phòng ban (${filterDepartments.length})`}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDepartmentDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDepartmentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {departmentNames.map((dept) => (
                      <label
                        key={dept}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filterDepartments.includes(dept)}
                          onChange={() => toggleDepartment(dept)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{dept}</span>
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

              {/* Date Filter Toggle */}
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors whitespace-nowrap ${showDateFilter || dateFrom || dateTo
                  ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
                  : 'border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
              >
                <Calendar size={16} />
                {dateFrom || dateTo ? 'Ngày (đã lọc)' : 'Ngày'}
              </button>

              {/* Clear Filters Button */}
              <button
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-300 ease-out ${hasActiveFilters
                  ? 'opacity-100 translate-x-0 pointer-events-auto text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                  : 'opacity-0 translate-x-4 pointer-events-none bg-gray-100'
                  }`}
              >
                Xóa bộ lọc
              </button>
            </div>

            {/* Date Filter Panel */}
            {showDateFilter && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-700 flex flex-wrap gap-3 items-end">
                <div className="min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors cursor-pointer"
                  />
                </div>
                <div className="min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors cursor-pointer"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <X size={14} />
                    Xóa ngày
                  </button>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            <div
              className={`flex flex-wrap gap-2 overflow-hidden transition-all duration-300 ease-in-out ${filterPriorities.length > 0 || filterDepartments.length > 0
                ? 'mt-3 pt-3 border-t border-gray-200 max-h-40 opacity-100'
                : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0'
                }`}
            >
              {filterPriorities.map((priority) => (
                <span
                  key={priority}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-in fade-in slide-in-from-top-2 duration-200"
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
              {filterDepartments.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {dept}
                  <button
                    onClick={() => toggleDepartment(dept)}
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Layout: 2 Columns - No page scroll */}
        <div className="flex-1 px-4 pb-4 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* LEFT PANE: LIST - Scrollable */}
            <div className="lg:col-span-1 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-4 flex flex-col min-h-0">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 px-2 flex-shrink-0">
                {t('incident.list')}
              </h2>
              <div className="overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0 flex-1" style={{ scrollbarGutter: 'stable' }}>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : activeIncidents.length > 0 ? (
                  activeIncidents.map((incident) => (
                    <IncidentListItem
                      key={incident.id}
                      incident={incident}
                      isSelected={selectedIncident?.id === incident.id}
                      onClick={() => handleSelectIncident(incident)}
                    />
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-500 py-8">
                    {t('error_report.no_incidents')}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT PANE: DETAIL - Scrollable */}
            <div className="lg:col-span-2 min-h-0 overflow-y-auto custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
              <div ref={detailViewRef}>
                <IncidentDetailView
                  incident={incidents.find((i) => i.id === selectedIncident?.id) || null}
                  departments={departmentNames}
                  onAcknowledge={handleAcknowledge}
                  onAssign={handleAssign}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncidentWorkspace;
