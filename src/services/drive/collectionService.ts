import { DriveClient } from './driveClient';
import { PromptCollection, validateCollection } from '@/types/prompt';
import { v4 as uuidv4 } from 'uuid';

export class CollectionService {
  constructor(private driveClient: DriveClient) {}

  async createCollection(
    data: Omit<PromptCollection, 'id' | 'createdAt' | 'modifiedAt'>
  ): Promise<PromptCollection> {
    const validationErrors = validateCollection(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const now = new Date().toISOString();
    const collection: PromptCollection = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      modifiedAt: now,
    };

    const fileName = `collection_${collection.id}.json`;
    const content = JSON.stringify(collection, null, 2);

    await this.driveClient.createCollectionFile(fileName, content);

    return collection;
  }

  async getCollection(id: string): Promise<PromptCollection | null> {
    try {
      const files = await this.driveClient.listCollectionFiles();
      const file = files.find(f => f.name === `collection_${id}.json`);

      if (!file) {
        return null;
      }

      const content = await this.driveClient.readFile(file.id);
      return JSON.parse(content) as PromptCollection;
    } catch (error) {
      console.error('Error getting collection:', error);
      return null;
    }
  }

  async listCollections(): Promise<PromptCollection[]> {
    const files = await this.driveClient.listCollectionFiles();
    const collections: PromptCollection[] = [];

    for (const file of files) {
      if (!file.name.startsWith('collection_')) {
        continue;
      }

      try {
        const content = await this.driveClient.readFile(file.id);
        const collection = JSON.parse(content) as PromptCollection;
        collections.push(collection);
      } catch (error) {
        console.error(`Error reading collection file ${file.name}:`, error);
      }
    }

    return collections.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateCollection(
    id: string,
    updates: Partial<Omit<PromptCollection, 'id' | 'createdAt' | 'modifiedAt'>>
  ): Promise<PromptCollection> {
    const existingCollection = await this.getCollection(id);

    if (!existingCollection) {
      throw new Error(`Collection with id ${id} not found`);
    }

    const updatedCollection: PromptCollection = {
      ...existingCollection,
      ...updates,
      modifiedAt: new Date().toISOString(),
    };

    const validationErrors = validateCollection(updatedCollection);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const files = await this.driveClient.listCollectionFiles();
    const file = files.find(f => f.name === `collection_${id}.json`);

    if (!file) {
      throw new Error(`File for collection ${id} not found`);
    }

    const content = JSON.stringify(updatedCollection, null, 2);
    await this.driveClient.updateFile(file.id, content);

    return updatedCollection;
  }

  async deleteCollection(id: string): Promise<boolean> {
    try {
      const files = await this.driveClient.listCollectionFiles();
      const file = files.find(f => f.name === `collection_${id}.json`);

      if (!file) {
        return false;
      }

      await this.driveClient.deleteFile(file.id);
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
  }
}
