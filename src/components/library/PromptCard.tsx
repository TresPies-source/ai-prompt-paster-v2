'use client';

import { motion } from 'framer-motion';
import { Prompt, getAverageRating, getSuccessRate, getWinRate } from '@/types/prompt';

interface PromptCardProps {
  prompt: Prompt;
  onClick: () => void;
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

function getQualityColor(prompt: Prompt): string {
  const avgRating = getAverageRating(prompt);
  const successRate = getSuccessRate(prompt);
  const winRate = getWinRate(prompt);

  const isHighQuality = 
    (avgRating !== null && avgRating >= 4) ||
    (successRate !== null && successRate >= 0.8) ||
    (winRate !== null && winRate >= 0.7);

  const isMediumQuality = 
    (avgRating !== null && avgRating >= 3) ||
    (successRate !== null && successRate >= 0.5) ||
    (winRate !== null && winRate >= 0.4);

  if (isHighQuality) return 'border-green-300 bg-green-50';
  if (isMediumQuality) return 'border-yellow-300 bg-yellow-50';
  return 'border-gray-200 bg-white';
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg className="w-3.5 h-3.5 text-yellow-500" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  );
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

  const avgRating = getAverageRating(prompt);
  const successRate = getSuccessRate(prompt);
  const winRate = getWinRate(prompt);
  const qualityColor = getQualityColor(prompt);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`rounded-lg border p-4 shadow-sm hover:shadow-md cursor-pointer transition-all ${qualityColor}`}
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

      {(avgRating !== null || successRate !== null || winRate !== null) && (
        <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-200">
          {avgRating !== null && (
            <div className="flex items-center gap-1.5" title={`Average rating: ${avgRating.toFixed(1)} stars (${prompt.ratings?.length || 0} ratings)`}>
              <StarRating rating={avgRating} />
              <span className="text-xs text-gray-600 font-medium">{avgRating.toFixed(1)}</span>
            </div>
          )}
          
          {successRate !== null && (
            <span 
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                successRate >= 0.8 
                  ? 'bg-green-100 text-green-800' 
                  : successRate >= 0.5 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}
              title={`Success rate: ${(prompt.successCount || 0)} successes, ${(prompt.failureCount || 0)} failures`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {Math.round(successRate * 100)}% success
            </span>
          )}
          
          {winRate !== null && (
            <span 
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                winRate >= 0.7 
                  ? 'bg-purple-100 text-purple-800' 
                  : winRate >= 0.4 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
              title={`Win rate: ${(prompt.winCount || 0)} wins, ${(prompt.lossCount || 0)} losses`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {Math.round(winRate * 100)}% win
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-mono truncate flex-1">{prompt.folderPath}</span>
        <div className="flex items-center gap-2 ml-2">
          {prompt.viewCount !== undefined && prompt.viewCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full" title="View count">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {prompt.viewCount}
            </span>
          )}
          <span>
            {prompt.lastUsedAt 
              ? formatRelativeTime(prompt.lastUsedAt)
              : new Date(prompt.modifiedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
