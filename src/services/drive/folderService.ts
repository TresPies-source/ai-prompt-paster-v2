import { DriveClient } from './driveClient';
import { FolderMetadata, FolderNode, buildFolderTree, DEFAULT_METADATA } from '@/types/folder';
import { Prompt } from '@/types/prompt';

export class FolderService {
  constructor(private driveClient: DriveClient) {}

  async getMetadata(): Promise<FolderMetadata> {
    try {
      const content = await this.driveClient.getMetadata();
      return JSON.parse(content) as FolderMetadata;
    } catch (error) {
      console.error('Error getting metadata, returning default:', error);
      return DEFAULT_METADATA;
    }
  }

  async updateMetadata(metadata: FolderMetadata): Promise<void> {
    metadata.lastSync = new Date().toISOString();
    const content = JSON.stringify(metadata, null, 2);
    await this.driveClient.updateMetadata(content);
  }

  async getFolders(): Promise<FolderNode[]> {
    const metadata = await this.getMetadata();
    return metadata.folders;
  }

  async createFolder(name: string, parentPath: string): Promise<FolderNode> {
    const metadata = await this.getMetadata();

    const normalizedParentPath = parentPath.endsWith('/') ? parentPath : parentPath + '/';
    const newFolderPath = normalizedParentPath + name + '/';

    const existingPaths = this.extractAllPaths(metadata.folders);
    if (existingPaths.includes(newFolderPath)) {
      throw new Error(`Folder ${newFolderPath} already exists`);
    }

    existingPaths.push(newFolderPath);
    metadata.folders = buildFolderTree(existingPaths);

    await this.updateMetadata(metadata);

    return this.findFolderByPath(metadata.folders, newFolderPath)!;
  }

  async rebuildFolderTree(prompts: Prompt[]): Promise<FolderNode[]> {
    const metadata = await this.getMetadata();

    const folderPaths = new Set<string>();
    prompts.forEach(prompt => {
      const parts = prompt.folderPath.split('/').filter(Boolean);
      let currentPath = '';
      parts.forEach(part => {
        currentPath += '/' + part + '/';
        folderPaths.add(currentPath);
      });
    });

    metadata.folders = buildFolderTree(Array.from(folderPaths));

    this.updatePromptCounts(metadata.folders, prompts);

    await this.updateMetadata(metadata);

    return metadata.folders;
  }

  private updatePromptCounts(folders: FolderNode[], prompts: Prompt[]): void {
    folders.forEach(folder => {
      const promptsInFolder = prompts.filter(p => p.folderPath === folder.path);
      folder.promptCount = promptsInFolder.length;

      if (folder.children.length > 0) {
        this.updatePromptCounts(folder.children, prompts);
      }
    });
  }

  private extractAllPaths(folders: FolderNode[]): string[] {
    const paths: string[] = [];

    const traverse = (nodes: FolderNode[]) => {
      nodes.forEach(node => {
        paths.push(node.path);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(folders);
    return paths;
  }

  private findFolderByPath(folders: FolderNode[], path: string): FolderNode | null {
    for (const folder of folders) {
      if (folder.path === path) {
        return folder;
      }
      if (folder.children.length > 0) {
        const found = this.findFolderByPath(folder.children, path);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}
