/**
 * Dashboard - Stat Card Component
 */
import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';




interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; isUp: boolean };
  onClick?: () => void;
  accent?: 'red' | 'gray';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
  accent = 'red'
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-400">{t('card.t1')}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent === 'red' ? 'bg-red-50' : 'bg-gray-50'}`}>
          <Icon className={`w-6 h-6 ${accent === 'red' ? 'text-red-600' : 'text-gray-600'}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
