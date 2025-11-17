import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function TopMachinesRoseGoldChart() {
  const seriesData = [24, 20, 18, 15, 13, 12, 10, 9, 7, 6];
  const maxValue = Math.max(...seriesData);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },

    // **Điểm thay đổi chính: Bảng màu Đỏ - Hồng**
    colors: [
      function ({ value }) {
        // Tạo gradient từ màu Đỏ Ruby (giá trị cao) đến Hồng Nhạt (giá trị thấp)
        const intensity = value / maxValue;
        const startColor = [201, 24, 74]; // Màu Đỏ Ruby #c9184a
        const endColor = [255, 204, 213]; // Màu Hồng Nhạt #ffccd5

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
        distributed: true, // Áp dụng màu cho từng thanh
      },
    },

    dataLabels: {
      enabled: true,
      textAnchor: "start",
      style: {
        colors: ["#374151"], // Giữ màu chữ tối để đảm bảo độ tương phản
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
      categories: [
        "Robot A1",
        "Máy ép B2",
        "Lò sấy C3",
        "Line 01",
        "Khuôn E5",
        "Van F6",
        "Sensor G7",
        "PLC H8",
        "Motor I9",
        "Line 02",
      ],
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

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        Top 10 Thiết Bị Gặp Lỗi Nhiều Nhất
      </h3>
      <Chart options={options} series={series} type="bar" height={400} />
    </div>
  );
}
