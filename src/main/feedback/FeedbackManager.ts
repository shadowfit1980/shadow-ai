/**
 * Feedback Manager - Review feedback
 */
import { EventEmitter } from 'events';

export interface Feedback { id: string; type: 'approve' | 'request-changes' | 'comment'; message: string; file?: string; line?: number; resolved: boolean; }

export class FeedbackManager extends EventEmitter {
    private static instance: FeedbackManager;
    private feedback: Map<string, Feedback> = new Map();
    private constructor() { super(); }
    static getInstance(): FeedbackManager { if (!FeedbackManager.instance) FeedbackManager.instance = new FeedbackManager(); return FeedbackManager.instance; }

    add(type: Feedback['type'], message: string, file?: string, line?: number): Feedback {
        const fb: Feedback = { id: `fb_${Date.now()}`, type, message, file, line, resolved: false };
        this.feedback.set(fb.id, fb);
        this.emit('added', fb);
        return fb;
    }

    resolve(id: string): boolean { const fb = this.feedback.get(id); if (!fb) return false; fb.resolved = true; this.emit('resolved', fb); return true; }
    getUnresolved(): Feedback[] { return Array.from(this.feedback.values()).filter(f => !f.resolved); }
    getByFile(file: string): Feedback[] { return Array.from(this.feedback.values()).filter(f => f.file === file); }
    getAll(): Feedback[] { return Array.from(this.feedback.values()); }
}
export function getFeedbackManager(): FeedbackManager { return FeedbackManager.getInstance(); }
