/**
 * DataTable Component - SmartFactory CONNECT
 * Advanced table with sorting, filtering, pagination
 * Refactored to use modular components
 */
import React from 'react';
import { LoadingSpinner } from '../loading/LoadingSpinner';
import { DataTableProps, Column } from './types';
import { TableLoading, TableError, TableEmpty } from './TableStates';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import TablePagination from './TablePagination';
import useTableSort from './useTableSort';

// Re-export Column type for external use
export type { Column };

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
  // Use sort hook
  const { sortedData, currentSortColumn, currentSortDirection, handleSort } = useTableSort({
    data,
    columns,
    externalSortColumn: sortColumn,
    externalSortDirection: sortDirection,
    onExternalSort: onSort,
  });

  // Check if all rows are selected
  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  // Render loading state
  if (loading && data.length === 0) {
    return <TableLoading columns={columns} className={className} />;
  }

  // Render error state
  if (error) {
    return <TableError error={error} className={className} />;
  }

  // Render empty state
  if (data.length === 0) {
    return <TableEmpty message={emptyMessage} description={emptyDescription} className={className} />;
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader
            columns={columns}
            selectable={selectable}
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={onSelectAll}
            sortColumn={currentSortColumn}
            sortDirection={currentSortDirection}
            onSort={handleSort}
            compact={compact}
            stickyHeader={stickyHeader}
          />
          
          <TableBody
            data={sortedData}
            columns={columns}
            selectable={selectable}
            selectedRows={selectedRows}
            onSelectRow={onSelectRow}
            onRowClick={onRowClick}
            getRowKey={getRowKey}
            hoverable={hoverable}
            striped={striped}
            compact={compact}
            rowClassName={rowClassName}
          />
        </table>
      </div>

      {/* Loading overlay for refresh */}
      {loading && data.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Pagination */}
      {pagination && <TablePagination pagination={pagination} />}
    </div>
  );
}

export default DataTable;
