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
import AdvancedSearchBar, { SearchFilters } from '@/components/search/AdvancedSearchBar';
import SearchResults from '@/components/search/SearchResults';
import TagCloud from '@/components/search/TagCloud';
import SimilarPrompts from '@/components/search/SimilarPrompts';
import { Prompt, getAverageRating, getSuccessRate, getWinRate } from '@/types/prompt';
import { buildFolderTree, FolderNode } from '@/types/folder';
import { aiService } from '@/services/ai/aiService';
import { embeddingSyncService } from '@/services/ai/embeddingSync';

const Composer = dynamic(() => import('@/components/composer/Composer'), {
  loading: () => <LoadingSpinner size="sm" />,
  ssr: false,
});

type TabType = 'prompts' | 'collections';
type SortOption = 'modified' | 'rating' | 'success' | 'winRate' | 'viewCount';

export default function LibraryLayout() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('prompts');
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
  const [sortBy, setSortBy] = useState<SortOption>('modified');
  const [minRating, setMinRating] = useState<number>(0);
  const [minSuccessRate, setMinSuccessRate] = useState<number>(0);
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [findingSimilar, setFindingSimilar] = useState(false);
  const [similarToPromptId, setSimilarToPromptId] = useState<string | null>(null);
  const [showTagCloud, setShowTagCloud] = useState(false);
  const [showSimilarPrompts, setShowSimilarPrompts] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const syncEmbeddings = useCallback(async () => {
    try {
      await embeddingSyncService.syncEmbeddings(prompts);
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

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    prompts.forEach((prompt) => {
      prompt.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return counts;
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

    if (minRating > 0) {
      filtered = filtered.filter((p) => {
        const avgRating = getAverageRating(p);
        return avgRating !== null && avgRating >= minRating;
      });
    }

    if (minSuccessRate > 0) {
      filtered = filtered.filter((p) => {
        const successRate = getSuccessRate(p);
        return successRate !== null && successRate >= minSuccessRate / 100;
      });
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[dateRange];
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter((p) => {
        const modifiedDate = new Date(p.modifiedAt);
        return modifiedDate >= cutoffDate;
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating': {
          const ratingA = getAverageRating(a) ?? 0;
          const ratingB = getAverageRating(b) ?? 0;
          return ratingB - ratingA;
        }
        case 'success': {
          const successA = getSuccessRate(a) ?? 0;
          const successB = getSuccessRate(b) ?? 0;
          return successB - successA;
        }
        case 'winRate': {
          const winRateA = getWinRate(a) ?? 0;
          const winRateB = getWinRate(b) ?? 0;
          return winRateB - winRateA;
        }
        case 'viewCount': {
          const viewCountA = a.viewCount ?? 0;
          const viewCountB = b.viewCount ?? 0;
          return viewCountB - viewCountA;
        }
        case 'modified':
        default:
          return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
      }
    });
  }, [prompts, selectedFolderPath, selectedTags, filterMode, minRating, minSuccessRate, dateRange, sortBy]);

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

  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    setMinRating(filters.minRating);
    setMinSuccessRate(filters.minSuccessRate);
    setDateRange(filters.dateRange);
  }, []);

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
    setSimilarToPromptId(null);

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

  const handleFindSimilar = async (promptId: string) => {
    const prompt = prompts.find((p) => p.id === promptId);
    if (!prompt) return;

    setSimilarToPromptId(promptId);
    setSearchQuery('');
    setFindingSimilar(true);

    try {
      if (!aiService.isInitialized()) {
        throw new Error('AI service not initialized. Please wait for model to load.');
      }

      const searchText = `${prompt.title} ${prompt.content}`;
      const results = await aiService.searchSimilar(searchText, 0.5, 10);
      
      const promptsWithScores = results
        .map((result) => {
          if (result.promptId === promptId) return null;
          const p = prompts.find((p) => p.id === result.promptId);
          return p ? { prompt: p, score: result.score } : null;
        })
        .filter((item): item is { prompt: Prompt; score: number } => item !== null);

      setSearchResults(promptsWithScores);
    } catch (err) {
      console.error('Find similar failed:', err);
      setError(err instanceof Error ? err.message : 'Find similar failed');
    } finally {
      setFindingSimilar(false);
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

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'prompts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Prompts
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'collections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Collections
          </button>
        </nav>
      </div>

      {activeTab === 'prompts' && (
        <>
          <div className="mb-6 flex justify-center">
            <AdvancedSearchBar
              onSearch={handleSearch}
              onFiltersChange={handleFiltersChange}
              isSearching={isSearching}
              showFilters={true}
            />
          </div>

          <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="modified">Last Modified</option>
                <option value="rating">Rating</option>
                <option value="success">Success Rate</option>
                <option value="winRate">Win Rate</option>
                <option value="viewCount">View Count</option>
              </select>
            </div>

            <button
              onClick={() => setShowTagCloud(!showTagCloud)}
              className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                showTagCloud
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showTagCloud ? 'Hide' : 'Show'} Tag Cloud
            </button>

            <button
              onClick={() => setShowSimilarPrompts(!showSimilarPrompts)}
              className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${
                showSimilarPrompts
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              disabled={!selectedPrompt}
            >
              {showSimilarPrompts ? 'Hide' : 'Show'} Similar Prompts
            </button>
          </div>

          {showTagCloud && (
            <div className="mb-6">
              <TagCloud
                tags={availableTags}
                tagCounts={tagCounts}
                selectedTags={selectedTags}
                onTagClick={handleTagToggle}
                maxTags={50}
              />
            </div>
          )}

          {showSimilarPrompts && selectedPrompt && (
            <div className="mb-6">
              <SimilarPrompts
                sourcePrompt={selectedPrompt}
                allPrompts={prompts}
                onPromptClick={setSelectedPrompt}
                maxResults={5}
                minSimilarityScore={0.3}
              />
            </div>
          )}
        </>
      )}

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          onRetry={loadPrompts}
        />
      )}

      {activeTab === 'collections' && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Collections Coming Soon</h3>
          <p className="text-gray-600">
            Create and manage prompt collections to organize your workflow.
          </p>
        </div>
      )}

      {activeTab === 'prompts' && (searchQuery || similarToPromptId) ? (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {similarToPromptId ? 'Similar Prompts' : 'Search Results'}
            </h2>
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSimilarToPromptId(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear {similarToPromptId ? 'Similar' : 'Search'}
            </button>
          </div>
          <SearchResults
            results={searchResults}
            onPromptClick={setSelectedPrompt}
            isSearching={isSearching || findingSimilar}
          />
        </div>
      ) : activeTab === 'prompts' ? (
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
      ) : null}

      <PromptDetailModal
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onUpdate={(updatedPrompt) => {
          setPrompts((prev) =>
            prev.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p))
          );
          setSelectedPrompt(updatedPrompt);
        }}
        onFindSimilar={handleFindSimilar}
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
