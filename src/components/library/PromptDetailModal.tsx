'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt } from '@/types/prompt';
import VersionHistoryModal from './VersionHistoryModal';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onUpdate?: (prompt: Prompt) => void;
}

export default function PromptDetailModal({ prompt, onClose, onUpdate }: PromptDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);

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
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                {prompt.title}
              </h2>
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
    </AnimatePresence>
  );
}
