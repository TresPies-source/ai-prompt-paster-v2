'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DEBOUNCE_DELAYS } from '@/config/constants';
import { aiService } from '@/services/ai/aiService';
import { Prompt } from '@/types/prompt';

interface EditorPanelProps {
  content: string;
  title: string;
  tags: string[];
  folderPath: string;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
  onFolderPathChange: (folderPath: string) => void;
  onSearch: (results: Array<{ prompt: Prompt; score: number }>) => void;
  onSearchStateChange: (isSearching: boolean) => void;
  allPrompts: Prompt[];
}

export default function EditorPanel({
  content,
  title,
  tags,
  folderPath,
  onContentChange,
  onTitleChange,
  onTagsChange,
  onFolderPathChange,
  onSearch,
  onSearchStateChange,
  allPrompts,
}: EditorPanelProps) {
  const [tagInput, setTagInput] = useState('');

  const variables = useMemo(() => {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = content.matchAll(variablePattern);
    const uniqueVars = new Set<string>();
    for (const match of matches) {
      uniqueVars.add(match[1]);
    }
    return Array.from(uniqueVars);
  }, [content]);

  const performSearch = useCallback(
    async (text: string) => {
      if (!text.trim() || text.trim().length < 3) {
        onSearch([]);
        return;
      }

      onSearchStateChange(true);

      try {
        if (!aiService.isInitialized()) {
          onSearch([]);
          return;
        }

        const results = await aiService.searchSimilar(text);

        const promptsWithScores = results
          .map((result) => {
            const prompt = allPrompts.find((p) => p.id === result.promptId);
            return prompt ? { prompt, score: result.score } : null;
          })
          .filter((item): item is { prompt: Prompt; score: number } => item !== null);

        onSearch(promptsWithScores);
      } catch (err) {
        console.error('Search failed:', err);
        onSearch([]);
      } finally {
        onSearchStateChange(false);
      }
    },
    [allPrompts, onSearch, onSearchStateChange]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(content);
    }, DEBOUNCE_DELAYS.COMPOSER_SUGGESTIONS_MS);

    return () => clearTimeout(timeoutId);
  }, [content, performSearch]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      onTagsChange([...tags, newTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const highlightVariables = (text: string) => {
    const parts = text.split(/({{[\w]+}})/g);
    return parts.map((part, index) => {
      if (part.match(/{{[\w]+}}/)) {
        return (
          <span key={index} className="bg-yellow-200 text-yellow-900 font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r border-gray-200">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter prompt title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Write your prompt here... Use {{variableName}} for variables"
              className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Variables detected: {variables.length > 0 ? variables.map(v => `{{${v}}}`).join(', ') : 'none'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Folder Path
          </label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => onFolderPathChange(e.target.value)}
            placeholder="/folder/subfolder/"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {variables.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">
              Variables in this prompt
            </h3>
            <ul className="space-y-1">
              {variables.map((variable) => (
                <li key={variable} className="text-sm text-yellow-800 font-mono">
                  {`{{${variable}}}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
