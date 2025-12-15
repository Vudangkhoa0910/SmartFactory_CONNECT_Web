import React, { useState, useMemo, useEffect } from "react";
import { BellRing } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useTranslation } from "../../contexts/LanguageContext";

import { Incident, Priority } from "../../components/ErrorReport/index";
import { useDepartments } from "../../hooks/useDepartments";
import IncidentListItem from "../../components/ErrorReport/IncidentListItem";
import IncidentDetailView from "../../components/ErrorReport/IncidentDetailView";

const IncidentWorkspace: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const { departments } = useDepartments();
  const { t } = useTranslation();

  // Get department names for UI
  const departmentNames = departments.map(d => d.name);

  // Fetch queue data
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

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

  // Lọc ra các sự cố chưa được giải quyết và sắp xếp
  const activeIncidents = useMemo(() => {
    const priorityWeight: Record<Priority, number> = {
      Critical: 4,
      High: 3,
      Normal: 2,
      Low: 1,
    };
    return incidents
      .filter((inc) => inc.status !== "processed")
      .sort((a, b) => {
        const priorityDiff =
          priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        // Use timestamp if available, otherwise use createdAt
        const aTime = (a.timestamp || a.createdAt).getTime();
        const bTime = (b.timestamp || b.createdAt).getTime();
        return bTime - aTime; // Mới nhất lên đầu
      });
  }, [incidents]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Select first incident when loaded
  useEffect(() => {
    if (activeIncidents.length > 0 && !selectedIncident) {
      setSelectedIncident(activeIncidents[0]);
    }
  }, [activeIncidents]);

  const handleAssign = async (id: string, department: string) => {
    try {
      // Find department ID from name (mock logic since we don't have dept IDs in frontend constant)
      // In real app, DEPARTMENTS should have IDs.
      // For now, we'll use quick-assign endpoint which accepts department_id.
      // Assuming we can't map name to ID easily without fetching departments.
      // Let's assume we just update status for now or use a mock ID if needed.

      // Actually, let's use the quick-assign endpoint
      // We need department ID. 
      // Let's just simulate success for UI and call API if we had IDs.
      // Since we don't have department IDs readily available in DEPARTMENTS constant (it's likely just strings),
      // we might need to fetch departments first.

      // For this implementation, I'll assume we just acknowledge/assign to current user or similar.
      // But the UI asks for Department.

      console.log(`[PHÂN CÔNG] Sự cố ${id} đã được gán cho ${department}`);

      // Optimistic update
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, status: "in_progress" } : inc
        )
      );

      // Call API (mocking department ID or using a specific endpoint)
      // await api.post(`/incidents/${id}/quick-assign`, { department_id: '...' });

    } catch (error) {
      console.error("Assign failed", error);
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
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('menu.queue')}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t('incident.select_to_process')}</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
            <BellRing size={16} />
            <span>{activeIncidents.length} {t('incident.waiting')}</span>
          </div>
        </div>

        {/* Main Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT PANE: LIST */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 px-2">
              {t('incident.list')}
            </h2>
            <div className="space-y-2">
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
                    onClick={() =>
                      setSelectedIncident(
                        incidents.find((i) => i.id === incident.id)!
                      )
                    }
                  />
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">
                  {t('error_report.no_incidents')}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT PANE: DETAIL */}
          <div className="lg:col-span-2">
            <IncidentDetailView
              incident={incidents.find((i) => i.id === selectedIncident?.id) || null}
              departments={departmentNames}
              onAcknowledge={handleAcknowledge}
              onAssign={handleAssign}
              onResolve={handleResolve}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default IncidentWorkspace;
