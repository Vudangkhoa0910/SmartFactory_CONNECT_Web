/**
 * EmptyState Component - SmartFactory CONNECT
 * Display when no data is available
 */
import React from 'react';
import { FolderIcon, FileIcon, BoxIcon } from '../../../icons';

export type EmptyStateSize = 'sm' | 'md' | 'lg';
export type EmptyStateVariant = 'default' | 'search' | 'error' | 'success';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: EmptyStateSize;
  variant?: EmptyStateVariant;
  className?: string;
  children?: React.ReactNode;
}

const SIZE_CLASSES: Record<EmptyStateSize, { 
  container: string; 
  icon: string; 
  title: string; 
  description: string 
}> = {
  sm: { 
    container: 'py-6', 
    icon: 'w-10 h-10', 
    title: 'text-sm', 
    description: 'text-xs' 
  },
  md: { 
    container: 'py-10', 
    icon: 'w-14 h-14', 
    title: 'text-base', 
    description: 'text-sm' 
  },
  lg: { 
    container: 'py-16', 
    icon: 'w-20 h-20', 
    title: 'text-lg', 
    description: 'text-base' 
  },
};

const VARIANT_CONFIG: Record<EmptyStateVariant, {
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  default: {
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-400 dark:text-gray-500',
    icon: BoxIcon,
  },
  search: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-500 dark:text-blue-400',
    icon: FileIcon,
  },
  error: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-500 dark:text-red-400',
    icon: FolderIcon,
  },
  success: {
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-500 dark:text-green-400',
    icon: FolderIcon,
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  variant = 'default',
  className = '',
  children,
}) => {
  const sizeClasses = SIZE_CLASSES[size];
  const variantConfig = VARIANT_CONFIG[variant];
  const IconComponent = variantConfig.icon;

  return (
    <div className={`text-center ${sizeClasses.container} ${className}`}>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className={`
          rounded-full p-4
          ${variantConfig.iconBg}
        `}>
          {icon ? (
            <div className={`${sizeClasses.icon} ${variantConfig.iconColor}`}>
              {icon}
            </div>
          ) : (
            <IconComponent className={`${sizeClasses.icon} ${variantConfig.iconColor}`} />
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-gray-900 dark:text-white ${sizeClasses.title}`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto ${sizeClasses.description}`}>
          {description}
        </p>
      )}

      {/* Custom children */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
