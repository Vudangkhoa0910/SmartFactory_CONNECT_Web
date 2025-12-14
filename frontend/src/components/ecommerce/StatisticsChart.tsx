import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import { getIncidentTrend, IncidentTrendData } from "../../services/dashboard.service";

export default function StatisticsChart() {
  const [trendData, setTrendData] = useState<IncidentTrendData | null>(null);
  const [period, setPeriod] = useState<string>("year");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getIncidentTrend(period);
        setTrendData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching incident trend:", err);
        setError("Không thể tải dữ liệu");
        // Fallback data
        setTrendData({
          categories: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
          reported: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          resolved: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#dc2626", "#ef4444"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "dd MMM yyyy",
      },
    },
    xaxis: {
      type: "category",
      categories: trendData?.categories || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Đã xử lý",
      data: trendData?.resolved || [],
    },
    {
      name: "Đã báo cáo",
      data: trendData?.reported || [],
    },
  ];

  const handleTabChange = (tab: string) => {
    const periodMap: Record<string, string> = {
      "12 tháng": "year",
      "6 tháng": "half",
      "30 ngày": "month",
    };
    setPeriod(periodMap[tab] || "year");
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Xu hướng sự cố
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Sự cố đã báo cáo vs Đã xử lý
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab onTabChange={handleTabChange} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[310px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[310px] text-gray-500">
          {error}
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[1000px] xl:min-w-full">
            <Chart options={options} series={series} type="area" height={310} />
          </div>
        </div>
      )}
    </div>
  );
}
