import { Prompt } from './prompt';
import { FolderNode } from './folder';

export interface ListPromptsRequest {
  folderPath?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ListPromptsResponse {
  prompts: Prompt[];
  total: number;
  hasMore: boolean;
}

export interface CreatePromptRequest {
  title: string;
  content: string;
  tags: string[];
  folderPath: string;
  sourceUrl?: string;
}

export interface CreatePromptResponse {
  prompt: Prompt;
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
  tags?: string[];
  folderPath?: string;
}

export interface UpdatePromptResponse {
  prompt: Prompt;
}

export interface DeletePromptResponse {
  success: boolean;
}

export interface ListFoldersResponse {
  folders: FolderNode[];
}

export interface CreateFolderRequest {
  name: string;
  parentPath: string;
}

export interface CreateFolderResponse {
  folder: FolderNode;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface PromptRevision {
  id: string;
  modifiedTime: string;
  version?: number;
}

export interface GetHistoryResponse {
  revisions: PromptRevision[];
}

export interface GetVersionResponse {
  content: Prompt;
  revisionId: string;
}

export interface SaveAsTemplateRequest {
  extractVariables?: boolean;
}

export interface SaveAsTemplateResponse {
  prompt: Prompt;
  variables: string[];
}

export interface CreateFromTemplateRequest {
  templateId: string;
  variables: Record<string, string>;
  title?: string;
  folderPath?: string;
  tags?: string[];
}

export interface CreateFromTemplateResponse {
  prompt: Prompt;
}

export interface TrackViewResponse {
  success: boolean;
  viewCount: number;
  lastUsedAt: string;
}

export interface ExportRequest {
  promptIds: string[];
  format: 'json' | 'markdown';
}

export interface ExportResponse {
  content: string;
  filename: string;
  mimeType: string;
}

export interface ImportRequest {
  content: string;
  format: 'json' | 'markdown';
}

export interface ImportResponse {
  prompts: Prompt[];
  imported: number;
  failed: number;
  errors?: string[];
}

export interface AddRatingRequest {
  rating: number;
}

export interface AddRatingResponse {
  success: boolean;
  averageRating: number | null;
  totalRatings: number;
}

export interface MarkSuccessRequest {
  success: boolean;
}

export interface MarkSuccessResponse {
  success: boolean;
  successCount: number;
  failureCount: number;
  successRate: number | null;
}

export interface RecordComparisonRequest {
  winnerId: string;
  loserIds: string[];
}

export interface RecordComparisonResponse {
  success: boolean;
  winner: {
    id: string;
    winCount: number;
    winRate: number | null;
  };
  losers: Array<{
    id: string;
    lossCount: number;
    winRate: number | null;
  }>;
}

export interface PromptRefinementSuggestion {
  content: string;
  explanation: string;
  changes: string[];
}

export interface RefinePromptRequest {
  content: string;
}

export interface RefinePromptResponse {
  suggestions: PromptRefinementSuggestion[];
}

export interface CreateCollectionRequest {
  name: string;
  description: string;
  promptIds: string[];
}

export interface CreateCollectionResponse {
  collection: import('./prompt').PromptCollection;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  promptIds?: string[];
}

export interface UpdateCollectionResponse {
  collection: import('./prompt').PromptCollection;
}

export interface ListCollectionsResponse {
  collections: import('./prompt').PromptCollection[];
  total: number;
}

export interface SharePromptRequest {
  expiresAt?: string;
  password?: string;
}

export interface SharePromptResponse {
  success: boolean;
  token: string;
  url: string;
  expiresAt?: string;
}

export interface GetSharedPromptRequest {
  token: string;
  password?: string;
}

export interface GetSharedPromptResponse {
  prompt: Prompt;
  sharedAt: string;
  expiresAt?: string;
}
