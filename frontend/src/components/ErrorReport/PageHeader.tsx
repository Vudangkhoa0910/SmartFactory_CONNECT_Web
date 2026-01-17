// src/components/PageHeader.tsx
import React from "react";
import { LayoutGrid, List, Plus, Search, FileDown } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface PageHeaderProps {
  viewMode: "kanban" | "list";
  onViewModeChange: (mode: "kanban" | "list") => void;
  onExport: () => void;
}

export function PageHeader({
  viewMode,
  onViewModeChange,
  onExport,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {t('error_report.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('error_report.description')}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <FileDown size={18} />
            {t('error_report.export_excel')}
          </button>

          <div className="bg-gray-200 dark:bg-neutral-700 p-1 rounded-md flex items-center">
            <button
              onClick={() => onViewModeChange("kanban")}
              className={`px-3 py-1 text-sm font-semibold rounded flex items-center gap-1.5 ${viewMode === "kanban"
                  ? "bg-white dark:bg-neutral-900 text-red-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
                }`}
            >
              <LayoutGrid size={16} /> {t('error_report.view.kanban')}
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`px-3 py-1 text-sm font-semibold rounded flex items-center gap-1.5 ${viewMode === "list"
                  ? "bg-white dark:bg-neutral-900 text-red-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
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
