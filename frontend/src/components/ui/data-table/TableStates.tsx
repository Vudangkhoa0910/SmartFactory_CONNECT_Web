/**
 * TableStates Components - SmartFactory CONNECT
 * Loading, Error, and Empty states for DataTable
 */
import React from 'react';
import { TableRowSkeleton } from '../loading/LoadingSpinner';
import EmptyState from '../empty-state/EmptyState';
import { Column } from './types';

interface TableLoadingProps<T> {
  columns: Column<T>[];
  className?: string;
}

export function TableLoading<T>({ columns, className = '' }: TableLoadingProps<T>) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map(column => (
              <th 
                key={column.id} 
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns.length} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TableErrorProps {
  error: string;
  className?: string;
}

export const TableError: React.FC<TableErrorProps> = ({ error, className = '' }) => {
  return (
    <div className={`overflow-hidden rounded-xl border border-red-200 dark:border-red-800 ${className}`}>
      <EmptyState
        variant="error"
        title="Có lỗi xảy ra"
        description={error}
        className="py-12"
      />
    </div>
  );
};

interface TableEmptyProps {
  message: string;
  description?: string;
  className?: string;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({ message, description, className = '' }) => {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <EmptyState
        title={message}
        description={description}
        className="py-12"
      />
    </div>
  );
};
