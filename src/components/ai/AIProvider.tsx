'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiService, ModelLoadProgress } from '@/services/ai/aiService';
import ModelLoadingScreen from '@/components/common/ModelLoadingScreen';
import ErrorMessage from '@/components/common/ErrorMessage';

interface AIContextValue {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  progress: ModelLoadProgress | null;
  initializeAI: () => Promise<void>;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
}

interface AIProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

export default function AIProvider({ 
  children, 
  autoInitialize = true 
}: AIProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ModelLoadProgress | null>(null);

  const initializeAI = async () => {
    if (initialized || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await aiService.initialize((progressUpdate) => {
        setProgress(progressUpdate);
      });
      setInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize AI';
      setError(errorMessage);
      console.error('AI initialization failed:', err);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  useEffect(() => {
    if (autoInitialize && !initialized && !loading) {
      initializeAI();
    }

    return () => {
      aiService.shutdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoInitialize]);

  const value: AIContextValue = {
    initialized,
    loading,
    error,
    progress,
    initializeAI,
  };

  return (
    <AIContext.Provider value={value}>
      {loading && progress && (
        <ModelLoadingScreen
          progress={progress.progress}
          message={progress.message}
        />
      )}
      {children}
    </AIContext.Provider>
  );
}
