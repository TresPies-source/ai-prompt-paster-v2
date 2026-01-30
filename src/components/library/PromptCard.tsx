'use client';

import { motion } from 'framer-motion';
import { Prompt } from '@/types/prompt';

interface PromptCardProps {
  prompt: Prompt;
  onClick: () => void;
  onDelete: () => void;
}

export default function PromptCard({ prompt, onClick, onDelete }: PromptCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const previewLength = 150;
  const contentPreview =
    prompt.content.length > previewLength
      ? prompt.content.slice(0, previewLength) + '...'
      : prompt.content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
          {prompt.title}
        </h3>
        <button
          onClick={handleDelete}
          className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          aria-label="Delete prompt"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{contentPreview}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {prompt.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
        {prompt.tags.length > 3 && (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            +{prompt.tags.length - 3} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-mono">{prompt.folderPath}</span>
        <span>
          {new Date(prompt.modifiedAt).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}
