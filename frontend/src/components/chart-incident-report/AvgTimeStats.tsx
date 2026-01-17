import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import api from "../../services/api";
import { useTranslation } from "../../contexts/LanguageContext";

export default function AvgTimeStats() {
  const { t } = useTranslation();
  const [responseTime, setResponseTime] = useState<string>("--");
  const [resolveTime, setResolveTime] = useState<string>("--");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/incidents/stats');
        const data = response.data.data;
        
        // Convert hours to minutes
        const responseMinutes = Math.round(parseFloat(data.avg_response_hours || 0) * 60);
        const resolveMinutes = Math.round(parseFloat(data.avg_resolution_hours || 0) * 60);
        
        setResponseTime(`${responseMinutes} ${t('time.minutes_ago').replace('trước', '').replace('前', '')}`);
        setResolveTime(`${resolveMinutes} ${t('time.minutes_ago').replace('trước', '').replace('前', '')}`);
      } catch (error) {
        console.error("Failed to fetch time stats:", error);
        setResponseTime("N/A");
        setResolveTime("N/A");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 bg-white border dark:bg-gray-900 dark:border-gray-800 flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        </div>
        <div className="rounded-2xl p-5 bg-white border dark:bg-gray-900 dark:border-gray-800 flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl p-5 bg-white border dark:bg-gray-900 dark:border-gray-800">
        <p className="text-sm text-gray-500">{t('incident_report.time_stats.response_time')}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
          {responseTime}
        </h3>
      </div>

      <div className="rounded-2xl p-5 bg-white border dark:bg-gray-900 dark:border-gray-800">
        <p className="text-sm text-gray-500">{t('incident_report.time_stats.resolve_time')}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
          {resolveTime}
        </h3>
      </div>
    </div>
  );
}
