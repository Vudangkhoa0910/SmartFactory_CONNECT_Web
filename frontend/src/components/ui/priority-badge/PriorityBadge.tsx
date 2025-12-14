/**
 * PriorityBadge Component - SmartFactory CONNECT
 * Displays priority levels with color coding
 */
import React from 'react';
import { AlertIcon, BoltIcon } from '../../../icons';

export type PriorityType = 'low' | 'medium' | 'high' | 'critical';
export type PrioritySize = 'sm' | 'md' | 'lg';

interface PriorityBadgeProps {
  priority: PriorityType;
  size?: PrioritySize;
  showIcon?: boolean;
  showDot?: boolean;
  pulse?: boolean;
  className?: string;
  customLabel?: string;
}

// Priority configuration with Vietnamese labels and colors
const PRIORITY_CONFIG: Record<PriorityType, { 
  label: string; 
  bgColor: string; 
  textColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  low: { 
    label: 'Thấp', 
    bgColor: 'bg-green-100 dark:bg-green-900/30', 
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: AlertIcon 
  },
  medium: { 
    label: 'Trung bình', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', 
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    icon: AlertIcon 
  },
  high: { 
    label: 'Cao', 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30', 
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700',
    icon: AlertIcon 
  },
  critical: { 
    label: 'Nghiêm trọng', 
    bgColor: 'bg-red-100 dark:bg-red-900/30', 
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
    icon: BoltIcon 
  },
};

const SIZE_CLASSES: Record<PrioritySize, { badge: string; icon: string; dot: string }> = {
  sm: { badge: 'px-2 py-0.5 text-xs', icon: 'w-3 h-3', dot: 'w-1.5 h-1.5' },
  md: { badge: 'px-2.5 py-1 text-sm', icon: 'w-4 h-4', dot: 'w-2 h-2' },
  lg: { badge: 'px-3 py-1.5 text-base', icon: 'w-5 h-5', dot: 'w-2.5 h-2.5' },
};

const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = false,
  showDot = false,
  pulse = false,
  className = '',
  customLabel,
}) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = config.icon;
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses.badge}
        ${className}
      `}
    >
      {/* Pulse dot indicator */}
      {showDot && (
        <span className="relative flex">
          {pulse && priority === 'critical' && (
            <span 
              className={`
                absolute inline-flex h-full w-full animate-ping rounded-full opacity-75
                bg-red-400
              `}
            />
          )}
          <span 
            className={`
              relative inline-flex rounded-full 
              ${sizeClasses.dot}
              ${config.textColor.replace('text-', 'bg-').replace('-700', '-500').replace('-600', '-500')}
            `}
          />
        </span>
      )}
      
      {/* Icon */}
      {showIcon && Icon && (
        <Icon className={sizeClasses.icon} />
      )}
      
      {/* Label */}
      <span>{customLabel || config.label}</span>
    </span>
  );
};

export default PriorityBadge;
