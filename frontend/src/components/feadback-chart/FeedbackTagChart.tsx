import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function FeedbackTagChart() {
  const labels: string[] = [
    "Chất lượng",
    "Hiệu suất",
    "An toàn",
    "Tiết kiệm năng lượng",
    "Khác",
  ];
  const series: number[] = [45, 25, 15, 8, 7];
  const colors: string[] = [
    "#e5386d",
    "#ff4d6d",
    "#ff8fa3",
    "#ffb3c1",
    "#ffccd5",
  ];
  const totalFeedback = series.reduce((a, b) => a + b, 0);

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
        color: "#000000",
        opacity: 0.45,
      },
    },
    stroke: { width: 3, colors: ["#ffffff"] },
    legend: {
      position: "bottom",
      fontSize: "14px",
      markers: { width: 10, height: 10, radius: 5, fillColors: colors },
      itemMargin: { horizontal: 10, vertical: 5 },
    },
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 h-full">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        Phân loại theo Tag
      </h3>

      <div className="relative flex items-center justify-center">
        <Chart options={options} series={series} type="donut" height={320} />

        {/* ✨ ĐÃ SỬA: Thêm "-translate-y-2" để đẩy nội dung lên trên */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center -translate-y-8">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {selectedSlice ? selectedSlice.label : "Tổng Góp Ý"}
          </p>
          <h2 className="bg-gradient-to-r from-[#c9184a] to-[#ff4d6d] bg-clip-text text-4xl font-extrabold text-transparent">
            {selectedSlice ? selectedSlice.value : totalFeedback}
          </h2>
        </div>
      </div>
    </div>
  );
}
