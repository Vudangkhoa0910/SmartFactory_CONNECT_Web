/**
 * SearchResults Component - SmartFactory CONNECT
 */
import React from 'react';
import { SearchResult, TYPE_CONFIG } from './config';
import SearchResultItem from './SearchResultItem';

interface SearchResultsProps {
  loading: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
  onSelectIndex: (index: number) => void;
  onQuickSearch: (query: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  loading,
  query,
  results,
  selectedIndex,
  onSelect,
  onSelectIndex,
  onQuickSearch,
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
        <span className="text-sm mt-2 block">Đang tìm kiếm...</span>
      </div>
    );
  }

  // Results list
  if (results.length > 0) {
    return (
      <div className="py-2 max-h-[350px] overflow-y-auto">
        {results.map((result, index) => (
          <SearchResultItem
            key={`${result.type}-${result.id}`}
            result={result}
            isSelected={index === selectedIndex}
            onSelect={onSelect}
            onMouseEnter={() => onSelectIndex(index)}
          />
        ))}
      </div>
    );
  }

  // No results
  if (query) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Không tìm thấy kết quả cho "<strong>{query}</strong>"
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Thử tìm kiếm với từ khóa khác
        </p>
      </div>
    );
  }

  // Quick search tips
  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Tìm kiếm nhanh</p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(TYPE_CONFIG).slice(0, 4).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300"
              onClick={() => onQuickSearch(config.label)}
            >
              <Icon className={`w-4 h-4 ${config.color}`} />
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
