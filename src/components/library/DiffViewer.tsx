'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt } from '@/types/prompt';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface DiffViewerProps {
  promptId: string;
  revisionId1: string;
  revisionId2: string;
  onClose: () => void;
  onRestore?: (content: string) => void;
}

export default function DiffViewer({
  promptId,
  revisionId1,
  revisionId2,
  onClose,
  onRestore
}: DiffViewerProps) {
  const [version1, setVersion1] = useState<Prompt | null>(null);
  const [version2, setVersion2] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [response1, response2] = await Promise.all([
        fetch(`/api/drive/prompts/${promptId}/version/${revisionId1}`),
        fetch(`/api/drive/prompts/${promptId}/version/${revisionId2}`)
      ]);

      if (!response1.ok || !response2.ok) {
        throw new Error('Failed to fetch version data');
      }

      const data1 = await response1.json();
      const data2 = await response2.json();

      setVersion1(data1.content);
      setVersion2(data2.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [promptId, revisionId1, revisionId2]);

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
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (content: string) => {
    if (!onRestore) return;

    setRestoring(true);
    try {
      onRestore(content);
      onClose();
    } catch (err) {
      console.error('Failed to restore version:', err);
    } finally {
      setRestoring(false);
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
          className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diff-modal-title"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="diff-modal-title" className="text-2xl font-bold text-gray-900">
              Compare Versions
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

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="m-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="font-medium">Error loading versions</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && version1 && version2 && (
              <div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b border-gray-200">
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{version1.title}</p>
                    <p className="text-sm text-gray-600">
                      Version {version1.version || 'N/A'} - {formatDate(version1.modifiedAt)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{version2.title}</p>
                    <p className="text-sm text-gray-600">
                      Version {version2.version || 'N/A'} - {formatDate(version2.modifiedAt)}
                    </p>
                  </div>
                </div>

                <div className="diff-viewer-wrapper">
                  <ReactDiffViewer
                    oldValue={version1.content}
                    newValue={version2.content}
                    splitView={true}
                    showDiffOnly={false}
                    styles={{
                      variables: {
                        light: {
                          diffViewerBackground: '#fff',
                          addedBackground: '#e6ffed',
                          addedColor: '#24292e',
                          removedBackground: '#ffeef0',
                          removedColor: '#24292e',
                          wordAddedBackground: '#acf2bd',
                          wordRemovedBackground: '#fdb8c0',
                          addedGutterBackground: '#cdffd8',
                          removedGutterBackground: '#ffdce0',
                          gutterBackground: '#f6f8fa',
                          gutterBackgroundDark: '#f3f4f6',
                          highlightBackground: '#fffbdd',
                          highlightGutterBackground: '#fff5b1',
                        },
                      },
                      line: {
                        padding: '10px 2px',
                        fontSize: '14px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              <p>Green = additions, Red = deletions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              {onRestore && version1 && (
                <button
                  onClick={() => handleRestore(version1.content)}
                  disabled={restoring}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {restoring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Restoring...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Restore Version {version1.version || 'Older'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
