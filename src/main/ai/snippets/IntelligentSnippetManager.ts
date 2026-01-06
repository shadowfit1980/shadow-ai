/**
 * Intelligent Code Snippets Manager
 * 
 * Manages reusable code snippets with intelligent suggestions,
 * auto-completion, and context-aware recommendations.
 */

import { EventEmitter } from 'events';

export interface CodeSnippet {
    id: string;
    name: string;
    prefix: string;
    body: string[];
    description: string;
    language: string;
    category: string;
    tags: string[];
    variables: SnippetVariable[];
    usageCount: number;
    lastUsed?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface SnippetVariable {
    name: string;
    placeholder: string;
    defaultValue?: string;
    choices?: string[];
}

export interface SnippetMatch {
    snippet: CodeSnippet;
    score: number;
    matchType: 'prefix' | 'name' | 'tag' | 'content';
}

export interface SnippetStats {
    totalSnippets: number;
    totalUsage: number;
    byLanguage: Record<string, number>;
    byCategory: Record<string, number>;
    topUsed: CodeSnippet[];
}

// Built-in snippets
const BUILTIN_SNIPPETS: Omit<CodeSnippet, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'React Functional Component',
        prefix: 'rfc',
        body: [
            "import React from 'react';",
            '',
            'interface ${1:ComponentName}Props {',
            '  ${2:// props}',
            '}',
            '',
            'export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ ${3:props} }) => {',
            '  return (',
            '    <div>',
            '      ${0:content}',
            '    </div>',
            '  );',
            '};',
        ],
        description: 'React functional component with TypeScript props',
        language: 'typescriptreact',
        category: 'React',
        tags: ['react', 'component', 'functional', 'typescript'],
        variables: [
            { name: 'ComponentName', placeholder: 'Component name' },
            { name: 'props', placeholder: 'Props' },
        ],
    },
    {
        name: 'React useState',
        prefix: 'rus',
        body: ['const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState<${2:type}>(${3:initial});'],
        description: 'React useState hook with TypeScript',
        language: 'typescriptreact',
        category: 'React Hooks',
        tags: ['react', 'hooks', 'useState'],
        variables: [{ name: 'state', placeholder: 'State name' }],
    },
    {
        name: 'React useEffect',
        prefix: 'rue',
        body: [
            'useEffect(() => {',
            '  ${1:effect}',
            '  return () => {',
            '    ${2:cleanup}',
            '  };',
            '}, [${3:deps}]);',
        ],
        description: 'React useEffect hook',
        language: 'typescriptreact',
        category: 'React Hooks',
        tags: ['react', 'hooks', 'useEffect'],
        variables: [],
    },
    {
        name: 'TypeScript Interface',
        prefix: 'tsi',
        body: [
            'interface ${1:InterfaceName} {',
            '  ${2:property}: ${3:type};',
            '}',
        ],
        description: 'TypeScript interface',
        language: 'typescript',
        category: 'TypeScript',
        tags: ['typescript', 'interface'],
        variables: [{ name: 'InterfaceName', placeholder: 'Interface name' }],
    },
    {
        name: 'Async Function',
        prefix: 'afn',
        body: [
            'async function ${1:functionName}(${2:params}): Promise<${3:ReturnType}> {',
            '  try {',
            '    ${0:body}',
            '  } catch (error) {',
            '    console.error(error);',
            '    throw error;',
            '  }',
            '}',
        ],
        description: 'Async function with error handling',
        language: 'typescript',
        category: 'Functions',
        tags: ['async', 'function', 'error-handling'],
        variables: [{ name: 'functionName', placeholder: 'Function name' }],
    },
    {
        name: 'Try-Catch Block',
        prefix: 'tc',
        body: [
            'try {',
            '  ${1:code}',
            '} catch (error) {',
            '  console.error(error);',
            '}',
        ],
        description: 'Try-catch error handling block',
        language: 'typescript',
        category: 'Error Handling',
        tags: ['try', 'catch', 'error'],
        variables: [],
    },
    {
        name: 'Console Log',
        prefix: 'cl',
        body: ["console.log('${1:label}:', ${2:value});"],
        description: 'Console log with label',
        language: 'typescript',
        category: 'Debugging',
        tags: ['console', 'log', 'debug'],
        variables: [],
    },
    {
        name: 'Express Route',
        prefix: 'exr',
        body: [
            "app.${1|get,post,put,delete,patch|}('${2:/path}', async (req, res) => {",
            '  try {',
            '    ${0:handler}',
            '    res.json({ success: true });',
            '  } catch (error) {',
            '    res.status(500).json({ error: error.message });',
            '  }',
            '});',
        ],
        description: 'Express route with error handling',
        language: 'typescript',
        category: 'Express',
        tags: ['express', 'route', 'api'],
        variables: [{ name: 'method', placeholder: 'HTTP method', choices: ['get', 'post', 'put', 'delete'] }],
    },
    {
        name: 'Jest Test',
        prefix: 'jtest',
        body: [
            "describe('${1:description}', () => {",
            "  it('${2:should}', () => {",
            '    ${0:assertions}',
            '  });',
            '});',
        ],
        description: 'Jest test suite with test case',
        language: 'typescript',
        category: 'Testing',
        tags: ['jest', 'test', 'describe'],
        variables: [],
    },
];

export class IntelligentSnippetManager extends EventEmitter {
    private static instance: IntelligentSnippetManager;
    private snippets: Map<string, CodeSnippet> = new Map();
    private prefixIndex: Map<string, string[]> = new Map(); // prefix -> snippet ids
    private tagIndex: Map<string, string[]> = new Map(); // tag -> snippet ids

    private constructor() {
        super();
        this.loadBuiltinSnippets();
    }

    static getInstance(): IntelligentSnippetManager {
        if (!IntelligentSnippetManager.instance) {
            IntelligentSnippetManager.instance = new IntelligentSnippetManager();
        }
        return IntelligentSnippetManager.instance;
    }

    private loadBuiltinSnippets(): void {
        for (const snippet of BUILTIN_SNIPPETS) {
            this.addSnippet(snippet);
        }
    }

    // ========================================================================
    // SNIPPET MANAGEMENT
    // ========================================================================

    addSnippet(data: Omit<CodeSnippet, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): CodeSnippet {
        const snippet: CodeSnippet = {
            ...data,
            id: `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.snippets.set(snippet.id, snippet);
        this.indexSnippet(snippet);
        this.emit('snippet:added', snippet);
        return snippet;
    }

    updateSnippet(id: string, updates: Partial<Omit<CodeSnippet, 'id' | 'createdAt'>>): CodeSnippet | undefined {
        const snippet = this.snippets.get(id);
        if (!snippet) return undefined;

        // Remove from old indexes
        this.unindexSnippet(snippet);

        // Apply updates
        Object.assign(snippet, updates, { updatedAt: new Date() });

        // Re-index
        this.indexSnippet(snippet);

        this.emit('snippet:updated', snippet);
        return snippet;
    }

    deleteSnippet(id: string): boolean {
        const snippet = this.snippets.get(id);
        if (!snippet) return false;

        this.unindexSnippet(snippet);
        this.snippets.delete(id);
        this.emit('snippet:deleted', id);
        return true;
    }

    private indexSnippet(snippet: CodeSnippet): void {
        // Index by prefix
        const prefix = snippet.prefix.toLowerCase();
        if (!this.prefixIndex.has(prefix)) {
            this.prefixIndex.set(prefix, []);
        }
        this.prefixIndex.get(prefix)!.push(snippet.id);

        // Index by tags
        for (const tag of snippet.tags) {
            const tagLower = tag.toLowerCase();
            if (!this.tagIndex.has(tagLower)) {
                this.tagIndex.set(tagLower, []);
            }
            this.tagIndex.get(tagLower)!.push(snippet.id);
        }
    }

    private unindexSnippet(snippet: CodeSnippet): void {
        // Remove from prefix index
        const prefixIds = this.prefixIndex.get(snippet.prefix.toLowerCase());
        if (prefixIds) {
            const idx = prefixIds.indexOf(snippet.id);
            if (idx > -1) prefixIds.splice(idx, 1);
        }

        // Remove from tag index
        for (const tag of snippet.tags) {
            const tagIds = this.tagIndex.get(tag.toLowerCase());
            if (tagIds) {
                const idx = tagIds.indexOf(snippet.id);
                if (idx > -1) tagIds.splice(idx, 1);
            }
        }
    }

    // ========================================================================
    // SEARCH & SUGGESTIONS
    // ========================================================================

    findByPrefix(prefix: string): SnippetMatch[] {
        const matches: SnippetMatch[] = [];
        const prefixLower = prefix.toLowerCase();

        // Exact prefix match
        const exactIds = this.prefixIndex.get(prefixLower) || [];
        for (const id of exactIds) {
            const snippet = this.snippets.get(id);
            if (snippet) {
                matches.push({ snippet, score: 100, matchType: 'prefix' });
            }
        }

        // Partial prefix match
        for (const [key, ids] of this.prefixIndex) {
            if (key !== prefixLower && key.startsWith(prefixLower)) {
                for (const id of ids) {
                    const snippet = this.snippets.get(id);
                    if (snippet && !matches.some(m => m.snippet.id === id)) {
                        matches.push({ snippet, score: 80, matchType: 'prefix' });
                    }
                }
            }
        }

        return matches.sort((a, b) => b.score - a.score);
    }

    search(query: string, language?: string): SnippetMatch[] {
        const matches: SnippetMatch[] = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);

        for (const snippet of this.snippets.values()) {
            // Filter by language if specified
            if (language && snippet.language !== language && snippet.language !== 'typescript') continue;

            let score = 0;
            let matchType: SnippetMatch['matchType'] = 'content';

            // Prefix match
            if (snippet.prefix.toLowerCase().includes(queryLower)) {
                score += 80;
                matchType = 'prefix';
            }

            // Name match
            if (snippet.name.toLowerCase().includes(queryLower)) {
                score += 60;
                if (matchType === 'content') matchType = 'name';
            }

            // Tag match
            for (const word of queryWords) {
                if (snippet.tags.some(t => t.toLowerCase().includes(word))) {
                    score += 40;
                    if (matchType === 'content') matchType = 'tag';
                }
            }

            // Description match
            if (snippet.description.toLowerCase().includes(queryLower)) {
                score += 20;
            }

            // Body content match
            const body = snippet.body.join('\n').toLowerCase();
            for (const word of queryWords) {
                if (body.includes(word)) {
                    score += 10;
                }
            }

            // Usage boost
            score += Math.min(20, snippet.usageCount * 2);

            if (score > 0) {
                matches.push({ snippet, score, matchType });
            }
        }

        return matches.sort((a, b) => b.score - a.score);
    }

    getSuggestions(context: { language: string; prefix?: string; currentLine?: string }): SnippetMatch[] {
        if (context.prefix) {
            return this.findByPrefix(context.prefix);
        }

        // Context-aware suggestions based on current line
        const suggestions: SnippetMatch[] = [];
        const line = (context.currentLine || '').toLowerCase();

        for (const snippet of this.snippets.values()) {
            if (snippet.language !== context.language && snippet.language !== 'typescript') continue;

            let score = 0;

            // Check if snippet is relevant to current context
            if (line.includes('import') && snippet.category.toLowerCase().includes('import')) {
                score += 50;
            }
            if (line.includes('function') && snippet.tags.includes('function')) {
                score += 50;
            }
            if (line.includes('class') && snippet.tags.includes('class')) {
                score += 50;
            }
            if (line.includes('test') && snippet.category === 'Testing') {
                score += 50;
            }

            // Boost frequently used snippets
            score += Math.min(30, snippet.usageCount * 3);

            if (score > 0) {
                suggestions.push({ snippet, score, matchType: 'content' });
            }
        }

        return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    // ========================================================================
    // SNIPPET USAGE
    // ========================================================================

    useSnippet(id: string, variables?: Record<string, string>): string | undefined {
        const snippet = this.snippets.get(id);
        if (!snippet) return undefined;

        // Track usage
        snippet.usageCount++;
        snippet.lastUsed = new Date();

        // Expand snippet body
        let body = snippet.body.join('\n');

        // Replace variables
        if (variables) {
            for (const [key, value] of Object.entries(variables)) {
                body = body.replace(new RegExp(`\\$\\{\\d+:${key}\\}`, 'g'), value);
            }
        }

        this.emit('snippet:used', { id, usageCount: snippet.usageCount });
        return body;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSnippet(id: string): CodeSnippet | undefined {
        return this.snippets.get(id);
    }

    getAllSnippets(): CodeSnippet[] {
        return Array.from(this.snippets.values());
    }

    getByLanguage(language: string): CodeSnippet[] {
        return Array.from(this.snippets.values())
            .filter(s => s.language === language || s.language === 'typescript');
    }

    getByCategory(category: string): CodeSnippet[] {
        return Array.from(this.snippets.values())
            .filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    getCategories(): string[] {
        const categories = new Set<string>();
        for (const snippet of this.snippets.values()) {
            categories.add(snippet.category);
        }
        return Array.from(categories).sort();
    }

    getStats(): SnippetStats {
        const snippets = Array.from(this.snippets.values());

        const byLanguage: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        let totalUsage = 0;

        for (const snippet of snippets) {
            byLanguage[snippet.language] = (byLanguage[snippet.language] || 0) + 1;
            byCategory[snippet.category] = (byCategory[snippet.category] || 0) + 1;
            totalUsage += snippet.usageCount;
        }

        const topUsed = snippets
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5);

        return {
            totalSnippets: snippets.length,
            totalUsage,
            byLanguage,
            byCategory,
            topUsed,
        };
    }
}

export const intelligentSnippetManager = IntelligentSnippetManager.getInstance();
