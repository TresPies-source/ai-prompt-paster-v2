'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import FolderTree from './FolderTree';
import TagFilter from './TagFilter';
import PromptGrid from './PromptGrid';
import PromptDetailModal from './PromptDetailModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import ExportDialog from './ExportDialog';
import ImportDialog from './ImportDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import SearchBar from '@/components/search/SearchBar';
import SearchResults from '@/components/search/SearchResults';
import { Prompt } from '@/types/prompt';
import { buildFolderTree, FolderNode } from '@/types/folder';
import { aiService } from '@/services/ai/aiService';
import { embeddingSyncService } from '@/services/ai/embeddingSync';

const Composer = dynamic(() => import('@/components/composer/Composer'), {
  loading: () => <LoadingSpinner size="sm" />,
  ssr: false,
});

export default function LibraryLayout() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('AND');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ prompt: Prompt; score: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showMostUsed, setShowMostUsed] = useState(true);
  const [showRecentlyUsed, setShowRecentlyUsed] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  const syncEmbeddings = useCallback(async () => {
    try {
      await embeddingSyncService.syncEmbeddings(prompts, (progress) => {
        console.log(
          `Syncing embeddings: ${progress.completed}/${progress.total} completed, ${progress.failed} failed`
        );
      });
    } catch (err) {
      console.error('Failed to sync embeddings:', err);
    }
  }, [prompts]);

  useEffect(() => {
    if (prompts.length > 0 && aiService.isInitialized()) {
      syncEmbeddings();
    }
  }, [prompts.length, syncEmbeddings]);

  const loadPrompts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/drive/prompts');
      if (!response.ok) {
        throw new Error('Failed to load prompts');
      }

      const data = await response.json();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const folderTree = useMemo(() => {
    const paths = Array.from(new Set(prompts.map((p) => p.folderPath)));
    const tree = buildFolderTree(paths);

    const updatePromptCounts = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map((node) => {
        const promptsInFolder = prompts.filter((p) =>
          p.folderPath.startsWith(node.path)
        ).length;

        return {
          ...node,
          promptCount: promptsInFolder,
          children: updatePromptCounts(node.children),
        };
      });
    };

    return updatePromptCounts(tree);
  }, [prompts]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts.forEach((prompt) => {
      prompt.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    if (selectedFolderPath) {
      filtered = filtered.filter((p) => p.folderPath === selectedFolderPath);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) => {
        if (filterMode === 'AND') {
          return selectedTags.every((tag) => p.tags.includes(tag));
        } else {
          return selectedTags.some((tag) => p.tags.includes(tag));
        }
      });
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    );
  }, [prompts, selectedFolderPath, selectedTags, filterMode]);

  const mostUsedPrompts = useMemo(() => {
    return prompts
      .filter((p) => p.viewCount && p.viewCount > 0)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 6);
  }, [prompts]);

  const recentlyUsedPrompts = useMemo(() => {
    return prompts
      .filter((p) => p.lastUsedAt)
      .sort((a, b) => {
        const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [prompts]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreateFolder = async (folderPath: string) => {
    try {
      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      await loadPrompts();
    } catch (err) {
      console.error('Failed to create folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleDeletePrompt = async () => {
    if (!promptToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/drive/prompts/${promptToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      setPrompts((prev) => prev.filter((p) => p.id !== promptToDelete.id));
      setPromptToDelete(null);
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      if (!aiService.isInitialized()) {
        throw new Error('AI service not initialized. Please wait for model to load.');
      }

      const results = await aiService.searchSimilar(query);
      
      const promptsWithScores = results
        .map((result) => {
          const prompt = prompts.find((p) => p.id === result.promptId);
          return prompt ? { prompt, score: result.score } : null;
        })
        .filter((item): item is { prompt: Prompt; score: number } => item !== null);

      setSearchResults(promptsWithScores);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Prompt Library</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportDialogOpen(true)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import
          </button>
          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
          <button
            onClick={() => setIsComposerOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            ✨ Compose
          </button>
          <button
            onClick={() => router.push('/paster')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Prompt
          </button>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <SearchBar
          onSearch={handleSearch}
          isSearching={isSearching}
        />
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          onRetry={loadPrompts}
        />
      )}

      {searchQuery ? (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear Search
            </button>
          </div>
          <SearchResults
            results={searchResults}
            onPromptClick={setSelectedPrompt}
            isSearching={isSearching}
          />
        </div>
      ) : (
        <>
          {(mostUsedPrompts.length > 0 || recentlyUsedPrompts.length > 0) && (
            <div className="mb-6 space-y-6">
              {mostUsedPrompts.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Most Used
                    </h2>
                    <button
                      onClick={() => setShowMostUsed(!showMostUsed)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                      aria-label={showMostUsed ? 'Hide most used' : 'Show most used'}
                    >
                      {showMostUsed ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showMostUsed && (
                    <PromptGrid
                      prompts={mostUsedPrompts}
                      onPromptClick={setSelectedPrompt}
                      onPromptDelete={setPromptToDelete}
                    />
                  )}
                </div>
              )}

              {recentlyUsedPrompts.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recently Used
                    </h2>
                    <button
                      onClick={() => setShowRecentlyUsed(!showRecentlyUsed)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                      aria-label={showRecentlyUsed ? 'Hide recently used' : 'Show recently used'}
                    >
                      {showRecentlyUsed ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showRecentlyUsed && (
                    <PromptGrid
                      prompts={recentlyUsedPrompts}
                      onPromptClick={setSelectedPrompt}
                      onPromptDelete={setPromptToDelete}
                    />
                  )}
                </div>
              )}
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <FolderTree
            folders={folderTree}
            selectedPath={selectedFolderPath}
            onFolderSelect={setSelectedFolderPath}
            onCreateFolder={handleCreateFolder}
          />

          <TagFilter
            availableTags={availableTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearFilters={() => setSelectedTags([])}
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
          />
        </div>

          <div className="lg:col-span-3">
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredPrompts.length} of {prompts.length} prompts
            </div>
            <PromptGrid
              prompts={filteredPrompts}
              onPromptClick={setSelectedPrompt}
              onPromptDelete={setPromptToDelete}
            />
          </div>
        </div>
        </>
      )}

      <PromptDetailModal
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onUpdate={(updatedPrompt) => {
          setPrompts((prev) =>
            prev.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p))
          );
          setSelectedPrompt(updatedPrompt);
        }}
      />

      <DeleteConfirmDialog
        prompt={promptToDelete}
        onConfirm={handleDeletePrompt}
        onCancel={() => setPromptToDelete(null)}
        isDeleting={isDeleting}
      />

      <Composer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSave={() => {
          loadPrompts();
        }}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        prompts={prompts}
        onClose={() => setIsExportDialogOpen(false)}
      />

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={() => {
          setIsImportDialogOpen(false);
          loadPrompts();
        }}
      />
    </div>
  );
}
