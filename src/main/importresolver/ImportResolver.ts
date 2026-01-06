/**
 * Import Resolver - Auto-import
 */
import { EventEmitter } from 'events';

export interface ImportSuggestion { symbol: string; from: string; isDefault: boolean; isType: boolean; }

export class ImportResolver extends EventEmitter {
    private static instance: ImportResolver;
    private imports: Map<string, { from: string; isDefault: boolean }> = new Map();
    private constructor() { super(); this.initCommon(); }
    static getInstance(): ImportResolver { if (!ImportResolver.instance) ImportResolver.instance = new ImportResolver(); return ImportResolver.instance; }

    private initCommon(): void {
        const common = [
            { symbol: 'useState', from: 'react', isDefault: false },
            { symbol: 'useEffect', from: 'react', isDefault: false },
            { symbol: 'React', from: 'react', isDefault: true },
            { symbol: 'EventEmitter', from: 'events', isDefault: false }
        ];
        common.forEach(i => this.imports.set(i.symbol, { from: i.from, isDefault: i.isDefault }));
    }

    register(symbol: string, from: string, isDefault = false): void { this.imports.set(symbol, { from, isDefault }); }
    resolve(symbol: string): ImportSuggestion | null { const i = this.imports.get(symbol); if (!i) return null; return { symbol, from: i.from, isDefault: i.isDefault, isType: false }; }
    generateStatement(suggestion: ImportSuggestion): string { return suggestion.isDefault ? `import ${suggestion.symbol} from '${suggestion.from}';` : `import { ${suggestion.symbol} } from '${suggestion.from}';`; }
    getMissing(code: string): string[] { const used = code.match(/\b[A-Z]\w+\b/g) || []; return used.filter(s => !code.includes(`import`) || !code.includes(s)); }
}
export function getImportResolver(): ImportResolver { return ImportResolver.getInstance(); }
