/**
 * GlobalSearch Component - SmartFactory CONNECT
 * Universal search with keyboard shortcuts (Cmd+K)
 * Refactored to use modular components
 */
import React from 'react';
import { GlobalSearchProps } from './config';
import useGlobalSearch from './useGlobalSearch';
import SearchInput from './SearchInput';
import SearchResults from './SearchResults';
import SearchFooter from './SearchFooter';

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const {
    isOpen,
    setIsOpen,
    query,
    results,
    loading,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    containerRef,
    handleSearchChange,
    handleKeyDown,
    handleSelect,
    performSearch,
  } = useGlobalSearch();

  return (
    <div className={`relative ${className}`}>
      {/* Search Trigger */}
      <SearchInput
        inputRef={inputRef}
        query={query}
        onOpenSearch={() => setIsOpen(true)}
        onSearchChange={handleSearchChange}
        onKeyDown={handleKeyDown}
      />

      {/* Search Results Dropdown */}
      {isOpen && (query || results.length > 0) && (
        <div 
          ref={containerRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-[99999] max-h-[400px] overflow-hidden"
        >
          <SearchResults
            loading={loading}
            query={query}
            results={results}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            onSelectIndex={setSelectedIndex}
            onQuickSearch={(label) => {
              handleSearchChange(label);
              performSearch(label);
            }}
          />

          <SearchFooter />
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[99998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default GlobalSearch;
