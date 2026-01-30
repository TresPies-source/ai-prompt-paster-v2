'use client';

import { Prompt } from '@/types/prompt';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface SearchResult {
  prompt: Prompt;
  score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  onPromptClick: (prompt: Prompt) => void;
  isSearching?: boolean;
}

export default function SearchResults({
  results,
  onPromptClick,
  isSearching = false,
}: SearchResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.7) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getRelevanceLabel = (score: number): string => {
    if (score >= 0.8) return 'Highly Relevant';
    if (score >= 0.7) return 'Relevant';
    return 'Somewhat Relevant';
  };

  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No results found</p>
        <p className="text-sm mt-2">Try a different search query</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {results.map((result, index) => (
          <motion.div
            key={result.prompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onPromptClick(result.prompt)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {result.prompt.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div
                      className={`h-2 w-2 rounded-full ${getRelevanceColor(result.score)}`}
                    />
                    <span className="text-xs text-gray-500">
                      {(result.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {result.prompt.content}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {result.prompt.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {result.prompt.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{result.prompt.tags.length - 3} more
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {result.prompt.folderPath}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => handleCopy(result.prompt, e)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedId === result.prompt.id ? (
                  <CheckIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {getRelevanceLabel(result.score)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
