/**
 * Natural Language Query for Code
 * 
 * Ask questions about your codebase in plain English.
 * "Where is authentication handled?"
 * "Show all API endpoints"
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface QueryResult {
    query: string;
    answer: string;
    sources: Array<{
        file: string;
        line?: number;
        snippet: string;
        relevance: number;
    }>;
    confidence: number;
    timestamp: Date;
}

export interface CodeLocation {
    file: string;
    line: number;
    column: number;
    snippet: string;
}

// ============================================================================
// NATURAL LANGUAGE QUERY
// ============================================================================

export class NaturalLanguageQuery extends EventEmitter {
    private static instance: NaturalLanguageQuery;
    private modelManager: ModelManager;
    private codebaseIndex: Map<string, string> = new Map();
    private indexed = false;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): NaturalLanguageQuery {
        if (!NaturalLanguageQuery.instance) {
            NaturalLanguageQuery.instance = new NaturalLanguageQuery();
        }
        return NaturalLanguageQuery.instance;
    }

    // ========================================================================
    // INDEXING
    // ========================================================================

    /**
     * Index the codebase for queries
     */
    async indexCodebase(projectPath: string): Promise<void> {
        this.emit('index:started', { projectPath });
        this.codebaseIndex.clear();

        try {
            const { stdout } = await execAsync(
                'find . -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \\) | grep -v node_modules | head -100',
                { cwd: projectPath }
            );

            const files = stdout.trim().split('\n').filter(Boolean);

            for (const file of files) {
                const fullPath = path.join(projectPath, file);
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    this.codebaseIndex.set(file, content);
                } catch { }
            }

            this.indexed = true;
            this.emit('index:completed', { files: files.length });
        } catch (error: any) {
            this.emit('index:error', { error: error.message });
        }
    }

    // ========================================================================
    // QUERYING
    // ========================================================================

    /**
     * Query the codebase in natural language
     */
    async query(question: string, projectPath?: string): Promise<QueryResult> {
        this.emit('query:started', { question });

        // Index if needed
        if (!this.indexed && projectPath) {
            await this.indexCodebase(projectPath);
        }

        // Find relevant files
        const relevantCode = await this.findRelevantCode(question);

        // Generate answer using AI
        const prompt = `Answer this question about the codebase:

Question: "${question}"

Relevant code:
${relevantCode.map(c => `
File: ${c.file}
\`\`\`
${c.snippet.slice(0, 500)}
\`\`\`
`).join('\n')}

Provide:
1. A clear answer to the question
2. Reference specific files and line numbers

Respond in JSON:
\`\`\`json
{
    "answer": "your answer",
    "sources": [
        { "file": "path", "line": 10, "snippet": "code", "relevance": 0.9 }
    ],
    "confidence": 0.85
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        const result: QueryResult = {
            query: question,
            answer: parsed.answer || 'No answer found',
            sources: parsed.sources || relevantCode,
            confidence: parsed.confidence || 0.5,
            timestamp: new Date(),
        };

        this.emit('query:completed', result);
        return result;
    }

    /**
     * Find code relevant to the question
     */
    private async findRelevantCode(question: string): Promise<Array<{ file: string; snippet: string; relevance: number }>> {
        const relevant: Array<{ file: string; snippet: string; relevance: number }> = [];
        const keywords = this.extractKeywords(question);

        for (const [file, content] of this.codebaseIndex) {
            let score = 0;

            for (const keyword of keywords) {
                if (content.toLowerCase().includes(keyword.toLowerCase())) {
                    score += 1;
                }
            }

            if (score > 0) {
                // Find the most relevant snippet
                const snippet = this.findBestSnippet(content, keywords);
                relevant.push({
                    file,
                    snippet,
                    relevance: score / keywords.length,
                });
            }
        }

        return relevant
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 5);
    }

    private extractKeywords(question: string): string[] {
        const stopWords = ['what', 'where', 'how', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'all', 'show', 'find', 'get'];
        return question
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.includes(w));
    }

    private findBestSnippet(content: string, keywords: string[]): string {
        const lines = content.split('\n');
        let bestStart = 0;
        let bestScore = 0;

        for (let i = 0; i < lines.length; i++) {
            const window = lines.slice(i, i + 15).join('\n').toLowerCase();
            let score = 0;
            for (const kw of keywords) {
                if (window.includes(kw)) score++;
            }
            if (score > bestScore) {
                bestScore = score;
                bestStart = i;
            }
        }

        return lines.slice(bestStart, bestStart + 15).join('\n');
    }

    // ========================================================================
    // COMMON QUERIES
    // ========================================================================

    /**
     * Find where something is defined
     */
    async findDefinition(name: string): Promise<CodeLocation[]> {
        const locations: CodeLocation[] = [];
        const patterns = [
            new RegExp(`(?:function|class|interface|type|const|let|var)\\s+${name}\\b`),
            new RegExp(`${name}\\s*[=:]\\s*(?:function|\\()`),
        ];

        for (const [file, content] of this.codebaseIndex) {
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                for (const pattern of patterns) {
                    if (pattern.test(lines[i])) {
                        locations.push({
                            file,
                            line: i + 1,
                            column: 0,
                            snippet: lines[i].trim(),
                        });
                    }
                }
            }
        }

        return locations;
    }

    /**
     * Find all usages of something
     */
    async findUsages(name: string): Promise<CodeLocation[]> {
        const locations: CodeLocation[] = [];
        const pattern = new RegExp(`\\b${name}\\b`, 'g');

        for (const [file, content] of this.codebaseIndex) {
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (pattern.test(lines[i])) {
                    locations.push({
                        file,
                        line: i + 1,
                        column: 0,
                        snippet: lines[i].trim(),
                    });
                }
            }
        }

        return locations;
    }

    /**
     * Find API endpoints
     */
    async findEndpoints(): Promise<Array<{ method: string; path: string; file: string; line: number }>> {
        const endpoints: Array<{ method: string; path: string; file: string; line: number }> = [];
        const pattern = /\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

        for (const [file, content] of this.codebaseIndex) {
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    endpoints.push({
                        method: match[1].toUpperCase(),
                        path: match[2],
                        file,
                        line: i + 1,
                    });
                }
            }
        }

        return endpoints;
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }
}

// Export singleton
export const naturalLanguageQuery = NaturalLanguageQuery.getInstance();
