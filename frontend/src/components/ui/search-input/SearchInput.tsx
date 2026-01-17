/**
 * SearchInput Component - SmartFactory CONNECT
 * Search input with keyboard shortcut support
 */
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from '../../../icons';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  showShortcut?: boolean;
  shortcutKey?: string;
  autoFocus?: boolean;
  loading?: boolean;
  debounceMs?: number;
  className?: string;
  clearable?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-8 text-sm px-3 pl-8',
  md: 'h-10 text-sm px-4 pl-10',
  lg: 'h-12 text-base px-5 pl-12',
};

const ICON_SIZE_CLASSES = {
  sm: 'w-4 h-4 left-2.5',
  md: 'w-5 h-5 left-3',
  lg: 'w-6 h-6 left-4',
};

const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Tìm kiếm...',
  size = 'md',
  showShortcut = false,
  shortcutKey = 'K',
  autoFocus = false,
  loading = false,
  debounceMs = 300,
  className = '',
  clearable = true,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>(undefined);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Keyboard shortcut handler
  useEffect(() => {
    if (!showShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showShortcut, shortcutKey]);

  // Auto focus
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);

    // Debounced search
    if (onSearch && debounceMs > 0) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      clearTimeout(debounceTimerRef.current);
      onSearch(value);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <svg
        className={`absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 ${ICON_SIZE_CLASSES[size]}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          w-full rounded-lg
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          transition-all
          ${SIZE_CLASSES[size]}
          ${clearable && value ? 'pr-20' : showShortcut ? 'pr-16' : 'pr-4'}
        `}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Clear button */}
      {clearable && value && !loading && (
        <button
          onClick={handleClear}
          className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          type="button"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}

      {/* Keyboard shortcut hint */}
      {showShortcut && !value && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <span className="text-[10px]">⌘</span>
          {shortcutKey}
        </kbd>
      )}
    </div>
  );
};

export default SearchInput;
