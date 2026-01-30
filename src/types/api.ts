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
