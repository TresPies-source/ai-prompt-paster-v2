'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface TagCloudProps {
  tags: string[];
  tagCounts?: Map<string, number>;
  selectedTags?: string[];
  onTagClick?: (tag: string) => void;
  maxTags?: number;
  minFontSize?: number;
  maxFontSize?: number;
}

export default function TagCloud({
  tags,
  tagCounts,
  selectedTags = [],
  onTagClick,
  maxTags = 50,
  minFontSize = 12,
  maxFontSize = 32,
}: TagCloudProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const tagData = useMemo(() => {
    const counts = tagCounts || new Map(tags.map((tag) => [tag, 1]));
    const maxCount = Math.max(...Array.from(counts.values()));
    const minCount = Math.min(...Array.from(counts.values()));

    const sortedTags = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags);

    return sortedTags.map(([tag, count]) => {
      const normalizedSize =
        minCount === maxCount
          ? 0.5
          : (count - minCount) / (maxCount - minCount);

      const fontSize = minFontSize + normalizedSize * (maxFontSize - minFontSize);

      const colorIntensity = Math.floor(50 + normalizedSize * 50);

      return {
        tag,
        count,
        fontSize,
        colorIntensity,
      };
    });
  }, [tags, tagCounts, maxTags, minFontSize, maxFontSize]);

  if (tagData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <svg
          className="h-12 w-12 mx-auto mb-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        <p className="text-sm">No tags available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Tag Cloud
        </h3>
        <span className="text-sm text-gray-500">
          {tagData.length} tag{tagData.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 justify-center items-center min-h-[200px] py-4">
        {tagData.map(({ tag, count, fontSize, colorIntensity }, index) => {
          const isSelected = selectedTags.includes(tag);
          const isHovered = hoveredTag === tag;

          return (
            <motion.button
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTagClick?.(tag)}
              onMouseEnter={() => setHoveredTag(tag)}
              onMouseLeave={() => setHoveredTag(null)}
              className={`
                px-3 py-1 rounded-lg font-medium transition-all
                ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : isHovered
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              style={{
                fontSize: `${fontSize}px`,
                opacity: isSelected ? 1 : isHovered ? 0.9 : 0.7 + colorIntensity / 200,
              }}
              title={`${tag} (${count} prompt${count !== 1 ? 's' : ''})`}
            >
              {tag}
              {(isHovered || isSelected) && (
                <span className="ml-2 text-xs opacity-75">
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => selectedTags.forEach((tag) => onTagClick?.(tag))}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Click on a tag to filter prompts • Larger tags are used more frequently
        </p>
      </div>
    </div>
  );
}
