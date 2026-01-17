/**
 * LoadingSpinner Component - SmartFactory CONNECT
 * Loading indicators for various states
 */
import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'primary' | 'white';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  className?: string;
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  animate?: boolean;
}

const SIZE_CLASSES: Record<SpinnerSize, { wrapper: string; border: string }> = {
  xs: { wrapper: 'w-3 h-3', border: 'border' },
  sm: { wrapper: 'w-4 h-4', border: 'border-2' },
  md: { wrapper: 'w-6 h-6', border: 'border-2' },
  lg: { wrapper: 'w-8 h-8', border: 'border-2' },
  xl: { wrapper: 'w-12 h-12', border: 'border-3' },
};

const VARIANT_CLASSES: Record<SpinnerVariant, string> = {
  default: 'border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300',
  primary: 'border-brand-200 dark:border-brand-800 border-t-brand-600 dark:border-t-brand-400',
  white: 'border-white/30 border-t-white',
};

// Basic spinner component
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeClasses = SIZE_CLASSES[size];
  const variantClasses = VARIANT_CLASSES[variant];

  return (
    <div
      className={`
        ${sizeClasses.wrapper}
        ${sizeClasses.border}
        ${variantClasses}
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
};

// Full-screen loading overlay
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = 'Đang tải...',
  className = '',
}) => {
  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" variant="primary" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Skeleton loading placeholders
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className = '',
  animate = true,
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`
            h-4 bg-gray-200 dark:bg-gray-700 rounded
            ${animate ? 'animate-pulse' : ''}
            ${index === lines - 1 ? 'w-2/3' : 'w-full'}
          `}
        />
      ))}
    </div>
  );
};

// Card skeleton for loading states
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
    </div>
  );
};

// Table row skeleton
export const TableRowSkeleton: React.FC<{ columns?: number; className?: string }> = ({ 
  columns = 5,
  className = '' 
}) => {
  return (
    <tr className={`animate-pulse ${className}`}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </td>
      ))}
    </tr>
  );
};

// Full page loading state
export const PageLoading: React.FC<{ message?: string }> = ({ 
  message = 'Đang tải dữ liệu...' 
}) => {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingSpinner size="xl" variant="primary" className="mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

// Inline loading indicator for buttons
export const ButtonLoading: React.FC<{ size?: SpinnerSize }> = ({ size = 'sm' }) => {
  return <LoadingSpinner size={size} variant="white" />;
};

export default LoadingSpinner;
