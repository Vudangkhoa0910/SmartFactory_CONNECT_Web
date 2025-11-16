// src/components/incident-reports/TopFaultyMachinesChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Rectangle,
} from "recharts";
import DashboardCard from "./DashboardCard";
import CustomTooltip from "./CustomTooltip";

const data = [
  { name: "Máy A", Lỗi: 30 },
  { name: "Máy B", Lỗi: 25 },
  { name: "Khu C", Lỗi: 22 },
  { name: "Máy D", Lỗi: 20 },
  { name: "Máy E", Lỗi: 18 },
  { name: "Dây chuyền F", Lỗi: 15 },
  { name: "Máy G", Lỗi: 12 },
  { name: "Máy H", Lỗi: 10 },
  { name: "Khu I", Lỗi: 8 },
  { name: "Máy K", Lỗi: 5 },
];

// Custom shape cho cột bo tròn
const RoundedBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      radius={[4, 4, 0, 0]}
      fill={fill}
    />
  );
};

export default function TopFaultyMachinesChart() {
  return (
    <DashboardCard title="Top 10 máy móc/vị trí lỗi">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(239, 246, 255, 0.5)" }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="Lỗi" fill="#3B82F6" shape={<RoundedBar />} />
        </BarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
