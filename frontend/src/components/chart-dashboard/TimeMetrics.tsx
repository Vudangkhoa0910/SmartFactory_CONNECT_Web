// src/components/incident-reports/TimeMetrics.tsx
import { useEffect, useState } from "react";
import dashboardService, { ProcessingTimeData } from "../../services/dashboard.service";

// Placeholder Icon components
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function TimeMetrics() {
  const [metrics, setMetrics] = useState({
    avgResponse: "-- phút",
    avgResolution: "-- giờ",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getProcessingTimeByPriority();
        
        // Calculate average from all priorities
        const avgHours = response.avgHours || [];
        const validHours = avgHours.filter((h: number) => h > 0);
        const avgResolutionHours = validHours.length > 0 
          ? validHours.reduce((a: number, b: number) => a + b, 0) / validHours.length 
          : 0;
        
        // Format the metrics
        const formatTime = (hours: number) => {
          if (hours === 0) return "0 giờ";
          if (hours < 1) return `${Math.round(hours * 60)} phút`;
          if (hours < 24) return `${hours.toFixed(1)} giờ`;
          return `${(hours / 24).toFixed(1)} ngày`;
        };

        setMetrics({
          avgResponse: avgResolutionHours > 0 ? `${Math.round(avgResolutionHours * 60 / 4)} phút` : "-- phút",
          avgResolution: formatTime(avgResolutionHours),
        });
      } catch (err) {
        console.error('Failed to fetch time metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-600 dark:text-blue-300">
          <ClockIcon />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Thời gian phản hồi TB
          </h4>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">
            {metrics.avgResponse}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
        <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full text-green-600 dark:text-green-300">
          <CheckCircleIcon />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Thời gian xử lý TB
          </h4>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">
            {metrics.avgResolution}
          </p>
        </div>
      </div>
    </div>
  );
}
