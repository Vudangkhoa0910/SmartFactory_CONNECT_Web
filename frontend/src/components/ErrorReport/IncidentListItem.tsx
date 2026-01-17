import React from 'react';
import { Incident } from '../types';
import { PriorityBadge } from './Badges';
import { TimelineBadge } from './TimelineBadge';
import { MapPin, Building2 } from 'lucide-react';

interface IncidentListItemProps {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}

const IncidentListItem: React.FC<IncidentListItemProps> = ({
  incident,
  isSelected,
  onClick,
}) => {
  // Priority color for dot indicator
  const priorityDotColors = {
    Critical: 'bg-red-600',
    High: 'bg-orange-500',
    Normal: 'bg-green-600',
    Low: 'bg-gray-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-l-4 ${isSelected
          ? 'bg-red-50 dark:bg-red-900/20 border-l-red-600 shadow-md'
          : 'bg-white dark:bg-neutral-700 border-l-transparent hover:bg-gray-50 dark:hover:bg-neutral-600 hover:border-l-red-400'
        } border border-gray-200 dark:border-neutral-600`}
    >
      {/* Header with priority dot and title */}
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDotColors[incident.priority]}`} />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">
            {incident.title}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={incident.priority} />
            <TimelineBadge createdAt={incident.timestamp || incident.createdAt} priority={incident.priority} />
          </div>
        </div>
      </div>

      {/* Meta information */}
      <div className="flex flex-col gap-1.5 ml-4 text-xs">
        {incident.location && (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{incident.location}</span>
          </div>
        )}
        {incident.department && (
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-xs">
              {incident.department}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentListItem;
