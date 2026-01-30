'use client';

import { Prompt } from '@/types/prompt';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface SuggestionsPanelProps {
  relatedPrompts: Array<{ prompt: Prompt; score: number }>;
  isSearching: boolean;
  onInsert: (prompt: Prompt) => void;
}

export default function SuggestionsPanel({
  relatedPrompts,
  isSearching,
  onInsert,
}: SuggestionsPanelProps) {
  const getRelevanceColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.7) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div className="w-96 flex flex-col bg-gray-50 border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">Related Prompts</h3>
        <p className="text-sm text-gray-500 mt-1">
          Suggestions update as you type
        </p>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {!isSearching && relatedPrompts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Start typing to see related prompts</p>
          </div>
        )}

        {!isSearching &&
          relatedPrompts.slice(0, 5).map((item, index) => (
            <motion.div
              key={item.prompt.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                  {item.prompt.title}
                </h4>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div
                    className={`h-2 w-2 rounded-full ${getRelevanceColor(item.score)}`}
                  />
                  <span className="text-xs text-gray-500">
                    {(item.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                {item.prompt.content}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {item.prompt.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onInsert(item.prompt)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Insert this prompt"
                >
                  <PlusIcon className="h-3 w-3" />
                  Insert
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-400">
                {item.prompt.folderPath}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
