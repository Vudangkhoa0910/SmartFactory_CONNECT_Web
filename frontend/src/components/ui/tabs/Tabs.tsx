/**
 * Tabs Component - SmartFactory CONNECT
 * Tab navigation with badges and icons
 */
import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  badgeColor?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
}

const BADGE_COLORS = {
  default: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  primary: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

const SIZE_CLASSES = {
  sm: { tab: 'px-3 py-1.5 text-xs', icon: 'w-3.5 h-3.5', badge: 'text-xs px-1.5 py-0.5 min-w-[18px]' },
  md: { tab: 'px-4 py-2 text-sm', icon: 'w-4 h-4', badge: 'text-xs px-2 py-0.5 min-w-[20px]' },
  lg: { tab: 'px-5 py-2.5 text-base', icon: 'w-5 h-5', badge: 'text-sm px-2 py-0.5 min-w-[22px]' },
};

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'default',
  size = 'md',
  className = '',
  fullWidth = false,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id);
  const activeTab = controlledActiveTab || internalActiveTab;
  const sizeClasses = SIZE_CLASSES[size];

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  const getVariantClasses = (isActive: boolean, isDisabled?: boolean) => {
    if (isDisabled) {
      return 'opacity-50 cursor-not-allowed';
    }

    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';
      case 'underline':
        return isActive
          ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
          : 'text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-white';
      default:
        return isActive
          ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm border border-gray-200 dark:border-gray-700'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
    }
  };

  const containerClasses = {
    default: 'bg-gray-100 dark:bg-gray-900 p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-gray-200 dark:border-gray-700',
  };

  return (
    <div 
      className={`
        flex ${fullWidth ? '' : 'inline-flex'}
        ${containerClasses[variant]}
        ${className}
      `}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            className={`
              inline-flex items-center justify-center gap-2 font-medium transition-all
              ${sizeClasses.tab}
              ${fullWidth ? 'flex-1' : ''}
              ${variant === 'default' ? 'rounded-md' : variant === 'pills' ? 'rounded-full' : ''}
              ${getVariantClasses(isActive, tab.disabled)}
            `}
          >
            {/* Icon */}
            {tab.icon && (
              <span className={sizeClasses.icon}>
                {tab.icon}
              </span>
            )}
            
            {/* Label */}
            <span>{tab.label}</span>
            
            {/* Badge */}
            {tab.badge !== undefined && (
              <span 
                className={`
                  inline-flex items-center justify-center rounded-full font-medium
                  ${sizeClasses.badge}
                  ${BADGE_COLORS[tab.badgeColor || 'default']}
                `}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
