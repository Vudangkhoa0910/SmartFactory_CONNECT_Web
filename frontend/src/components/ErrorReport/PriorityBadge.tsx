import React, { useMemo } from "react";
import { Priority } from "../types";
import { useTranslation } from "../../contexts/LanguageContext";

interface PriorityBadgeProps {
  priority: Priority;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const { t } = useTranslation();
  const styles = useMemo(() => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800";
      case "Low":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-800";
      default: // Normal
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800";
    }
  }, [priority]);

  return (
    <span
      className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${styles}`}
    >
      {t(`priority.${priority.toLowerCase()}`)}
    </span>
  );
};

export default PriorityBadge;
