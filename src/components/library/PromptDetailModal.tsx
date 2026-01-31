'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt, getAverageRating, getSuccessRate, getWinRate } from '@/types/prompt';
import VersionHistoryModal from './VersionHistoryModal';
import RefinementModal from './RefinementModal';
import ShareDialog from './ShareDialog';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onUpdate?: (prompt: Prompt) => void;
  onFindSimilar?: (promptId: string) => void;
}

export default function PromptDetailModal({ prompt, onClose, onUpdate, onFindSimilar }: PromptDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [isMarkingSuccess, setIsMarkingSuccess] = useState(false);

  const trackView = useCallback(async () => {
    if (!prompt) return;

    try {
      await fetch(`/api/drive/prompts/${prompt.id}/track-view`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  }, [prompt]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (prompt) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      trackView();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [prompt, onClose, trackView]);

  const handleCopy = async () => {
    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleRestore = async (content: string) => {
    if (!prompt || !onUpdate) return;

    try {
      const response = await fetch(`/api/drive/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      const data = await response.json();
      onUpdate(data.prompt);
      setShowHistory(false);
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!prompt) return;

    try {
      setIsSavingTemplate(true);
      const response = await fetch(`/api/drive/prompts/${prompt.id}/save-as-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to save as template');
      }

      const data = await response.json();
      if (onUpdate) {
        onUpdate(data.prompt);
      }
      setTemplateSuccess(true);
      setTimeout(() => setTemplateSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save as template:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!prompt || isRating) return;

    try {
      setIsRating(true);
      const response = await fetch(`/api/drive/prompts/${prompt.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error('Failed to add rating');
      }

      const data = await response.json();
      if (onUpdate) {
        onUpdate(data.prompt);
      }
    } catch (err) {
      console.error('Failed to add rating:', err);
    } finally {
      setIsRating(false);
      setHoveredStar(null);
    }
  };

  const handleMarkSuccess = async (success: boolean) => {
    if (!prompt || isMarkingSuccess) return;

    try {
      setIsMarkingSuccess(true);
      const response = await fetch(`/api/drive/prompts/${prompt.id}/mark-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark success');
      }

      const data = await response.json();
      if (onUpdate) {
        onUpdate(data.prompt);
      }
    } catch (err) {
      console.error('Failed to mark success:', err);
    } finally {
      setIsMarkingSuccess(false);
    }
  };

  if (!prompt) return null;

  if (showHistory) {
    return (
      <VersionHistoryModal
        promptId={prompt.id}
        currentContent={prompt.content}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestore}
      />
    );
  }

  if (showRefinement) {
    return (
      <RefinementModal
        prompt={prompt}
        onClose={() => setShowRefinement(false)}
        onApply={() => {
          setShowRefinement(false);
        }}
      />
    );
  }

  const averageRating = getAverageRating(prompt);
  const successRate = getSuccessRate(prompt);
  const winRate = getWinRate(prompt);

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
          className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                  {prompt.title}
                </h2>
                {averageRating !== null && (
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
                {successRate !== null && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    {Math.round(successRate * 100)}% Success
                  </span>
                )}
                {winRate !== null && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                    {Math.round(winRate * 100)}% Win Rate
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {prompt.content}
              </pre>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Folder:</span>
                <p className="mt-1 font-mono text-gray-600">{prompt.folderPath}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Modified:</span>
                <p className="mt-1 text-gray-600">
                  {new Date(prompt.modifiedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="mt-1 text-gray-600">
                  {new Date(prompt.createdAt).toLocaleString()}
                </p>
              </div>
              {prompt.viewCount !== undefined && (
                <div>
                  <span className="font-medium text-gray-700">Views:</span>
                  <p className="mt-1 text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {prompt.viewCount}
                  </p>
                </div>
              )}
              {prompt.lastUsedAt && (
                <div>
                  <span className="font-medium text-gray-700">Last Viewed:</span>
                  <p className="mt-1 text-gray-600">
                    {new Date(prompt.lastUsedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {prompt.sourceUrl && (
                <div>
                  <span className="font-medium text-gray-700">Source:</span>
                  <a
                    href={prompt.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:underline block truncate"
                  >
                    {prompt.sourceUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Tracking</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate this prompt:
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        disabled={isRating}
                        className="p-1 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Rate ${star} stars`}
                      >
                        <svg
                          className={`w-8 h-8 ${
                            (hoveredStar !== null ? star <= hoveredStar : false)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    {prompt.ratings && prompt.ratings.length > 0 && (
                      <span className="ml-2 text-sm text-gray-600">
                        ({prompt.ratings.length} rating{prompt.ratings.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Did this prompt work well?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleMarkSuccess(true)}
                      disabled={isMarkingSuccess}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Success
                    </button>
                    <button
                      onClick={() => handleMarkSuccess(false)}
                      disabled={isMarkingSuccess}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Failure
                    </button>
                    {(prompt.successCount !== undefined || prompt.failureCount !== undefined) && (
                      <span className="ml-2 text-sm text-gray-600">
                        ({(prompt.successCount || 0) + (prompt.failureCount || 0)} total feedback)
                      </span>
                    )}
                  </div>
                </div>

                {prompt.comparisonIds && prompt.comparisonIds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comparison History
                    </label>
                    <div className="text-sm text-gray-600">
                      <p>Compared {prompt.comparisonIds.length} time{prompt.comparisonIds.length !== 1 ? 's' : ''}</p>
                      <p className="mt-1">
                        Won: {prompt.winCount || 0} • Lost: {prompt.lossCount || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(true)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                History
              </button>
              <button
                onClick={() => setShowRefinement(true)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Improve
              </button>
              <button
                onClick={() => setShowShareDialog(true)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>
              {onFindSimilar && (
                <button
                  onClick={() => {
                    onFindSimilar(prompt.id);
                    onClose();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Find Similar
                </button>
              )}
              {!prompt.isTemplate && (
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={isSavingTemplate}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {templateSuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Saved as Template!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {isSavingTemplate ? 'Saving...' : 'Save as Template'}
                    </>
                  )}
                </button>
              )}
              {prompt.isTemplate && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                  Template
                </span>
              )}
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
      <ShareDialog
        isOpen={showShareDialog}
        prompt={prompt}
        onClose={() => setShowShareDialog(false)}
      />
    </AnimatePresence>
  );
}
