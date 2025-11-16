// src/components/incident-reports/IncidentTypePieChart.tsx
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardCard from "./DashboardCard";
import CustomTooltip from "./CustomTooltip";

const data = [
  { name: "Nhân sự", value: 400 },
  { name: "Vận hành", value: 300 },
  { name: "Thiết bị", value: 300 },
  { name: "Kỹ thuật", value: 200 },
];
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]; // blue, green, amber, red

export default function IncidentTypePieChart() {
  return (
    <DashboardCard title="Thống kê Loại sự cố">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70} // Chuyển thành Donut
            outerRadius={110}
            paddingAngle={5} // Tạo khoảng cách giữa các miếng
            fill="#8884d8"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
