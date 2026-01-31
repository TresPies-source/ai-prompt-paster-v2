'use client';

import { useState, useCallback, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { DEBOUNCE_DELAYS } from '@/config/constants';

export interface SearchFilters {
  minRating: number;
  minSuccessRate: number;
  dateRange: 'all' | '7d' | '30d' | '90d';
}

interface AdvancedSearchBarProps {
  onSearch: (query: string) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  isSearching?: boolean;
  showFilters?: boolean;
}

export default function AdvancedSearchBar({
  onSearch,
  onFiltersChange,
  placeholder = 'Search prompts semantically...',
  isSearching = false,
  showFilters = true,
}: AdvancedSearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minRating: 0,
    minSuccessRate: 0,
    dateRange: 'all',
  });

  const debouncedSearch = useCallback(
    (value: string) => {
      const timeoutId = setTimeout(() => {
        onSearch(value);
      }, DEBOUNCE_DELAYS.SEARCH_MS);

      return () => clearTimeout(timeoutId);
    },
    [onSearch]
  );

  useEffect(() => {
    const cleanup = debouncedSearch(inputValue);
    return cleanup;
  }, [inputValue, debouncedSearch]);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  const handleFilterChange = (key: keyof SearchFilters, value: number | string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      minRating: 0,
      minSuccessRate: 0,
      dateRange: 'all',
    });
  };

  const hasActiveFilters = filters.minRating > 0 || filters.minSuccessRate > 0 || filters.dateRange !== 'all';

  return (
    <div className="w-full max-w-3xl">
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" 
            aria-hidden="true" 
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            aria-label="Search prompts"
            role="searchbox"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {inputValue && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            )}
            {showFilters && (
              <button
                onClick={() => setIsFiltersPanelOpen(!isFiltersPanelOpen)}
                className={`p-1 rounded-full transition-colors ${
                  hasActiveFilters || isFiltersPanelOpen
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-400'
                }`}
                aria-label="Toggle filters"
                title="Advanced filters"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        {isSearching && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2" role="status" aria-label="Searching">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {showFilters && isFiltersPanelOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">All Ratings</option>
                <option value="1">1+ ⭐</option>
                <option value="2">2+ ⭐⭐</option>
                <option value="3">3+ ⭐⭐⭐</option>
                <option value="4">4+ ⭐⭐⭐⭐</option>
                <option value="5">5 ⭐⭐⭐⭐⭐</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Success Rate
              </label>
              <select
                value={filters.minSuccessRate}
                onChange={(e) => handleFilterChange('minSuccessRate', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">All Success Rates</option>
                <option value="50">50%+</option>
                <option value="70">70%+</option>
                <option value="80">80%+</option>
                <option value="90">90%+</option>
                <option value="95">95%+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              {hasActiveFilters
                ? 'Filters applied'
                : 'No filters applied'}
            </span>
            <button
              onClick={() => setIsFiltersPanelOpen(false)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
