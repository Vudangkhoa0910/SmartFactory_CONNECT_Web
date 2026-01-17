/**
 * Dashboard - Chart Options Configuration
 */
import { ApexOptions } from 'apexcharts';
import { DepartmentStats } from '../../../services/dashboard.service';

export function getPriorityChartOptions(totalIncidents: number, t: (key: string) => string, isDark: boolean = false): ApexOptions {
  const textColor = isDark ? '#e5e7eb' : '#374151';
  const subTextColor = isDark ? '#9ca3af' : '#6b7280';
  const valueColor = isDark ? '#ffffff' : '#111827';
  
  return {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, sans-serif',
      background: 'transparent',
    },
    colors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5'],
    labels: [
      t('priority.critical'), 
      t('priority.high'), 
      t('priority.medium'), 
      t('priority.low')
    ],
    legend: {
      position: 'bottom',
      fontFamily: 'Outfit, sans-serif',
      labels: { colors: subTextColor },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', color: textColor },
            value: { show: true, fontSize: '24px', fontWeight: 700, color: valueColor },
            total: {
              show: true,
              label: t('incident.total'),
              color: subTextColor,
              formatter: () => totalIncidents.toString(),
            },
          },
        },
      },
    },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    theme: { mode: isDark ? 'dark' : 'light' }
  };
}

export function getDepartmentChartOptions(departmentStats: DepartmentStats[], isDark: boolean = false): ApexOptions {
  const textColor = isDark ? '#e5e7eb' : '#374151';
  const subTextColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#404040' : '#f3f4f6';

  return {
    chart: {
      type: 'bar',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
      background: 'transparent',
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
      labels: { style: { colors: subTextColor } },
    },
    yaxis: {
      labels: { style: { fontSize: '12px', colors: textColor } },
    },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    theme: { mode: isDark ? 'dark' : 'light' }
  };
}
