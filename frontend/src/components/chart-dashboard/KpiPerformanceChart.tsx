// src/components/incident-reports/KpiPerformanceChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  Legend,
} from "recharts";
import DashboardCard from "./DashboardCard";
import CustomTooltip from "./CustomTooltip";

const data = [
  { name: "Tháng 1", "Phòng A": 80, "Phòng B": 75 },
  { name: "Tháng 2", "Phòng A": 85, "Phòng B": 82 },
  { name: "Tháng 3", "Phòng A": 90, "Phòng B": 88 },
  { name: "Tháng 4", "Phòng A": 88, "Phòng B": 92 },
  { name: "Tháng 5", "Phòng A": 92, "Phòng B": 95 },
  { name: "Tháng 6", "Phòng A": 95, "Phòng B": 97 },
];

export default function KpiPerformanceChart() {
  return (
    <DashboardCard title="KPI hiệu suất xử lý của các phòng ban">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorPhongA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPhongB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis
            unit="%"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="Phòng A"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorPhongA)"
          />
          <Line
            type="monotone"
            dataKey="Phòng A"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="Phòng B"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorPhongB)"
          />
          <Line
            type="monotone"
            dataKey="Phòng B"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
}
