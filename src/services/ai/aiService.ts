import { SYSTEM_PROMPTS, formatPrompt } from '@/config/prompts';
import { AI_CONFIG, ERROR_MESSAGES } from '@/config/constants';
import { indexedDBService } from '@/services/storage/indexedDB';
import { PromptRefinementSuggestion } from '@/types/api';

export interface AIAnalysisResult {
  title: string;
  tags: string[];
  folderPath: string;
}

export interface ModelLoadProgress {
  progress: number;
  message: string;
}

type ProgressCallback = (progress: ModelLoadProgress) => void;

class AIService {
  private worker: Worker | null = null;
  private initialized = false;
  private initializing = false;
  private progressCallbacks: ProgressCallback[] = [];
  private pendingRequests: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();

  async initialize(onProgress?: ProgressCallback): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializing) {
      return new Promise((resolve, reject) => {
        const checkInit = setInterval(() => {
          if (this.initialized) {
            clearInterval(checkInit);
            resolve();
          } else if (!this.initializing) {
            clearInterval(checkInit);
            reject(new Error('Initialization failed'));
          }
        }, 100);
      });
    }

    this.initializing = true;

    if (onProgress) {
      this.progressCallbacks.push(onProgress);
    }

    if (!this.isWebGPUSupported()) {
      throw new Error(ERROR_MESSAGES.WEBGPU_NOT_SUPPORTED);
    }

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), {
          type: 'module',
        });

        this.worker.onmessage = (event) => {
          this.handleWorkerMessage(event.data);
        };

        this.worker.onerror = (error) => {
          this.initializing = false;
          reject(new Error(`Worker error: ${error.message}`));
        };

        const timeoutId = setTimeout(() => {
          this.initializing = false;
          reject(new Error(ERROR_MESSAGES.MODEL_LOAD_FAILED));
        }, AI_CONFIG.DEFAULT_TIMEOUT_MS);

        this.pendingRequests.set('initialize', {
          resolve: () => {
            clearTimeout(timeoutId);
            this.initialized = true;
            this.initializing = false;
            this.progressCallbacks = [];
            resolve();
          },
          reject: (error: Error) => {
            clearTimeout(timeoutId);
            this.initializing = false;
            this.progressCallbacks = [];
            reject(error);
          },
          timeout: timeoutId,
        });

        this.worker.postMessage({ type: 'initialize' });
      } catch (error) {
        this.initializing = false;
        reject(error);
      }
    });
  }

  private isWebGPUSupported(): boolean {
    return 'gpu' in navigator;
  }

  private handleWorkerMessage(data: {
    type: string;
    payload?: {
      progress?: number;
      message?: string;
      text?: string;
      embedding?: number[];
      error?: string;
    };
  }) {
    const { type, payload } = data;

    switch (type) {
      case 'initialized': {
        const request = this.pendingRequests.get('initialize');
        if (request) {
          this.pendingRequests.delete('initialize');
          request.resolve(undefined);
        }
        break;
      }

      case 'progress': {
        if (payload?.progress !== undefined && payload?.message) {
          this.progressCallbacks.forEach((callback) => {
            callback({
              progress: payload.progress!,
              message: payload.message!,
            });
          });
        }
        break;
      }

      case 'generated': {
        const request = this.pendingRequests.get('generate');
        if (request && payload?.text !== undefined) {
          clearTimeout(request.timeout);
          this.pendingRequests.delete('generate');
          request.resolve(payload.text);
        }
        break;
      }

      case 'embedded': {
        const request = this.pendingRequests.get('embed');
        if (request && payload?.embedding) {
          clearTimeout(request.timeout);
          this.pendingRequests.delete('embed');
          request.resolve(payload.embedding);
        }
        break;
      }

      case 'error': {
        const error = new Error(payload?.error || 'Unknown error');
        this.pendingRequests.forEach((request, key) => {
          clearTimeout(request.timeout);
          this.pendingRequests.delete(key);
          request.reject(error);
        });
        break;
      }
    }
  }

  private async generate(
    prompt: string,
    temperature = 0.7,
    maxTokens = 100
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('AI service not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete('generate');
        reject(new Error(ERROR_MESSAGES.ANALYSIS_TIMEOUT));
      }, AI_CONFIG.DEFAULT_TIMEOUT_MS);

      this.pendingRequests.set('generate', {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timeoutId,
      });

      this.worker!.postMessage({
        type: 'generate',
        payload: { prompt, temperature, maxTokens },
      });
    });
  }

  async generateTitle(content: string): Promise<string> {
    const truncatedContent = content.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const prompt = formatPrompt(SYSTEM_PROMPTS.GENERATE_TITLE, {
      content: truncatedContent,
    });

    const title = await this.generate(prompt, 0.3, 50);
    return title.trim();
  }

  async generateTags(content: string): Promise<string[]> {
    const truncatedContent = content.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const prompt = formatPrompt(SYSTEM_PROMPTS.GENERATE_TAGS, {
      content: truncatedContent,
    });

    const tagsText = await this.generate(prompt, 0.5, 50);
    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, AI_CONFIG.MAX_TAGS);

    return tags;
  }

  async suggestFolder(
    content: string,
    existingFolders: string[]
  ): Promise<string> {
    const truncatedContent = content.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const foldersText =
      existingFolders.length > 0
        ? existingFolders.join('\n')
        : 'No existing folders';

    const prompt = formatPrompt(SYSTEM_PROMPTS.SUGGEST_FOLDER, {
      content: truncatedContent,
      existingFolders: foldersText,
    });

    const folderPath = await this.generate(prompt, 0.3, 30);
    const cleanPath = folderPath.trim();

    if (!cleanPath.startsWith('/')) {
      return `/${cleanPath}`;
    }
    if (!cleanPath.endsWith('/')) {
      return `${cleanPath}/`;
    }

    return cleanPath;
  }

  async analyzeContent(
    content: string,
    existingFolders: string[] = []
  ): Promise<AIAnalysisResult> {
    const [title, tags, folderPath] = await Promise.all([
      this.generateTitle(content),
      this.generateTags(content),
      this.suggestFolder(content, existingFolders),
    ]);

    return {
      title,
      tags,
      folderPath,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.initialized) {
      throw new Error('AI service not initialized');
    }

    const truncatedText = text.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const embeddingText = SYSTEM_PROMPTS.EMBEDDING_PREFIX + truncatedText;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete('embed');
        reject(new Error(ERROR_MESSAGES.EMBEDDING_GENERATION_FAILED));
      }, AI_CONFIG.DEFAULT_TIMEOUT_MS);

      this.pendingRequests.set('embed', {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timeoutId,
      });

      this.worker!.postMessage({
        type: 'embed',
        payload: { text: embeddingText },
      });
    });
  }

  async storeEmbedding(promptId: string, content: string): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content);
      await indexedDBService.storeEmbedding(promptId, embedding);
    } catch (error) {
      console.error('Failed to store embedding:', error);
      throw error;
    }
  }

  async searchSimilar(
    query: string,
    threshold?: number,
    topK?: number
  ): Promise<Array<{ promptId: string; score: number }>> {
    const queryEmbedding = await this.generateEmbedding(query);
    return indexedDBService.searchSimilar(queryEmbedding, threshold, topK);
  }

  async refinePrompt(promptContent: string): Promise<PromptRefinementSuggestion[]> {
    if (!this.initialized) {
      throw new Error('AI service not initialized');
    }

    const truncatedContent = promptContent.slice(0, AI_CONFIG.MAX_CONTENT_LENGTH);
    const prompt = formatPrompt(SYSTEM_PROMPTS.REFINE_PROMPT, {
      content: truncatedContent,
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete('refine');
        reject(new Error('Prompt refinement timed out after 60 seconds'));
      }, AI_CONFIG.REFINEMENT_TIMEOUT_MS);

      this.pendingRequests.set('refine', {
        resolve: (response: unknown) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete('refine');

          try {
            const text = response as string;
            const cleanText = text.trim();
            
            let jsonText = cleanText;
            if (cleanText.startsWith('```json')) {
              jsonText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanText.startsWith('```')) {
              jsonText = cleanText.replace(/```\n?/g, '');
            }
            
            const parsed = JSON.parse(jsonText);
            
            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
              reject(new Error('Invalid response format: missing suggestions array'));
              return;
            }

            const suggestions = parsed.suggestions.filter(
              (s: unknown): s is PromptRefinementSuggestion => {
                const suggestion = s as Record<string, unknown>;
                return (
                  typeof suggestion.content === 'string' &&
                  typeof suggestion.explanation === 'string' &&
                  Array.isArray(suggestion.changes) &&
                  suggestion.changes.every((c: unknown) => typeof c === 'string')
                );
              }
            );

            if (suggestions.length === 0) {
              reject(new Error('No valid suggestions in response'));
              return;
            }

            resolve(suggestions);
          } catch (error) {
            if (error instanceof SyntaxError) {
              reject(new Error('Failed to parse refinement suggestions: Invalid JSON'));
            } else {
              reject(error);
            }
          }
        },
        reject,
        timeout: timeoutId,
      });

      this.worker!.postMessage({
        type: 'generate',
        payload: { 
          prompt, 
          temperature: 0.7, 
          maxTokens: 2000 
        },
      });
    });
  }

  async executePrompt(promptContent: string, userInput?: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('AI service not initialized');
    }

    const fullPrompt = userInput 
      ? `${promptContent}\n\n${userInput}`
      : promptContent;

    return new Promise((resolve, reject) => {
      const requestId = `execute_${Date.now()}`;
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Prompt execution timed out'));
      }, 60000);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timeoutId,
      });

      this.worker!.postMessage({
        type: 'generate',
        payload: { 
          prompt: fullPrompt, 
          temperature: 0.7, 
          maxTokens: 1000 
        },
      });
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  shutdown(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'shutdown' });
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.initializing = false;
    this.progressCallbacks = [];
    this.pendingRequests.clear();
  }
}

export const aiService = new AIService();
