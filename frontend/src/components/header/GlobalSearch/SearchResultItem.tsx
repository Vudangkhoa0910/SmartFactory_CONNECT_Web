/**
 * SearchResultItem Component - SmartFactory CONNECT
 */
import React from 'react';
import { SearchResult, TYPE_CONFIG } from './config';

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onSelect: (result: SearchResult) => void;
  onMouseEnter: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isSelected,
  onSelect,
  onMouseEnter,
}) => {
  const config = TYPE_CONFIG[result.type];
  const Icon = config.icon;

  return (
    <button
      className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
        isSelected ? 'bg-gray-50 dark:bg-gray-700/50' : ''
      }`}
      onClick={() => onSelect(result)}
      onMouseEnter={onMouseEnter}
    >
      <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {result.title}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
        </div>
        {result.subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {result.subtitle}
          </p>
        )}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        ↵
      </div>
    </button>
  );
};

export default SearchResultItem;
