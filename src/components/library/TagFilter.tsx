'use client';

import { motion } from 'framer-motion';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  filterMode: 'AND' | 'OR';
  onFilterModeChange: (mode: 'AND' | 'OR') => void;
}

export default function TagFilter({
  availableTags,
  selectedTags,
  onTagToggle,
  onClearFilters,
  filterMode,
  onFilterModeChange,
}: TagFilterProps) {
  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filter by Tags</h2>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {selectedTags.length > 1 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-gray-600">Match:</span>
          <div className="inline-flex rounded-md border border-gray-300">
            <button
              onClick={() => onFilterModeChange('AND')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                filterMode === 'AND'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } rounded-l-md`}
            >
              All
            </button>
            <button
              onClick={() => onFilterModeChange('OR')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                filterMode === 'OR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } rounded-r-md border-l border-gray-300`}
            >
              Any
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <motion.button
              key={tag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>

      {selectedTags.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">
          {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
