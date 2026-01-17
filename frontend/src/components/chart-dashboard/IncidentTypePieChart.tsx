// src/components/incident-reports/IncidentTypePieChart.tsx
import { useEffect, useState } from "react";
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
import dashboardService from "../../services/dashboard.service";

interface IncidentTypeData {
  name: string;
  value: number;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function IncidentTypePieChart() {
  const [data, setData] = useState<IncidentTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getPriorityDistribution();
        // Map API response to chart data format
        const chartData: IncidentTypeData[] = response.map((item: { priority: string; count: number }) => ({
          name: item.priority === 'critical' ? 'Nghiêm trọng' :
                item.priority === 'high' ? 'Cao' :
                item.priority === 'medium' ? 'Trung bình' : 'Thấp',
          value: item.count
        }));
        setData(chartData);
      } catch (err) {
        console.error('Failed to fetch incident type data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <DashboardCard title="Thống kê Loại sự cố">
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardCard>
    );
  }

  if (data.length === 0) {
    return (
      <DashboardCard title="Thống kê Loại sự cố">
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          Chưa có dữ liệu
        </div>
      </DashboardCard>
    );
  }

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
            innerRadius={70}
            outerRadius={110}
            paddingAngle={5}
            fill="#8884d8"
          >
            {data.map((_, index) => (
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
