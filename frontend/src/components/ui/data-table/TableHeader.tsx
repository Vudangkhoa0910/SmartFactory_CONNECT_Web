/**
 * TableHeader Component - SmartFactory CONNECT
 */
import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../../../icons';
import { Column } from './types';

interface TableHeaderProps<T> {
  columns: Column<T>[];
  selectable: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll?: (selected: boolean) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnId: string) => void;
  compact: boolean;
  stickyHeader: boolean;
}

function TableHeader<T>({
  columns,
  selectable,
  allSelected,
  someSelected,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
  compact,
  stickyHeader,
}: TableHeaderProps<T>) {
  return (
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
            onClick={() => column.sortable && onSort(column.id)}
          >
            <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
              {column.header}
              {column.sortable && (
                <span className="flex flex-col">
                  <ChevronUpIcon 
                    className={`w-3 h-3 -mb-1 ${sortColumn === column.id && sortDirection === 'asc' ? 'text-brand-600' : 'text-gray-300'}`}
                  />
                  <ChevronDownIcon 
                    className={`w-3 h-3 ${sortColumn === column.id && sortDirection === 'desc' ? 'text-brand-600' : 'text-gray-300'}`}
                  />
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default TableHeader;
