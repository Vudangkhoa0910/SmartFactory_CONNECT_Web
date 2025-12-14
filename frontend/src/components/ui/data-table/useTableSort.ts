/**
 * useTableSort Hook - SmartFactory CONNECT
 */
import { useState, useMemo } from 'react';
import { Column, SortState } from './types';
import { sortData } from './utils';

interface UseTableSortProps<T> {
  data: T[];
  columns: Column<T>[];
  externalSortColumn?: string;
  externalSortDirection?: 'asc' | 'desc';
  onExternalSort?: (column: string, direction: 'asc' | 'desc') => void;
}

interface UseTableSortReturn<T> {
  sortedData: T[];
  currentSortColumn: string | null;
  currentSortDirection: 'asc' | 'desc';
  handleSort: (columnId: string) => void;
}

function useTableSort<T>({
  data,
  columns,
  externalSortColumn,
  externalSortDirection = 'asc',
  onExternalSort,
}: UseTableSortProps<T>): UseTableSortReturn<T> {
  const [localSort, setLocalSort] = useState<SortState>({
    column: null,
    direction: 'asc',
  });

  const currentSortColumn = externalSortColumn || localSort.column;
  const currentSortDirection = externalSortColumn ? externalSortDirection : localSort.direction;

  // Handle sorting
  const handleSort = (columnId: string) => {
    const newDirection = currentSortColumn === columnId && currentSortDirection === 'asc' ? 'desc' : 'asc';
    
    if (onExternalSort) {
      onExternalSort(columnId, newDirection);
    } else {
      setLocalSort({
        column: columnId,
        direction: newDirection,
      });
    }
  };

  // Sort data locally if no external sort handler
  const sortedData = useMemo(() => {
    if (onExternalSort || !localSort.column) return data;
    return sortData(data, columns, localSort.column, localSort.direction);
  }, [data, columns, localSort, onExternalSort]);

  return {
    sortedData,
    currentSortColumn,
    currentSortDirection,
    handleSort,
  };
}

export default useTableSort;
