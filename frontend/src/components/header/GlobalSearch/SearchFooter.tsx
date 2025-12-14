/**
 * SearchFooter Component - SmartFactory CONNECT
 */
import React from 'react';

const SearchFooter: React.FC = () => {
  return (
    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</span>
        <span>Di chuyển</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</span>
        <span>Chọn</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</span>
        <span>Đóng</span>
      </div>
    </div>
  );
};

export default SearchFooter;
