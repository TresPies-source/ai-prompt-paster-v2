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
