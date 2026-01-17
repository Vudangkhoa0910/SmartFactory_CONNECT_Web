/**
 * TablePagination Component - SmartFactory CONNECT
 */
import React from 'react';
import { AngleLeftIcon, AngleRightIcon } from '../../../icons';
import { PaginationConfig } from './types';
import { getPageNumbers } from './utils';

interface TablePaginationProps {
  pagination: PaginationConfig;
}

const TablePagination: React.FC<TablePaginationProps> = ({ pagination }) => {
  const { page, limit, total, onPageChange, onLimitChange, pageSizeOptions } = pagination;
  
  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      {/* Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Hiển thị {startItem} - {endItem} / {total} kết quả
      </div>

      {/* Page size selector */}
      {onLimitChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Hiển thị:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 px-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
          >
            {(pageSizeOptions || [10, 20, 50, 100]).map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      )}

      {/* Pagination buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AngleLeftIcon className="w-5 h-5" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`
              w-8 h-8 text-sm font-medium rounded
              ${page === pageNum
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AngleRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
