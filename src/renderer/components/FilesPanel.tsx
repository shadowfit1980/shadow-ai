/**
 * FilesPanel - Dedicated File Attachment and Management Tab
 * 
 * Features:
 * - Drag and drop file upload
 * - Paste from clipboard
 * - Browse local files
 * - Support for images, PDFs, URLs, text, and code files
 * - File preview carousel
 * - Send files to chat context
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttachedFile {
    id: string;
    name: string;
    type: 'image' | 'pdf' | 'url' | 'text' | 'code' | 'document' | 'unknown';
    size: number;
    path?: string;
    content?: string;
    preview?: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    error?: string;
}

const FILE_TYPE_CONFIG: Record<string, { icon: string; color: string; accept: string[] }> = {
    image: { icon: '🖼️', color: 'from-purple-500 to-pink-500', accept: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'] },
    pdf: { icon: '📄', color: 'from-red-500 to-orange-500', accept: ['.pdf'] },
    text: { icon: '📝', color: 'from-blue-500 to-cyan-500', accept: ['.txt', '.md', '.json', '.xml', '.csv'] },
    code: { icon: '💻', color: 'from-green-500 to-emerald-500', accept: ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.html', '.css'] },
    document: { icon: '📑', color: 'from-yellow-500 to-amber-500', accept: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'] },
    url: { icon: '🔗', color: 'from-indigo-500 to-violet-500', accept: [] },
    unknown: { icon: '📁', color: 'from-gray-500 to-slate-500', accept: [] }
};

export const FilesPanel: React.FC = () => {
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<AttachedFile | null>(null);
    const [isAddingUrl, setIsAddingUrl] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateId = () => Math.random().toString(36).substring(2, 10);

    const detectFileType = (filename: string, mimeType?: string): AttachedFile['type'] => {
        const ext = filename.toLowerCase().split('.').pop() || '';

        for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
            if (config.accept.includes(`.${ext}`)) {
                return type as AttachedFile['type'];
            }
        }

        if (mimeType?.startsWith('image/')) return 'image';
        if (mimeType?.startsWith('text/')) return 'text';
        if (mimeType === 'application/pdf') return 'pdf';

        return 'unknown';
    };

    const processFile = async (file: File): Promise<AttachedFile> => {
        const id = generateId();
        const type = detectFileType(file.name, file.type);

        const attachedFile: AttachedFile = {
            id,
            name: file.name,
            type,
            size: file.size,
            status: 'processing'
        };

        try {
            // Generate preview for images
            if (type === 'image') {
                const reader = new FileReader();
                attachedFile.preview = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }

            // Read text content for text/code files
            if (type === 'text' || type === 'code') {
                const reader = new FileReader();
                attachedFile.content = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsText(file);
                });
            }

            // Process via backend if available
            if ((window as any).shadowAPI?.attachment?.processFile) {
                try {
                    const result = await (window as any).shadowAPI.attachment.processFile(file.name);
                    if (result.success) {
                        attachedFile.content = result.content;
                        attachedFile.path = result.path;
                    }
                } catch {
                    // Backend processing optional
                }
            }

            attachedFile.status = 'ready';
        } catch (error: any) {
            attachedFile.status = 'error';
            attachedFile.error = error.message;
        }

        return attachedFile;
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);

        // Also check for URLs in text
        const text = e.dataTransfer.getData('text');
        if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
            await addUrl(text);
        }

        for (const file of droppedFiles) {
            const processed = await processFile(file);
            setFiles(prev => [...prev, processed]);
        }
    }, []);

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;

        for (const item of Array.from(items)) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    const processed = await processFile(file);
                    setFiles(prev => [...prev, processed]);
                }
            } else if (item.kind === 'string' && item.type === 'text/plain') {
                item.getAsString(async (text) => {
                    if (text.startsWith('http://') || text.startsWith('https://')) {
                        await addUrl(text);
                    }
                });
            }
        }
    }, []);

    const addUrl = async (url: string) => {
        const id = generateId();
        const urlFile: AttachedFile = {
            id,
            name: url.length > 50 ? url.substring(0, 50) + '...' : url,
            type: 'url',
            size: 0,
            content: url,
            status: 'processing'
        };

        setFiles(prev => [...prev, urlFile]);

        try {
            if ((window as any).shadowAPI?.attachment?.processUrl) {
                const result = await (window as any).shadowAPI.attachment.processUrl(url);
                if (result.success) {
                    setFiles(prev => prev.map(f =>
                        f.id === id ? { ...f, content: result.content, status: 'ready' as const } : f
                    ));
                } else {
                    setFiles(prev => prev.map(f =>
                        f.id === id ? { ...f, status: 'error' as const, error: 'Failed to fetch URL' } : f
                    ));
                }
            } else {
                setFiles(prev => prev.map(f =>
                    f.id === id ? { ...f, status: 'ready' as const } : f
                ));
            }
        } catch (error: any) {
            setFiles(prev => prev.map(f =>
                f.id === id ? { ...f, status: 'error' as const, error: error.message } : f
            ));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        selectedFiles.forEach(async (file) => {
            const processed = await processFile(file);
            setFiles(prev => [...prev, processed]);
        });
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        if (selectedFile?.id === id) {
            setSelectedFile(null);
        }
    };

    const clearAllFiles = () => {
        setFiles([]);
        setSelectedFile(null);
    };

    const handleAddUrl = () => {
        if (urlInput.trim()) {
            addUrl(urlInput.trim());
            setUrlInput('');
            setIsAddingUrl(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const sendToChat = () => {
        // This would integrate with the chat system
        console.log('Sending files to chat:', files);
        // TODO: Integrate with chat context
    };

    return (
        <div
            className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6"
            onPaste={handlePaste}
            tabIndex={0}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        📎 File Attachments
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Drag & drop files, paste from clipboard, or browse your device
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{files.length} file(s)</span>
                    {files.length > 0 && (
                        <>
                            <button
                                onClick={sendToChat}
                                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                            >
                                📤 Send to Chat
                            </button>
                            <button
                                onClick={clearAllFiles}
                                className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                            >
                                🗑️ Clear All
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Drop Zone */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Main Drop Area */}
                    <motion.div
                        className={`
                            relative flex-1 border-2 border-dashed rounded-2xl transition-all duration-300 overflow-hidden
                            ${isDragOver
                                ? 'border-cyan-400 bg-cyan-500/10'
                                : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                            }
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        animate={isDragOver ? { scale: 1.01 } : { scale: 1 }}
                    >
                        {files.length === 0 ? (
                            /* Empty State */
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                                <motion.div
                                    className="text-6xl mb-4"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    📂
                                </motion.div>
                                <h3 className="text-xl font-medium text-gray-300 mb-2">
                                    Drop files here
                                </h3>
                                <p className="text-gray-500 text-center mb-6 max-w-md">
                                    Supports images, PDFs, text files, code, and URLs.<br />
                                    You can also <strong>paste</strong> from clipboard (Ctrl+V / Cmd+V)
                                </p>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                                    >
                                        📁 Browse Files
                                    </button>
                                    <button
                                        onClick={() => setIsAddingUrl(true)}
                                        className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                                    >
                                        🔗 Add URL
                                    </button>
                                </div>

                                {/* Supported Types */}
                                <div className="mt-8 flex flex-wrap justify-center gap-2">
                                    {Object.entries(FILE_TYPE_CONFIG).filter(([k]) => k !== 'unknown').map(([type, config]) => (
                                        <span
                                            key={type}
                                            className={`px-3 py-1 rounded-full text-xs text-white/80 bg-gradient-to-r ${config.color} opacity-60`}
                                        >
                                            {config.icon} {type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* File Grid */
                            <div className="absolute inset-0 overflow-auto p-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    <AnimatePresence>
                                        {files.map((file) => {
                                            const config = FILE_TYPE_CONFIG[file.type];
                                            return (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className={`
                                                        relative group rounded-xl overflow-hidden cursor-pointer
                                                        bg-gradient-to-br ${config.color} p-[1px]
                                                        ${selectedFile?.id === file.id ? 'ring-2 ring-white' : ''}
                                                    `}
                                                    onClick={() => setSelectedFile(file)}
                                                >
                                                    <div className="bg-gray-900 rounded-xl p-3 h-full">
                                                        {/* Preview */}
                                                        <div className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center mb-2 overflow-hidden">
                                                            {file.type === 'image' && file.preview ? (
                                                                <img
                                                                    src={file.preview}
                                                                    alt={file.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-4xl">{config.icon}</span>
                                                            )}

                                                            {/* Status Overlay */}
                                                            {file.status === 'processing' && (
                                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                </div>
                                                            )}
                                                            {file.status === 'error' && (
                                                                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                                                    <span className="text-2xl">⚠️</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <p className="text-xs text-white truncate font-medium">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {formatFileSize(file.size)}
                                                        </p>

                                                        {/* Remove Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeFile(file.id);
                                                            }}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* Add More Card */}
                                    <motion.button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-cyan-500 transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-cyan-400"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <span className="text-3xl mb-2">+</span>
                                        <span className="text-xs">Add More</span>
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Actions Bar */}
                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            📁 Browse
                        </button>
                        <button
                            onClick={() => setIsAddingUrl(true)}
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            🔗 Add URL
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.read().then(items => {
                                    items.forEach(item => {
                                        item.types.forEach(type => {
                                            if (type.startsWith('image/')) {
                                                item.getType(type).then(async blob => {
                                                    const file = new File([blob], 'pasted-image.png', { type });
                                                    const processed = await processFile(file);
                                                    setFiles(prev => [...prev, processed]);
                                                });
                                            }
                                        });
                                    });
                                });
                            }}
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            📋 Paste
                        </button>
                    </div>
                </div>

                {/* Preview Panel */}
                {selectedFile && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-80 bg-gray-800/50 rounded-2xl p-4 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-white">Preview</h3>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 rounded-lg bg-gray-900 overflow-hidden flex items-center justify-center mb-4">
                            {selectedFile.type === 'image' && selectedFile.preview ? (
                                <img
                                    src={selectedFile.preview}
                                    alt={selectedFile.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : selectedFile.type === 'text' || selectedFile.type === 'code' ? (
                                <pre className="p-4 text-xs text-gray-300 overflow-auto w-full h-full">
                                    {selectedFile.content?.substring(0, 1000)}
                                    {(selectedFile.content?.length || 0) > 1000 && '...'}
                                </pre>
                            ) : selectedFile.type === 'url' ? (
                                <div className="p-4 text-center">
                                    <span className="text-4xl block mb-2">🔗</span>
                                    <a
                                        href={selectedFile.content}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:underline text-sm break-all"
                                    >
                                        {selectedFile.content}
                                    </a>
                                </div>
                            ) : (
                                <div className="p-4 text-center">
                                    <span className="text-6xl block mb-2">
                                        {FILE_TYPE_CONFIG[selectedFile.type].icon}
                                    </span>
                                    <p className="text-gray-400 text-sm">Preview not available</p>
                                </div>
                            )}
                        </div>

                        {/* File Details */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Name:</span>
                                <span className="text-white truncate ml-2">{selectedFile.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Type:</span>
                                <span className="text-white capitalize">{selectedFile.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Size:</span>
                                <span className="text-white">{formatFileSize(selectedFile.size)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Status:</span>
                                <span className={`
                                    ${selectedFile.status === 'ready' ? 'text-green-400' : ''}
                                    ${selectedFile.status === 'processing' ? 'text-yellow-400' : ''}
                                    ${selectedFile.status === 'error' ? 'text-red-400' : ''}
                                `}>
                                    {selectedFile.status}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.go,.rs,.html,.css,.doc,.docx,.xls,.xlsx"
            />

            {/* URL Input Modal */}
            <AnimatePresence>
                {isAddingUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
                        onClick={() => setIsAddingUrl(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-gray-800 rounded-2xl p-6 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-medium text-white mb-4">Add URL</h3>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setIsAddingUrl(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddUrl}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                                >
                                    Add URL
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FilesPanel;
