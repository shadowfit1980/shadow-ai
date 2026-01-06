/**
 * Code Snippets Library - Advanced snippets
 */
import { EventEmitter } from 'events';

export interface CodeSnippet { id: string; name: string; language: string; code: string; description?: string; tags: string[]; usage: number; createdAt: number; }

export class CodeSnippetsLibrary extends EventEmitter {
    private static instance: CodeSnippetsLibrary;
    private snippets: Map<string, CodeSnippet> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): CodeSnippetsLibrary { if (!CodeSnippetsLibrary.instance) CodeSnippetsLibrary.instance = new CodeSnippetsLibrary(); return CodeSnippetsLibrary.instance; }

    private initDefaults(): void {
        this.add('react-component', 'typescript', 'export const ${1:Component} = () => {\n  return <div>${2:content}</div>;\n};', ['react', 'component']);
        this.add('async-function', 'typescript', 'async function ${1:name}(${2:params}): Promise<${3:void}> {\n  ${4:body}\n}', ['async', 'function']);
        this.add('try-catch', 'typescript', 'try {\n  ${1:code}\n} catch (error) {\n  console.error(error);\n}', ['error', 'handling']);
    }

    add(name: string, language: string, code: string, tags: string[] = [], description?: string): CodeSnippet {
        const snippet: CodeSnippet = { id: `snp_${Date.now()}`, name, language, code, description, tags, usage: 0, createdAt: Date.now() };
        this.snippets.set(snippet.id, snippet);
        return snippet;
    }

    use(id: string): CodeSnippet | null { const s = this.snippets.get(id); if (s) { s.usage++; this.emit('used', s); } return s || null; }
    search(query: string): CodeSnippet[] { const q = query.toLowerCase(); return Array.from(this.snippets.values()).filter(s => s.name.includes(q) || s.tags.some(t => t.includes(q))); }
    getPopular(limit = 10): CodeSnippet[] { return [...this.snippets.values()].sort((a, b) => b.usage - a.usage).slice(0, limit); }
    getAll(): CodeSnippet[] { return Array.from(this.snippets.values()); }
}

export function getCodeSnippetsLibrary(): CodeSnippetsLibrary { return CodeSnippetsLibrary.getInstance(); }
