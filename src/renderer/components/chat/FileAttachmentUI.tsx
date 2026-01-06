/**
 * FileAttachmentUI - Drag & Drop File Attachment Component
 * 
 * Features:
 * - Drag and drop zone
 * - Clipboard paste support
 * - File preview carousel
 * - Progress indicators
 * - Remove/clear actions
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Attachment {
    id: string;
    type: string;
    name: string;
    size: number;
    status: 'pending' | 'processing' | 'ready' | 'error';
    error?: string;
    base64?: string;
    textContent?: string;
    thumbnail?: string;
}

interface FileAttachmentUIProps {
    onAttachmentsChange?: (attachments: Attachment[]) => void;
    maxFiles?: number;
    compact?: boolean;
}

export const FileAttachmentUI: React.FC<FileAttachmentUIProps> = ({
    onAttachmentsChange,
    maxFiles = 10,
    compact = false
}) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load existing attachments on mount
    useEffect(() => {
        loadAttachments();
    }, []);

    // Notify parent of changes
    useEffect(() => {
        onAttachmentsChange?.(attachments);
    }, [attachments, onAttachmentsChange]);

    const loadAttachments = async () => {
        try {
            const result = await (window as any).shadowAPI?.attachment?.getAll?.();
            if (result) {
                setAttachments(result);
            }
        } catch (err) {
            console.error('Failed to load attachments:', err);
        }
    };

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === dropRef.current) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        if (attachments.length + files.length > maxFiles) {
            alert(`Maximum ${maxFiles} files allowed`);
            return;
        }

        setIsProcessing(true);
        try {
            for (const file of files) {
                // For Electron, we need the file path
                const path = (file as any).path;
                if (path) {
                    const result = await (window as any).shadowAPI?.attachment?.processFile?.(path);
                    if (result?.success) {
                        setAttachments(prev => [...prev, result.attachment]);
                    }
                }
            }
        } finally {
            setIsProcessing(false);
            loadAttachments();
        }
    }, [attachments, maxFiles]);

    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const blob = item.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        const base64 = (reader.result as string).split(',')[1];
                        const result = await (window as any).shadowAPI?.attachment?.processClipboard?.({
                            type: 'image',
                            content: base64,
                            name: 'Pasted Image'
                        });
                        if (result?.success) {
                            setAttachments(prev => [...prev, result.attachment]);
                        }
                    };
                    reader.readAsDataURL(blob);
                }
            } else if (item.type === 'text/plain') {
                item.getAsString(async (text) => {
                    if (text.startsWith('http')) {
                        e.preventDefault();
                        const result = await (window as any).shadowAPI?.attachment?.processUrl?.(text);
                        if (result?.success) {
                            setAttachments(prev => [...prev, result.attachment]);
                        }
                    }
                });
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const handleOpenDialog = async () => {
        const result = await (window as any).shadowAPI?.attachment?.openDialog?.();
        if (!result?.canceled && result?.files) {
            loadAttachments();
        }
    };

    const handleRemove = async (id: string) => {
        await (window as any).shadowAPI?.attachment?.remove?.(id);
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleClearAll = async () => {
        await (window as any).shadowAPI?.attachment?.clearAll?.();
        setAttachments([]);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'image': return '🖼️';
            case 'pdf': return '📄';
            case 'code': return '💻';
            case 'text': return '📝';
            case 'url': return '🔗';
            case 'document': return '📃';
            default: return '📎';
        }
    };

    const styles: Record<string, React.CSSProperties> = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        },
        dropZone: {
            border: `2px dashed ${isDragging ? '#3b82f6' : '#4b5563'}`,
            borderRadius: '12px',
            padding: compact ? '12px' : '24px',
            textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
        },
        dropIcon: {
            fontSize: compact ? '24px' : '36px',
            marginBottom: '8px',
        },
        dropText: {
            color: '#9ca3af',
            fontSize: compact ? '12px' : '14px',
        },
        attachmentList: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
        },
        attachmentItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            fontSize: '13px',
        },
        thumbnail: {
            width: '40px',
            height: '40px',
            borderRadius: '4px',
            objectFit: 'cover' as const,
        },
        attachmentInfo: {
            display: 'flex',
            flexDirection: 'column',
        },
        attachmentName: {
            fontWeight: 500,
            color: '#fff',
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
        attachmentMeta: {
            fontSize: '11px',
            color: '#9ca3af',
        },
        removeBtn: {
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
        },
        actions: {
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
        },
        btn: {
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer',
        },
        btnPrimary: {
            backgroundColor: '#3b82f6',
            color: '#fff',
        },
        btnSecondary: {
            backgroundColor: '#374151',
            color: '#fff',
        },
        processing: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#9ca3af',
            fontSize: '13px',
        },
    };

    return (
        <div style={styles.container}>
            {/* Drop Zone */}
            <div
                ref={dropRef}
                style={styles.dropZone}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleOpenDialog}
            >
                <div style={styles.dropIcon}>📎</div>
                <div style={styles.dropText}>
                    {isDragging ? 'Drop files here' : 'Drag & drop files, paste images, or click to browse'}
                </div>
                <div style={{ ...styles.dropText, fontSize: '11px', marginTop: '4px' }}>
                    Images, PDFs, code, documents, or URLs
                </div>
            </div>

            {/* Processing indicator */}
            {isProcessing && (
                <div style={styles.processing}>
                    <span>⏳</span> Processing files...
                </div>
            )}

            {/* Attachment list */}
            {attachments.length > 0 && (
                <>
                    <div style={styles.attachmentList}>
                        {attachments.map(att => (
                            <div key={att.id} style={styles.attachmentItem}>
                                {att.thumbnail || att.base64 ? (
                                    <img
                                        src={`data:image/png;base64,${att.thumbnail || att.base64}`}
                                        alt={att.name}
                                        style={styles.thumbnail}
                                    />
                                ) : (
                                    <span style={{ fontSize: '24px' }}>{getTypeIcon(att.type)}</span>
                                )}
                                <div style={styles.attachmentInfo}>
                                    <span style={styles.attachmentName}>{att.name}</span>
                                    <span style={styles.attachmentMeta}>
                                        {formatSize(att.size)} • {att.type}
                                    </span>
                                </div>
                                <button
                                    style={styles.removeBtn}
                                    onClick={(e) => { e.stopPropagation(); handleRemove(att.id); }}
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={styles.actions}>
                        <button
                            style={{ ...styles.btn, ...styles.btnSecondary }}
                            onClick={handleClearAll}
                        >
                            Clear All
                        </button>
                    </div>
                </>
            )}

            <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                    // Handle file input change
                }}
            />
        </div>
    );
};

export default FileAttachmentUI;
