// src/components/PageHeader.tsx
import React from "react";
import { LayoutGrid, List, Plus, Search, FileDown } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface PageHeaderProps {
  viewMode: "kanban" | "list";
  onViewModeChange: (mode: "kanban" | "list") => void;
  onSearchChange: (term: string) => void;
  onExport: () => void;
}

export function PageHeader({
  viewMode,
  onViewModeChange,
  onSearchChange,
  onExport,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {t('error_report.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('error_report.description')}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            {/* Cải tiến: Đổi màu focus và thêm sự kiện onChange */}
            <input
              type="text"
              placeholder={t('error_report.search_placeholder')}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <FileDown size={18} />
            {t('error_report.export_excel')}
          </button>

          <div className="bg-slate-200 dark:bg-slate-700 p-1 rounded-md flex items-center">
            <button
              onClick={() => onViewModeChange("kanban")}
              className={`px-3 py-1 text-sm font-semibold rounded flex items-center gap-1.5 ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <LayoutGrid size={16} /> {t('error_report.view.kanban')}
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`px-3 py-1 text-sm font-semibold rounded flex items-center gap-1.5 ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <List size={16} /> {t('error_report.view.list')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
