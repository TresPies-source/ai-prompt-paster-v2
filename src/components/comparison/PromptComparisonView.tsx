'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt, getWinRate } from '@/types/prompt';
import { aiService } from '@/services/ai/aiService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

interface PromptResult {
  promptId: string;
  promptTitle: string;
  output: string;
  isLoading: boolean;
  error: string | null;
}

export default function PromptComparisonView() {
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [testInput, setTestInput] = useState('');
  const [results, setResults] = useState<PromptResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [votedPromptId, setVotedPromptId] = useState<string | null>(null);
  const [isRecordingVote, setIsRecordingVote] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/drive/prompts');
      if (!response.ok) {
        throw new Error('Failed to load prompts');
      }

      const data = await response.json();
      setAvailablePrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptToggle = (promptId: string) => {
    setSelectedPromptIds((prev) => {
      if (prev.includes(promptId)) {
        return prev.filter((id) => id !== promptId);
      } else if (prev.length < 4) {
        return [...prev, promptId];
      }
      return prev;
    });
  };

  const handleRunComparison = async () => {
    if (selectedPromptIds.length < 2) {
      setError('Please select at least 2 prompts to compare');
      return;
    }

    if (!testInput.trim()) {
      setError('Please enter test input');
      return;
    }

    setIsRunning(true);
    setError(null);
    setHasRun(false);
    setVotedPromptId(null);

    try {
      if (!aiService.isInitialized()) {
        await aiService.initialize();
      }

      const selectedPrompts = availablePrompts.filter((p) =>
        selectedPromptIds.includes(p.id)
      );

      const initialResults: PromptResult[] = selectedPrompts.map((p) => ({
        promptId: p.id,
        promptTitle: p.title,
        output: '',
        isLoading: true,
        error: null,
      }));

      setResults(initialResults);

      const resultPromises = selectedPrompts.map(async (prompt, index) => {
        try {
          const output = await aiService.executePrompt(prompt.content, testInput);
          
          setResults((prev) =>
            prev.map((r) =>
              r.promptId === prompt.id
                ? { ...r, output, isLoading: false }
                : r
            )
          );
        } catch (err) {
          setResults((prev) =>
            prev.map((r) =>
              r.promptId === prompt.id
                ? {
                    ...r,
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'Execution failed',
                  }
                : r
            )
          );
        }
      });

      await Promise.all(resultPromises);
      setHasRun(true);
    } catch (err) {
      console.error('Comparison failed:', err);
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleVote = async (winnerId: string) => {
    if (isRecordingVote) return;

    const loserIds = selectedPromptIds.filter((id) => id !== winnerId);

    setIsRecordingVote(true);
    setError(null);

    try {
      const response = await fetch('/api/drive/prompts/record-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winnerId,
          loserIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record comparison');
      }

      setVotedPromptId(winnerId);
      
      await loadPrompts();
    } catch (err) {
      console.error('Failed to record vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to record vote');
    } finally {
      setIsRecordingVote(false);
    }
  };

  const getSelectedPrompts = () => {
    return availablePrompts.filter((p) => selectedPromptIds.includes(p.id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prompt Comparison</h1>
        <p className="text-gray-600">
          Select 2-4 prompts to test side-by-side and vote for the best result
        </p>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Prompts ({selectedPromptIds.length}/4)
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availablePrompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedPromptIds.includes(prompt.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePromptToggle(prompt.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">
                        {prompt.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {prompt.winCount !== undefined && prompt.lossCount !== undefined && (
                          <>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {prompt.winCount} wins
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              {prompt.lossCount} losses
                            </span>
                          </>
                        )}
                        {getWinRate(prompt) !== null && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                            {Math.round((getWinRate(prompt) ?? 0) * 100)}% win rate
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedPromptIds.includes(prompt.id) && (
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Input</h2>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter your test input here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleRunComparison}
              disabled={selectedPromptIds.length < 2 || !testInput.trim() || isRunning}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Running...
                </span>
              ) : (
                'Run Comparison'
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {results.length === 0 ? (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No comparison yet</h3>
              <p className="text-gray-600">Select prompts and run a comparison to see results</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {results.map((result) => {
                    const prompt = availablePrompts.find((p) => p.id === result.promptId);
                    const winRate = prompt ? getWinRate(prompt) : null;

                    return (
                      <motion.div
                        key={result.promptId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`bg-white rounded-lg border-2 p-4 ${
                          votedPromptId === result.promptId
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="mb-3">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {result.promptTitle}
                          </h3>
                          {winRate !== null && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                                {Math.round(winRate * 100)}% win rate
                              </span>
                              <span className="text-gray-500">
                                {prompt?.winCount || 0}W - {prompt?.lossCount || 0}L
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3 min-h-[200px] max-h-[400px] overflow-y-auto">
                          {result.isLoading ? (
                            <div className="flex items-center justify-center h-[200px]">
                              <LoadingSpinner size="md" />
                            </div>
                          ) : result.error ? (
                            <div className="text-red-600 text-sm">{result.error}</div>
                          ) : (
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {result.output}
                            </p>
                          )}
                        </div>

                        {hasRun && !result.isLoading && !result.error && (
                          <button
                            onClick={() => handleVote(result.promptId)}
                            disabled={isRecordingVote || votedPromptId !== null}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                              votedPromptId === result.promptId
                                ? 'bg-green-600 text-white'
                                : votedPromptId !== null
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {votedPromptId === result.promptId ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Winner!
                              </span>
                            ) : (
                              'Vote for Best'
                            )}
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {votedPromptId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
                >
                  <p className="text-green-800 font-medium">
                    Vote recorded! The winner&apos;s stats have been updated.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
