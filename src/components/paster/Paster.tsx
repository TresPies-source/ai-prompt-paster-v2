'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ContentInput from './ContentInput';
import AISuggestions from './AISuggestions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import TemplateLibraryModal from '@/components/library/TemplateLibraryModal';
import { aiService, AIAnalysisResult } from '@/services/ai/aiService';
import { validatePrompt } from '@/types/prompt';

export default function Paster() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [folderPath, setFolderPath] = useState('/');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      if (!aiService.isInitialized()) {
        await aiService.initialize();
      }

      const result: AIAnalysisResult = await aiService.analyzeContent(content);
      setTitle(result.title);
      setTags(result.tags);
      setFolderPath(result.folderPath);
      setShowSuggestions(true);
      setPreviewMode(true);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  }, [content]);

  const handleSave = async () => {
    const validationErrors = validatePrompt({
      title,
      content,
      tags,
      folderPath,
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/drive/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          tags,
          folderPath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prompt');
      }

      const savedPrompt = await response.json();

      if (aiService.isInitialized()) {
        try {
          await aiService.storeEmbedding(savedPrompt.id, content);
        } catch (embeddingError) {
          console.warn('Failed to store embedding:', embeddingError);
        }
      }

      setSuccessMessage('Prompt saved successfully!');
      setContent('');
      setTitle('');
      setTags([]);
      setFolderPath('/');
      setShowSuggestions(false);
      setPreviewMode(false);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setContent('');
    setTitle('');
    setTags([]);
    setFolderPath('/');
    setShowSuggestions(false);
    setPreviewMode(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleRegenerate = () => {
    handleAnalyze();
  };

  const handleTemplateSelect = (templateContent: string) => {
    setContent(templateContent);
    setShowTemplateLibrary(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Paste New Prompt</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplateLibrary(true)}
            className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Start from Template
          </button>
          <button
            onClick={() => router.push('/library')}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Go to Library →
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-green-50 border border-green-200 p-4"
        >
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-400 mr-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ContentInput
            value={content}
            onChange={setContent}
            disabled={isAnalyzing || isSaving}
          />
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isSaving || !content.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <LoadingSpinner size="sm" className="border-white border-t-blue-300" />
                  Analyzing...
                </>
              ) : (
                'Analyze with AI'
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={isAnalyzing || isSaving}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        <div>
          {showSuggestions && (
            <AISuggestions
              title={title}
              tags={tags}
              folderPath={folderPath}
              onTitleChange={setTitle}
              onTagsChange={setTags}
              onFolderPathChange={setFolderPath}
              isLoading={isAnalyzing}
              onRegenerate={handleRegenerate}
              previewMode={previewMode}
            />
          )}
        </div>
      </div>

      {showSuggestions && (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="border-white border-t-green-300" />
                Saving...
              </>
            ) : (
              'Save Prompt'
            )}
          </button>
        </div>
      )}

      {showTemplateLibrary && (
        <TemplateLibraryModal
          onClose={() => setShowTemplateLibrary(false)}
          onSelectTemplate={handleTemplateSelect}
        />
      )}
    </div>
  );
}
