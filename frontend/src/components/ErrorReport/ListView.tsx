// src/components/ListView.tsx
import React, { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronsUpDown } from "lucide-react";
import { Incident } from "../types/index";
import { getColumns } from "./tableColumns";
import { useTranslation } from "../../contexts/LanguageContext";
import { EmptyState } from "./EmptyState";
import { FileSearch } from "lucide-react";

export function ListView({ data }: { data: Incident[] }) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns: getColumns(t),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-sm p-8">
        <EmptyState
          title="Không có sự cố nào"
          description="Không tìm thấy sự cố nào phù hợp với bộ lọc của bạn"
          icon={<FileSearch size={32} />}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead className="text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-50 dark:bg-neutral-900 border-b-2 border-gray-200 dark:border-neutral-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-4">
                    <div
                      className={`flex items-center gap-2 cursor-pointer ${header.column.getCanSort() ? "select-none hover:text-red-600 dark:hover:text-red-400" : ""
                        }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: <ChevronsUpDown size={14} className="text-red-600" />,
                        desc: <ChevronsUpDown size={14} className="text-red-600" />,
                      }[header.column.getIsSorted() as string] ??
                        (header.column.getCanSort() ? (
                          <ChevronsUpDown size={14} className="opacity-30" />
                        ) : null)}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-gray-100 dark:border-neutral-700 transition-all duration-150 ${index % 2 === 0
                    ? 'bg-white dark:bg-neutral-800'
                    : 'bg-gray-50/50 dark:bg-neutral-800/50'
                  } hover:bg-red-50 dark:hover:bg-red-900/10 hover:shadow-sm`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
