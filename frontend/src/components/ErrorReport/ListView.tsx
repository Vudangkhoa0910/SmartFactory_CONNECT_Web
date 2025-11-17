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
import { columns } from "./tableColumns";

export function ListView({ data }: { data: Incident[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
        <thead className="text-xs text-slate-700 dark:text-slate-200 uppercase bg-slate-50 dark:bg-slate-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-4">
                  <div
                    className={`flex items-center gap-2 cursor-pointer ${
                      header.column.getCanSort() ? "select-none" : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {/* Cải tiến: Bỏ màu đỏ ở icon sort */}
                    {{
                      asc: <ChevronsUpDown size={14} />,
                      desc: <ChevronsUpDown size={14} />,
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="bg-white dark:bg-slate-900 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
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
  );
}
