/**
 * FileHandler - File Download and Management Service
 * 
 * Handles downloading files from URLs, analyzing images,
 * transcribing audio, and fetching web content.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { app } from 'electron';

export interface DownloadResult {
    success: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    error?: string;
}

export interface WebContentResult {
    success: boolean;
    title?: string;
    content?: string;
    url?: string;
    error?: string;
}

export interface FileInfo {
    name: string;
    path: string;
    size: number;
    mimeType: string;
    extension: string;
    isImage: boolean;
    isAudio: boolean;
    isVideo: boolean;
    isDocument: boolean;
}

export class FileHandler {
    private static instance: FileHandler;
    private downloadPath: string;

    private constructor() {
        // Default to user's Downloads folder
        this.downloadPath = app.getPath('downloads');
    }

    static getInstance(): FileHandler {
        if (!FileHandler.instance) {
            FileHandler.instance = new FileHandler();
        }
        return FileHandler.instance;
    }

    /**
     * Set custom download path
     */
    setDownloadPath(newPath: string): void {
        this.downloadPath = newPath;
    }

    /**
     * Get current download path
     */
    getDownloadPath(): string {
        return this.downloadPath;
    }

    /**
     * Download a file from URL
     */
    async downloadFile(url: string, customFileName?: string): Promise<DownloadResult> {
        console.log(`📥 Downloading: ${url}`);

        try {
            // Parse URL to get filename
            const urlObj = new URL(url);
            const urlPath = urlObj.pathname;
            const defaultFileName = path.basename(urlPath) || `download_${Date.now()}`;
            const fileName = customFileName || defaultFileName;

            // Ensure download directory exists
            await fs.mkdir(this.downloadPath, { recursive: true });

            const filePath = path.join(this.downloadPath, fileName);

            // Download the file
            const fileData = await this.fetchUrl(url);

            if (!fileData.success || !fileData.data) {
                return {
                    success: false,
                    error: fileData.error || 'Failed to download file'
                };
            }

            // Write to disk
            await fs.writeFile(filePath, fileData.data);

            const stats = await fs.stat(filePath);
            const mimeType = this.getMimeType(fileName);

            console.log(`✅ Downloaded: ${filePath} (${stats.size} bytes)`);

            return {
                success: true,
                filePath,
                fileName,
                fileSize: stats.size,
                mimeType
            };
        } catch (error: any) {
            console.error('❌ Download error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Fetch URL content as buffer
     */
    private fetchUrl(url: string): Promise<{ success: boolean; data?: Buffer; contentType?: string; error?: string }> {
        return new Promise((resolve) => {
            const protocol = url.startsWith('https') ? https : http;

            protocol.get(url, {
                headers: {
                    'User-Agent': 'Shadow-AI/3.0',
                    'Accept': '*/*'
                }
            }, (response) => {
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        this.fetchUrl(redirectUrl).then(resolve);
                        return;
                    }
                }

                if (response.statusCode !== 200) {
                    resolve({ success: false, error: `HTTP ${response.statusCode}` });
                    return;
                }

                const chunks: Buffer[] = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    resolve({
                        success: true,
                        data: Buffer.concat(chunks),
                        contentType: response.headers['content-type']
                    });
                });
                response.on('error', (err) => resolve({ success: false, error: err.message }));
            }).on('error', (err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    /**
     * Fetch and extract text content from a web page
     */
    async getWebContent(url: string): Promise<WebContentResult> {
        console.log(`🌐 Fetching web content: ${url}`);

        try {
            const result = await this.fetchUrl(url);

            if (!result.success || !result.data) {
                return { success: false, error: result.error, url };
            }

            const html = result.data.toString('utf-8');

            // Extract title
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

            // Extract text content (basic extraction)
            let content = html
                // Remove scripts and styles
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                // Remove HTML tags
                .replace(/<[^>]+>/g, ' ')
                // Decode entities
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                // Clean whitespace
                .replace(/\s+/g, ' ')
                .trim();

            // Limit content length
            if (content.length > 5000) {
                content = content.substring(0, 5000) + '...';
            }

            console.log(`✅ Extracted ${content.length} chars from: ${title}`);

            return {
                success: true,
                title,
                content,
                url
            };
        } catch (error: any) {
            console.error('❌ Web content error:', error);
            return {
                success: false,
                error: error.message,
                url
            };
        }
    }

    /**
     * Get file information
     */
    async getFileInfo(filePath: string): Promise<FileInfo | null> {
        try {
            const stats = await fs.stat(filePath);
            const name = path.basename(filePath);
            const extension = path.extname(filePath).toLowerCase().slice(1);
            const mimeType = this.getMimeType(name);

            return {
                name,
                path: filePath,
                size: stats.size,
                mimeType,
                extension,
                isImage: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension),
                isAudio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension),
                isVideo: ['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(extension),
                isDocument: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(extension)
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Detect if a string is a URL
     */
    isUrl(str: string): boolean {
        try {
            new URL(str);
            return str.startsWith('http://') || str.startsWith('https://');
        } catch {
            return false;
        }
    }

    /**
     * Get MIME type from filename
     */
    private getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
            // Images
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.bmp': 'image/bmp',
            // Audio
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
            // Video
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mkv': 'video/x-matroska',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            // Documents
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.html': 'text/html',
            '.json': 'application/json',
            '.xml': 'application/xml',
            // Archives
            '.zip': 'application/zip',
            '.tar': 'application/x-tar',
            '.gz': 'application/gzip',
        };

        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * List files in download directory
     */
    async listDownloads(): Promise<FileInfo[]> {
        try {
            const files = await fs.readdir(this.downloadPath);
            const fileInfos: FileInfo[] = [];

            for (const file of files) {
                const info = await this.getFileInfo(path.join(this.downloadPath, file));
                if (info) {
                    fileInfos.push(info);
                }
            }

            return fileInfos;
        } catch (error) {
            return [];
        }
    }
}

// Export singleton getter
export function getFileHandler(): FileHandler {
    return FileHandler.getInstance();
}
