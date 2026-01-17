// src/components/incident-reports/TopFaultyMachinesChart.tsx
import { useEffect, useState } from "react";
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
import dashboardService, { TopMachineData } from "../../services/dashboard.service";

interface ChartData {
  name: string;
  Lỗi: number;
}

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
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getTopMachinesWithErrors();
        
        // Transform API data to chart format
        const chartData: ChartData[] = response.map((item: TopMachineData) => ({
          name: item.machine_name || item.machine_code || 'Unknown',
          Lỗi: item.error_count
        }));
        
        setData(chartData);
      } catch (err) {
        console.error('Failed to fetch top machines data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <DashboardCard title="Top 10 máy móc/vị trí lỗi">
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardCard>
    );
  }

  if (data.length === 0) {
    return (
      <DashboardCard title="Top 10 máy móc/vị trí lỗi">
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          Chưa có dữ liệu thiết bị
        </div>
      </DashboardCard>
    );
  }

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
