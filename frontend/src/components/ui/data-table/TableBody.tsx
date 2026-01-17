/**
 * TableBody Component - SmartFactory CONNECT
 */
import React from 'react';
import { Column } from './types';
import { getCellValue, getRowClasses } from './utils';

interface TableBodyProps<T> {
  data: T[];
  columns: Column<T>[];
  selectable: boolean;
  selectedRows: T[];
  onSelectRow?: (row: T) => void;
  onRowClick?: (row: T, index: number) => void;
  getRowKey: (row: T, index: number) => string | number;
  hoverable: boolean;
  striped: boolean;
  compact: boolean;
  rowClassName?: string | ((row: T, index: number) => string);
}

function TableBody<T>({
  data,
  columns,
  selectable,
  selectedRows,
  onSelectRow,
  onRowClick,
  getRowKey,
  hoverable,
  striped,
  compact,
  rowClassName,
}: TableBodyProps<T>) {
  return (
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {data.map((row, rowIndex) => (
        <tr
          key={getRowKey(row, rowIndex)}
          className={getRowClasses(row, rowIndex, {
            hoverable,
            striped,
            clickable: !!onRowClick,
            rowClassName,
          })}
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
  );
}

export default TableBody;
