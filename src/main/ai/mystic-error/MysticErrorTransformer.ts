/**
 * Mystic Error Transformer
 * 
 * Transforms cryptic errors into enlightening messages,
 * revealing the true meaning behind each exception.
 */

import { EventEmitter } from 'events';

export interface TransformedError {
    id: string;
    original: string;
    transformed: string;
    enlightenment: string;
    wisdom: number;
}

export class MysticErrorTransformer extends EventEmitter {
    private static instance: MysticErrorTransformer;
    private transformations: Map<string, TransformedError> = new Map();

    private constructor() { super(); }

    static getInstance(): MysticErrorTransformer {
        if (!MysticErrorTransformer.instance) {
            MysticErrorTransformer.instance = new MysticErrorTransformer();
        }
        return MysticErrorTransformer.instance;
    }

    transform(error: string): TransformedError {
        const transformed = this.decryptError(error);
        const enlightenment = this.extractEnlightenment(error);

        const result: TransformedError = {
            id: `terror_${Date.now()}`,
            original: error,
            transformed,
            enlightenment,
            wisdom: 0.5 + Math.random() * 0.5,
        };

        this.transformations.set(result.id, result);
        this.emit('error:transformed', result);
        return result;
    }

    private decryptError(error: string): string {
        const lower = error.toLowerCase();
        if (lower.includes('undefined')) return 'A value you seek has not yet manifested in this realm';
        if (lower.includes('null')) return 'The void speaks - where you expected something, nothing exists';
        if (lower.includes('type')) return 'The shapes of your data do not align with the cosmic order';
        return 'An unknown disturbance ripples through your code';
    }

    private extractEnlightenment(error: string): string {
        return 'Every error is a teacher. Listen to its wisdom.';
    }

    getStats(): { total: number; avgWisdom: number } {
        const trans = Array.from(this.transformations.values());
        return {
            total: trans.length,
            avgWisdom: trans.length > 0 ? trans.reduce((s, t) => s + t.wisdom, 0) / trans.length : 0,
        };
    }
}

export const mysticErrorTransformer = MysticErrorTransformer.getInstance();
