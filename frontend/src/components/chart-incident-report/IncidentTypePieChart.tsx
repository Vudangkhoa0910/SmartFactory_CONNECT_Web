import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import api from "../../services/api";

interface IncidentTypeData {
  incident_type: string;
  count: number;
  percentage: number;
}

// Map incident types to Vietnamese labels
const INCIDENT_TYPE_LABELS: Record<string, string> = {
  machine: "Máy móc",
  quality: "Chất lượng",
  safety: "An toàn",
  environment: "Môi trường",
  other: "Khác"
};

export default function IncidentTypeModernRougeChart() {
  const [data, setData] = useState<IncidentTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/incidents/stats');
        setData(response.data.data.byType || []);
      } catch (error) {
        console.error('Failed to fetch incident type data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const labels = data.map(item => INCIDENT_TYPE_LABELS[item.incident_type] || item.incident_type);
  const series = data.map(item => Number(item.count));

  // **1. Bảng màu mới: Đỏ -> Hồng -> Hồng Pastel**
  const colors = ["#e5386d", "#ff4d6d", "#ff8fa3", "#ffb3c1", "#ffccd5"];
  const totalIncidents = series.reduce((a, b) => a + b, 0);

  const [selectedSlice, setSelectedSlice] = useState<{
    index: number;
    label: string;
    value: number;
  } | null>(null);

  const options: ApexOptions = {
    labels,
    colors,
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      // Giữ nguyên logic tương tác vì nó đã rất tốt
      events: {
        click: (event, chartContext, config) => {
          if (config.dataPointIndex === -1) setSelectedSlice(null);
        },
        dataPointSelection: (event, chartContext, config) => {
          const clickedIndex = config.dataPointIndex;
          setSelectedSlice((current) => {
            if (current && current.index === clickedIndex) return null;
            return {
              index: clickedIndex,
              label: labels[clickedIndex],
              value: series[clickedIndex],
            };
          });
        },
      },
    },
    tooltip: { enabled: false },
    plotOptions: {
      pie: {
        donut: { size: "60%", labels: { show: false } },
      },
    },

    // **3. Data Labels dễ đọc hơn với bóng đen**
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(0)}%`,
      style: {
        colors: ["#ffffff"],
        fontSize: "14px",
        fontWeight: "bold",
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        color: "#000000", // Đổi sang bóng đen
        opacity: 0.45,
      },
    },
    stroke: { width: 3, colors: ["#ffffff"] }, // Tăng độ dày viền cho nổi bật
    legend: {
      position: "bottom",
      fontSize: "14px",
      markers: { width: 10, height: 10, radius: 5, fillColors: colors },
      itemMargin: { horizontal: 10, vertical: 5 },
    },
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          Phân Tích Loại Sự Cố
        </h3>
        <div className="flex h-80 items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          Phân Tích Loại Sự Cố
        </h3>
        <div className="flex h-80 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu thiết bị lỗi</p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              Dữ liệu sẽ hiển thị khi có sự cố được báo cáo
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // **4. Container cao cấp**
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        Phân Tích Loại Sự Cố
      </h3>

      <div className="relative flex items-center justify-center">
        <Chart options={options} series={series} type="donut" height={320} />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {selectedSlice ? selectedSlice.label : "Tổng Sự Cố"}
          </p>

          {/* **2. Gradient trung tâm đồng bộ với màu của biểu đồ** */}
          <h2 className="bg-gradient-to-r from-[#c9184a] to-[#ff4d6d] bg-clip-text text-4xl font-extrabold text-transparent">
            {selectedSlice ? selectedSlice.value : totalIncidents}
          </h2>
        </div>
      </div>
    </div>
  );
}
