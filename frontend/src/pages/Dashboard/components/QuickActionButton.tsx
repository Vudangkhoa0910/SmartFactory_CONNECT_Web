/**
 * Dashboard - Quick Action Button Component
 */
import React from 'react';

interface QuickActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 hover:border-red-200 dark:hover:border-red-900 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-all group"
  >
    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
      <Icon className="w-5 h-5 text-red-600 dark:text-red-500" />
    </div>
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
      {label}
    </span>
  </button>
);

export default QuickActionButton;
