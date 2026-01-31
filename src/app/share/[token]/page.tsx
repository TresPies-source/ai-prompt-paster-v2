'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GetSharedPromptResponse, ApiError } from '@/types/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function SharedPromptPage() {
  const params = useParams();
  const token = params.token as string;

  const [promptData, setPromptData] = useState<GetSharedPromptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchSharedPrompt() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/public/share/${token}`);
        
        if (!response.ok) {
          const errorData: ApiError = await response.json();
          
          if (response.status === 404) {
            setError('This shared prompt does not exist or has expired.');
          } else if (response.status === 400) {
            setError('Invalid share link.');
          } else {
            setError(errorData.details || errorData.error || 'Failed to load shared prompt.');
          }
          return;
        }

        const data: GetSharedPromptResponse = await response.json();
        setPromptData(data);
      } catch (err) {
        console.error('Error fetching shared prompt:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchSharedPrompt();
    }
  }, [token]);

  const handleCopy = async () => {
    if (!promptData) return;

    try {
      await navigator.clipboard.writeText(promptData.prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !promptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg 
              className="w-16 h-16 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Prompt Not Found
          </h1>
          <p className="text-gray-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const { prompt, sharedAt, expiresAt } = promptData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">
                {prompt.title}
              </h1>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">
                  Shared Prompt
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-8 py-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                {prompt.content}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleCopy}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
              }`}
            >
              {copied ? (
                <span className="flex items-center justify-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Content
                </span>
              )}
            </button>
          </div>

          {/* Metadata Footer */}
          <div className="px-8 py-4 bg-gray-100 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div>
                <span className="font-medium">Shared:</span>{' '}
                {new Date(sharedAt).toLocaleString()}
              </div>
              {expiresAt && (
                <div>
                  <span className="font-medium">Expires:</span>{' '}
                  {new Date(expiresAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            This is a read-only shared prompt.{' '}
            {prompt.isTemplate && (
              <span className="font-medium">This prompt is a template.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
