'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CollectionCard from '@/components/collections/CollectionCard';
import CollectionBuilder from '@/components/collections/CollectionBuilder';
import { PromptCollection, Prompt } from '@/types/prompt';
import { ListCollectionsResponse } from '@/types/api';

export default function CollectionsPage() {
  const { data: session, status } = useSession();
  const [collections, setCollections] = useState<PromptCollection[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<PromptCollection | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [collectionsRes, promptsRes] = await Promise.all([
        fetch('/api/drive/collections'),
        fetch('/api/drive/prompts'),
      ]);

      if (!collectionsRes.ok) {
        throw new Error('Failed to load collections');
      }
      if (!promptsRes.ok) {
        throw new Error('Failed to load prompts');
      }

      const collectionsData: ListCollectionsResponse = await collectionsRes.json();
      const promptsData = await promptsRes.json();

      setCollections(collectionsData.collections);
      setPrompts(promptsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCollection = () => {
    setEditingCollection(null);
    setIsBuilderOpen(true);
  };

  const handleEditCollection = (collection: PromptCollection) => {
    setEditingCollection(collection);
    setIsBuilderOpen(true);
  };

  const handleDeleteCollection = (collectionId: string) => {
    setDeletingId(collectionId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/drive/collections/${deletingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }

      setCollections(collections.filter(c => c.id !== deletingId));
    } catch (err) {
      console.error('Failed to delete collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  const handleSaveCollection = (collection: PromptCollection) => {
    if (editingCollection) {
      setCollections(collections.map(c => c.id === collection.id ? collection : c));
    } else {
      setCollections([collection, ...collections]);
    }
    setIsBuilderOpen(false);
    setEditingCollection(null);
  };

  const handleCancelBuilder = () => {
    setIsBuilderOpen(false);
    setEditingCollection(null);
  };

  const getPromptTitles = (collection: PromptCollection): string[] => {
    return collection.promptIds
      .map(id => prompts.find(p => p.id === id)?.title)
      .filter((title): title is string => title !== undefined);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prompt Collections
            </h1>
            <p className="text-gray-600">
              Organize prompts into reusable sequences for complex workflows
            </p>
          </div>
          <button
            onClick={handleNewCollection}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Collection
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Collections Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first collection to organize prompts into reusable workflows.
              Perfect for multi-step tasks that require multiple prompts in sequence.
            </p>
            <button
              onClick={handleNewCollection}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  promptTitles={getPromptTitles(collection)}
                  onOpen={() => handleEditCollection(collection)}
                  onEdit={() => handleEditCollection(collection)}
                  onDelete={() => handleDeleteCollection(collection.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isBuilderOpen && (
          <CollectionBuilder
            collection={editingCollection}
            onSave={handleSaveCollection}
            onCancel={handleCancelBuilder}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 id="delete-title" className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Collection
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to delete this collection? This action cannot be undone.
                    The prompts themselves will not be deleted.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={cancelDelete}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
