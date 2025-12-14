/**
 * System Status Component - SmartFactory CONNECT
 * Real-time system health monitoring
 */
import React from 'react';
import { CheckCircleIcon, AlertIcon, TimeIcon } from '../../icons';

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  responseTime?: number;
  lastChecked?: string;
  message?: string;
}

interface SystemStatusProps {
  services?: ServiceHealth[];
  loading?: boolean;
  className?: string;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<ServiceStatus, {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  healthy: {
    label: 'Hoạt động',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    dotColor: 'bg-green-500',
    icon: CheckCircleIcon,
  },
  degraded: {
    label: 'Chậm',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    dotColor: 'bg-yellow-500',
    icon: AlertIcon,
  },
  down: {
    label: 'Không hoạt động',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    icon: AlertIcon,
  },
  unknown: {
    label: 'Không xác định',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-500',
    icon: TimeIcon,
  },
};

const DEFAULT_SERVICES: ServiceHealth[] = [
  { name: 'API Server', status: 'healthy', responseTime: 45 },
  { name: 'Database', status: 'healthy', responseTime: 12 },
  { name: 'File Storage', status: 'healthy', responseTime: 89 },
  { name: 'Notification Service', status: 'healthy', responseTime: 23 },
];

const SystemStatus: React.FC<SystemStatusProps> = ({
  services = DEFAULT_SERVICES,
  loading = false,
  className = '',
  onRefresh,
}) => {
  // Calculate overall status
  const overallStatus = services.every(s => s.status === 'healthy')
    ? 'healthy'
    : services.some(s => s.status === 'down')
      ? 'down'
      : services.some(s => s.status === 'degraded')
        ? 'degraded'
        : 'unknown';

  const overallConfig = STATUS_CONFIG[overallStatus];

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Trạng thái hệ thống
          </h3>
          
          {/* Overall status badge */}
          <span className={`
            inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
            ${overallConfig.bgColor} ${overallConfig.color}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${overallConfig.dotColor} animate-pulse`} />
            {overallConfig.label}
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Làm mới"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Services List */}
      <div className="p-4 sm:p-5 space-y-3">
        {services.map((service) => {
          const config = STATUS_CONFIG[service.status];
          
          return (
            <div 
              key={service.name}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Status dot with pulse animation for healthy */}
                <span className="relative flex">
                  {service.status === 'healthy' && (
                    <span className={`absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75 animate-ping`} />
                  )}
                  <span className={`relative inline-flex w-2 h-2 rounded-full ${config.dotColor}`} />
                </span>

                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {service.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Response time */}
                {service.responseTime !== undefined && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {service.responseTime}ms
                  </span>
                )}

                {/* Status badge */}
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${config.bgColor} ${config.color}
                `}>
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with last updated time */}
      <div className="px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
        </p>
      </div>
    </div>
  );
};

export default SystemStatus;
