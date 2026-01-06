import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    path: string;
    extension?: string;
}

interface FileExplorerProps {
    onFileSelect?: (file: FileNode) => void;
    onCreateFile?: (path: string, name: string) => void;
    onCreateFolder?: (path: string, name: string) => void;
    onDelete?: (path: string) => void;
    onRename?: (oldPath: string, newName: string) => void;
}

const MOCK_FILES: FileNode[] = [
    {
        id: '1',
        name: 'src',
        type: 'folder',
        path: '/src',
        children: [
            {
                id: '2',
                name: 'components',
                type: 'folder',
                path: '/src/components',
                children: [
                    { id: '3', name: 'App.tsx', type: 'file', path: '/src/components/App.tsx', extension: 'tsx' },
                    { id: '4', name: 'Header.tsx', type: 'file', path: '/src/components/Header.tsx', extension: 'tsx' },
                    { id: '5', name: 'Sidebar.tsx', type: 'file', path: '/src/components/Sidebar.tsx', extension: 'tsx' },
                ]
            },
            {
                id: '6',
                name: 'styles',
                type: 'folder',
                path: '/src/styles',
                children: [
                    { id: '7', name: 'globals.css', type: 'file', path: '/src/styles/globals.css', extension: 'css' },
                    { id: '8', name: 'components.css', type: 'file', path: '/src/styles/components.css', extension: 'css' },
                ]
            },
            { id: '9', name: 'index.tsx', type: 'file', path: '/src/index.tsx', extension: 'tsx' },
            { id: '10', name: 'main.ts', type: 'file', path: '/src/main.ts', extension: 'ts' },
        ]
    },
    {
        id: '11',
        name: 'public',
        type: 'folder',
        path: '/public',
        children: [
            { id: '12', name: 'index.html', type: 'file', path: '/public/index.html', extension: 'html' },
            { id: '13', name: 'favicon.ico', type: 'file', path: '/public/favicon.ico', extension: 'ico' },
        ]
    },
    { id: '14', name: 'package.json', type: 'file', path: '/package.json', extension: 'json' },
    { id: '15', name: 'tsconfig.json', type: 'file', path: '/tsconfig.json', extension: 'json' },
    { id: '16', name: 'README.md', type: 'file', path: '/README.md', extension: 'md' },
];

const getFileIcon = (extension?: string): string => {
    switch (extension) {
        case 'tsx':
        case 'jsx':
            return '⚛️';
        case 'ts':
            return '📘';
        case 'js':
            return '📙';
        case 'css':
            return '🎨';
        case 'html':
            return '🌐';
        case 'json':
            return '📋';
        case 'md':
            return '📝';
        case 'ico':
        case 'png':
        case 'jpg':
        case 'svg':
            return '🖼️';
        default:
            return '📄';
    }
};

interface TreeNodeProps {
    node: FileNode;
    level: number;
    selectedPath: string | null;
    expandedFolders: Set<string>;
    onToggleFolder: (path: string) => void;
    onSelectFile: (file: FileNode) => void;
    onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}

function TreeNode({
    node,
    level,
    selectedPath,
    expandedFolders,
    onToggleFolder,
    onSelectFile,
    onContextMenu
}: TreeNodeProps) {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPath === node.path;

    const handleClick = () => {
        if (node.type === 'folder') {
            onToggleFolder(node.path);
        } else {
            onSelectFile(node);
        }
    };

    return (
        <div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center py-1 px-2 cursor-pointer rounded-md transition-colors ${isSelected
                        ? 'bg-neon-cyan/20 text-neon-cyan'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
                onContextMenu={(e) => onContextMenu(e, node)}
            >
                {node.type === 'folder' ? (
                    <span className="mr-1 text-xs">
                        {isExpanded ? '📂' : '📁'}
                    </span>
                ) : (
                    <span className="mr-1 text-xs">
                        {getFileIcon(node.extension)}
                    </span>
                )}
                <span className="text-sm truncate">{node.name}</span>
            </motion.div>

            {node.type === 'folder' && isExpanded && node.children && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            selectedPath={selectedPath}
                            expandedFolders={expandedFolders}
                            onToggleFolder={onToggleFolder}
                            onSelectFile={onSelectFile}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}

export default function FileExplorer({
    onFileSelect,
    onCreateFile,
    onCreateFolder,
    onDelete,
    onRename
}: FileExplorerProps) {
    const [files] = useState<FileNode[]>(MOCK_FILES);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/src', '/src/components']));
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleToggleFolder = useCallback((path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    const handleSelectFile = useCallback((file: FileNode) => {
        setSelectedPath(file.path);
        onFileSelect?.(file);
    }, [onFileSelect]);

    const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleNewFile = useCallback(() => {
        if (contextMenu) {
            const path = contextMenu.node.type === 'folder' ? contextMenu.node.path : contextMenu.node.path.split('/').slice(0, -1).join('/');
            onCreateFile?.(path, 'newfile.ts');
            closeContextMenu();
        }
    }, [contextMenu, onCreateFile, closeContextMenu]);

    const handleNewFolder = useCallback(() => {
        if (contextMenu) {
            const path = contextMenu.node.type === 'folder' ? contextMenu.node.path : contextMenu.node.path.split('/').slice(0, -1).join('/');
            onCreateFolder?.(path, 'newfolder');
            closeContextMenu();
        }
    }, [contextMenu, onCreateFolder, closeContextMenu]);

    const handleDelete = useCallback(() => {
        if (contextMenu) {
            onDelete?.(contextMenu.node.path);
            closeContextMenu();
        }
    }, [contextMenu, onDelete, closeContextMenu]);

    const handleRename = useCallback(() => {
        if (contextMenu) {
            const newName = prompt('Enter new name:', contextMenu.node.name);
            if (newName) {
                onRename?.(contextMenu.node.path, newName);
            }
            closeContextMenu();
        }
    }, [contextMenu, onRename, closeContextMenu]);

    return (
        <div className="h-full flex flex-col bg-gray-950 border-r border-gray-800" onClick={closeContextMenu}>
            {/* Header */}
            <div className="p-3 border-b border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Explorer</span>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300"
                            title="New File"
                            onClick={() => onCreateFile?.('/', 'newfile.ts')}
                        >
                            📄
                        </button>
                        <button
                            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300"
                            title="New Folder"
                            onClick={() => onCreateFolder?.('/', 'newfolder')}
                        >
                            📁
                        </button>
                        <button
                            className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300"
                            title="Refresh"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-900 border border-gray-700 rounded focus:border-neon-cyan/50 focus:outline-none text-gray-300 placeholder-gray-600"
                />
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin py-2">
                {files.map((node) => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        level={0}
                        selectedPath={selectedPath}
                        expandedFolders={expandedFolders}
                        onToggleFolder={handleToggleFolder}
                        onSelectFile={handleSelectFile}
                        onContextMenu={handleContextMenu}
                    />
                ))}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full px-4 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-800"
                        onClick={handleNewFile}
                    >
                        📄 New File
                    </button>
                    <button
                        className="w-full px-4 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-800"
                        onClick={handleNewFolder}
                    >
                        📁 New Folder
                    </button>
                    <div className="border-t border-gray-700 my-1" />
                    <button
                        className="w-full px-4 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-800"
                        onClick={handleRename}
                    >
                        ✏️ Rename
                    </button>
                    <button
                        className="w-full px-4 py-1.5 text-left text-sm text-red-400 hover:bg-gray-800"
                        onClick={handleDelete}
                    >
                        🗑️ Delete
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className="px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
                {files.length} items
            </div>
        </div>
    );
}
