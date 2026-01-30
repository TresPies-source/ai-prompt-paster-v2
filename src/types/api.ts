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
