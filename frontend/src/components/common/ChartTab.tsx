import { useState } from "react";

interface ChartTabProps {
  onTabChange?: (tab: string) => void;
  tabs?: { value: string; label: string }[];
}

const ChartTab: React.FC<ChartTabProps> = ({ 
  onTabChange,
  tabs = [
    { value: "month", label: "30 ngày" },
    { value: "half", label: "6 tháng" },
    { value: "year", label: "12 tháng" },
  ]
}) => {
  const [selected, setSelected] = useState<string>(tabs[2]?.value || "year");

  const handleSelect = (value: string, label: string) => {
    setSelected(value);
    onTabChange?.(label);
  };

  const getButtonClass = (value: string) =>
    selected === value
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleSelect(tab.value, tab.label)}
          className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
            tab.value
          )}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ChartTab;
