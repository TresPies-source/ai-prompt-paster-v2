'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderNode } from '@/types/folder';

interface FolderTreeProps {
  folders: FolderNode[];
  selectedPath: string | null;
  onFolderSelect: (path: string | null) => void;
  onCreateFolder: (parentPath: string) => void;
}

interface FolderItemProps {
  node: FolderNode;
  level: number;
  selectedPath: string | null;
  onFolderSelect: (path: string | null) => void;
}

function FolderItem({ node, level, selectedPath, onFolderSelect }: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedPath === node.path;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClick = () => {
    onFolderSelect(isSelected ? null : node.path);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-100 text-blue-900'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <button
            onClick={toggleExpand}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
        {node.promptCount > 0 && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {node.promptCount}
          </span>
        )}
      </motion.div>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child) => (
              <FolderItem
                key={child.id}
                node={child}
                level={level + 1}
                selectedPath={selectedPath}
                onFolderSelect={onFolderSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FolderTree({
  folders,
  selectedPath,
  onFolderSelect,
  onCreateFolder,
}: FolderTreeProps) {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const parentPath = selectedPath || '/';
      onCreateFolder(parentPath + newFolderName.trim() + '/');
      setNewFolderName('');
      setShowCreateInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setShowCreateInput(false);
      setNewFolderName('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
        <button
          onClick={() => setShowCreateInput(true)}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          aria-label="Create new folder"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {showCreateInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3"
        >
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Folder name..."
            autoFocus
            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCreateFolder}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateInput(false);
                setNewFolderName('');
              }}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div
        className={`py-2 px-3 rounded-md cursor-pointer transition-colors mb-2 ${
          selectedPath === null
            ? 'bg-blue-100 text-blue-900'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={() => onFolderSelect(null)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="text-sm font-medium">All Prompts</span>
        </div>
      </div>

      <div className="space-y-1">
        {folders.map((node) => (
          <FolderItem
            key={node.id}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onFolderSelect={onFolderSelect}
          />
        ))}
      </div>

      {folders.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No folders yet. Create one to get started!
        </p>
      )}
    </div>
  );
}
