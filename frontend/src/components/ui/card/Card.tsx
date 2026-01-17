/**
 * Card Component - SmartFactory CONNECT
 * Reusable card container with multiple variants
 */
import React from 'react';

export type CardVariant = 'default' | 'bordered' | 'elevated' | 'flat' | 'gradient';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30',
  flat: 'bg-gray-50 dark:bg-gray-800/50',
  gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700',
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
  header,
  footer,
  title,
  subtitle,
  action,
}) => {
  const baseClasses = 'rounded-xl overflow-hidden transition-all duration-200';
  const variantClasses = VARIANT_CLASSES[variant];
  const hoverClasses = hoverable || onClick 
    ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer' 
    : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header Section */}
      {(header || title || action) && (
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          {header ? (
            header
          ) : (
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
      )}

      {/* Body Section */}
      <div className={PADDING_CLASSES[padding]}>
        {children}
      </div>

      {/* Footer Section */}
      {footer && (
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {footer}
        </div>
      )}
    </div>
  );
};

// Card subcomponents
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`p-4 sm:p-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-4 py-3 sm:px-5 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
    {children}
  </div>
);

export default Card;
