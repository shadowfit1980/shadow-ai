/**
 * AI Cloud Drive
 * 
 * Project file storage, version control for artifacts,
 * AI-indexed search, and sharing capabilities.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface DriveFile {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    mimeType?: string;
    size: number;
    hash?: string;
    metadata: FileMetadata;
    versions: FileVersion[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    sharedWith: SharePermission[];
}

export interface FileMetadata {
    description?: string;
    projectId?: string;
    category?: string;
    aiSummary?: string;
    aiTags?: string[];
    embeddings?: number[];
}

export interface FileVersion {
    id: string;
    version: number;
    hash: string;
    size: number;
    createdAt: Date;
    createdBy: string;
    comment?: string;
}

export interface SharePermission {
    userId: string;
    email: string;
    role: 'viewer' | 'editor' | 'owner';
    sharedAt: Date;
}

export interface SearchResult {
    file: DriveFile;
    score: number;
    matches: SearchMatch[];
}

export interface SearchMatch {
    field: string;
    snippet: string;
}

export interface DriveStats {
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    recentFiles: DriveFile[];
    storageUsed: number;
    storageLimit: number;
}

// ============================================================================
// AI CLOUD DRIVE
// ============================================================================

export class AICloudDrive extends EventEmitter {
    private static instance: AICloudDrive;
    private files: Map<string, DriveFile> = new Map();
    private basePath: string;
    private userId: string = 'default';

    private constructor() {
        super();
        this.basePath = path.join(process.cwd(), '.ai-drive');
        this.ensureBasePath();
    }

    static getInstance(): AICloudDrive {
        if (!AICloudDrive.instance) {
            AICloudDrive.instance = new AICloudDrive();
        }
        return AICloudDrive.instance;
    }

    private ensureBasePath(): void {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    setUser(userId: string): void {
        this.userId = userId;
    }

    // ========================================================================
    // FILE OPERATIONS
    // ========================================================================

    async uploadFile(
        name: string,
        content: Buffer | string,
        options?: {
            folder?: string;
            description?: string;
            tags?: string[];
            projectId?: string;
        }
    ): Promise<DriveFile> {
        const id = this.generateId();
        const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content;
        const hash = this.computeHash(contentBuffer);
        const filePath = options?.folder
            ? path.join(options.folder, name)
            : name;

        // Determine MIME type
        const mimeType = this.getMimeType(name);

        const file: DriveFile = {
            id,
            name,
            path: filePath,
            type: 'file',
            mimeType,
            size: contentBuffer.length,
            hash,
            metadata: {
                description: options?.description,
                projectId: options?.projectId,
            },
            versions: [{
                id: this.generateId(),
                version: 1,
                hash,
                size: contentBuffer.length,
                createdAt: new Date(),
                createdBy: this.userId,
            }],
            tags: options?.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: this.userId,
            sharedWith: [],
        };

        // Save to disk
        const diskPath = path.join(this.basePath, id);
        fs.writeFileSync(diskPath, contentBuffer);

        // Generate AI metadata
        await this.generateAIMetadata(file, contentBuffer);

        this.files.set(id, file);
        this.emit('fileUploaded', file);
        return file;
    }

    async updateFile(
        id: string,
        content: Buffer | string,
        comment?: string
    ): Promise<DriveFile | null> {
        const file = this.files.get(id);
        if (!file) return null;

        const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content;
        const hash = this.computeHash(contentBuffer);

        // Check if content actually changed
        if (hash === file.hash) {
            return file;
        }

        // Create new version
        const newVersion: FileVersion = {
            id: this.generateId(),
            version: file.versions.length + 1,
            hash,
            size: contentBuffer.length,
            createdAt: new Date(),
            createdBy: this.userId,
            comment,
        };

        file.versions.push(newVersion);
        file.hash = hash;
        file.size = contentBuffer.length;
        file.updatedAt = new Date();

        // Save to disk
        const diskPath = path.join(this.basePath, id);
        fs.writeFileSync(diskPath, contentBuffer);

        // Update AI metadata
        await this.generateAIMetadata(file, contentBuffer);

        this.emit('fileUpdated', file);
        return file;
    }

    async getFile(id: string): Promise<{ file: DriveFile; content: Buffer } | null> {
        const file = this.files.get(id);
        if (!file) return null;

        const diskPath = path.join(this.basePath, id);
        if (!fs.existsSync(diskPath)) return null;

        const content = fs.readFileSync(diskPath);
        return { file, content };
    }

    async deleteFile(id: string): Promise<boolean> {
        const file = this.files.get(id);
        if (!file) return false;

        // Delete from disk
        const diskPath = path.join(this.basePath, id);
        if (fs.existsSync(diskPath)) {
            fs.unlinkSync(diskPath);
        }

        this.files.delete(id);
        this.emit('fileDeleted', id);
        return true;
    }

    async getFileVersion(
        id: string,
        version: number
    ): Promise<{ version: FileVersion; content: Buffer } | null> {
        const file = this.files.get(id);
        if (!file) return null;

        const fileVersion = file.versions.find(v => v.version === version);
        if (!fileVersion) return null;

        // For simplicity, we're keeping current version only on disk
        // In production, you'd store all versions
        const diskPath = path.join(this.basePath, id);
        const content = fs.readFileSync(diskPath);

        return { version: fileVersion, content };
    }

    // ========================================================================
    // FOLDER OPERATIONS
    // ========================================================================

    async createFolder(name: string, parentPath?: string): Promise<DriveFile> {
        const id = this.generateId();
        const folderPath = parentPath ? path.join(parentPath, name) : name;

        const folder: DriveFile = {
            id,
            name,
            path: folderPath,
            type: 'folder',
            size: 0,
            metadata: {},
            versions: [],
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: this.userId,
            sharedWith: [],
        };

        this.files.set(id, folder);
        this.emit('folderCreated', folder);
        return folder;
    }

    async listFolder(folderPath?: string): Promise<DriveFile[]> {
        const files = Array.from(this.files.values());

        if (!folderPath) {
            // Root level items
            return files.filter(f => !f.path.includes('/'));
        }

        return files.filter(f => {
            const parentPath = path.dirname(f.path);
            return parentPath === folderPath;
        });
    }

    // ========================================================================
    // SEARCH
    // ========================================================================

    async search(query: string, options?: {
        tags?: string[];
        projectId?: string;
        mimeType?: string;
        limit?: number;
    }): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const queryLower = query.toLowerCase();

        for (const file of this.files.values()) {
            if (file.type === 'folder') continue;

            // Apply filters
            if (options?.tags && !options.tags.some(t => file.tags.includes(t))) {
                continue;
            }
            if (options?.projectId && file.metadata.projectId !== options.projectId) {
                continue;
            }
            if (options?.mimeType && file.mimeType !== options.mimeType) {
                continue;
            }

            // Calculate relevance score
            let score = 0;
            const matches: SearchMatch[] = [];

            // Name match
            if (file.name.toLowerCase().includes(queryLower)) {
                score += 10;
                matches.push({ field: 'name', snippet: file.name });
            }

            // Tag match
            const matchingTags = file.tags.filter(t => t.toLowerCase().includes(queryLower));
            if (matchingTags.length > 0) {
                score += 5 * matchingTags.length;
                matches.push({ field: 'tags', snippet: matchingTags.join(', ') });
            }

            // AI summary match
            if (file.metadata.aiSummary?.toLowerCase().includes(queryLower)) {
                score += 8;
                matches.push({ field: 'aiSummary', snippet: file.metadata.aiSummary });
            }

            // AI tags match
            const matchingAiTags = file.metadata.aiTags?.filter(t =>
                t.toLowerCase().includes(queryLower)
            ) || [];
            if (matchingAiTags.length > 0) {
                score += 3 * matchingAiTags.length;
                matches.push({ field: 'aiTags', snippet: matchingAiTags.join(', ') });
            }

            // Description match
            if (file.metadata.description?.toLowerCase().includes(queryLower)) {
                score += 5;
                matches.push({ field: 'description', snippet: file.metadata.description });
            }

            if (score > 0) {
                results.push({ file, score, matches });
            }
        }

        // Sort by score and limit
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, options?.limit || 20);
    }

    async semanticSearch(query: string, limit = 10): Promise<SearchResult[]> {
        // In production, use embeddings for semantic search
        // For now, fall back to keyword search
        return this.search(query, { limit });
    }

    // ========================================================================
    // SHARING
    // ========================================================================

    async shareFile(
        id: string,
        email: string,
        role: 'viewer' | 'editor'
    ): Promise<boolean> {
        const file = this.files.get(id);
        if (!file) return false;

        // Check if already shared
        const existing = file.sharedWith.find(s => s.email === email);
        if (existing) {
            existing.role = role;
        } else {
            file.sharedWith.push({
                userId: email, // In production, resolve to actual user ID
                email,
                role,
                sharedAt: new Date(),
            });
        }

        this.emit('fileShared', { file, email, role });
        return true;
    }

    async unshareFile(id: string, email: string): Promise<boolean> {
        const file = this.files.get(id);
        if (!file) return false;

        file.sharedWith = file.sharedWith.filter(s => s.email !== email);
        this.emit('fileUnshared', { file, email });
        return true;
    }

    async getSharedWithMe(): Promise<DriveFile[]> {
        return Array.from(this.files.values()).filter(f =>
            f.sharedWith.some(s => s.userId === this.userId)
        );
    }

    // ========================================================================
    // AI FEATURES
    // ========================================================================

    private async generateAIMetadata(file: DriveFile, content: Buffer): Promise<void> {
        // In production, use LLM to generate metadata
        const textContent = content.toString('utf-8');

        // Simple extraction for demo
        file.metadata.aiSummary = `File containing ${textContent.split('\n').length} lines of ${file.mimeType || 'text'}`;
        file.metadata.aiTags = this.extractTags(file.name, textContent);
    }

    private extractTags(filename: string, content: string): string[] {
        const tags: string[] = [];

        // Extract from filename
        const ext = path.extname(filename).toLowerCase();
        if (ext) tags.push(ext.replace('.', ''));

        // Extract from content (simple keyword extraction)
        const keywords = ['function', 'class', 'import', 'export', 'interface', 'type'];
        for (const kw of keywords) {
            if (content.includes(kw)) {
                tags.push(kw);
            }
        }

        return [...new Set(tags)];
    }

    async summarizeFile(id: string): Promise<string | null> {
        const result = await this.getFile(id);
        if (!result) return null;

        // In production, use LLM to summarize
        const content = result.content.toString('utf-8');
        const lines = content.split('\n');

        return `This file contains ${lines.length} lines. ` +
            `First line: "${lines[0]?.substring(0, 50)}..."`;
    }

    // ========================================================================
    // STATS & UTILITIES
    // ========================================================================

    async getStats(): Promise<DriveStats> {
        const files = Array.from(this.files.values());
        const actualFiles = files.filter(f => f.type === 'file');

        const filesByType: Record<string, number> = {};
        let totalSize = 0;

        for (const file of actualFiles) {
            const ext = path.extname(file.name) || 'unknown';
            filesByType[ext] = (filesByType[ext] || 0) + 1;
            totalSize += file.size;
        }

        const recentFiles = [...actualFiles]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 10);

        return {
            totalFiles: actualFiles.length,
            totalSize,
            filesByType,
            recentFiles,
            storageUsed: totalSize,
            storageLimit: 1024 * 1024 * 1024, // 1GB default limit
        };
    }

    private generateId(): string {
        return `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    private computeHash(content: Buffer): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    private getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.ts': 'text/typescript',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.css': 'text/css',
            '.py': 'text/x-python',
            '.java': 'text/x-java',
            '.go': 'text/x-go',
            '.rs': 'text/x-rust',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}

export const aiCloudDrive = AICloudDrive.getInstance();
