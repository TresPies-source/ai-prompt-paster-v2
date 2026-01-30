import { DriveClient } from './driveClient';
import { Prompt, validatePrompt } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';

export class PromptService {
  constructor(private driveClient: DriveClient) {}

  async createPrompt(
    data: Omit<Prompt, 'id' | 'createdAt' | 'modifiedAt'>
  ): Promise<Prompt> {
    const validationErrors = validatePrompt(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const now = new Date().toISOString();
    const prompt: Prompt = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      modifiedAt: now,
    };

    const fileName = `${prompt.id}.json`;
    const content = JSON.stringify(prompt, null, 2);

    await this.driveClient.createFile(fileName, content);

    return prompt;
  }

  async getPrompt(id: string): Promise<Prompt | null> {
    try {
      const files = await this.driveClient.listFiles();
      const file = files.find(f => f.name === `${id}.json`);

      if (!file) {
        return null;
      }

      const content = await this.driveClient.readFile(file.id);
      return JSON.parse(content) as Prompt;
    } catch (error) {
      console.error('Error getting prompt:', error);
      return null;
    }
  }

  async listPrompts(filters?: {
    folderPath?: string;
    tags?: string[];
  }): Promise<Prompt[]> {
    const files = await this.driveClient.listFiles();
    const prompts: Prompt[] = [];

    for (const file of files) {
      try {
        const content = await this.driveClient.readFile(file.id);
        const prompt = JSON.parse(content) as Prompt;
        prompts.push(prompt);
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    let filtered = prompts;

    if (filters?.folderPath) {
      filtered = filtered.filter(p => p.folderPath === filters.folderPath);
    }

    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter(p =>
        filters.tags!.every(tag => p.tags.includes(tag))
      );
    }

    return filtered;
  }

  async updatePrompt(
    id: string,
    updates: Partial<Omit<Prompt, 'id' | 'createdAt' | 'modifiedAt'>>
  ): Promise<Prompt> {
    const existingPrompt = await this.getPrompt(id);

    if (!existingPrompt) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    const updatedPrompt: Prompt = {
      ...existingPrompt,
      ...updates,
      modifiedAt: new Date().toISOString(),
    };

    const validationErrors = validatePrompt(updatedPrompt);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const files = await this.driveClient.listFiles();
    const file = files.find(f => f.name === `${id}.json`);

    if (!file) {
      throw new Error(`File for prompt ${id} not found`);
    }

    const content = JSON.stringify(updatedPrompt, null, 2);
    await this.driveClient.updateFile(file.id, content);

    return updatedPrompt;
  }

  async deletePrompt(id: string): Promise<boolean> {
    const files = await this.driveClient.listFiles();
    const file = files.find(f => f.name === `${id}.json`);

    if (!file) {
      return false;
    }

    await this.driveClient.deleteFile(file.id);
    return true;
  }
}
