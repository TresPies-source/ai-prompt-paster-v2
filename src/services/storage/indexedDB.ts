import { STORAGE_KEYS, AI_CONFIG } from '@/config/constants';

export interface EmbeddingRecord {
  promptId: string;
  embedding: number[];
  createdAt: string;
}

class IndexedDBService {
  private dbName = STORAGE_KEYS.EMBEDDINGS_DB;
  private storeName = STORAGE_KEYS.EMBEDDINGS_STORE;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'promptId' });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async storeEmbedding(promptId: string, embedding: number[]): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const record: EmbeddingRecord = {
        promptId,
        embedding,
        createdAt: new Date().toISOString(),
      };

      const request = objectStore.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store embedding'));
    });
  }

  async getEmbedding(promptId: string): Promise<number[] | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(promptId);

      request.onsuccess = () => {
        const record = request.result as EmbeddingRecord | undefined;
        resolve(record?.embedding || null);
      };

      request.onerror = () => reject(new Error('Failed to retrieve embedding'));
    });
  }

  async getAllEmbeddings(): Promise<EmbeddingRecord[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result as EmbeddingRecord[]);
      };

      request.onerror = () => reject(new Error('Failed to retrieve embeddings'));
    });
  }

  async deleteEmbedding(promptId: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(promptId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete embedding'));
    });
  }

  async clearAllEmbeddings(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear embeddings'));
    });
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async searchSimilar(
    queryEmbedding: number[],
    threshold: number = AI_CONFIG.SEARCH_RELEVANCE_THRESHOLD,
    topK: number = AI_CONFIG.SEARCH_TOP_K
  ): Promise<Array<{ promptId: string; score: number }>> {
    const allEmbeddings = await this.getAllEmbeddings();

    const results = allEmbeddings
      .map((record) => ({
        promptId: record.promptId,
        score: this.cosineSimilarity(queryEmbedding, record.embedding),
      }))
      .filter((result) => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const indexedDBService = new IndexedDBService();
