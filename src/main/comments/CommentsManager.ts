/**
 * Comments Manager - Code comments
 */
import { EventEmitter } from 'events';

export interface CodeComment { id: string; file: string; line: number; text: string; author: string; resolved: boolean; createdAt: number; }

export class CommentsManager extends EventEmitter {
    private static instance: CommentsManager;
    private comments: Map<string, CodeComment> = new Map();
    private constructor() { super(); }
    static getInstance(): CommentsManager { if (!CommentsManager.instance) CommentsManager.instance = new CommentsManager(); return CommentsManager.instance; }

    add(file: string, line: number, text: string, author = 'anonymous'): CodeComment {
        const comment: CodeComment = { id: `cmt_${Date.now()}`, file, line, text, author, resolved: false, createdAt: Date.now() };
        this.comments.set(comment.id, comment);
        this.emit('added', comment);
        return comment;
    }

    resolve(id: string): boolean { const c = this.comments.get(id); if (!c) return false; c.resolved = true; this.emit('resolved', c); return true; }
    delete(id: string): boolean { return this.comments.delete(id); }
    getByFile(file: string): CodeComment[] { return Array.from(this.comments.values()).filter(c => c.file === file); }
    getUnresolved(): CodeComment[] { return Array.from(this.comments.values()).filter(c => !c.resolved); }
    getAll(): CodeComment[] { return Array.from(this.comments.values()); }
}

export function getCommentsManager(): CommentsManager { return CommentsManager.getInstance(); }
