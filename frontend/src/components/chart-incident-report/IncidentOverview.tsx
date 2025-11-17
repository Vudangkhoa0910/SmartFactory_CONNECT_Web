import React from "react";

const IncidentOverview: React.FC = () => {
  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
        Incident Overview
      </h2>

      <ul className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
        <li>• Total incidents: 23</li>
        <li>• Pending review: 5</li>
        <li>• Resolved: 18</li>
        <li>• SLA breaches: 2</li>
      </ul>
    </div>
  );
};

export default IncidentOverview;
