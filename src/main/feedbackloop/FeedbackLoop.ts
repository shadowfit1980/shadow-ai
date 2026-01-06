/**
 * Feedback Loop - User feedback learning
 */
import { EventEmitter } from 'events';

export interface Feedback { id: string; responseId: string; rating: 1 | 2 | 3 | 4 | 5; type: 'thumbs' | 'stars' | 'text'; comment?: string; timestamp: number; }

export class FeedbackLoop extends EventEmitter {
    private static instance: FeedbackLoop;
    private feedbacks: Feedback[] = [];
    private constructor() { super(); }
    static getInstance(): FeedbackLoop { if (!FeedbackLoop.instance) FeedbackLoop.instance = new FeedbackLoop(); return FeedbackLoop.instance; }

    submit(responseId: string, type: Feedback['type'], rating: Feedback['rating'], comment?: string): Feedback {
        const feedback: Feedback = { id: `fb_${Date.now()}`, responseId, rating, type, comment, timestamp: Date.now() };
        this.feedbacks.push(feedback); this.emit('submitted', feedback); return feedback;
    }

    getAverageRating(): number { if (!this.feedbacks.length) return 0; return this.feedbacks.reduce((s, f) => s + f.rating, 0) / this.feedbacks.length; }
    getByResponse(responseId: string): Feedback[] { return this.feedbacks.filter(f => f.responseId === responseId); }
    getRecent(limit = 50): Feedback[] { return this.feedbacks.slice(-limit); }
    getStats(): { total: number; avgRating: number; positive: number; negative: number } { const avg = this.getAverageRating(); return { total: this.feedbacks.length, avgRating: avg, positive: this.feedbacks.filter(f => f.rating >= 4).length, negative: this.feedbacks.filter(f => f.rating <= 2).length }; }
}
export function getFeedbackLoop(): FeedbackLoop { return FeedbackLoop.getInstance(); }
