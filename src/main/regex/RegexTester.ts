/**
 * Regex Tester
 * Regular expression testing
 */

import { EventEmitter } from 'events';

export interface RegexMatch {
    match: string;
    index: number;
    groups?: Record<string, string>;
}

export interface RegexResult {
    valid: boolean;
    matches: RegexMatch[];
    count: number;
    error?: string;
}

export class RegexTester extends EventEmitter {
    private static instance: RegexTester;
    private savedPatterns: Map<string, string> = new Map();

    private constructor() { super(); }

    static getInstance(): RegexTester {
        if (!RegexTester.instance) RegexTester.instance = new RegexTester();
        return RegexTester.instance;
    }

    test(pattern: string, text: string, flags = 'g'): RegexResult {
        try {
            const regex = new RegExp(pattern, flags);
            const matches: RegexMatch[] = [];
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({ match: match[0], index: match.index, groups: match.groups });
                if (!flags.includes('g')) break;
            }
            return { valid: true, matches, count: matches.length };
        } catch (error: any) {
            return { valid: false, matches: [], count: 0, error: error.message };
        }
    }

    replace(pattern: string, text: string, replacement: string, flags = 'g'): string {
        try {
            return text.replace(new RegExp(pattern, flags), replacement);
        } catch {
            return text;
        }
    }

    savePattern(name: string, pattern: string): void { this.savedPatterns.set(name, pattern); }
    getSaved(): { name: string; pattern: string }[] {
        return Array.from(this.savedPatterns.entries()).map(([name, pattern]) => ({ name, pattern }));
    }
}

export function getRegexTester(): RegexTester { return RegexTester.getInstance(); }
