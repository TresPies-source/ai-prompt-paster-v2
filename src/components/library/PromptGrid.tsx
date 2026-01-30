'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Prompt } from '@/types/prompt';
import PromptCard from './PromptCard';

interface PromptGridProps {
  prompts: Prompt[];
  onPromptClick: (prompt: Prompt) => void;
  onPromptDelete: (prompt: Prompt) => void;
}

export default function PromptGrid({
  prompts,
  onPromptClick,
  onPromptDelete,
}: PromptGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg
          className="w-16 h-16 mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No prompts found</p>
        <p className="text-sm">Try adjusting your filters or create a new prompt</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence>
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onClick={() => onPromptClick(prompt)}
            onDelete={() => onPromptDelete(prompt)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
