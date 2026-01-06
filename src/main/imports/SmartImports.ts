/**
 * Smart Imports
 * Auto-organize and optimize imports
 */

import { EventEmitter } from 'events';

export interface ImportStatement {
    source: string;
    specifiers: ImportSpecifier[];
    isDefault: boolean;
    isNamespace: boolean;
    line: number;
}

export interface ImportSpecifier {
    name: string;
    alias?: string;
}

export interface ImportOptimization {
    originalCount: number;
    optimizedCount: number;
    removed: string[];
    added: string[];
    reordered: boolean;
}

/**
 * SmartImports
 * Auto-organize, sort, and remove unused imports
 */
export class SmartImports extends EventEmitter {
    private static instance: SmartImports;
    private importOrder = ['builtin', 'external', 'internal', 'relative'];

    private constructor() {
        super();
    }

    static getInstance(): SmartImports {
        if (!SmartImports.instance) {
            SmartImports.instance = new SmartImports();
        }
        return SmartImports.instance;
    }

    /**
     * Parse imports from code
     */
    parseImports(code: string): ImportStatement[] {
        const imports: ImportStatement[] = [];
        const importRegex = /^import\s+(?:(?:(\{[^}]+\})|(\*\s+as\s+\w+)|(\w+))\s+from\s+)?['"]([^'"]+)['"]/gm;

        let match;
        let lineNum = 0;

        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('import ')) {
                const importMatch = line.match(/^import\s+(?:(\{[^}]+\})|(\*\s+as\s+\w+)|(\w+))?\s*,?\s*(?:(\{[^}]+\}))?\s*from\s+['"]([^'"]+)['"]/);

                if (importMatch) {
                    const specifiers: ImportSpecifier[] = [];
                    let isDefault = false;
                    let isNamespace = false;

                    // Named imports
                    if (importMatch[1] || importMatch[4]) {
                        const namedPart = importMatch[1] || importMatch[4];
                        const names = namedPart.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
                        for (const name of names) {
                            const parts = name.split(/\s+as\s+/);
                            specifiers.push({ name: parts[0], alias: parts[1] });
                        }
                    }

                    // Namespace import
                    if (importMatch[2]) {
                        isNamespace = true;
                        const name = importMatch[2].replace(/\*\s+as\s+/, '');
                        specifiers.push({ name });
                    }

                    // Default import
                    if (importMatch[3]) {
                        isDefault = true;
                        specifiers.push({ name: importMatch[3] });
                    }

                    imports.push({
                        source: importMatch[5],
                        specifiers,
                        isDefault,
                        isNamespace,
                        line: i,
                    });
                }
            }
        }

        return imports;
    }

    /**
     * Sort imports
     */
    sortImports(imports: ImportStatement[]): ImportStatement[] {
        return [...imports].sort((a, b) => {
            const orderA = this.getImportOrder(a.source);
            const orderB = this.getImportOrder(b.source);

            if (orderA !== orderB) return orderA - orderB;

            return a.source.localeCompare(b.source);
        });
    }

    /**
     * Get import order category
     */
    private getImportOrder(source: string): number {
        if (source.startsWith('.')) return 3; // relative
        if (source.startsWith('@/') || source.startsWith('~/')) return 2; // internal
        if (['fs', 'path', 'http', 'https', 'crypto', 'events', 'child_process'].includes(source)) return 0; // builtin
        return 1; // external
    }

    /**
     * Find unused imports
     */
    findUnused(code: string, imports: ImportStatement[]): ImportStatement[] {
        const codeWithoutImports = code.split('\n')
            .filter((_, i) => !imports.some(imp => imp.line === i))
            .join('\n');

        return imports.filter(imp => {
            for (const spec of imp.specifiers) {
                const name = spec.alias || spec.name;
                const regex = new RegExp(`\\b${name}\\b`);
                if (regex.test(codeWithoutImports)) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Optimize imports
     */
    optimize(code: string): { code: string; optimization: ImportOptimization } {
        const imports = this.parseImports(code);
        const unused = this.findUnused(code, imports);
        const usedImports = imports.filter(i => !unused.includes(i));
        const sorted = this.sortImports(usedImports);

        // Generate optimized import section
        const importLines = sorted.map(imp => this.generateImportLine(imp));

        // Find where imports end
        const lines = code.split('\n');
        let lastImportLine = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportLine = i;
            }
        }

        // Rebuild code
        const nonImportLines = lines.slice(lastImportLine + 1);
        const newCode = [...importLines, '', ...nonImportLines].join('\n');

        const optimization: ImportOptimization = {
            originalCount: imports.length,
            optimizedCount: sorted.length,
            removed: unused.map(i => i.source),
            added: [],
            reordered: true,
        };

        this.emit('optimized', optimization);

        return { code: newCode, optimization };
    }

    /**
     * Generate import line
     */
    private generateImportLine(imp: ImportStatement): string {
        if (imp.isNamespace) {
            return `import * as ${imp.specifiers[0].name} from '${imp.source}';`;
        }

        if (imp.isDefault && imp.specifiers.length === 1) {
            return `import ${imp.specifiers[0].name} from '${imp.source}';`;
        }

        const namedSpecs = imp.specifiers
            .filter(s => !imp.isDefault || s !== imp.specifiers[0])
            .map(s => s.alias ? `${s.name} as ${s.alias}` : s.name)
            .join(', ');

        if (imp.isDefault) {
            return `import ${imp.specifiers[0].name}, { ${namedSpecs} } from '${imp.source}';`;
        }

        return `import { ${namedSpecs} } from '${imp.source}';`;
    }

    /**
     * Add missing import
     */
    addImport(code: string, symbol: string, source: string): string {
        const imports = this.parseImports(code);

        // Check if import from this source already exists
        const existing = imports.find(i => i.source === source);

        if (existing) {
            // Add to existing import
            const line = code.split('\n')[existing.line];
            const newLine = line.replace(/}/, `, ${symbol} }`);
            const lines = code.split('\n');
            lines[existing.line] = newLine;
            return lines.join('\n');
        }

        // Add new import at the beginning
        return `import { ${symbol} } from '${source}';\n${code}`;
    }

    /**
     * Set import order
     */
    setImportOrder(order: string[]): void {
        this.importOrder = order;
    }
}

// Singleton getter
export function getSmartImports(): SmartImports {
    return SmartImports.getInstance();
}
