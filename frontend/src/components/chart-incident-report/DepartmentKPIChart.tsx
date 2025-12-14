import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { getDepartmentKPI, DepartmentKPIData } from "../../services/dashboard.service";

export default function DepartmentKPIChart() {
  const [data, setData] = useState<DepartmentKPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDepartmentKPI(6);
        setData(result);
      } catch (err) {
        console.error("Error fetching department KPI:", err);
        // Fallback data
        setData({
          categories: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"],
          kpiPercentages: [0, 0, 0, 0, 0, 0],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const options: ApexOptions = {
    colors: ["#dc2626"],
    chart: { type: "line", height: 300, toolbar: { show: false } },
    stroke: { curve: "smooth", width: 3 },
    fill: { opacity: 0.2 },
    xaxis: {
      categories: data?.categories || [],
    },
  };

  const series = [{ name: "KPI xử lý (%)", data: data?.kpiPercentages || [] }];

  return (
    <div className="rounded-2xl border p-6 bg-white dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        KPI hiệu suất xử lý sự cố – Phòng ban
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <Chart options={options} series={series} type="line" height={300} />
      )}
    </div>
  );
}
