/**
 * Room Booking Calendar - Loading Component
 */
import React from 'react';

const CalendarLoading: React.FC = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-gray-600 dark:text-gray-400">Đang tải...</div>
    </div>
  </div>
);

export default CalendarLoading;
