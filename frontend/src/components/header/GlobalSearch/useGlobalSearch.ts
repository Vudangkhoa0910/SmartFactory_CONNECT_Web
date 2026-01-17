/**
 * useGlobalSearch Hook - SmartFactory CONNECT
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import api from '../../../services/api';
import { SearchResult } from './config';

interface UseGlobalSearchReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  query: string;
  results: SearchResult[];
  loading: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleSearchChange: (value: string) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  handleSelect: (result: SearchResult) => void;
  performSearch: (query: string) => void;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
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
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  // Select result
  const handleSelect = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    navigate(result.url);
  }, [navigate]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
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
  }, [results, selectedIndex, handleSelect]);

  return {
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
  };
}

export default useGlobalSearch;
