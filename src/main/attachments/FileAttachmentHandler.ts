/**
 * FileAttachmentHandler - Multi-Format File Processing
 * 
 * Handles various file types for agent context:
 * - Images → Base64 encoding for vision APIs
 * - PDFs → Text extraction
 * - URLs → Content fetching and parsing
 * - Text/Code → Direct content loading
 * - Documents → Text extraction (docx, etc.)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type AttachmentType = 'image' | 'pdf' | 'url' | 'text' | 'code' | 'document' | 'unknown';

export interface Attachment {
    id: string;
    type: AttachmentType;
    name: string;
    mimeType: string;
    size: number;
    /** Original file path (for local files) */
    path?: string;
    /** URL (for web content) */
    url?: string;
    /** Base64 data (for images) */
    base64?: string;
    /** Extracted text content */
    textContent?: string;
    /** Summary (for long content) */
    summary?: string;
    /** Thumbnail base64 (for images/PDFs) */
    thumbnail?: string;
    /** Processing status */
    status: 'pending' | 'processing' | 'ready' | 'error';
    /** Error message if failed */
    error?: string;
    /** Creation timestamp */
    createdAt: Date;
}

export interface ProcessingResult {
    success: boolean;
    attachment: Attachment;
    error?: string;
}

// ============================================================================
// FILE TYPE DETECTION
// ============================================================================

const MIME_TYPES: Record<string, AttachmentType> = {
    // Images
    'image/jpeg': 'image',
    'image/jpg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'image/svg+xml': 'image',
    'image/bmp': 'image',

    // PDF
    'application/pdf': 'pdf',

    // Documents
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'application/vnd.oasis.opendocument.text': 'document',
    'application/rtf': 'document',

    // Text and code
    'text/plain': 'text',
    'text/markdown': 'text',
    'text/html': 'text',
    'text/css': 'code',
    'text/javascript': 'code',
    'application/javascript': 'code',
    'application/json': 'code',
    'application/xml': 'code',
    'text/xml': 'code',
    'application/x-yaml': 'code',
    'text/yaml': 'code',
    'text/x-python': 'code',
    'text/x-java': 'code',
    'text/x-c': 'code',
    'text/x-cpp': 'code',
    'text/x-typescript': 'code',
    'text/x-rust': 'code',
    'text/x-go': 'code',
};

const CODE_EXTENSIONS = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
    '.rs', '.go', '.rb', '.php', '.swift', '.kt', '.scala', '.cs', '.fs',
    '.html', '.css', '.scss', '.sass', '.less', '.vue', '.svelte',
    '.json', '.yaml', '.yml', '.xml', '.toml', '.ini', '.env',
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
    '.sql', '.graphql', '.prisma', '.dockerfile', '.makefile'
];

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.rtf', '.log', '.csv'];

// ============================================================================
// FILE ATTACHMENT HANDLER
// ============================================================================

export class FileAttachmentHandler extends EventEmitter {
    private attachments: Map<string, Attachment> = new Map();

    constructor() {
        super();
        console.log('[FileAttachmentHandler] Initialized');
    }

    /**
     * Process a file from path
     */
    async processFile(filePath: string): Promise<ProcessingResult> {
        const id = this.generateId();
        const name = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        const attachment: Attachment = {
            id,
            name,
            path: filePath,
            type: 'unknown',
            mimeType: this.getMimeType(ext),
            size: 0,
            status: 'processing',
            createdAt: new Date()
        };

        try {
            const stats = await fs.stat(filePath);
            attachment.size = stats.size;

            // Determine type
            attachment.type = this.getTypeFromExtension(ext) ||
                MIME_TYPES[attachment.mimeType] ||
                'unknown';

            // Process based on type
            await this.processAttachment(attachment, filePath);

            attachment.status = 'ready';
            this.attachments.set(id, attachment);
            this.emit('processed', attachment);

            return { success: true, attachment };

        } catch (error: any) {
            attachment.status = 'error';
            attachment.error = error.message;
            return { success: false, attachment, error: error.message };
        }
    }

    /**
     * Process a URL
     */
    async processUrl(url: string): Promise<ProcessingResult> {
        const id = this.generateId();
        const urlObj = new URL(url);

        const attachment: Attachment = {
            id,
            name: urlObj.hostname + urlObj.pathname,
            url,
            type: 'url',
            mimeType: 'text/html',
            size: 0,
            status: 'processing',
            createdAt: new Date()
        };

        try {
            const content = await this.fetchUrl(url);
            attachment.size = content.length;
            attachment.textContent = this.extractTextFromHtml(content);

            // Generate summary for long content
            if (attachment.textContent.length > 2000) {
                attachment.summary = attachment.textContent.substring(0, 2000) + '...';
            }

            attachment.status = 'ready';
            this.attachments.set(id, attachment);
            this.emit('processed', attachment);

            return { success: true, attachment };

        } catch (error: any) {
            attachment.status = 'error';
            attachment.error = error.message;
            return { success: false, attachment, error: error.message };
        }
    }

    /**
     * Process clipboard data (from paste)
     */
    async processClipboard(data: {
        type: string;
        content: string;
        name?: string;
    }): Promise<ProcessingResult> {
        const id = this.generateId();

        if (data.type === 'text' && data.content.startsWith('http')) {
            return this.processUrl(data.content);
        }

        const attachment: Attachment = {
            id,
            name: data.name || 'Pasted content',
            type: data.type === 'image' ? 'image' : 'text',
            mimeType: data.type === 'image' ? 'image/png' : 'text/plain',
            size: data.content.length,
            status: 'processing',
            createdAt: new Date()
        };

        try {
            if (data.type === 'image') {
                attachment.base64 = data.content;
                attachment.thumbnail = data.content;
            } else {
                attachment.textContent = data.content;
            }

            attachment.status = 'ready';
            this.attachments.set(id, attachment);
            this.emit('processed', attachment);

            return { success: true, attachment };

        } catch (error: any) {
            attachment.status = 'error';
            attachment.error = error.message;
            return { success: false, attachment, error: error.message };
        }
    }

    /**
     * Process attachment based on type
     */
    private async processAttachment(attachment: Attachment, filePath: string): Promise<void> {
        switch (attachment.type) {
            case 'image':
                await this.processImage(attachment, filePath);
                break;
            case 'pdf':
                await this.processPdf(attachment, filePath);
                break;
            case 'text':
            case 'code':
                await this.processText(attachment, filePath);
                break;
            case 'document':
                await this.processDocument(attachment, filePath);
                break;
            default:
                // Try to read as text
                await this.processText(attachment, filePath);
        }
    }

    /**
     * Process image file
     */
    private async processImage(attachment: Attachment, filePath: string): Promise<void> {
        const buffer = await fs.readFile(filePath);
        attachment.base64 = buffer.toString('base64');
        attachment.thumbnail = attachment.base64;  // For small images, use same

        // For large images, we could resize for thumbnail
        if (attachment.size > 100000) {
            // Keep base64 but note that thumbnail should be generated separately
            // In production, use sharp or similar to resize
        }
    }

    /**
     * Process PDF file
     */
    private async processPdf(attachment: Attachment, filePath: string): Promise<void> {
        try {
            // Try to load pdf-parse dynamically
            let pdfParser: any;
            try {
                pdfParser = require('pdf-parse');
            } catch {
                pdfParser = null;
            }

            if (pdfParser) {
                const buffer = await fs.readFile(filePath);
                const data = await pdfParser(buffer);
                attachment.textContent = data.text;

                if (data.text.length > 2000) {
                    attachment.summary = data.text.substring(0, 2000) + '...';
                }
            } else {
                // Fallback: just note that it's a PDF
                attachment.textContent = `[PDF Document: ${attachment.name}]\n\nPDF parsing not available. Install pdf-parse for text extraction.`;
            }
        } catch (error: any) {
            attachment.textContent = `[PDF Document: ${attachment.name}]\n\nError extracting text: ${error.message}`;
        }
    }

    /**
     * Process text/code file
     */
    private async processText(attachment: Attachment, filePath: string): Promise<void> {
        const content = await fs.readFile(filePath, 'utf-8');
        attachment.textContent = content;

        if (content.length > 5000) {
            attachment.summary = content.substring(0, 5000) + `\n\n... (${content.length - 5000} more characters)`;
        }
    }

    /**
     * Process document file (docx, etc.)
     */
    private async processDocument(attachment: Attachment, filePath: string): Promise<void> {
        // For now, just note the document type
        // In production, use mammoth for docx, etc.
        attachment.textContent = `[Document: ${attachment.name}]\n\nDocument parsing not available. Supported formats require additional libraries.`;
    }

    /**
     * Fetch URL content
     */
    private fetchUrl(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const lib = url.startsWith('https') ? https : http;

            lib.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShadowAI/1.0)' }
            }, (res) => {
                // Handle redirects
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    this.fetchUrl(res.headers.location).then(resolve).catch(reject);
                    return;
                }

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Extract text from HTML
     */
    private extractTextFromHtml(html: string): string {
        // Remove scripts, styles, and tags
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim()
            .substring(0, 10000);  // Limit length
    }

    /**
     * Get type from extension
     */
    private getTypeFromExtension(ext: string): AttachmentType | null {
        if (CODE_EXTENSIONS.includes(ext)) return 'code';
        if (TEXT_EXTENSIONS.includes(ext)) return 'text';
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext)) return 'image';
        if (ext === '.pdf') return 'pdf';
        if (['.doc', '.docx', '.odt', '.rtf'].includes(ext)) return 'document';
        return null;
    }

    /**
     * Get MIME type from extension
     */
    private getMimeType(ext: string): string {
        const mimes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.json': 'application/json',
            '.js': 'text/javascript',
            '.ts': 'text/x-typescript',
            '.py': 'text/x-python',
            '.html': 'text/html',
            '.css': 'text/css',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        return mimes[ext] || 'application/octet-stream';
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `attach-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    /**
     * Get attachment by ID
     */
    getAttachment(id: string): Attachment | undefined {
        return this.attachments.get(id);
    }

    /**
     * Get all attachments
     */
    getAllAttachments(): Attachment[] {
        return Array.from(this.attachments.values());
    }

    /**
     * Remove attachment
     */
    removeAttachment(id: string): boolean {
        const removed = this.attachments.delete(id);
        if (removed) this.emit('removed', id);
        return removed;
    }

    /**
     * Clear all attachments
     */
    clearAll(): void {
        this.attachments.clear();
        this.emit('cleared');
    }

    /**
     * Get context string for agent (combines all attachments)
     */
    getContextString(): string {
        const attachments = this.getAllAttachments().filter(a => a.status === 'ready');

        if (attachments.length === 0) return '';

        const parts: string[] = ['## Attached Files\n'];

        for (const attach of attachments) {
            parts.push(`### ${attach.name} (${attach.type})`);

            if (attach.textContent) {
                const content = attach.summary || attach.textContent;
                parts.push('```');
                parts.push(content.substring(0, 3000));
                parts.push('```\n');
            } else if (attach.base64 && attach.type === 'image') {
                parts.push('[Image attached - will be processed by vision API]\n');
            } else if (attach.url) {
                parts.push(`URL: ${attach.url}\n`);
            }
        }

        return parts.join('\n');
    }

    /**
     * Get images for vision API
     */
    getImagesForVision(): { mimeType: string; base64: string }[] {
        return this.getAllAttachments()
            .filter(a => a.type === 'image' && a.base64)
            .map(a => ({
                mimeType: a.mimeType,
                base64: a.base64!
            }));
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalAttachments: number;
        byType: Record<string, number>;
        totalSize: number;
    } {
        const attachments = this.getAllAttachments();
        const byType: Record<string, number> = {};

        for (const a of attachments) {
            byType[a.type] = (byType[a.type] || 0) + 1;
        }

        return {
            totalAttachments: attachments.length,
            byType,
            totalSize: attachments.reduce((sum, a) => sum + a.size, 0)
        };
    }
}

// Singleton export
export const fileAttachmentHandler = new FileAttachmentHandler();
