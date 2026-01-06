/**
 * Suggestions Panel - AI suggestions
 */
import { EventEmitter } from 'events';

export interface AISuggestion { id: string; type: 'completion' | 'refactor' | 'fix' | 'optimize' | 'document'; title: string; description: string; code?: string; priority: number; }

export class SuggestionsPanel extends EventEmitter {
    private static instance: SuggestionsPanel;
    private suggestions: AISuggestion[] = [];
    private constructor() { super(); }
    static getInstance(): SuggestionsPanel { if (!SuggestionsPanel.instance) SuggestionsPanel.instance = new SuggestionsPanel(); return SuggestionsPanel.instance; }

    add(type: AISuggestion['type'], title: string, description: string, code?: string, priority = 5): AISuggestion {
        const suggestion: AISuggestion = { id: `sug_${Date.now()}_${this.suggestions.length}`, type, title, description, code, priority };
        this.suggestions.push(suggestion); this.emit('added', suggestion); return suggestion;
    }

    generate(context: string): AISuggestion[] {
        const suggestions: AISuggestion[] = [
            { id: `sug_${Date.now()}`, type: 'optimize', title: 'Optimize imports', description: 'Remove unused imports', priority: 8 },
            { id: `sug_${Date.now()}_1`, type: 'refactor', title: 'Extract function', description: 'Extract repeated code into function', priority: 6 }
        ];
        this.suggestions = suggestions; return suggestions;
    }

    accept(suggestionId: string): boolean { this.suggestions = this.suggestions.filter(s => s.id !== suggestionId); return true; }
    dismiss(suggestionId: string): boolean { this.suggestions = this.suggestions.filter(s => s.id !== suggestionId); return true; }
    getByType(type: AISuggestion['type']): AISuggestion[] { return this.suggestions.filter(s => s.type === type); }
    getAll(): AISuggestion[] { return this.suggestions.sort((a, b) => b.priority - a.priority); }
}
export function getSuggestionsPanel(): SuggestionsPanel { return SuggestionsPanel.getInstance(); }
