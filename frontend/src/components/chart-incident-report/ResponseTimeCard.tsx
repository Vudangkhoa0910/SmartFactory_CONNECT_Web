import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import api from "../../services/api";
import { useTranslation } from "../../contexts/LanguageContext";

const ResponseTimeCard: React.FC = () => {
  const { t } = useTranslation();
  const [avgTime, setAvgTime] = useState<string>("--");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/incidents/stats');
        const hours = parseFloat(response.data.data.avg_response_hours || 0);
        // Convert hours to minutes for display
        const minutes = Math.round(hours * 60);
        setAvgTime(`${minutes} ${t('time.minutes_ago').replace('trước', '').replace('前', '')}`);
      } catch (error) {
        console.error("Failed to fetch response time:", error);
        setAvgTime("N/A");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [t]);

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
        {t('incident_report.time_stats.response_card_title')}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {t('incident_report.time_stats.response_card_desc')}
      </p>

      <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        ) : (
          avgTime
        )}
      </div>
    </div>
  );
};

export default ResponseTimeCard;
