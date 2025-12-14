/**
 * Dashboard - Chart Options Configuration
 */
import { ApexOptions } from 'apexcharts';
import { DepartmentStats } from '../../../services/dashboard.service';

export function getPriorityChartOptions(totalIncidents: number): ApexOptions {
  return {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, sans-serif',
    },
    colors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5'],
    labels: ['Nghiêm trọng', 'Cao', 'Trung bình', 'Thấp'],
    legend: {
      position: 'bottom',
      fontFamily: 'Outfit, sans-serif',
      labels: { colors: '#6b7280' },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', color: '#374151' },
            value: { show: true, fontSize: '24px', fontWeight: 700, color: '#111827' },
            total: {
              show: true,
              label: 'Tổng sự cố',
              color: '#6b7280',
              formatter: () => totalIncidents.toString(),
            },
          },
        },
      },
    },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
  };
}

export function getDepartmentChartOptions(departmentStats: DepartmentStats[]): ApexOptions {
  return {
    chart: {
      type: 'bar',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#dc2626'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '50%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}%`,
      style: { fontSize: '12px', fontWeight: 600 },
    },
    xaxis: {
      categories: departmentStats.slice(0, 5).map(d => d.department_name),
      max: 100,
      labels: { style: { colors: '#6b7280' } },
    },
    yaxis: {
      labels: { style: { fontSize: '12px', colors: '#374151' } },
    },
    grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
  };
}
