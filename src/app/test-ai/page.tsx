'use client';

import { useState } from 'react';
import { useAI } from '@/components/ai/AIProvider';
import { aiService } from '@/services/ai/aiService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

export default function TestAIPage() {
  const { initialized, loading, error, initializeAI } = useAI();
  const [testContent, setTestContent] = useState(
    'Write a Python Flask server with a REST API endpoint that returns JSON data.'
  );
  const [testResults, setTestResults] = useState<{
    title?: string;
    tags?: string[];
    folder?: string;
    error?: string;
  }>({});
  const [testing, setTesting] = useState(false);

  const handleInitialize = async () => {
    await initializeAI();
  };

  const handleTestAnalysis = async () => {
    if (!initialized) {
      setTestResults({ error: 'AI not initialized. Please initialize first.' });
      return;
    }

    setTesting(true);
    setTestResults({});

    try {
      const result = await aiService.analyzeContent(testContent, [
        '/Code Snippets/Python/',
        '/Code Snippets/JavaScript/',
        '/Writing/Technical/',
      ]);

      setTestResults({
        title: result.title,
        tags: result.tags,
        folder: result.folderPath,
      });
    } catch (err) {
      setTestResults({
        error: err instanceof Error ? err.message : 'Analysis failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestEmbedding = async () => {
    if (!initialized) {
      setTestResults({ error: 'AI not initialized. Please initialize first.' });
      return;
    }

    setTesting(true);
    setTestResults({});

    try {
      const embedding = await aiService.generateEmbedding(testContent);
      setTestResults({
        title: `Generated ${embedding.length}-dimensional embedding`,
        tags: [`First 5 values: ${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`],
      });
    } catch (err) {
      setTestResults({
        error: err instanceof Error ? err.message : 'Embedding generation failed',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            WebLLM Integration Test
          </h1>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Status:</span>
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-blue-600">Initializing...</span>
                </div>
              ) : initialized ? (
                <span className="text-green-600 font-semibold">✓ Initialized</span>
              ) : (
                <span className="text-gray-500">Not initialized</span>
              )}
            </div>

            {error && (
              <ErrorMessage
                message={error}
                onRetry={handleInitialize}
              />
            )}

            {!initialized && !loading && (
              <button
                onClick={handleInitialize}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Initialize AI Model
              </button>
            )}
          </div>
        </div>

        {initialized && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Test Content Analysis
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Content
              </label>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter content to analyze..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleTestAnalysis}
                disabled={testing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testing && <LoadingSpinner size="sm" />}
                Test Analysis (Title, Tags, Folder)
              </button>

              <button
                onClick={handleTestEmbedding}
                disabled={testing}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testing && <LoadingSpinner size="sm" />}
                Test Embedding Generation
              </button>
            </div>

            {testResults.error && (
              <ErrorMessage message={testResults.error} />
            )}

            {(testResults.title || testResults.tags || testResults.folder) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-green-900">Results:</h3>

                {testResults.title && (
                  <div>
                    <span className="font-medium text-gray-700">Title:</span>
                    <p className="text-gray-900 mt-1">{testResults.title}</p>
                  </div>
                )}

                {testResults.tags && testResults.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {testResults.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.folder && (
                  <div>
                    <span className="font-medium text-gray-700">Suggested Folder:</span>
                    <p className="text-gray-900 mt-1 font-mono">{testResults.folder}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Click &quot;Initialize AI Model&quot; to load the Phi-3 model</li>
            <li>Wait for the model to download and initialize (first time: 10-30s)</li>
            <li>Edit the test content or use the default</li>
            <li>Click &quot;Test Analysis&quot; to generate title, tags, and folder suggestion</li>
            <li>Click &quot;Test Embedding&quot; to generate a vector embedding</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
