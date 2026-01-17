/**
 * DataTable Types - SmartFactory CONNECT
 */
import React from 'react';

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

// Pagination config
export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

// Props
export interface DataTableProps<T> {
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
  pagination?: PaginationConfig;
}

// Sort state
export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
}
