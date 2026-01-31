'use client';

import { motion } from 'framer-motion';
import { PromptCollection } from '@/types/prompt';

interface CollectionCardProps {
  collection: PromptCollection;
  promptTitles: string[];
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

export default function CollectionCard({ 
  collection, 
  promptTitles,
  onOpen, 
  onEdit, 
  onDelete 
}: CollectionCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const descriptionPreview =
    collection.description.length > 120
      ? collection.description.slice(0, 120) + '...'
      : collection.description;

  const previewPrompts = promptTitles.slice(0, 3);
  const remainingCount = promptTitles.length - 3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onOpen}
      className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-2 flex-1">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
              {collection.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {collection.promptIds.length} {collection.promptIds.length === 1 ? 'prompt' : 'prompts'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={handleEdit}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            aria-label="Edit collection"
            title="Edit collection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label="Delete collection"
            title="Delete collection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{descriptionPreview}</p>

      {previewPrompts.length > 0 && (
        <div className="border-t border-purple-200 pt-3 mb-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Prompt Sequence:</p>
          <div className="space-y-1.5">
            {previewPrompts.map((title, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 line-clamp-1 flex-1">
                  {title}
                </span>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-medium rounded">
                  +{remainingCount}
                </span>
                <span className="text-sm text-gray-500 italic">
                  more {remainingCount === 1 ? 'prompt' : 'prompts'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-purple-200">
        <span>
          Created {formatRelativeTime(collection.createdAt)}
        </span>
        {collection.modifiedAt && collection.modifiedAt !== collection.createdAt && (
          <span>
            Updated {formatRelativeTime(collection.modifiedAt)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
