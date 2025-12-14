/**
 * StatCard Component - SmartFactory CONNECT
 * KPI/Statistics card for dashboard
 */
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '../../../icons';

export type TrendDirection = 'up' | 'down' | 'neutral';
export type StatCardSize = 'sm' | 'md' | 'lg';
export type StatCardVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  change?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  size?: StatCardSize;
  variant?: StatCardVariant;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  footer?: React.ReactNode;
  badge?: React.ReactNode;
}

const VARIANT_CLASSES: Record<StatCardVariant, { 
  card: string; 
  icon: string;
  value: string;
}> = {
  default: { 
    card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    value: 'text-gray-900 dark:text-white'
  },
  primary: { 
    card: 'bg-white dark:bg-gray-800 border border-brand-200 dark:border-brand-800',
    icon: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
    value: 'text-brand-600 dark:text-brand-400'
  },
  success: { 
    card: 'bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800',
    icon: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    value: 'text-green-600 dark:text-green-400'
  },
  warning: { 
    card: 'bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800',
    icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    value: 'text-yellow-600 dark:text-yellow-400'
  },
  error: { 
    card: 'bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800',
    icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400'
  },
};

const SIZE_CLASSES: Record<StatCardSize, { 
  padding: string; 
  icon: string; 
  title: string;
  value: string;
}> = {
  sm: { padding: 'p-3', icon: 'w-8 h-8 text-sm', title: 'text-xs', value: 'text-lg' },
  md: { padding: 'p-4 sm:p-5', icon: 'w-10 h-10 text-base', title: 'text-sm', value: 'text-2xl' },
  lg: { padding: 'p-5 sm:p-6', icon: 'w-12 h-12 text-lg', title: 'text-base', value: 'text-3xl' },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  change,
  size = 'md',
  variant = 'default',
  loading = false,
  onClick,
  className = '',
  footer,
  badge,
}) => {
  const variantClasses = VARIANT_CLASSES[variant];
  const sizeClasses = SIZE_CLASSES[size];

  const getTrendColor = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl ${sizeClasses.padding} ${variantClasses.card} animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
          <div className={`${sizeClasses.icon} bg-gray-200 dark:bg-gray-700 rounded-xl`} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-xl ${sizeClasses.padding} ${variantClasses.card}
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title with optional badge */}
          <div className="flex items-center gap-2">
            <p className={`${sizeClasses.title} font-medium text-gray-500 dark:text-gray-400 truncate`}>
              {title}
            </p>
            {badge}
          </div>

          {/* Value */}
          <p className={`${sizeClasses.value} font-bold ${variantClasses.value} mt-1`}>
            {value}
          </p>

          {/* Trend or Change indicator */}
          {(trend || change) && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend && (
                <>
                  <span className={`flex items-center ${getTrendColor(trend.direction)}`}>
                    {trend.direction === 'up' && <ArrowUpIcon className="w-4 h-4" />}
                    {trend.direction === 'down' && <ArrowDownIcon className="w-4 h-4" />}
                    <span className="text-sm font-medium ml-0.5">
                      {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                  </span>
                  {trend.label && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{trend.label}</span>
                  )}
                </>
              )}
              {change && (
                <>
                  <span className={`text-sm font-medium ${change.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {change.isPositive ? '+' : ''}{change.value}
                  </span>
                  {change.label && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{change.label}</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`
            flex-shrink-0 rounded-xl flex items-center justify-center ml-4
            ${sizeClasses.icon} ${variantClasses.icon}
          `}>
            {icon}
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default StatCard;
