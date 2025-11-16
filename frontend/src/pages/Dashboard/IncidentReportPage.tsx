import { useState, useRef } from "react";

import IncidentTypePieChart from "../../components/chart-dashboard/IncidentTypePieChart";
import KpiPerformanceChart from "../../components/chart-dashboard/KpiPerformanceChart";
import TimeMetrics from "../../components/chart-dashboard/TimeMetrics";
import TopFaultyMachinesChart from "../../components/chart-dashboard/TopFaultyMachinesChart";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";

const chartSections = {
  timeMetrics: "Chỉ số thời gian",
  incidentTypes: "Thống kê Loại sự cố",
  topMachines: "Top máy móc lỗi",
  kpiPerformance: "KPI hiệu suất phòng ban",
};
type ChartKey = keyof typeof chartSections;

// const AdjustmentsIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     className="h-5 w-5"
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//     strokeWidth={2}
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M12 6V4m0 16v-2m-6.364-3.636l1.414-1.414m12.728 0l-1.414-1.414M4 12H2m18 0h-2M6.343 7.757l1.414 1.414m12.728 0l-1.414 1.414M12 20a8 8 0 100-16 8 8 0 000 16z"
//     />
//   </svg>
// );

export default function IncidentReportPage() {
  const [visibleCharts, setVisibleCharts] = useState<Record<ChartKey, boolean>>(
    {
      timeMetrics: true,
      incidentTypes: true,
      topMachines: true,
      kpiPerformance: true,
    }
  );
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // SỬA LỖI Ở ĐÂY: Thêm type assertion
  useOnClickOutside(dropdownRef as React.RefObject<HTMLElement>, () =>
    setDropdownOpen(false)
  );

  const handleVisibilityChange = (chartKey: ChartKey) => {
    setVisibleCharts((prev) => ({ ...prev, [chartKey]: !prev[chartKey] }));
  };

  const selectAll = () => {
    const allVisible = (Object.keys(chartSections) as ChartKey[]).reduce(
      (acc, key) => {
        acc[key] = true;
        return acc;
      },
      {} as Record<ChartKey, boolean>
    );
    setVisibleCharts(allVisible);
  };

  const deselectAll = () => {
    const allHidden = (Object.keys(chartSections) as ChartKey[]).reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {} as Record<ChartKey, boolean>
    );
    setVisibleCharts(allHidden);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* <PageMeta title="Dashboard Báo cáo sự cố" description="Trang tổng quan và phân tích các sự cố." /> */}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Tổng quan Sự cố
        </h1>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span>Tùy chọn hiển thị</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border dark:border-gray-700">
              <div className="p-4 space-y-3">
                <p className="font-semibold text-gray-800 dark:text-white">
                  Hiển thị biểu đồ
                </p>
                {(Object.entries(chartSections) as [ChartKey, string][]).map(
                  ([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCharts[key]}
                        onChange={() => handleVisibilityChange(key)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-600 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  )
                )}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex justify-around">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Chọn tất cả
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {visibleCharts.timeMetrics && (
          <div className="col-span-12">
            <TimeMetrics />
          </div>
        )}
        {visibleCharts.incidentTypes && (
          <div className="col-span-12 xl:col-span-6">
            <IncidentTypePieChart />
          </div>
        )}
        {visibleCharts.topMachines && (
          <div className="col-span-12 xl:col-span-6">
            <TopFaultyMachinesChart />
          </div>
        )}
        {visibleCharts.kpiPerformance && (
          <div className="col-span-12">
            <KpiPerformanceChart />
          </div>
        )}
      </div>
    </div>
  );
}
