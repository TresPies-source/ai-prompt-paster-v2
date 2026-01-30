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
      version: (existingPrompt.version || 0) + 1,
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

  private extractVariables(content: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  async getPromptHistory(promptId: string): Promise<Array<{ id: string; modifiedTime: string; version?: number }>> {
    const files = await this.driveClient.listFiles();
    const file = files.find(f => f.name === `${promptId}.json`);

    if (!file) {
      throw new Error(`Prompt with id ${promptId} not found`);
    }

    const revisions = await this.driveClient.getRevisions(file.id);

    const revisionsWithVersion = await Promise.all(
      revisions.map(async (rev, index) => {
        try {
          const content = await this.driveClient.getRevisionContent(file.id, rev.id);
          const prompt = JSON.parse(content) as Prompt;
          return {
            id: rev.id,
            modifiedTime: rev.modifiedTime,
            version: prompt.version || index + 1,
          };
        } catch (error) {
          return {
            id: rev.id,
            modifiedTime: rev.modifiedTime,
            version: index + 1,
          };
        }
      })
    );

    return revisionsWithVersion;
  }

  async getPromptVersion(promptId: string, revisionId: string): Promise<Prompt> {
    const files = await this.driveClient.listFiles();
    const file = files.find(f => f.name === `${promptId}.json`);

    if (!file) {
      throw new Error(`Prompt with id ${promptId} not found`);
    }

    const content = await this.driveClient.getRevisionContent(file.id, revisionId);
    return JSON.parse(content) as Prompt;
  }

  async saveAsTemplate(promptId: string): Promise<{ prompt: Prompt; variables: string[] }> {
    const existingPrompt = await this.getPrompt(promptId);

    if (!existingPrompt) {
      throw new Error(`Prompt with id ${promptId} not found`);
    }

    const variables = this.extractVariables(existingPrompt.content);

    const updatedPrompt: Prompt = {
      ...existingPrompt,
      isTemplate: true,
      variables,
      modifiedAt: new Date().toISOString(),
      version: (existingPrompt.version || 0) + 1,
    };

    const files = await this.driveClient.listFiles();
    const file = files.find(f => f.name === `${promptId}.json`);

    if (!file) {
      throw new Error(`File for prompt ${promptId} not found`);
    }

    const content = JSON.stringify(updatedPrompt, null, 2);
    await this.driveClient.updateFile(file.id, content);

    return { prompt: updatedPrompt, variables };
  }

  async createFromTemplate(
    templateId: string,
    variableValues: Record<string, string>,
    options?: { title?: string; folderPath?: string; tags?: string[] }
  ): Promise<Prompt> {
    const template = await this.getPrompt(templateId);

    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    if (!template.isTemplate) {
      throw new Error(`Prompt ${templateId} is not a template`);
    }

    let content = template.content;
    for (const [key, value] of Object.entries(variableValues)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    }

    const now = new Date().toISOString();
    const newPrompt: Prompt = {
      id: uuidv4(),
      title: options?.title || template.title,
      content,
      tags: options?.tags || template.tags,
      folderPath: options?.folderPath || template.folderPath,
      createdAt: now,
      modifiedAt: now,
      version: 1,
      viewCount: 0,
    };

    const fileName = `${newPrompt.id}.json`;
    const fileContent = JSON.stringify(newPrompt, null, 2);

    await this.driveClient.createFile(fileName, fileContent);

    return newPrompt;
  }

  async trackPromptView(promptId: string): Promise<{ viewCount: number; lastUsedAt: string }> {
    const existingPrompt = await this.getPrompt(promptId);

    if (!existingPrompt) {
      throw new Error(`Prompt with id ${promptId} not found`);
    }

    const now = new Date().toISOString();
    const updatedPrompt: Prompt = {
      ...existingPrompt,
      viewCount: (existingPrompt.viewCount || 0) + 1,
      lastUsedAt: now,
      modifiedAt: now,
    };

    const files = await this.driveClient.listFiles();
    const file = files.find(f => f.name === `${promptId}.json`);

    if (!file) {
      throw new Error(`File for prompt ${promptId} not found`);
    }

    const content = JSON.stringify(updatedPrompt, null, 2);
    await this.driveClient.updateFile(file.id, content);

    return {
      viewCount: updatedPrompt.viewCount || 0,
      lastUsedAt: updatedPrompt.lastUsedAt || now,
    };
  }

  async exportPrompts(promptIds: string[], format: 'json' | 'markdown'): Promise<string> {
    const prompts = await Promise.all(
      promptIds.map(id => this.getPrompt(id))
    );

    const validPrompts = prompts.filter((p): p is Prompt => p !== null);

    if (format === 'json') {
      return JSON.stringify(validPrompts, null, 2);
    } else {
      const markdown = validPrompts.map(prompt => {
        const frontmatter = [
          '---',
          `id: ${prompt.id}`,
          `title: ${prompt.title}`,
          `tags: ${prompt.tags.join(', ')}`,
          `folderPath: ${prompt.folderPath}`,
          `createdAt: ${prompt.createdAt}`,
          `modifiedAt: ${prompt.modifiedAt}`,
        ];

        if (prompt.isTemplate) {
          frontmatter.push('isTemplate: true');
          if (prompt.variables && prompt.variables.length > 0) {
            frontmatter.push(`variables: ${prompt.variables.join(', ')}`);
          }
        }

        if (prompt.viewCount) {
          frontmatter.push(`viewCount: ${prompt.viewCount}`);
        }

        if (prompt.lastUsedAt) {
          frontmatter.push(`lastUsedAt: ${prompt.lastUsedAt}`);
        }

        if (prompt.version) {
          frontmatter.push(`version: ${prompt.version}`);
        }

        frontmatter.push('---');
        frontmatter.push('');
        frontmatter.push(prompt.content);

        return frontmatter.join('\n');
      }).join('\n\n---\n\n');

      return markdown;
    }
  }

  async importPrompts(content: string, format: 'json' | 'markdown'): Promise<{ prompts: Prompt[]; imported: number; failed: number; errors?: string[] }> {
    const imported: Prompt[] = [];
    const errors: string[] = [];

    try {
      if (format === 'json') {
        const data = JSON.parse(content);
        const promptsToImport = Array.isArray(data) ? data : [data];

        for (const promptData of promptsToImport) {
          try {
            const now = new Date().toISOString();
            const newPrompt: Prompt = {
              ...promptData,
              id: uuidv4(),
              createdAt: now,
              modifiedAt: now,
              version: 1,
            };

            const validationErrors = validatePrompt(newPrompt);
            if (validationErrors.length > 0) {
              errors.push(`Validation failed for prompt "${promptData.title || 'Unknown'}": ${validationErrors.join(', ')}`);
              continue;
            }

            const fileName = `${newPrompt.id}.json`;
            const fileContent = JSON.stringify(newPrompt, null, 2);
            await this.driveClient.createFile(fileName, fileContent);

            imported.push(newPrompt);
          } catch (error) {
            errors.push(`Failed to import prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else {
        const promptBlocks = content.split(/\n---\n\n/);

        for (const block of promptBlocks) {
          try {
            const lines = block.split('\n');
            if (lines[0] !== '---') {
              continue;
            }

            const frontmatterEndIndex = lines.findIndex((line, idx) => idx > 0 && line === '---');
            if (frontmatterEndIndex === -1) {
              errors.push('Invalid markdown format: missing frontmatter end');
              continue;
            }

            const frontmatterLines = lines.slice(1, frontmatterEndIndex);
            const contentLines = lines.slice(frontmatterEndIndex + 1);

            const metadata: Record<string, string> = {};
            for (const line of frontmatterLines) {
              const colonIndex = line.indexOf(':');
              if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                metadata[key] = value;
              }
            }

            const now = new Date().toISOString();
            const newPrompt: Prompt = {
              id: uuidv4(),
              title: metadata.title || 'Untitled',
              content: contentLines.join('\n').trim(),
              tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
              folderPath: metadata.folderPath || '/',
              createdAt: now,
              modifiedAt: now,
              version: 1,
              isTemplate: metadata.isTemplate === 'true',
              variables: metadata.variables ? metadata.variables.split(',').map(v => v.trim()) : undefined,
              viewCount: metadata.viewCount ? parseInt(metadata.viewCount, 10) : undefined,
            };

            const validationErrors = validatePrompt(newPrompt);
            if (validationErrors.length > 0) {
              errors.push(`Validation failed for prompt "${newPrompt.title}": ${validationErrors.join(', ')}`);
              continue;
            }

            const fileName = `${newPrompt.id}.json`;
            const fileContent = JSON.stringify(newPrompt, null, 2);
            await this.driveClient.createFile(fileName, fileContent);

            imported.push(newPrompt);
          } catch (error) {
            errors.push(`Failed to parse markdown block: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return {
        prompts: imported,
        imported: imported.length,
        failed: errors.length,
        ...(errors.length > 0 && { errors }),
      };
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
