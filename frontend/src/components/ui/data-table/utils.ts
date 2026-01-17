/**
 * DataTable Utilities - SmartFactory CONNECT
 */
import React from 'react';
import { Column } from './types';

/**
 * Get cell value from row using column accessor
 */
export function getCellValue<T>(row: T, column: Column<T>, index: number): React.ReactNode {
  const accessor = column.accessor;
  const value = typeof accessor === 'function' ? accessor(row) : row[accessor];
  
  if (column.render) {
    return column.render(value, row, index);
  }
  
  return value as React.ReactNode;
}

/**
 * Sort data based on column and direction
 */
export function sortData<T>(
  data: T[],
  columns: Column<T>[],
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc'
): T[] {
  if (!sortColumn) return data;

  const column = columns.find(c => c.id === sortColumn);
  if (!column) return data;

  return [...data].sort((a, b) => {
    const accessor = column.accessor;
    const aValue = typeof accessor === 'function' ? accessor(a) : a[accessor];
    const bValue = typeof accessor === 'function' ? accessor(b) : b[accessor];

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = aValue < bValue ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

/**
 * Get row CSS classes
 */
export function getRowClasses<T>(
  row: T,
  index: number,
  options: {
    hoverable: boolean;
    striped: boolean;
    clickable: boolean;
    rowClassName?: string | ((row: T, index: number) => string);
  }
): string {
  const { hoverable, striped, clickable, rowClassName } = options;
  
  const classes = [
    'transition-colors',
    hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
    striped && index % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/30',
    clickable && 'cursor-pointer',
    typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName,
  ].filter(Boolean).join(' ');
  
  return classes;
}

/**
 * Calculate page numbers for pagination
 */
export function getPageNumbers(currentPage: number, totalPages: number): number[] {
  const maxVisible = 5;
  
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  if (currentPage <= 3) {
    return Array.from({ length: maxVisible }, (_, i) => i + 1);
  }
  
  if (currentPage >= totalPages - 2) {
    return Array.from({ length: maxVisible }, (_, i) => totalPages - 4 + i);
  }
  
  return Array.from({ length: maxVisible }, (_, i) => currentPage - 2 + i);
}
