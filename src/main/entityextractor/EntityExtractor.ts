/**
 * Entity Extractor - Named entity recognition
 */
import { EventEmitter } from 'events';

export interface Entity { type: 'file' | 'function' | 'class' | 'variable' | 'url' | 'path' | 'language'; value: string; start: number; end: number; }

export class EntityExtractor extends EventEmitter {
    private static instance: EntityExtractor;
    private extractors: { type: Entity['type']; regex: RegExp }[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): EntityExtractor { if (!EntityExtractor.instance) EntityExtractor.instance = new EntityExtractor(); return EntityExtractor.instance; }

    private initDefaults(): void {
        this.extractors = [
            { type: 'file', regex: /[\w-]+\.(ts|js|tsx|jsx|py|go|rs|java|cpp|c|h|css|html|json|md|yaml|yml)/gi },
            { type: 'function', regex: /\b([a-z][a-zA-Z0-9]+)\s*\(/g },
            { type: 'class', regex: /\b([A-Z][a-zA-Z0-9]+)\b/g },
            { type: 'url', regex: /https?:\/\/[^\s]+/gi },
            { type: 'path', regex: /(?:\/[\w.-]+)+/g },
            { type: 'language', regex: /\b(typescript|javascript|python|rust|go|java|cpp|c\+\+)\b/gi }
        ];
    }

    extract(text: string): Entity[] {
        const entities: Entity[] = [];
        this.extractors.forEach(e => { let match; while ((match = e.regex.exec(text)) !== null) { entities.push({ type: e.type, value: match[0], start: match.index, end: match.index + match[0].length }); } e.regex.lastIndex = 0; });
        this.emit('extracted', entities); return entities;
    }

    addExtractor(type: Entity['type'], regex: RegExp): void { this.extractors.push({ type, regex }); }
}
export function getEntityExtractor(): EntityExtractor { return EntityExtractor.getInstance(); }
