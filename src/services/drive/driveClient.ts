import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';

const APP_FOLDER_NAME = 'AI Prompt Paster';
const PROMPTS_FOLDER_NAME = 'prompts';
const METADATA_FILE_NAME = 'metadata.json';

export interface DriveClientConfig {
  accessToken: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
};

export class DriveClient {
  private drive: drive_v3.Drive;
  private appFolderId: string | null = null;
  private promptsFolderId: string | null = null;

  constructor(config: DriveClientConfig) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: config.accessToken });

    this.drive = google.drive({ version: 'v3', auth });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < config.maxRetries) {
          const delay = config.baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  async ensureAppFolderStructure(): Promise<void> {
    await this.retry(async () => {
      const appFolderId = await this.getOrCreateFolder(APP_FOLDER_NAME, 'root');
      this.appFolderId = appFolderId;

      const promptsFolderId = await this.getOrCreateFolder(PROMPTS_FOLDER_NAME, appFolderId);
      this.promptsFolderId = promptsFolderId;

      await this.ensureMetadataFile();
    });
  }

  private async getOrCreateFolder(folderName: string, parentId: string): Promise<string> {
    const query = parentId === 'root'
      ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    const folder = await this.drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId === 'root' ? undefined : [parentId],
      },
      fields: 'id',
    });

    return folder.data.id!;
  }

  private async ensureMetadataFile(): Promise<void> {
    if (!this.appFolderId) {
      throw new Error('App folder not initialized');
    }

    const query = `name='${METADATA_FILE_NAME}' and '${this.appFolderId}' in parents and trashed=false`;
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (!response.data.files || response.data.files.length === 0) {
      const defaultMetadata = {
        version: '1.0.0',
        folders: [],
        settings: {
          modelPreference: 'phi-3',
          preloadModel: true,
          tagFilterMode: 'AND',
        },
        lastSync: new Date().toISOString(),
      };

      await this.drive.files.create({
        requestBody: {
          name: METADATA_FILE_NAME,
          parents: [this.appFolderId],
          mimeType: 'application/json',
        },
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(defaultMetadata, null, 2),
        },
      });
    }
  }

  async createFile(fileName: string, content: string): Promise<string> {
    if (!this.promptsFolderId) {
      await this.ensureAppFolderStructure();
    }

    return this.retry(async () => {
      const file = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [this.promptsFolderId!],
          mimeType: 'application/json',
        },
        media: {
          mimeType: 'application/json',
          body: content,
        },
        fields: 'id, name, createdTime, modifiedTime',
      });

      return file.data.id!;
    });
  }

  async readFile(fileId: string): Promise<string> {
    return this.retry(async () => {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      });

      return JSON.stringify(response.data);
    });
  }

  async updateFile(fileId: string, content: string): Promise<void> {
    await this.retry(async () => {
      await this.drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: content,
        },
      });
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.retry(async () => {
      await this.drive.files.delete({
        fileId,
      });
    });
  }

  async listFiles(): Promise<Array<{ id: string; name: string }>> {
    if (!this.promptsFolderId) {
      await this.ensureAppFolderStructure();
    }

    return this.retry(async () => {
      const response = await this.drive.files.list({
        q: `'${this.promptsFolderId}' in parents and trashed=false and mimeType='application/json'`,
        fields: 'files(id, name, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      return (response.data.files || []).map(file => ({
        id: file.id!,
        name: file.name!,
      }));
    });
  }

  async getMetadata(): Promise<string> {
    if (!this.appFolderId) {
      await this.ensureAppFolderStructure();
    }

    return this.retry(async () => {
      const query = `name='${METADATA_FILE_NAME}' and '${this.appFolderId}' in parents and trashed=false`;
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id)',
        spaces: 'drive',
      });

      if (!response.data.files || response.data.files.length === 0) {
        throw new Error('Metadata file not found');
      }

      const fileId = response.data.files[0].id!;
      return await this.readFile(fileId);
    });
  }

  async updateMetadata(content: string): Promise<void> {
    if (!this.appFolderId) {
      await this.ensureAppFolderStructure();
    }

    await this.retry(async () => {
      const query = `name='${METADATA_FILE_NAME}' and '${this.appFolderId}' in parents and trashed=false`;
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id)',
        spaces: 'drive',
      });

      if (!response.data.files || response.data.files.length === 0) {
        throw new Error('Metadata file not found');
      }

      const fileId = response.data.files[0].id!;
      await this.updateFile(fileId, content);
    });
  }

  async getRevisions(fileId: string): Promise<Array<{ id: string; modifiedTime: string }>> {
    return this.retry(async () => {
      const response = await this.drive.revisions.list({
        fileId,
        fields: 'revisions(id, modifiedTime)',
      });

      return (response.data.revisions || []).map(rev => ({
        id: rev.id!,
        modifiedTime: rev.modifiedTime!,
      }));
    });
  }

  async getRevisionContent(fileId: string, revisionId: string): Promise<string> {
    return this.retry(async () => {
      const response = await this.drive.revisions.get({
        fileId,
        revisionId,
        alt: 'media',
      });

      return JSON.stringify(response.data);
    });
  }
}
