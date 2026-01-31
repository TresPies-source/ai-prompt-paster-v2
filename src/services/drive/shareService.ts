import { DriveClient } from './driveClient';
import { Share, Prompt } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class ShareService {
  constructor(private driveClient: DriveClient) {}

  async createShare(
    promptId: string,
    prompt: Prompt,
    options?: { expiresAt?: string; password?: string }
  ): Promise<{ share: Share; url: string }> {
    const token = this.generateToken();
    const now = new Date().toISOString();

    const share: Share = {
      id: uuidv4(),
      promptId,
      token,
      createdAt: now,
      expiresAt: options?.expiresAt,
      password: options?.password,
    };

    const fileName = `share_${share.token}.json`;
    const shareData = {
      ...share,
      prompt,
    };
    const content = JSON.stringify(shareData, null, 2);

    await this.driveClient.createShareFile(fileName, content);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/share/${token}`;

    return { share, url };
  }

  async getSharedPrompt(token: string): Promise<{ prompt: Prompt; sharedAt: string; expiresAt?: string } | null> {
    try {
      const files = await this.driveClient.listShareFiles();
      const file = files.find(f => f.name === `share_${token}.json`);

      if (!file) {
        return null;
      }

      const content = await this.driveClient.readFile(file.id);
      const shareData = JSON.parse(content) as { 
        id: string;
        promptId: string;
        token: string;
        createdAt: string;
        expiresAt?: string;
        password?: string;
        prompt: Prompt;
      };

      if (shareData.expiresAt) {
        const expirationDate = new Date(shareData.expiresAt);
        const now = new Date();
        if (now > expirationDate) {
          return null;
        }
      }

      return {
        prompt: shareData.prompt,
        sharedAt: shareData.createdAt,
        expiresAt: shareData.expiresAt,
      };
    } catch (error) {
      console.error('Error getting shared prompt:', error);
      return null;
    }
  }

  async getShareByPromptId(promptId: string): Promise<Share | null> {
    try {
      const files = await this.driveClient.listShareFiles();
      
      for (const file of files) {
        try {
          const content = await this.driveClient.readFile(file.id);
          const shareData = JSON.parse(content) as {
            id: string;
            promptId: string;
            token: string;
            createdAt: string;
            expiresAt?: string;
            password?: string;
            prompt: Prompt;
          };

          if (shareData.promptId === promptId) {
            if (shareData.expiresAt) {
              const expirationDate = new Date(shareData.expiresAt);
              const now = new Date();
              if (now > expirationDate) {
                continue;
              }
            }

            return {
              id: shareData.id,
              promptId: shareData.promptId,
              token: shareData.token,
              createdAt: shareData.createdAt,
              expiresAt: shareData.expiresAt,
              password: shareData.password,
            };
          }
        } catch (error) {
          console.error(`Error reading share file ${file.name}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting share by prompt ID:', error);
      return null;
    }
  }

  async deleteShare(token: string): Promise<boolean> {
    try {
      const files = await this.driveClient.listShareFiles();
      const file = files.find(f => f.name === `share_${token}.json`);

      if (!file) {
        return false;
      }

      await this.driveClient.deleteFile(file.id);
      return true;
    } catch (error) {
      console.error('Error deleting share:', error);
      return false;
    }
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}
