/**
 * Context-Aware Code Completion
 * 
 * Provides intelligent code completions based on context,
 * patterns, and learned user preferences.
 */

import { EventEmitter } from 'events';
import { userPreferenceLearning } from '../preferences/UserPreferenceLearning';
import { crossProjectKnowledgeBase } from '../knowledge/CrossProjectKnowledgeBase';

// ============================================================================
// TYPES
// ============================================================================

interface CompletionItem {
    label: string;
    kind: 'function' | 'variable' | 'class' | 'interface' | 'snippet' | 'keyword' | 'import';
    detail: string;
    insertText: string;
    documentation?: string;
    sortOrder: number;
    source: 'context' | 'pattern' | 'knowledge' | 'common';
}

interface CompletionContext {
    fileContent: string;
    cursorPosition: number;
    currentLine: string;
    previousLines: string[];
    fileType: string;
    imports: string[];
    variables: string[];
    functions: string[];
}

interface CompletionPattern {
    trigger: RegExp;
    generate: (context: CompletionContext, match: RegExpMatchArray) => CompletionItem[];
}

// ============================================================================
// CONTEXT-AWARE CODE COMPLETION
// ============================================================================

export class ContextAwareCompletion extends EventEmitter {
    private static instance: ContextAwareCompletion;
    private patterns: CompletionPattern[] = [];
    private commonSnippets: Map<string, CompletionItem[]> = new Map();

    private constructor() {
        super();
        this.initializePatterns();
        this.initializeSnippets();
    }

    static getInstance(): ContextAwareCompletion {
        if (!ContextAwareCompletion.instance) {
            ContextAwareCompletion.instance = new ContextAwareCompletion();
        }
        return ContextAwareCompletion.instance;
    }

    // ========================================================================
    // PATTERNS INITIALIZATION
    // ========================================================================

    private initializePatterns(): void {
        // Import completion
        this.patterns.push({
            trigger: /import\s+{\s*$/,
            generate: (ctx) => this.suggestExports(ctx),
        });

        this.patterns.push({
            trigger: /import\s+.*\s+from\s+['"]$/,
            generate: (ctx) => this.suggestModules(ctx),
        });

        // React hooks
        this.patterns.push({
            trigger: /use[A-Z]?$/,
            generate: () => this.getReactHooks(),
        });

        // Console methods
        this.patterns.push({
            trigger: /console\.$/,
            generate: () => this.getConsoleMethods(),
        });

        // Array methods
        this.patterns.push({
            trigger: /\.\s*$/,
            generate: (ctx) => this.getArrayMethods(ctx),
        });

        // Async/Await patterns
        this.patterns.push({
            trigger: /async\s+function\s+\w*$/,
            generate: () => this.getAsyncPatterns(),
        });

        // Error handling
        this.patterns.push({
            trigger: /try\s*{?$/,
            generate: () => this.getTryCatchPatterns(),
        });

        // TypeScript types
        this.patterns.push({
            trigger: /:\s*$/,
            generate: (ctx) => this.getTypeCompletions(ctx),
        });

        // Object destructuring
        this.patterns.push({
            trigger: /const\s+{\s*$/,
            generate: (ctx) => this.getDestructuringCompletions(ctx),
        });
    }

    private initializeSnippets(): void {
        // React component snippets
        this.commonSnippets.set('react', [
            {
                label: 'rfc',
                kind: 'snippet',
                detail: 'React Functional Component',
                insertText: `export function \${1:ComponentName}() {\n    return (\n        <div>\n            \${2:content}\n        </div>\n    );\n}`,
                documentation: 'Creates a React functional component',
                sortOrder: 1,
                source: 'common',
            },
            {
                label: 'useS',
                kind: 'snippet',
                detail: 'useState Hook',
                insertText: `const [\${1:state}, set\${1/(.*)/$\{1:/capitalize\}/}] = useState(\${2:initialValue});`,
                documentation: 'Creates a useState hook',
                sortOrder: 2,
                source: 'common',
            },
            {
                label: 'useE',
                kind: 'snippet',
                detail: 'useEffect Hook',
                insertText: `useEffect(() => {\n    \${1:// effect}\n    return () => {\n        \${2:// cleanup}\n    };\n}, [\${3:dependencies}]);`,
                documentation: 'Creates a useEffect hook with cleanup',
                sortOrder: 3,
                source: 'common',
            },
        ]);

        // Express snippets
        this.commonSnippets.set('express', [
            {
                label: 'route',
                kind: 'snippet',
                detail: 'Express Route Handler',
                insertText: `app.\${1:get}('\${2:/path}', async (req, res) => {\n    try {\n        \${3:// handler}\n        res.json({ success: true });\n    } catch (error) {\n        res.status(500).json({ error: error.message });\n    }\n});`,
                sortOrder: 1,
                source: 'common',
            },
            {
                label: 'middleware',
                kind: 'snippet',
                detail: 'Express Middleware',
                insertText: `const \${1:middlewareName} = (req, res, next) => {\n    \${2:// middleware logic}\n    next();\n};`,
                sortOrder: 2,
                source: 'common',
            },
        ]);

        // TypeScript snippets
        this.commonSnippets.set('typescript', [
            {
                label: 'interface',
                kind: 'snippet',
                detail: 'TypeScript Interface',
                insertText: `interface \${1:Name} {\n    \${2:property}: \${3:type};\n}`,
                sortOrder: 1,
                source: 'common',
            },
            {
                label: 'type',
                kind: 'snippet',
                detail: 'TypeScript Type Alias',
                insertText: `type \${1:Name} = \${2:type};`,
                sortOrder: 2,
                source: 'common',
            },
            {
                label: 'enum',
                kind: 'snippet',
                detail: 'TypeScript Enum',
                insertText: `enum \${1:Name} {\n    \${2:Value} = '\${2:value}',\n}`,
                sortOrder: 3,
                source: 'common',
            },
        ]);
    }

    // ========================================================================
    // COMPLETION GENERATION
    // ========================================================================

    async getCompletions(context: CompletionContext): Promise<CompletionItem[]> {
        const completions: CompletionItem[] = [];

        // Check patterns
        for (const pattern of this.patterns) {
            const match = context.currentLine.match(pattern.trigger);
            if (match) {
                const items = pattern.generate(context, match);
                completions.push(...items);
            }
        }

        // Add context-based completions
        completions.push(...this.getContextCompletions(context));

        // Add knowledge-based completions
        completions.push(...await this.getKnowledgeCompletions(context));

        // Add common snippets based on file type
        const snippets = this.commonSnippets.get(context.fileType) || [];
        completions.push(...snippets);

        // Sort by priority
        return completions.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    private getContextCompletions(context: CompletionContext): CompletionItem[] {
        const items: CompletionItem[] = [];

        // Suggest variables in scope
        context.variables.forEach((v, i) => {
            items.push({
                label: v,
                kind: 'variable',
                detail: 'Local variable',
                insertText: v,
                sortOrder: 10 + i,
                source: 'context',
            });
        });

        // Suggest functions in scope
        context.functions.forEach((f, i) => {
            items.push({
                label: f,
                kind: 'function',
                detail: 'Local function',
                insertText: `${f}()`,
                sortOrder: 20 + i,
                source: 'context',
            });
        });

        return items;
    }

    private async getKnowledgeCompletions(context: CompletionContext): Promise<CompletionItem[]> {
        const items: CompletionItem[] = [];

        // Search knowledge base for relevant snippets
        const similar = crossProjectKnowledgeBase.findSimilar(context.currentLine);

        similar.forEach((entry, i) => {
            if (entry.type === 'snippet') {
                items.push({
                    label: entry.title,
                    kind: 'snippet',
                    detail: 'From knowledge base',
                    insertText: entry.content,
                    documentation: entry.description,
                    sortOrder: 100 + i,
                    source: 'knowledge',
                });
            }
        });

        return items;
    }

    // ========================================================================
    // PATTERN GENERATORS
    // ========================================================================

    private suggestExports(ctx: CompletionContext): CompletionItem[] {
        // Parse imports to find what's available
        const exports = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'];
        return exports.map((e, i) => ({
            label: e,
            kind: 'function' as const,
            detail: 'Named export',
            insertText: e,
            sortOrder: i,
            source: 'common' as const,
        }));
    }

    private suggestModules(ctx: CompletionContext): CompletionItem[] {
        const modules = [
            { label: 'react', detail: 'React library' },
            { label: 'lodash', detail: 'Utility library' },
            { label: 'axios', detail: 'HTTP client' },
            { label: 'express', detail: 'Web framework' },
            { label: '@prisma/client', detail: 'Database ORM' },
        ];

        return modules.map((m, i) => ({
            ...m,
            kind: 'import' as const,
            insertText: m.label,
            sortOrder: i,
            source: 'common' as const,
        }));
    }

    private getReactHooks(): CompletionItem[] {
        const hooks = [
            { label: 'useState', detail: 'State hook', insert: 'useState(${1:initialValue})' },
            { label: 'useEffect', detail: 'Effect hook', insert: 'useEffect(() => {\n    ${1:}\n}, [${2:}])' },
            { label: 'useCallback', detail: 'Memoized callback', insert: 'useCallback(() => {\n    ${1:}\n}, [${2:}])' },
            { label: 'useMemo', detail: 'Memoized value', insert: 'useMemo(() => ${1:value}, [${2:}])' },
            { label: 'useRef', detail: 'Ref hook', insert: 'useRef(${1:null})' },
            { label: 'useContext', detail: 'Context hook', insert: 'useContext(${1:Context})' },
            { label: 'useReducer', detail: 'Reducer hook', insert: 'useReducer(${1:reducer}, ${2:initialState})' },
        ];

        return hooks.map((h, i) => ({
            label: h.label,
            kind: 'function' as const,
            detail: h.detail,
            insertText: h.insert,
            sortOrder: i,
            source: 'pattern' as const,
        }));
    }

    private getConsoleMethods(): CompletionItem[] {
        const methods = ['log', 'error', 'warn', 'info', 'debug', 'table', 'trace', 'time', 'timeEnd'];
        return methods.map((m, i) => ({
            label: m,
            kind: 'function' as const,
            detail: `console.${m}()`,
            insertText: `${m}(\${1:})`,
            sortOrder: i,
            source: 'common' as const,
        }));
    }

    private getArrayMethods(ctx: CompletionContext): CompletionItem[] {
        const methods = [
            { label: 'map', insert: 'map((item) => ${1:item})' },
            { label: 'filter', insert: 'filter((item) => ${1:condition})' },
            { label: 'reduce', insert: 'reduce((acc, item) => ${1:acc}, ${2:initial})' },
            { label: 'find', insert: 'find((item) => ${1:condition})' },
            { label: 'forEach', insert: 'forEach((item) => {\n    ${1:}\n})' },
            { label: 'some', insert: 'some((item) => ${1:condition})' },
            { label: 'every', insert: 'every((item) => ${1:condition})' },
            { label: 'includes', insert: 'includes(${1:value})' },
            { label: 'sort', insert: 'sort((a, b) => ${1:a - b})' },
        ];

        return methods.map((m, i) => ({
            label: m.label,
            kind: 'function' as const,
            detail: `Array.${m.label}()`,
            insertText: m.insert,
            sortOrder: i,
            source: 'pattern' as const,
        }));
    }

    private getAsyncPatterns(): CompletionItem[] {
        return [{
            label: 'async-function',
            kind: 'snippet',
            detail: 'Async function with error handling',
            insertText: `async function \${1:name}(\${2:params}) {\n    try {\n        \${3:// implementation}\n    } catch (error) {\n        console.error('Error:', error);\n        throw error;\n    }\n}`,
            sortOrder: 0,
            source: 'pattern',
        }];
    }

    private getTryCatchPatterns(): CompletionItem[] {
        return [{
            label: 'try-catch',
            kind: 'snippet',
            detail: 'Try-Catch block',
            insertText: `try {\n    \${1:// code}\n} catch (error) {\n    console.error('Error:', error);\n    \${2:// handle error}\n}`,
            sortOrder: 0,
            source: 'pattern',
        }];
    }

    private getTypeCompletions(ctx: CompletionContext): CompletionItem[] {
        const types = [
            'string', 'number', 'boolean', 'null', 'undefined',
            'object', 'Array', 'Promise', 'void', 'never', 'unknown', 'any'
        ];

        return types.map((t, i) => ({
            label: t,
            kind: 'keyword' as const,
            detail: 'TypeScript type',
            insertText: t,
            sortOrder: i,
            source: 'common' as const,
        }));
    }

    private getDestructuringCompletions(ctx: CompletionContext): CompletionItem[] {
        // Suggest common destructuring patterns
        return [{
            label: 'props-destructure',
            kind: 'snippet',
            detail: 'Destructure props',
            insertText: `\${1:prop1}, \${2:prop2}`,
            sortOrder: 0,
            source: 'pattern',
        }];
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    parseContext(fileContent: string, cursorPosition: number, fileType: string): CompletionContext {
        const lines = fileContent.split('\n');
        let currentLineIndex = 0;
        let charCount = 0;

        for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for newline
            if (charCount > cursorPosition) {
                currentLineIndex = i;
                break;
            }
        }

        const currentLine = lines[currentLineIndex] || '';
        const previousLines = lines.slice(Math.max(0, currentLineIndex - 10), currentLineIndex);

        // Extract imports
        const imports = fileContent.match(/import\s+.*\s+from\s+['"][^'"]+['"]/g) || [];

        // Extract variables
        const variables = (fileContent.match(/(?:const|let|var)\s+(\w+)/g) || [])
            .map(m => m.split(/\s+/)[1]);

        // Extract functions
        const functions = (fileContent.match(/(?:function|const)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|[\(<])/g) || [])
            .map(m => m.match(/(\w+)/)?.[1] || '')
            .filter(Boolean);

        return {
            fileContent,
            cursorPosition,
            currentLine,
            previousLines,
            fileType,
            imports,
            variables,
            functions,
        };
    }
}

export const contextAwareCompletion = ContextAwareCompletion.getInstance();
