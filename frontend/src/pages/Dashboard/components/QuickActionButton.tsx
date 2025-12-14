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
    className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group"
  >
    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
      <Icon className="w-5 h-5 text-red-600" />
    </div>
    <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
      {label}
    </span>
  </button>
);

export default QuickActionButton;
