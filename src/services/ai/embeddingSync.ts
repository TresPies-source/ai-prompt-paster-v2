import { aiService } from './aiService';
import { indexedDBService } from '@/services/storage/indexedDB';
import { Prompt } from '@/types/prompt';

export interface EmbeddingSyncProgress {
  total: number;
  completed: number;
  failed: number;
  currentPromptId?: string;
}

type ProgressCallback = (progress: EmbeddingSyncProgress) => void;

export class EmbeddingSyncService {
  private isSyncing = false;

  async syncEmbeddings(
    prompts: Prompt[],
    onProgress?: ProgressCallback
  ): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!aiService.isInitialized()) {
      throw new Error('AI service not initialized');
    }

    this.isSyncing = true;
    let completed = 0;
    let failed = 0;

    try {
      const existingEmbeddings = await indexedDBService.getAllEmbeddings();
      const existingIds = new Set(existingEmbeddings.map((e) => e.promptId));

      const promptsToSync = prompts.filter((p) => !existingIds.has(p.id));

      for (const prompt of promptsToSync) {
        try {
          if (onProgress) {
            onProgress({
              total: promptsToSync.length,
              completed,
              failed,
              currentPromptId: prompt.id,
            });
          }

          await aiService.storeEmbedding(prompt.id, prompt.content);
          completed++;
        } catch (error) {
          console.error(`Failed to generate embedding for prompt ${prompt.id}:`, error);
          failed++;
        }
      }

      if (onProgress) {
        onProgress({
          total: promptsToSync.length,
          completed,
          failed,
        });
      }

      return { success: completed, failed };
    } finally {
      this.isSyncing = false;
    }
  }

  async regenerateAllEmbeddings(
    prompts: Prompt[],
    onProgress?: ProgressCallback
  ): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!aiService.isInitialized()) {
      throw new Error('AI service not initialized');
    }

    this.isSyncing = true;
    let completed = 0;
    let failed = 0;

    try {
      await indexedDBService.clearAllEmbeddings();

      for (const prompt of prompts) {
        try {
          if (onProgress) {
            onProgress({
              total: prompts.length,
              completed,
              failed,
              currentPromptId: prompt.id,
            });
          }

          await aiService.storeEmbedding(prompt.id, prompt.content);
          completed++;
        } catch (error) {
          console.error(`Failed to generate embedding for prompt ${prompt.id}:`, error);
          failed++;
        }
      }

      if (onProgress) {
        onProgress({
          total: prompts.length,
          completed,
          failed,
        });
      }

      return { success: completed, failed };
    } finally {
      this.isSyncing = false;
    }
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const embeddingSyncService = new EmbeddingSyncService();
