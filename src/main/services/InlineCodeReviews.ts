/**
 * Inline Code Reviews
 * 
 * Add comment threads to specific lines of code
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

interface ReviewComment {
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    resolved: boolean;
}

interface CodeReviewThread {
    id: string;
    file: string;
    lineStart: number;
    lineEnd: number;
    codeSnippet: string;
    comments: ReviewComment[];
    status: 'open' | 'resolved' | 'pending';
    createdAt: Date;
    updatedAt: Date;
}

interface ReviewSummary {
    totalThreads: number;
    openThreads: number;
    resolvedThreads: number;
    pendingThreads: number;
}

/**
 * InlineCodeReviews - Manage code review threads
 */
export class InlineCodeReviews extends EventEmitter {
    private static instance: InlineCodeReviews;
    private threads: Map<string, CodeReviewThread> = new Map();
    private storageDir: string;

    private constructor() {
        super();
        this.storageDir = path.join(app.getPath('userData'), 'code-reviews');
        this.initialize();
    }

    static getInstance(): InlineCodeReviews {
        if (!InlineCodeReviews.instance) {
            InlineCodeReviews.instance = new InlineCodeReviews();
        }
        return InlineCodeReviews.instance;
    }

    /**
     * Initialize storage
     */
    private async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
            await this.loadThreads();
        } catch (error) {
            console.error('Failed to initialize code reviews:', error);
        }
    }

    /**
     * Load threads from storage
     */
    private async loadThreads(): Promise<void> {
        try {
            const files = await fs.readdir(this.storageDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(this.storageDir, file), 'utf-8');
                    const thread = JSON.parse(content);
                    this.threads.set(thread.id, thread);
                }
            }
        } catch (error) {
            console.error('Failed to load threads:', error);
        }
    }

    /**
     * Save a thread to storage
     */
    private async saveThread(thread: CodeReviewThread): Promise<void> {
        try {
            const filePath = path.join(this.storageDir, `${thread.id}.json`);
            await fs.writeFile(filePath, JSON.stringify(thread, null, 2));
        } catch (error) {
            console.error('Failed to save thread:', error);
        }
    }

    /**
     * Create a new review thread
     */
    async createThread(
        file: string,
        lineStart: number,
        lineEnd: number,
        codeSnippet: string,
        initialComment: { author: string; content: string }
    ): Promise<CodeReviewThread> {
        const thread: CodeReviewThread = {
            id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            lineStart,
            lineEnd,
            codeSnippet,
            comments: [{
                id: `comment_${Date.now()}`,
                author: initialComment.author,
                content: initialComment.content,
                timestamp: new Date(),
                resolved: false,
            }],
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.threads.set(thread.id, thread);
        await this.saveThread(thread);
        this.emit('thread:created', thread);

        return thread;
    }

    /**
     * Add a comment to a thread
     */
    async addComment(threadId: string, author: string, content: string): Promise<ReviewComment | null> {
        const thread = this.threads.get(threadId);
        if (!thread) return null;

        const comment: ReviewComment = {
            id: `comment_${Date.now()}`,
            author,
            content,
            timestamp: new Date(),
            resolved: false,
        };

        thread.comments.push(comment);
        thread.updatedAt = new Date();

        await this.saveThread(thread);
        this.emit('comment:added', { threadId, comment });

        return comment;
    }

    /**
     * Resolve a thread
     */
    async resolveThread(threadId: string): Promise<boolean> {
        const thread = this.threads.get(threadId);
        if (!thread) return false;

        thread.status = 'resolved';
        thread.updatedAt = new Date();
        thread.comments.forEach(c => c.resolved = true);

        await this.saveThread(thread);
        this.emit('thread:resolved', thread);

        return true;
    }

    /**
     * Reopen a thread
     */
    async reopenThread(threadId: string): Promise<boolean> {
        const thread = this.threads.get(threadId);
        if (!thread) return false;

        thread.status = 'open';
        thread.updatedAt = new Date();

        await this.saveThread(thread);
        this.emit('thread:reopened', thread);

        return true;
    }

    /**
     * Delete a thread
     */
    async deleteThread(threadId: string): Promise<boolean> {
        const thread = this.threads.get(threadId);
        if (!thread) return false;

        this.threads.delete(threadId);

        try {
            await fs.unlink(path.join(this.storageDir, `${threadId}.json`));
        } catch { }

        this.emit('thread:deleted', threadId);
        return true;
    }

    /**
     * Get threads for a file
     */
    getThreadsForFile(file: string): CodeReviewThread[] {
        return Array.from(this.threads.values())
            .filter(t => t.file === file)
            .sort((a, b) => a.lineStart - b.lineStart);
    }

    /**
     * Get all threads
     */
    getAllThreads(): CodeReviewThread[] {
        return Array.from(this.threads.values())
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    /**
     * Get thread by ID
     */
    getThread(threadId: string): CodeReviewThread | undefined {
        return this.threads.get(threadId);
    }

    /**
     * Get review summary
     */
    getSummary(): ReviewSummary {
        const threads = Array.from(this.threads.values());
        return {
            totalThreads: threads.length,
            openThreads: threads.filter(t => t.status === 'open').length,
            resolvedThreads: threads.filter(t => t.status === 'resolved').length,
            pendingThreads: threads.filter(t => t.status === 'pending').length,
        };
    }

    /**
     * Request AI review
     */
    async requestAIReview(file: string, code: string): Promise<CodeReviewThread[]> {
        const { ModelManager } = await import('../ai/ModelManager');
        const manager = ModelManager.getInstance();

        const prompt = `Review this code and identify issues. For each issue, specify the line number.

\`\`\`
${code}
\`\`\`

Format your response as JSON array:
[{"line": 1, "issue": "description", "severity": "error|warning|info"}]`;

        const response = await manager.chat([
            { role: 'user', content: prompt, timestamp: new Date() },
        ]);

        try {
            const issues = JSON.parse(response);
            const threads: CodeReviewThread[] = [];

            for (const issue of issues) {
                const thread = await this.createThread(
                    file,
                    issue.line,
                    issue.line,
                    '',
                    { author: 'AI Reviewer', content: `[${issue.severity}] ${issue.issue}` }
                );
                threads.push(thread);
            }

            return threads;
        } catch {
            return [];
        }
    }
}

export default InlineCodeReviews;
