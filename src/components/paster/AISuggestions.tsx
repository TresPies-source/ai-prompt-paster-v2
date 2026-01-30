'use client';

import { useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { PROMPT_VALIDATION } from '@/types/prompt';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface AISuggestionsProps {
  title: string;
  tags: string[];
  folderPath: string;
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
  onFolderPathChange: (folderPath: string) => void;
  isLoading?: boolean;
  onRegenerate?: () => void;
  previewMode?: boolean;
}

export default function AISuggestions({
  title,
  tags,
  folderPath,
  onTitleChange,
  onTagsChange,
  onFolderPathChange,
  isLoading = false,
  onRegenerate,
  previewMode = false,
}: AISuggestionsProps) {
  const [tagInput, setTagInput] = useState('');

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleFolderPathChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFolderPathChange(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < PROMPT_VALIDATION.maxTags) {
        onTagsChange([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isLoading ? 'Analyzing...' : 'AI Suggestions'}
          </h3>
          {previewMode && !isLoading && (
            <p className="text-sm text-gray-500 mt-1">
              Preview mode - Edit suggestions before saving
            </p>
          )}
        </div>
        {onRegenerate && !isLoading && (
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-2"
            aria-label="Regenerate AI suggestions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Regenerate
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={isLoading}
            maxLength={PROMPT_VALIDATION.maxTitleLength}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter a title for your prompt"
          />
          <p className="mt-1 text-xs text-gray-500">
            {title.length}/{PROMPT_VALIDATION.maxTitleLength}
          </p>
        </div>

        <div>
          <label htmlFor="folderPath" className="block text-sm font-medium text-gray-700 mb-1">
            Folder Path <span className="text-red-500">*</span>
          </label>
          <input
            id="folderPath"
            type="text"
            value={folderPath}
            onChange={handleFolderPathChange}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
            placeholder="/folder/subfolder/"
          />
          <p className="mt-1 text-xs text-gray-500">
            Must start with / and end with /
          </p>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  disabled={isLoading}
                  className="hover:text-blue-900 disabled:opacity-50"
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </motion.span>
            ))}
          </div>
          {tags.length < PROMPT_VALIDATION.maxTags && (
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Type a tag and press Enter"
            />
          )}
          <p className="mt-1 text-xs text-gray-500">
            {tags.length}/{PROMPT_VALIDATION.maxTags} tags (press Enter to add)
          </p>
        </div>
      </div>
    </motion.div>
  );
}
