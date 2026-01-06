/**
 * Transcendent Error Handler
 * 
 * Handles errors at a transcendent level, understanding the
 * deeper meaning and purpose behind each error.
 */

import { EventEmitter } from 'events';

export interface TranscendentError {
    id: string;
    originalError: string;
    transcendentMeaning: string;
    karmaLevel: 'positive' | 'neutral' | 'negative';
    lessonsLearned: string[];
    healingPath: string[];
    resolved: boolean;
}

export class TranscendentErrorHandler extends EventEmitter {
    private static instance: TranscendentErrorHandler;
    private errors: Map<string, TranscendentError> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): TranscendentErrorHandler {
        if (!TranscendentErrorHandler.instance) {
            TranscendentErrorHandler.instance = new TranscendentErrorHandler();
        }
        return TranscendentErrorHandler.instance;
    }

    transcend(error: string): TranscendentError {
        const meaning = this.findMeaning(error);
        const karma = this.assessKarma(error);
        const lessons = this.extractLessons(error);
        const healing = this.findHealingPath(error);

        const transcendent: TranscendentError = {
            id: `trans_err_${Date.now()}`,
            originalError: error,
            transcendentMeaning: meaning,
            karmaLevel: karma,
            lessonsLearned: lessons,
            healingPath: healing,
            resolved: false,
        };

        this.errors.set(transcendent.id, transcendent);
        this.emit('error:transcended', transcendent);
        return transcendent;
    }

    private findMeaning(error: string): string {
        const lower = error.toLowerCase();
        if (lower.includes('undefined')) return 'A value sought was never created - manifest it first';
        if (lower.includes('null')) return 'Emptiness encountered - fill the void with intention';
        if (lower.includes('type')) return 'Shapes do not align - harmonize the structures';
        if (lower.includes('network')) return 'Connection broken - rebuild the bridge';
        if (lower.includes('timeout')) return 'Patience exceeded - optimize or increase tolerance';
        return 'An unknown disturbance in the code force';
    }

    private assessKarma(error: string): 'positive' | 'neutral' | 'negative' {
        const lower = error.toLowerCase();
        if (lower.includes('warning')) return 'neutral';
        if (lower.includes('deprecated')) return 'neutral';
        if (lower.includes('fatal') || lower.includes('critical')) return 'negative';
        return 'neutral';
    }

    private extractLessons(error: string): string[] {
        const lessons: string[] = [];
        const lower = error.toLowerCase();

        if (lower.includes('undefined')) lessons.push('Always initialize variables');
        if (lower.includes('null')) lessons.push('Check for null before accessing');
        if (lower.includes('type')) lessons.push('Use TypeScript for type safety');
        if (lower.includes('network')) lessons.push('Implement retry logic');

        if (lessons.length === 0) lessons.push('Every error is a teacher');
        return lessons;
    }

    private findHealingPath(error: string): string[] {
        const path: string[] = [];
        path.push('1. Acknowledge the error');
        path.push('2. Understand its root cause');
        path.push('3. Apply the appropriate fix');
        path.push('4. Add tests to prevent recurrence');
        path.push('5. Document the lesson learned');
        return path;
    }

    resolve(errorId: string): boolean {
        const err = this.errors.get(errorId);
        if (err) {
            err.resolved = true;
            this.emit('error:resolved', err);
            return true;
        }
        return false;
    }

    getStats(): { total: number; resolved: number; avgKarma: string } {
        const errors = Array.from(this.errors.values());
        const resolved = errors.filter(e => e.resolved).length;
        const karmaScores = { positive: 1, neutral: 0, negative: -1 };
        const avgKarma = errors.length > 0
            ? errors.reduce((s, e) => s + karmaScores[e.karmaLevel], 0) / errors.length
            : 0;

        return {
            total: errors.length,
            resolved,
            avgKarma: avgKarma > 0.3 ? 'positive' : avgKarma < -0.3 ? 'negative' : 'neutral',
        };
    }
}

export const transcendentErrorHandler = TranscendentErrorHandler.getInstance();
