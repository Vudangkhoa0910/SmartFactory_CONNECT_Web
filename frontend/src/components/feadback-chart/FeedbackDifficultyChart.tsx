import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

type ChartSeries = {
  name: string;
  data: number[];
}[];

export default function FeedbackDifficultyChart() {
  const options: ApexOptions = {
    colors: ["#e5386d"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#ff8fa3"],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    grid: {
      borderColor: "#e7e7e7",
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    xaxis: {
      categories: ["Dễ", "Trung bình", "Khó", "Rất khó"],
      labels: {
        style: {
          colors: "#6B7280",
        },
      },
    },
    yaxis: {
      title: {
        text: "Số lượng ý kiến",
        style: {
          color: "#6B7280",
        },
      },
      labels: {
        style: {
          colors: "#6B7280",
        },
      },
    },
    // ✨ ĐÃ SỬA: Chỉnh sửa Tooltip
    tooltip: {
      theme: "light", // Đổi từ "dark" sang "light" để có nền trắng và shadow mặc định
      y: {
        formatter: function (val: number) {
          return val + " ý kiến";
        },
      },
    },
  };

  const series: ChartSeries = [
    {
      name: "Số lượng",
      data: [76, 102, 65, 23],
    },
  ];

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        Mức độ khó của ý kiến
      </h3>
      <div>
        <Chart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
}
