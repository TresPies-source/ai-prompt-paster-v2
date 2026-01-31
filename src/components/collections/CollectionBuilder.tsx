'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt, PromptCollection, validateCollection, COLLECTION_VALIDATION } from '@/types/prompt';
import { CreateCollectionRequest, UpdateCollectionRequest } from '@/types/api';

interface CollectionBuilderProps {
  collection?: PromptCollection | null;
  onSave: (collection: PromptCollection) => void;
  onCancel: () => void;
}

export default function CollectionBuilder({ collection, onSave, onCancel }: CollectionBuilderProps) {
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [promptIds, setPromptIds] = useState<string[]>(collection?.promptIds || []);
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const selectedPrompts = promptIds
    .map((id) => availablePrompts.find((p) => p.id === id))
    .filter((p): p is Prompt => p !== undefined);

  const filteredAvailablePrompts = availablePrompts.filter((prompt) => {
    if (promptIds.includes(prompt.id)) return false;
    
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      prompt.title.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const handleAddPrompt = (promptId: string) => {
    if (promptIds.length >= COLLECTION_VALIDATION.maxPromptsInCollection) {
      setError(`Cannot add more than ${COLLECTION_VALIDATION.maxPromptsInCollection} prompts to a collection`);
      return;
    }
    
    setPromptIds([...promptIds, promptId]);
    setError(null);
  };

  const handleRemovePrompt = (promptId: string) => {
    setPromptIds(promptIds.filter((id) => id !== promptId));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPromptIds = [...promptIds];
    const [movedItem] = newPromptIds.splice(draggedIndex, 1);
    newPromptIds.splice(dropIndex, 0, movedItem);

    setPromptIds(newPromptIds);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    const validationErrors = validateCollection({ name, description, promptIds });
    
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (collection) {
        const updateRequest: UpdateCollectionRequest = {
          name,
          description,
          promptIds,
        };

        const response = await fetch(`/api/drive/collections/${collection.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to update collection');
        }

        const data = await response.json();
        onSave(data.collection);
      } else {
        const createRequest: CreateCollectionRequest = {
          name,
          description,
          promptIds,
        };

        const response = await fetch('/api/drive/collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createRequest),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to create collection');
        }

        const data = await response.json();
        onSave(data.collection);
      }
    } catch (err) {
      console.error('Failed to save collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to save collection');
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = name.trim().length > 0 && 
                  description.trim().length > 0 && 
                  promptIds.length > 0 &&
                  !isSaving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="builder-title" className="text-2xl font-bold text-gray-900">
            {collection ? 'Edit Collection' : 'Create New Collection'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name <span className="text-red-500">*</span>
              </label>
              <input
                id="collection-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={COLLECTION_VALIDATION.maxNameLength}
                placeholder="e.g., Content Creation Workflow"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {name.length}/{COLLECTION_VALIDATION.maxNameLength} characters
              </p>
            </div>

            <div>
              <label htmlFor="collection-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={COLLECTION_VALIDATION.maxDescriptionLength}
                rows={3}
                placeholder="Describe the purpose and usage of this collection..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {description.length}/{COLLECTION_VALIDATION.maxDescriptionLength} characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Available Prompts
                  </h3>
                </div>
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />

                <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading prompts...</div>
                  ) : filteredAvailablePrompts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {searchQuery ? 'No prompts match your search' : 'No available prompts'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredAvailablePrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => handleAddPrompt(prompt.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {prompt.title}
                              </h4>
                              <p className="text-xs text-gray-600 truncate mt-1">
                                {prompt.content.slice(0, 80)}...
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddPrompt(prompt.id);
                              }}
                              className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              aria-label="Add to collection"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Collection Sequence
                  </h3>
                  <span className="text-sm text-gray-600">
                    {promptIds.length}/{COLLECTION_VALIDATION.maxPromptsInCollection} prompts
                  </span>
                </div>

                <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                  {selectedPrompts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Add prompts from the left to build your collection
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {selectedPrompts.map((prompt, index) => (
                        <div
                          key={prompt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 transition-all ${
                            draggedIndex === index ? 'opacity-50' : 'opacity-100'
                          } ${
                            dragOverIndex === index ? 'border-t-2 border-blue-500' : ''
                          } hover:bg-gray-100 cursor-move`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                              <span className="text-xs mt-1">{index + 1}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {prompt.title}
                              </h4>
                              <p className="text-xs text-gray-600 truncate mt-1">
                                {prompt.content.slice(0, 60)}...
                              </p>
                            </div>

                            <button
                              onClick={() => handleRemovePrompt(prompt.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              aria-label="Remove from collection"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedPrompts.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 italic">
                    Drag and drop to reorder prompts
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              collection ? 'Update Collection' : 'Create Collection'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
