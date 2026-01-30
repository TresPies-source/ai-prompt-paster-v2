'use client';

import { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import { UI_CONFIG } from '@/config/constants';

interface ModelLoadingScreenProps {
  progress: number;
  message: string;
  onCancel?: () => void;
}

export default function ModelLoadingScreen({
  progress,
  message,
  onCancel,
}: ModelLoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % UI_CONFIG.MODEL_LOAD_TIPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg
              className="w-8 h-8 text-blue-600 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Loading AI Engine
          </h2>
          <p className="text-gray-600">
            Setting up your private AI assistant...
          </p>
        </div>

        <ProgressBar
          progress={progress}
          message={message}
          showPercentage={true}
          className="mb-6"
        />

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 text-center transition-opacity duration-500">
            💡 {UI_CONFIG.MODEL_LOAD_TIPS[tipIndex]}
          </p>
        </div>

        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Cancel and continue without AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
