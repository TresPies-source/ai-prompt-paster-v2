'use client';

import { useState, useEffect } from 'react';
import { Prompt } from '@/types/prompt';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface SimilarPromptsProps {
  sourcePrompt: Prompt;
  allPrompts: Prompt[];
  onPromptClick: (prompt: Prompt) => void;
  maxResults?: number;
  minSimilarityScore?: number;
}

interface SimilarPromptResult {
  prompt: Prompt;
  score: number;
  reason: string;
}

export default function SimilarPrompts({
  sourcePrompt,
  allPrompts,
  onPromptClick,
  maxResults = 5,
  minSimilarityScore = 0.3,
}: SimilarPromptsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [similarPrompts, setSimilarPrompts] = useState<SimilarPromptResult[]>([]);

  useEffect(() => {
    const findSimilarPrompts = () => {
      const results: SimilarPromptResult[] = [];

      for (const prompt of allPrompts) {
        if (prompt.id === sourcePrompt.id) continue;

        let score = 0;
        let reasons: string[] = [];

        const sharedTags = prompt.tags.filter((tag) => sourcePrompt.tags.includes(tag));
        if (sharedTags.length > 0) {
          const tagSimilarity = sharedTags.length / Math.max(prompt.tags.length, sourcePrompt.tags.length);
          score += tagSimilarity * 0.4;
          if (sharedTags.length > 0) {
            reasons.push(`${sharedTags.length} shared tag${sharedTags.length > 1 ? 's' : ''}`);
          }
        }

        if (prompt.folderPath === sourcePrompt.folderPath) {
          score += 0.2;
          reasons.push('Same folder');
        }

        const sourceWords = new Set(
          sourcePrompt.content
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 3)
        );
        const promptWords = new Set(
          prompt.content
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 3)
        );

        const commonWords = Array.from(sourceWords).filter((w) => promptWords.has(w));
        if (commonWords.length > 0) {
          const wordSimilarity = commonWords.length / Math.max(sourceWords.size, promptWords.size);
          score += wordSimilarity * 0.4;
          if (commonWords.length > 2) {
            reasons.push('Similar content');
          }
        }

        if (score >= minSimilarityScore) {
          results.push({
            prompt,
            score,
            reason: reasons.join(', ') || 'Related',
          });
        }
      }

      results.sort((a, b) => b.score - a.score);
      setSimilarPrompts(results.slice(0, maxResults));
    };

    findSimilarPrompts();
  }, [sourcePrompt, allPrompts, maxResults, minSimilarityScore]);

  const handleCopy = async (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.7) return 'bg-green-500';
    if (score >= 0.5) return 'bg-blue-500';
    if (score >= 0.3) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (similarPrompts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <SparklesIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-sm">No similar prompts found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Similar Prompts ({similarPrompts.length})
        </h3>
      </div>

      <AnimatePresence mode="popLayout">
        {similarPrompts.map((result, index) => (
          <motion.div
            key={result.prompt.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
            onClick={() => onPromptClick(result.prompt)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900 truncate text-sm">
                    {result.prompt.title}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div
                      className={`h-2 w-2 rounded-full ${getSimilarityColor(result.score)}`}
                      title={`Similarity: ${(result.score * 100).toFixed(0)}%`}
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {result.prompt.content}
                </p>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-600 font-medium">
                    {result.reason}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    {(result.score * 100).toFixed(0)}% match
                  </span>
                </div>

                {result.prompt.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    {result.prompt.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {result.prompt.tags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{result.prompt.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={(e) => handleCopy(result.prompt, e)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedId === result.prompt.id ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
