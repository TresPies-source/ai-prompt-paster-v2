export interface FolderNode {
  id: string;
  name: string;
  path: string;
  children: FolderNode[];
  promptCount: number;
}

export interface AppSettings {
  modelPreference: 'phi-3' | 'llama-3-8b';
  preloadModel: boolean;
  tagFilterMode: 'AND' | 'OR';
}

export interface FolderMetadata {
  version: string;
  folders: FolderNode[];
  settings: AppSettings;
  lastSync: string;
}

export const DEFAULT_METADATA: FolderMetadata = {
  version: '1.0.0',
  folders: [],
  settings: {
    modelPreference: 'phi-3',
    preloadModel: true,
    tagFilterMode: 'AND',
  },
  lastSync: new Date().toISOString(),
};

export function buildFolderTree(paths: string[]): FolderNode[] {
  const root: FolderNode[] = [];
  
  paths.forEach(path => {
    const parts = path.split('/').filter(Boolean);
    let currentLevel = root;
    let currentPath = '';
    
    parts.forEach((part, index) => {
      currentPath += '/' + part;
      
      let existingNode = currentLevel.find(node => node.name === part);
      
      if (!existingNode) {
        existingNode = {
          id: `folder-${currentPath.replace(/\//g, '-')}`,
          name: part,
          path: currentPath + '/',
          children: [],
          promptCount: 0,
        };
        currentLevel.push(existingNode);
      }
      
      currentLevel = existingNode.children;
    });
  });
  
  return root;
}

export function flattenFolderTree(nodes: FolderNode[]): string[] {
  const paths: string[] = [];
  
  function traverse(node: FolderNode) {
    paths.push(node.path);
    node.children.forEach(traverse);
  }
  
  nodes.forEach(traverse);
  return paths;
}
