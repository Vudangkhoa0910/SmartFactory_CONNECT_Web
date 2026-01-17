/**
 * KPI Card Component - SmartFactory CONNECT
 * Real-time KPI display with trend indicators
 */
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, AlertIcon, CheckCircleIcon } from '../../icons';

export interface KPIData {
  label: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

interface KPICardProps extends KPIData {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const VARIANT_STYLES = {
  default: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  },
  primary: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-brand-200 dark:border-brand-800',
    icon: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  },
  success: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  },
  danger: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  },
};

const SIZE_STYLES = {
  sm: {
    padding: 'p-3',
    icon: 'w-8 h-8',
    iconInner: 'w-4 h-4',
    label: 'text-xs',
    value: 'text-lg',
    trend: 'text-xs',
  },
  md: {
    padding: 'p-4 sm:p-5',
    icon: 'w-10 h-10 sm:w-12 sm:h-12',
    iconInner: 'w-5 h-5 sm:w-6 sm:h-6',
    label: 'text-sm',
    value: 'text-2xl sm:text-3xl',
    trend: 'text-sm',
  },
  lg: {
    padding: 'p-5 sm:p-6',
    icon: 'w-12 h-12 sm:w-14 sm:h-14',
    iconInner: 'w-6 h-6 sm:w-7 sm:h-7',
    label: 'text-base',
    value: 'text-3xl sm:text-4xl',
    trend: 'text-base',
  },
};

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit,
  trend,
  status,
  icon,
  loading = false,
  onClick,
  className = '',
  size = 'md',
  variant = 'default',
}) => {
  const sizeStyles = SIZE_STYLES[size];

  // Auto-detect variant from status if not specified
  const effectiveVariant = status === 'critical' ? 'danger' : status === 'warning' ? 'warning' : variant;
  const effectiveStyles = VARIANT_STYLES[effectiveVariant];

  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    if (!status) return null;
    switch (status) {
      case 'critical':
        return <AlertIcon className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertIcon className="w-4 h-4 text-yellow-500" />;
      case 'good':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl ${sizeStyles.padding} ${effectiveStyles.bg} border ${effectiveStyles.border} animate-pulse ${className}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
          <div className={`${sizeStyles.icon} bg-gray-200 dark:bg-gray-700 rounded-xl`} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-xl ${sizeStyles.padding} ${effectiveStyles.bg} border ${effectiveStyles.border}
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-2">
            <span className={`${sizeStyles.label} font-medium text-gray-500 dark:text-gray-400`}>
              {label}
            </span>
            {getStatusIcon()}
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`${sizeStyles.value} font-bold text-gray-900 dark:text-white`}>
              {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
            </span>
            {unit && (
              <span className={`${sizeStyles.label} text-gray-500 dark:text-gray-400`}>
                {unit}
              </span>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`flex items-center ${getTrendColor(trend.direction)}`}>
                {trend.direction === 'up' && <ArrowUpIcon className="w-4 h-4" />}
                {trend.direction === 'down' && <ArrowDownIcon className="w-4 h-4" />}
                <span className={`${sizeStyles.trend} font-medium`}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
              </span>
              <span className={`${sizeStyles.trend} text-gray-500 dark:text-gray-400`}>
                {trend.label}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`
            flex-shrink-0 rounded-xl flex items-center justify-center
            ${sizeStyles.icon} ${effectiveStyles.icon}
          `}>
            <div className={sizeStyles.iconInner}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
