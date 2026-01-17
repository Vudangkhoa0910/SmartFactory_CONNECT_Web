/**
 * DataTable Component - SmartFactory CONNECT
 * Advanced table with sorting, filtering, pagination
 */
import React, { useState, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon, AngleLeftIcon, AngleRightIcon } from '../../../icons';
import { LoadingSpinner, TableRowSkeleton } from '../loading/LoadingSpinner';
import EmptyState from '../empty-state/EmptyState';

// Column definition
export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

// Props
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  selectedRows?: T[];
  onSelectRow?: (row: T) => void;
  onSelectAll?: (selected: boolean) => void;
  selectable?: boolean;
  getRowKey?: (row: T, index: number) => string | number;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  className?: string;
  // Sorting
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  // Pagination
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    pageSizeOptions?: number[];
  };
}

function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  error,
  emptyMessage = 'Không có dữ liệu',
  emptyDescription,
  onRowClick,
  rowClassName,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  selectable = false,
  getRowKey = (_, index) => index,
  striped = false,
  hoverable = true,
  compact = false,
  stickyHeader = false,
  className = '',
  sortColumn,
  sortDirection = 'asc',
  onSort,
  pagination,
}: DataTableProps<T>) {
  const [localSortColumn, setLocalSortColumn] = useState<string | null>(null);
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('asc');

  const currentSortColumn = sortColumn || localSortColumn;
  const currentSortDirection = sortColumn ? sortDirection : localSortDirection;

  // Handle sorting
  const handleSort = (columnId: string) => {
    const newDirection = currentSortColumn === columnId && currentSortDirection === 'asc' ? 'desc' : 'asc';
    
    if (onSort) {
      onSort(columnId, newDirection);
    } else {
      setLocalSortColumn(columnId);
      setLocalSortDirection(newDirection);
    }
  };

  // Sort data locally if no external sort handler
  const sortedData = useMemo(() => {
    if (onSort || !localSortColumn) return data;

    const column = columns.find(c => c.id === localSortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const accessor = column.accessor;
      const aValue = typeof accessor === 'function' ? accessor(a) : a[accessor];
      const bValue = typeof accessor === 'function' ? accessor(b) : b[accessor];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return localSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, columns, localSortColumn, localSortDirection, onSort]);

  // Get cell value
  const getCellValue = (row: T, column: Column<T>, index: number): React.ReactNode => {
    const accessor = column.accessor;
    const value = typeof accessor === 'function' ? accessor(row) : row[accessor];
    
    if (column.render) {
      return column.render(value, row, index);
    }
    
    return value as React.ReactNode;
  };

  // Check if all rows are selected
  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  // Pagination helpers
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;
  const startItem = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  // Row classes
  const getRowClasses = (row: T, index: number): string => {
    const baseClasses = [
      'transition-colors',
      hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      striped && index % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/30',
      onRowClick && 'cursor-pointer',
      typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName,
    ].filter(Boolean).join(' ');
    
    return baseClasses;
  };

  // Render loading state
  if (loading && data.length === 0) {
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

  // Render error state
  if (error) {
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
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
        <EmptyState
          title={emptyMessage}
          description={emptyDescription}
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-gray-50 dark:bg-gray-800 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {/* Selection checkbox */}
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
              )}
              
              {/* Column headers */}
              {columns.map(column => (
                <th
                  key={column.id}
                  className={`
                    px-4 ${compact ? 'py-2' : 'py-3'} 
                    text-${column.align || 'left'} 
                    text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                    ${column.className || ''}
                  `}
                  style={{ width: column.width, minWidth: column.minWidth }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                    {column.header}
                    {column.sortable && (
                      <span className="flex flex-col">
                        <ChevronUpIcon 
                          className={`w-3 h-3 -mb-1 ${currentSortColumn === column.id && currentSortDirection === 'asc' ? 'text-brand-600' : 'text-gray-300'}`}
                        />
                        <ChevronDownIcon 
                          className={`w-3 h-3 ${currentSortColumn === column.id && currentSortDirection === 'desc' ? 'text-brand-600' : 'text-gray-300'}`}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={getRowClasses(row, rowIndex)}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {/* Selection checkbox */}
                {selectable && (
                  <td className="w-12 px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row)}
                      onChange={() => onSelectRow?.(row)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                )}
                
                {/* Cells */}
                {columns.map(column => (
                  <td
                    key={column.id}
                    className={`
                      px-4 ${compact ? 'py-2' : 'py-3'} 
                      text-${column.align || 'left'}
                      text-sm text-gray-900 dark:text-gray-100
                      ${column.className || ''}
                    `}
                  >
                    {getCellValue(row, column, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading overlay for refresh */}
      {loading && data.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* Info */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Hiển thị {startItem} - {endItem} / {pagination.total} kết quả
          </div>

          {/* Page size selector */}
          {pagination.onLimitChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Hiển thị:</span>
              <select
                value={pagination.limit}
                onChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
                className="h-8 px-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
              >
                {(pagination.pageSizeOptions || [10, 20, 50, 100]).map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}

          {/* Pagination buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AngleLeftIcon className="w-5 h-5" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`
                    w-8 h-8 text-sm font-medium rounded
                    ${pagination.page === pageNum
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AngleRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
