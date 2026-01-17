// src/components/common/DashboardCard.tsx
import React from "react";

type DashboardCardProps = {
  title: string;
  children: React.ReactNode;
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {title}
      </h3>
      <div className="flex-grow">{children}</div>
    </div>
  );
};

export default DashboardCard;
