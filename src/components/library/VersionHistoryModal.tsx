'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptRevision } from '@/types/api';
import DiffViewer from './DiffViewer';

interface VersionHistoryModalProps {
  promptId: string;
  currentContent: string;
  onClose: () => void;
  onRestore?: (content: string) => void;
}

export default function VersionHistoryModal({ 
  promptId, 
  currentContent,
  onClose,
  onRestore
}: VersionHistoryModalProps) {
  const [revisions, setRevisions] = useState<PromptRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevisions, setSelectedRevisions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/drive/prompts/${promptId}/history`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }

      const data = await response.json();
      setRevisions(data.revisions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiff) {
          setShowDiff(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showDiff, onClose]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRevisionSelect = (revisionId: string) => {
    setSelectedRevisions(prev => {
      if (prev.includes(revisionId)) {
        return prev.filter(id => id !== revisionId);
      }
      if (prev.length >= 2) {
        return [prev[1], revisionId];
      }
      return [...prev, revisionId];
    });
  };

  const handleCompare = () => {
    if (selectedRevisions.length === 2) {
      setShowDiff(true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showDiff && selectedRevisions.length === 2) {
    return (
      <DiffViewer
        promptId={promptId}
        revisionId1={selectedRevisions[0]}
        revisionId2={selectedRevisions[1]}
        onClose={() => setShowDiff(false)}
        onRestore={onRestore}
      />
    );
  }

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
          className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="version-modal-title"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="version-modal-title" className="text-2xl font-bold text-gray-900">
              Version History
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="font-medium">Error loading history</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && revisions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lg font-medium">No version history available</p>
                <p className="text-sm mt-1">This prompt has not been edited yet</p>
              </div>
            )}

            {!loading && !error && revisions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-4">
                  Select up to 2 versions to compare
                </p>
                {revisions.map((revision, index) => (
                  <div
                    key={revision.id}
                    onClick={() => handleRevisionSelect(revision.id)}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedRevisions.includes(revision.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-6 h-6 rounded border-2 flex items-center justify-center
                            ${selectedRevisions.includes(revision.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                            }
                          `}>
                            {selectedRevisions.includes(revision.id) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Version {revision.version || (revisions.length - index)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(revision.modifiedTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Current
                        </span>
                      )}
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
              Cancel
            </button>
            <button
              onClick={handleCompare}
              disabled={selectedRevisions.length !== 2}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Compare Selected
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
