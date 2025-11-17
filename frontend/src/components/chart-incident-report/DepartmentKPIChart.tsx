import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function DepartmentKPIChart() {
  const options: ApexOptions = {
    colors: ["#dc2626"],
    chart: { type: "line", height: 300, toolbar: { show: false } },
    stroke: { curve: "smooth", width: 3 },
    fill: { opacity: 0.2 },
    xaxis: {
      categories: [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
      ],
    },
  };

  const series = [{ name: "KPI xử lý (%)", data: [70, 72, 75, 80, 85, 90] }];

  return (
    <div className="rounded-2xl border p-6 bg-white dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        KPI hiệu suất xử lý sự cố – Phòng ban
      </h3>

      <Chart options={options} series={series} type="line" height={300} />
    </div>
  );
}
