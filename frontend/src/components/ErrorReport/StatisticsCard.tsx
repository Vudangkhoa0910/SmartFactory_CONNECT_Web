import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatisticsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'gray';
  subtitle?: string;
}

const colorClasses = {
  red: {
    bg: 'bg-red-50 dark:bg-red-900/10',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-900/30',
    trend: 'text-red-600 dark:text-red-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/30',
    trend: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/10',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-100 dark:border-green-900/30',
    trend: 'text-green-600 dark:text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
    icon: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-100 dark:border-yellow-900/30',
    trend: 'text-yellow-600 dark:text-yellow-400',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/10',
    icon: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-100 dark:border-gray-900/30',
    trend: 'text-gray-600 dark:text-gray-400',
  },
};

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'gray',
  subtitle,
}) => {
  const colors = colorClasses[color];

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp size={14} className={colors.trend} />
              ) : (
                <TrendingDown size={14} className={colors.trend} />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={`${colors.icon} p-3 rounded-lg ${colors.bg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
