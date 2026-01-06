/**
 * Review Panel Component
 * Approve/reject interface for code changes like Warp's Review Interface
 */

import React, { useState, useCallback } from 'react';
import './ReviewPanel.css';

export interface FileChange {
    filePath: string;
    type: 'add' | 'modify' | 'delete';
    oldContent?: string;
    newContent?: string;
    hunks: DiffHunk[];
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}

export interface DiffLine {
    type: 'context' | 'add' | 'remove';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

export interface ReviewRequest {
    id: string;
    title: string;
    description?: string;
    changes: FileChange[];
    timestamp: number;
    source?: string; // agent, workflow, etc.
}

interface ReviewPanelProps {
    review: ReviewRequest;
    onApprove: (reviewId: string, selectedChanges?: string[]) => void;
    onReject: (reviewId: string, reason?: string) => void;
    onEdit?: (reviewId: string, modifiedChanges: FileChange[]) => void;
    onClose?: () => void;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
    review,
    onApprove,
    onReject,
    onEdit,
    onClose,
}) => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
        new Set(review.changes.map(c => c.filePath))
    );
    const [activeFile, setActiveFile] = useState<string>(review.changes[0]?.filePath || '');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

    const toggleFileSelection = useCallback((filePath: string) => {
        setSelectedFiles(prev => {
            const next = new Set(prev);
            if (next.has(filePath)) {
                next.delete(filePath);
            } else {
                next.add(filePath);
            }
            return next;
        });
    }, []);

    const handleApprove = () => {
        const selected = Array.from(selectedFiles);
        onApprove(review.id, selected.length === review.changes.length ? undefined : selected);
    };

    const handleReject = () => {
        onReject(review.id, rejectReason || undefined);
        setShowRejectModal(false);
    };

    const activeChange = review.changes.find(c => c.filePath === activeFile);

    const getFileStats = (change: FileChange) => {
        let additions = 0;
        let deletions = 0;
        for (const hunk of change.hunks) {
            for (const line of hunk.lines) {
                if (line.type === 'add') additions++;
                if (line.type === 'remove') deletions++;
            }
        }
        return { additions, deletions };
    };

    const getFileIcon = (type: 'add' | 'modify' | 'delete') => {
        switch (type) {
            case 'add': return '🆕';
            case 'modify': return '📝';
            case 'delete': return '🗑️';
        }
    };

    return (
        <div className="review-panel">
            {/* Header */}
            <div className="review-header">
                <div className="review-title">
                    <h2>📋 Review Changes</h2>
                    <span className="review-source">{review.source || 'Agent'}</span>
                </div>
                <div className="review-meta">
                    <span className="file-count">{review.changes.length} files</span>
                    <span className="timestamp">
                        {new Date(review.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                {onClose && (
                    <button className="close-btn" onClick={onClose}>✕</button>
                )}
            </div>

            {review.description && (
                <div className="review-description">{review.description}</div>
            )}

            {/* Main content */}
            <div className="review-content">
                {/* File list sidebar */}
                <div className="file-list">
                    <div className="file-list-header">
                        <span>Changed Files</span>
                        <label className="select-all">
                            <input
                                type="checkbox"
                                checked={selectedFiles.size === review.changes.length}
                                onChange={() => {
                                    if (selectedFiles.size === review.changes.length) {
                                        setSelectedFiles(new Set());
                                    } else {
                                        setSelectedFiles(new Set(review.changes.map(c => c.filePath)));
                                    }
                                }}
                            />
                            All
                        </label>
                    </div>

                    {review.changes.map(change => {
                        const stats = getFileStats(change);
                        const isActive = change.filePath === activeFile;
                        const isSelected = selectedFiles.has(change.filePath);

                        return (
                            <div
                                key={change.filePath}
                                className={`file-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => setActiveFile(change.filePath)}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleFileSelection(change.filePath);
                                    }}
                                />
                                <span className="file-icon">{getFileIcon(change.type)}</span>
                                <span className="file-name" title={change.filePath}>
                                    {change.filePath.split('/').pop()}
                                </span>
                                <div className="file-stats">
                                    {stats.additions > 0 && <span className="additions">+{stats.additions}</span>}
                                    {stats.deletions > 0 && <span className="deletions">-{stats.deletions}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Diff view */}
                <div className="diff-view">
                    <div className="diff-header">
                        <span className="diff-file-path">{activeFile}</span>
                        <div className="view-toggle">
                            <button
                                className={viewMode === 'split' ? 'active' : ''}
                                onClick={() => setViewMode('split')}
                            >
                                Split
                            </button>
                            <button
                                className={viewMode === 'unified' ? 'active' : ''}
                                onClick={() => setViewMode('unified')}
                            >
                                Unified
                            </button>
                        </div>
                    </div>

                    <div className={`diff-content ${viewMode}`}>
                        {activeChange?.hunks.map((hunk, hunkIndex) => (
                            <div key={hunkIndex} className="diff-hunk">
                                <div className="hunk-header">
                                    @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                                </div>

                                {viewMode === 'split' ? (
                                    <div className="split-view">
                                        <div className="split-left">
                                            {hunk.lines
                                                .filter(l => l.type !== 'add')
                                                .map((line, i) => (
                                                    <div key={i} className={`diff-line ${line.type}`}>
                                                        <span className="line-number">{line.oldLineNumber || ''}</span>
                                                        <span className="line-content">{line.content}</span>
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="split-right">
                                            {hunk.lines
                                                .filter(l => l.type !== 'remove')
                                                .map((line, i) => (
                                                    <div key={i} className={`diff-line ${line.type}`}>
                                                        <span className="line-number">{line.newLineNumber || ''}</span>
                                                        <span className="line-content">{line.content}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="unified-view">
                                        {hunk.lines.map((line, i) => (
                                            <div key={i} className={`diff-line ${line.type}`}>
                                                <span className="line-number old">{line.oldLineNumber || ''}</span>
                                                <span className="line-number new">{line.newLineNumber || ''}</span>
                                                <span className="line-prefix">
                                                    {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                                                </span>
                                                <span className="line-content">{line.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="review-actions">
                <div className="selection-info">
                    {selectedFiles.size} of {review.changes.length} files selected
                </div>
                <div className="action-buttons">
                    <button
                        className="reject-btn"
                        onClick={() => setShowRejectModal(true)}
                    >
                        ✕ Reject
                    </button>
                    <button
                        className="approve-btn"
                        onClick={handleApprove}
                        disabled={selectedFiles.size === 0}
                    >
                        ✓ Approve {selectedFiles.size < review.changes.length ? 'Selected' : 'All'}
                    </button>
                </div>
            </div>

            {/* Reject modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="reject-modal">
                        <h3>Reject Changes</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)"
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className="reject-confirm" onClick={handleReject}>
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewPanel;
