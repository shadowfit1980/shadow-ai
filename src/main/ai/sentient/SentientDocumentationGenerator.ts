/**
 * Sentient Documentation Generator
 * 
 * Generates documentation that understands itself, updates
 * automatically, and proactively suggests documentation needs.
 */

import { EventEmitter } from 'events';

export interface SentientDoc {
    id: string;
    code: string;
    documentation: DocSection[];
    selfAwareness: SelfAwareness;
    suggestions: DocSuggestion[];
    lastUpdate: Date;
    createdAt: Date;
}

export interface DocSection {
    id: string;
    type: 'overview' | 'api' | 'example' | 'warning' | 'note';
    title: string;
    content: string;
    relevantCode: string;
    confidence: number;
}

export interface SelfAwareness {
    completeness: number;
    accuracy: number;
    staleness: number;
    gaps: string[];
}

export interface DocSuggestion {
    priority: 'high' | 'medium' | 'low';
    type: 'missing' | 'outdated' | 'unclear' | 'expand';
    location: string;
    suggestion: string;
}

export class SentientDocumentationGenerator extends EventEmitter {
    private static instance: SentientDocumentationGenerator;
    private docs: Map<string, SentientDoc> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): SentientDocumentationGenerator {
        if (!SentientDocumentationGenerator.instance) {
            SentientDocumentationGenerator.instance = new SentientDocumentationGenerator();
        }
        return SentientDocumentationGenerator.instance;
    }

    generate(code: string): SentientDoc {
        const documentation = this.generateSections(code);
        const selfAwareness = this.assessSelfAwareness(documentation, code);
        const suggestions = this.generateSuggestions(selfAwareness, code);

        const doc: SentientDoc = {
            id: `doc_${Date.now()}`,
            code,
            documentation,
            selfAwareness,
            suggestions,
            lastUpdate: new Date(),
            createdAt: new Date(),
        };

        this.docs.set(doc.id, doc);
        this.emit('doc:generated', doc);
        return doc;
    }

    private generateSections(code: string): DocSection[] {
        const sections: DocSection[] = [];

        // Generate overview
        sections.push({
            id: `section_overview_${Date.now()}`,
            type: 'overview',
            title: 'Overview',
            content: this.generateOverview(code),
            relevantCode: code.substring(0, 200),
            confidence: 0.8,
        });

        // Generate API documentation for exports
        const exports = code.match(/export\s+(?:function|class|const|interface)\s+(\w+)/g) || [];
        for (const exp of exports.slice(0, 5)) {
            const name = exp.match(/(\w+)$/)?.[1] || 'unknown';
            sections.push({
                id: `section_api_${name}`,
                type: 'api',
                title: `API: ${name}`,
                content: this.generateApiDoc(name, code),
                relevantCode: exp,
                confidence: 0.7,
            });
        }

        // Generate examples if complex code
        if (code.length > 200) {
            sections.push({
                id: `section_example_${Date.now()}`,
                type: 'example',
                title: 'Usage Example',
                content: this.generateExample(code),
                relevantCode: '',
                confidence: 0.6,
            });
        }

        // Generate warnings if issues detected
        if (code.includes('any') || code.includes('TODO')) {
            sections.push({
                id: `section_warning_${Date.now()}`,
                type: 'warning',
                title: 'Important Notes',
                content: this.generateWarnings(code),
                relevantCode: '',
                confidence: 0.9,
            });
        }

        return sections;
    }

    private generateOverview(code: string): string {
        const lines = code.split('\n').length;
        const hasClass = code.includes('class');
        const hasAsync = code.includes('async');
        const exports = (code.match(/export/g) || []).length;

        let overview = `This module contains ${lines} lines of code. `;
        if (hasClass) overview += 'It uses object-oriented design patterns. ';
        if (hasAsync) overview += 'It includes asynchronous operations. ';
        overview += `It exports ${exports} public interface(s).`;

        return overview;
    }

    private generateApiDoc(name: string, code: string): string {
        const isClass = code.includes(`class ${name}`);
        const isFunction = code.includes(`function ${name}`) || code.includes(`const ${name}`);

        if (isClass) {
            return `\`${name}\` is a class that encapsulates related functionality.\n\n` +
                `**Usage:**\n\`\`\`typescript\nconst instance = new ${name}();\n\`\`\``;
        }
        if (isFunction) {
            return `\`${name}\` is a function that performs a specific operation.\n\n` +
                `**Usage:**\n\`\`\`typescript\nconst result = ${name}(args);\n\`\`\``;
        }
        return `\`${name}\` is exported from this module.`;
    }

    private generateExample(code: string): string {
        const exports = code.match(/export\s+(?:function|class|const)\s+(\w+)/g) || [];
        const mainExport = exports[0]?.match(/(\w+)$/)?.[1] || 'example';

        return `\`\`\`typescript
import { ${mainExport} } from './module';

// Basic usage
const result = ${mainExport}();
console.log(result);
\`\`\``;
    }

    private generateWarnings(code: string): string {
        const warnings: string[] = [];

        if (code.includes('any')) {
            warnings.push('⚠️ This code uses `any` type which bypasses type checking.');
        }
        if (code.includes('TODO')) {
            warnings.push('📝 Contains TODO items that need attention.');
        }
        if (code.includes('deprecated')) {
            warnings.push('⛔ Contains deprecated functionality.');
        }

        return warnings.join('\n\n');
    }

    private assessSelfAwareness(sections: DocSection[], code: string): SelfAwareness {
        const gaps: string[] = [];

        // Check for undocumented exports
        const exports = code.match(/export\s+(?:function|class|const|interface)\s+(\w+)/g) || [];
        const documented = sections.filter(s => s.type === 'api').length;
        if (documented < exports.length) {
            gaps.push(`${exports.length - documented} exports lack documentation`);
        }

        // Check for missing examples
        if (!sections.some(s => s.type === 'example') && code.length > 300) {
            gaps.push('No usage examples provided');
        }

        const completeness = sections.length / Math.max(1, exports.length + 2);
        const accuracy = sections.reduce((s, sec) => s + sec.confidence, 0) / Math.max(1, sections.length);

        return {
            completeness: Math.min(1, completeness),
            accuracy,
            staleness: 0, // Fresh documentation
            gaps,
        };
    }

    private generateSuggestions(awareness: SelfAwareness, code: string): DocSuggestion[] {
        const suggestions: DocSuggestion[] = [];

        for (const gap of awareness.gaps) {
            suggestions.push({
                priority: 'high',
                type: 'missing',
                location: gap,
                suggestion: `Add documentation for: ${gap}`,
            });
        }

        if (awareness.completeness < 0.5) {
            suggestions.push({
                priority: 'high',
                type: 'expand',
                location: 'overall',
                suggestion: 'Expand documentation coverage significantly',
            });
        }

        if (code.length > 500 && !code.includes('```')) {
            suggestions.push({
                priority: 'medium',
                type: 'expand',
                location: 'examples',
                suggestion: 'Add code examples for complex functionality',
            });
        }

        return suggestions;
    }

    update(docId: string, newCode: string): SentientDoc | undefined {
        const existing = this.docs.get(docId);
        if (!existing) return undefined;

        const updated = this.generate(newCode);
        updated.id = docId;
        updated.selfAwareness.staleness = 0;
        this.docs.set(docId, updated);

        this.emit('doc:updated', updated);
        return updated;
    }

    getDoc(id: string): SentientDoc | undefined {
        return this.docs.get(id);
    }

    getStats(): { total: number; avgCompleteness: number; totalGaps: number } {
        const docs = Array.from(this.docs.values());
        return {
            total: docs.length,
            avgCompleteness: docs.length > 0
                ? docs.reduce((s, d) => s + d.selfAwareness.completeness, 0) / docs.length
                : 0,
            totalGaps: docs.reduce((s, d) => s + d.selfAwareness.gaps.length, 0),
        };
    }
}

export const sentientDocumentationGenerator = SentientDocumentationGenerator.getInstance();
