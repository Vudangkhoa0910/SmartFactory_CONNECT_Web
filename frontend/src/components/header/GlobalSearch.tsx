/**
 * GlobalSearch Component - SmartFactory CONNECT
 * Universal search with keyboard shortcuts (Cmd+K)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { 
  AlertIcon, 
  BoxIcon, 
  CalenderIcon, 
  FileIcon,
  UserIcon 
} from '../../icons';
import api from '../../services/api';

interface SearchResult {
  id: string | number;
  type: 'incident' | 'idea' | 'booking' | 'news' | 'user';
  title: string;
  subtitle?: string;
  status?: string;
  url: string;
}

interface GlobalSearchProps {
  className?: string;
}

const TYPE_CONFIG = {
  incident: { 
    label: 'Sự cố', 
    icon: AlertIcon, 
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20'
  },
  idea: { 
    label: 'Góp ý', 
    icon: BoxIcon, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  booking: { 
    label: 'Đặt phòng', 
    icon: CalenderIcon, 
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  news: { 
    label: 'Tin tức', 
    icon: FileIcon, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  },
  user: { 
    label: 'Nhân viên', 
    icon: UserIcon, 
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800'
  }
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);
  const navigate = useNavigate();

  // Open search with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Search handler with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Parallel search across multiple endpoints
      const [incidentsRes, ideasRes, bookingsRes] = await Promise.allSettled([
        api.get(`/incidents?search=${encodeURIComponent(searchQuery)}&limit=5`),
        api.get(`/ideas?search=${encodeURIComponent(searchQuery)}&limit=5`),
        api.get(`/bookings?search=${encodeURIComponent(searchQuery)}&limit=5`)
      ]);

      const searchResults: SearchResult[] = [];

      // Process incidents
      if (incidentsRes.status === 'fulfilled' && incidentsRes.value.data.data) {
        incidentsRes.value.data.data.forEach((item: any) => {
          searchResults.push({
            id: item.id,
            type: 'incident',
            title: item.title,
            subtitle: `${item.location || 'N/A'} • ${item.reporter_name || 'Unknown'}`,
            status: item.status,
            url: `/error-report/all`
          });
        });
      }

      // Process ideas
      if (ideasRes.status === 'fulfilled' && ideasRes.value.data.data) {
        ideasRes.value.data.data.forEach((item: any) => {
          searchResults.push({
            id: item.id,
            type: 'idea',
            title: item.title,
            subtitle: item.is_anonymous ? 'Ẩn danh' : (item.submitter_name || 'Unknown'),
            status: item.status,
            url: `/feedback/public`
          });
        });
      }

      // Process bookings
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data.data) {
        bookingsRes.value.data.data.forEach((item: any) => {
          searchResults.push({
            id: item.id,
            type: 'booking',
            title: item.title,
            subtitle: `${item.room_name || 'Room'} • ${new Date(item.booking_date).toLocaleDateString('vi-VN')}`,
            status: item.status,
            url: `/room-booking`
          });
        });
      }

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && results[selectedIndex]) {
      event.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  // Select result
  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    navigate(result.url);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Trigger */}
      <div className="relative">
        <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
          <svg className="w-5 h-5 fill-gray-500 dark:fill-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Tìm kiếm nhanh..."
          className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-600 focus:outline-hidden focus:ring-3 focus:ring-brand-600/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-brand-600 xl:w-[430px]"
          onClick={() => setIsOpen(true)}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button 
          className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
          onClick={() => setIsOpen(true)}
        >
          <span>⌘</span>
          <span>K</span>
        </button>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query || results.length > 0) && (
        <div 
          ref={containerRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-[99999] max-h-[400px] overflow-hidden"
        >
          {/* Loading */}
          {loading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
              <span className="text-sm mt-2 block">Đang tìm kiếm...</span>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div className="py-2 max-h-[350px] overflow-y-auto">
              {results.map((result, index) => {
                const config = TYPE_CONFIG[result.type];
                const Icon = config.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isSelected ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                    }`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
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
              })}
            </div>
          )}

          {/* No results */}
          {!loading && query && results.length === 0 && (
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
          )}

          {/* Search tips */}
          {!loading && !query && (
            <div className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Tìm kiếm nhanh</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TYPE_CONFIG).slice(0, 4).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300"
                      onClick={() => {
                        setQuery(config.label);
                        performSearch(config.label);
                      }}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</span>
              <span>Di chuyển</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</span>
              <span>Chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</span>
              <span>Đóng</span>
            </div>
          </div>
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
