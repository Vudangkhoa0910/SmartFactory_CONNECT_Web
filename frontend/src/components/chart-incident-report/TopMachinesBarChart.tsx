import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import dashboardService, { TopMachineData } from "../../services/dashboard.service";

export default function TopMachinesRoseGoldChart() {
  const [machines, setMachines] = useState<TopMachineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getTopMachinesWithErrors();
        setMachines(response);
      } catch (err) {
        console.error('Failed to fetch top machines:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare data from API or use default empty state
  const seriesData = machines.length > 0 
    ? machines.map(m => m.error_count)
    : [];
  const categories = machines.length > 0
    ? machines.map(m => m.machine_name || m.machine_code)
    : [];
  const maxValue = Math.max(...seriesData, 1);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },

    colors: [
      function ({ value }) {
        const intensity = value / maxValue;
        const startColor = [201, 24, 74];
        const endColor = [255, 204, 213];

        const r = Math.round(
          startColor[0] + (endColor[0] - startColor[0]) * (1 - intensity)
        );
        const g = Math.round(
          startColor[1] + (endColor[1] - startColor[1]) * (1 - intensity)
        );
        const b = Math.round(
          startColor[2] + (endColor[2] - startColor[2]) * (1 - intensity)
        );

        return `rgb(${r}, ${g}, ${b})`;
      },
    ],

    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "65%",
        borderRadius: 8,
        distributed: true,
      },
    },

    dataLabels: {
      enabled: true,
      textAnchor: "start",
      style: {
        colors: ["#374151"],
        fontSize: "13px",
        fontWeight: 500,
      },
      formatter: (val) => `${val} lỗi`,
      offsetX: 10,
      dropShadow: { enabled: false },
    },

    grid: {
      show: true,
      borderColor: "#f3f4f6",
      strokeDashArray: 0,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: categories,
      labels: { style: { colors: "#6b7280", fontSize: "14px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#374151", fontSize: "14px", fontWeight: 600 },
        align: "left",
        offsetX: -10,
      },
    },

    tooltip: {
      theme: "light",
      style: { fontSize: "13px" },
      y: { title: { formatter: () => "Số lần lỗi:" } },
    },

    states: {
      hover: {
        filter: {
          type: "lighten",
          value: 0.03,
        },
      },
    },
  };

  const series = [{ name: "Số lần lỗi", data: seriesData }];

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          Top 10 Thiết Bị Gặp Lỗi Nhiều Nhất
        </h3>
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          Top 10 Thiết Bị Gặp Lỗi Nhiều Nhất
        </h3>
        <div className="flex items-center justify-center h-[400px] text-gray-500">
          Chưa có dữ liệu thiết bị
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        Top 10 Thiết Bị Gặp Lỗi Nhiều Nhất
      </h3>
      <Chart options={options} series={series} type="bar" height={400} />
    </div>
  );
}
