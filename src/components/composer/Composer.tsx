'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import EditorPanel from './EditorPanel';
import SuggestionsPanel from './SuggestionsPanel';
import { Prompt } from '@/types/prompt';
import { validatePrompt } from '@/types/prompt';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { aiService } from '@/services/ai/aiService';

interface ComposerProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  onSave?: (prompt: Prompt) => void;
}

export default function Composer({
  isOpen,
  onClose,
  initialContent = '',
  onSave,
}: ComposerProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [folderPath, setFolderPath] = useState('/');
  const [relatedPrompts, setRelatedPrompts] = useState<Array<{ prompt: Prompt; score: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/drive/prompts');
      if (!response.ok) {
        throw new Error('Failed to load prompts');
      }
      const data = await response.json();
      setAllPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    }
  };

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);
  };

  const handleInsertPrompt = (prompt: Prompt) => {
    const cursorPosition = content.length;
    const newContent = content + (content ? '\n\n' : '') + prompt.content;
    setContent(newContent);
  };

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

      if (onSave) {
        onSave(savedPrompt);
      }

      handleClose();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setTitle('');
    setTags([]);
    setFolderPath('/');
    setRelatedPrompts([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="composer-title"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 id="composer-title" className="text-2xl font-bold text-gray-900">Prompt Composer</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close composer"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="px-4 pt-4">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
            <EditorPanel
              content={content}
              title={title}
              tags={tags}
              folderPath={folderPath}
              onContentChange={handleContentChange}
              onTitleChange={setTitle}
              onTagsChange={setTags}
              onFolderPathChange={setFolderPath}
              onSearch={setRelatedPrompts}
              onSearchStateChange={setIsSearching}
              allPrompts={allPrompts}
            />
            <SuggestionsPanel
              relatedPrompts={relatedPrompts}
              isSearching={isSearching}
              onInsert={handleInsertPrompt}
            />
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              aria-label="Cancel and close composer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim() || !title.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              aria-label="Save composed prompt"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="border-white border-t-blue-300" />
                  Saving...
                </>
              ) : (
                'Save Composed Prompt'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
