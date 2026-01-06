/**
 * Clean Code Guide - Clean code standards
 */
import { EventEmitter } from 'events';

export interface CleanCodeViolation { id: string; file: string; line: number; attribute: 'consistent' | 'intentional' | 'adaptable' | 'responsible'; category: 'formatting' | 'naming' | 'design' | 'documentation'; message: string; suggestion: string; }

export class CleanCodeGuide extends EventEmitter {
    private static instance: CleanCodeGuide;
    private violations: CleanCodeViolation[] = [];
    private constructor() { super(); }
    static getInstance(): CleanCodeGuide { if (!CleanCodeGuide.instance) CleanCodeGuide.instance = new CleanCodeGuide(); return CleanCodeGuide.instance; }

    analyze(file: string, code: string): CleanCodeViolation[] {
        const results: CleanCodeViolation[] = [];
        if (code.match(/[a-z][A-Z]/g)?.length !== code.match(/[a-z]_[a-z]/g)?.length) results.push({ id: `cc_${Date.now()}`, file, line: 1, attribute: 'consistent', category: 'naming', message: 'Inconsistent naming convention', suggestion: 'Use consistent camelCase or snake_case' });
        if (!code.includes('/**') && !code.includes('//')) results.push({ id: `cc_${Date.now()}_1`, file, line: 1, attribute: 'intentional', category: 'documentation', message: 'Missing documentation', suggestion: 'Add JSDoc comments' });
        if (code.split('\n').some(l => l.length > 120)) results.push({ id: `cc_${Date.now()}_2`, file, line: 1, attribute: 'consistent', category: 'formatting', message: 'Lines too long', suggestion: 'Keep lines under 120 characters' });
        this.violations.push(...results); this.emit('analyzed', { file, count: results.length }); return results;
    }

    getByAttribute(attr: CleanCodeViolation['attribute']): CleanCodeViolation[] { return this.violations.filter(v => v.attribute === attr); }
    getAll(): CleanCodeViolation[] { return [...this.violations]; }
}
export function getCleanCodeGuide(): CleanCodeGuide { return CleanCodeGuide.getInstance(); }
