export interface RefinementHistoryEntry {
  timestamp: string;
  originalContent: string;
  refinedContent: string;
  explanation: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  createdAt: string;
  modifiedAt: string;
  sourceUrl?: string;
  isTemplate?: boolean;
  variables?: string[];
  viewCount?: number;
  lastUsedAt?: string;
  version?: number;
  
  ratings?: number[];
  successCount?: number;
  failureCount?: number;
  comparisonIds?: string[];
  winCount?: number;
  lossCount?: number;
  lastRatedAt?: string;
  refinementHistory?: RefinementHistoryEntry[];
}

export interface PromptValidationRules {
  maxTitleLength: number;
  maxContentLength: number;
  maxTags: number;
}

export const PROMPT_VALIDATION: PromptValidationRules = {
  maxTitleLength: 200,
  maxContentLength: 50000,
  maxTags: 10,
};

export interface CollectionValidationRules {
  maxNameLength: number;
  maxDescriptionLength: number;
  maxPromptsInCollection: number;
}

export const COLLECTION_VALIDATION: CollectionValidationRules = {
  maxNameLength: 100,
  maxDescriptionLength: 500,
  maxPromptsInCollection: 50,
};

export interface PromptCollection {
  id: string;
  name: string;
  description: string;
  promptIds: string[];
  createdAt: string;
  modifiedAt?: string;
}

export function validatePrompt(prompt: Partial<Prompt>): string[] {
  const errors: string[] = [];

  if (!prompt.title || prompt.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (prompt.title.length > PROMPT_VALIDATION.maxTitleLength) {
    errors.push(`Title must be ${PROMPT_VALIDATION.maxTitleLength} characters or less`);
  }

  if (!prompt.content || prompt.content.trim().length === 0) {
    errors.push('Content is required');
  } else if (prompt.content.length > PROMPT_VALIDATION.maxContentLength) {
    errors.push(`Content must be ${PROMPT_VALIDATION.maxContentLength} characters or less`);
  }

  if (!prompt.folderPath || prompt.folderPath.trim().length === 0) {
    errors.push('Folder path is required');
  } else if (!prompt.folderPath.startsWith('/')) {
    errors.push('Folder path must start with /');
  }

  if (prompt.tags && prompt.tags.length > PROMPT_VALIDATION.maxTags) {
    errors.push(`Maximum ${PROMPT_VALIDATION.maxTags} tags allowed`);
  }

  return errors;
}

export function getAverageRating(prompt: Prompt): number | null {
  if (!prompt.ratings || prompt.ratings.length === 0) {
    return null;
  }
  
  const sum = prompt.ratings.reduce((acc, rating) => acc + rating, 0);
  return sum / prompt.ratings.length;
}

export function getSuccessRate(prompt: Prompt): number | null {
  const successCount = prompt.successCount ?? 0;
  const failureCount = prompt.failureCount ?? 0;
  const totalCount = successCount + failureCount;
  
  if (totalCount === 0) {
    return null;
  }
  
  return successCount / totalCount;
}

export function getWinRate(prompt: Prompt): number | null {
  const winCount = prompt.winCount ?? 0;
  const lossCount = prompt.lossCount ?? 0;
  const totalComparisons = winCount + lossCount;
  
  if (totalComparisons === 0) {
    return null;
  }
  
  return winCount / totalComparisons;
}

export interface Share {
  id: string;
  promptId: string;
  token: string;
  createdAt: string;
  expiresAt?: string;
  password?: string;
}

export function validateCollection(collection: Partial<PromptCollection>): string[] {
  const errors: string[] = [];

  if (!collection.name || collection.name.trim().length === 0) {
    errors.push('Collection name is required');
  } else if (collection.name.length > COLLECTION_VALIDATION.maxNameLength) {
    errors.push(`Collection name must be ${COLLECTION_VALIDATION.maxNameLength} characters or less`);
  }

  if (!collection.description || collection.description.trim().length === 0) {
    errors.push('Collection description is required');
  } else if (collection.description.length > COLLECTION_VALIDATION.maxDescriptionLength) {
    errors.push(`Collection description must be ${COLLECTION_VALIDATION.maxDescriptionLength} characters or less`);
  }

  if (!collection.promptIds || !Array.isArray(collection.promptIds)) {
    errors.push('Collection must have a promptIds array');
  } else if (collection.promptIds.length === 0) {
    errors.push('Collection must contain at least one prompt');
  } else if (collection.promptIds.length > COLLECTION_VALIDATION.maxPromptsInCollection) {
    errors.push(`Collection cannot contain more than ${COLLECTION_VALIDATION.maxPromptsInCollection} prompts`);
  }

  return errors;
}
