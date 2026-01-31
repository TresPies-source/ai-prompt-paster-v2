export const AI_CONFIG = {
  MODEL_ID: 'Phi-3-mini-4k-instruct-q4f16_1',
  MODEL_SIZE_GB: 2.3,
  MAX_TAGS: 5,
  MIN_TAGS: 3,
  DEFAULT_TIMEOUT_MS: 30000,
  REFINEMENT_TIMEOUT_MS: 60000,
  MAX_CONTENT_LENGTH: 10000,
  EMBEDDING_DIMENSION: 768,
  SEARCH_RELEVANCE_THRESHOLD: 0.6,
  SEARCH_TOP_K: 5,
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH_MS: 300,
  COMPOSER_SUGGESTIONS_MS: 500,
  INPUT_MS: 150,
} as const;

export const STORAGE_KEYS = {
  EMBEDDINGS_DB: 'ai-prompt-paster-embeddings',
  EMBEDDINGS_STORE: 'embeddings',
  MODEL_CACHE: 'webllm-model-cache',
} as const;

export const ERROR_MESSAGES = {
  MODEL_LOAD_FAILED: 'Failed to load AI model. Please refresh and try again.',
  WEBGPU_NOT_SUPPORTED: 'AI Prompt Paster requires a modern browser with WebGPU support. Please update your browser or try Chrome/Edge.',
  INSUFFICIENT_STORAGE: 'Insufficient storage space for AI model. Please free up at least 3GB of disk space.',
  ANALYSIS_TIMEOUT: 'AI analysis timed out. Please try again or save manually.',
  EMBEDDING_GENERATION_FAILED: 'Failed to generate search embedding.',
} as const;

export const UI_CONFIG = {
  MODEL_LOAD_TIPS: [
    'Your prompts are analyzed locally for complete privacy',
    'This download happens once — future visits are instant',
    'The AI engine runs entirely in your browser',
  ],
  TAG_COLORS: [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-yellow-100 text-yellow-800',
    'bg-indigo-100 text-indigo-800',
    'bg-red-100 text-red-800',
    'bg-teal-100 text-teal-800',
  ],
} as const;
