'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt } from '@/types/prompt';
import { PromptRefinementSuggestion, RefinePromptResponse } from '@/types/api';

interface RefinementModalProps {
  prompt: Prompt;
  onClose: () => void;
  onApply?: (refinedContent: string) => void;
}

export default function RefinementModal({ prompt, onClose, onApply }: RefinementModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<PromptRefinementSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  useEffect(() => {
    const fetchRefinements = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/ai/refine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: prompt.content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate refinements');
        }

        const data: RefinePromptResponse = await response.json();
        setSuggestions(data.suggestions);
      } catch (err) {
        console.error('Error fetching refinements:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate refinements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRefinements();
  }, [prompt.content]);

  const handleApply = async (suggestion: PromptRefinementSuggestion, index: number) => {
    try {
      setApplyingIndex(index);

      const versionNumber = (prompt.version || 0) + 1;
      const newTitle = `${prompt.title} - Refined v${versionNumber}`;

      const response = await fetch('/api/drive/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          content: suggestion.content,
          tags: prompt.tags,
          folderPath: prompt.folderPath,
          sourceUrl: prompt.sourceUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create refined prompt');
      }

      if (onApply) {
        onApply(suggestion.content);
      }

      onClose();
    } catch (err) {
      console.error('Error applying refinement:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply refinement');
    } finally {
      setApplyingIndex(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="refinement-modal-title"
        >
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 id="refinement-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                AI Prompt Refinement
              </h2>
              <p className="text-gray-600">
                Reviewing: <span className="font-medium">{prompt.title}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating refinement suggestions...</p>
                <p className="text-sm text-gray-500 mt-2">This may take up to 60 seconds</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !error && suggestions.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-yellow-900">No Suggestions</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      The AI couldn&apos;t generate refinement suggestions. Your prompt may already be well-optimized.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !error && suggestions.length > 0 && (
              <div className="space-y-6">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Suggestion {index + 1}
                      </h3>
                      <button
                        onClick={() => handleApply(suggestion, index)}
                        disabled={applyingIndex !== null}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {applyingIndex === index ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Applying...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Apply as New Version
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Explanation:</h4>
                      <p className="text-gray-600">{suggestion.explanation}</p>
                    </div>

                    {suggestion.changes && suggestion.changes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Changes:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {suggestion.changes.map((change, changeIndex) => (
                            <li key={changeIndex} className="text-sm text-gray-600">
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Refined Content:</h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                          {suggestion.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
