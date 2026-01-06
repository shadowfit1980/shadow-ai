/**
 * Suggestions Engine - Inline suggestions
 */
import { EventEmitter } from 'events';

export interface Suggestion { id: string; type: 'completion' | 'refactor' | 'fix' | 'import'; content: string; position: { line: number; column: number }; confidence: number; }

export class SuggestionsEngine extends EventEmitter {
    private static instance: SuggestionsEngine;
    private suggestions: Suggestion[] = [];
    private enabled = true;
    private constructor() { super(); }
    static getInstance(): SuggestionsEngine { if (!SuggestionsEngine.instance) SuggestionsEngine.instance = new SuggestionsEngine(); return SuggestionsEngine.instance; }

    setEnabled(enabled: boolean): void { this.enabled = enabled; }
    isEnabled(): boolean { return this.enabled; }

    generate(code: string, line: number, column: number): Suggestion[] {
        if (!this.enabled) return [];
        const suggestions: Suggestion[] = [
            { id: `sug_${Date.now()}`, type: 'completion', content: '// AI suggested completion', position: { line, column }, confidence: 0.85 },
        ];
        if (code.includes('function')) suggestions.push({ id: `sug_${Date.now()}_1`, type: 'refactor', content: 'Consider using arrow function', position: { line, column }, confidence: 0.7 });
        this.suggestions = suggestions; this.emit('generated', suggestions); return suggestions;
    }

    accept(suggestionId: string): boolean { return this.suggestions.some(s => s.id === suggestionId); }
    dismiss(suggestionId: string): boolean { this.suggestions = this.suggestions.filter(s => s.id !== suggestionId); return true; }
    getCurrent(): Suggestion[] { return [...this.suggestions]; }
}
export function getSuggestionsEngine(): SuggestionsEngine { return SuggestionsEngine.getInstance(); }
