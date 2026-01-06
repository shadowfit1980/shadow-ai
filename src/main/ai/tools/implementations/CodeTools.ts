import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseTool, defineParameter } from '../BaseTool';
import { ToolExecutionContext, ToolExecutionResult } from '../types';

/**
 * Tool to search for text in files (grep-like functionality)
 */
export class SearchCodeTool extends BaseTool {
    constructor() {
        super({
            name: 'search_code',
            description: 'Search for text patterns in code files',
            category: 'code',
            parameters: [
                defineParameter('query', 'string', 'Text or regex pattern to search for'),
                defineParameter('path', 'string', 'Directory path to search in'),
                defineParameter('filePattern', 'string', 'File pattern to include (e.g., *.ts)', false),
                defineParameter('caseSensitive', 'boolean', 'Case-sensitive search', false, {
                    default: false,
                }),
                defineParameter('isRegex', 'boolean', 'Treat query as regex', false, {
                    default: false,
                }),
                defineParameter('maxResults', 'number', 'Maximum number of results', false, {
                    default: 100,
                }),
            ],
            returns: {
                type: 'array',
                description: 'Array of search matches with file, line number, and context',
            },
            examples: [
                {
                    input: {
                        query: 'function createUser',
                        path: './src',
                        filePattern: '*.ts',
                    },
                    output: [
                        {
                            file: 'src/users/service.ts',
                            line: 42,
                            column: 8,
                            match: 'function createUser(data: UserData) {',
                            context: {
                                before: ['', '// Create a new user'],
                                after: ['  return db.insert(data);', '}'],
                            },
                        },
                    ],
                    description: 'Find function definitions',
                },
            ],
            tags: ['code', 'search', 'grep', 'find'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const query = params.query as string;
            const searchPath = params.path as string;
            const filePattern = params.filePattern as string | undefined;
            const caseSensitive = params.caseSensitive === true;
            const isRegex = params.isRegex === true;
            const maxResults = (params.maxResults as number) || 100;

            const resolvedPath = context?.workingDirectory
                ? path.resolve(context.workingDirectory, searchPath)
                : path.resolve(searchPath);

            // Create search pattern
            let searchRegex: RegExp;
            if (isRegex) {
                searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi');
            } else {
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                searchRegex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
            }

            // Find matching files
            const files = await this.findCodeFiles(resolvedPath, filePattern);

            // Search in files
            const matches: any[] = [];
            for (const file of files) {
                if (matches.length >= maxResults) break;

                const fileMatches = await this.searchInFile(file, searchRegex, maxResults - matches.length);
                matches.push(...fileMatches);
            }

            return this.createSuccessResult(matches, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private async findCodeFiles(dirPath: string, pattern?: string): Promise<string[]> {
        const files: string[] = [];

        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Skip certain directories
            if (entry.isDirectory()) {
                if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                    continue;
                }
                const subFiles = await this.findCodeFiles(fullPath, pattern);
                files.push(...subFiles);
            } else if (entry.isFile()) {
                // Check pattern
                if (pattern) {
                    const regex = new RegExp(pattern.replace('*', '.*'));
                    if (!regex.test(entry.name)) continue;
                } else {
                    // Default: code file extensions
                    const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h'];
                    if (!codeExts.some(ext => entry.name.endsWith(ext))) {
                        continue;
                    }
                }
                files.push(fullPath);
            }
        }

        return files;
    }

    private async searchInFile(
        filePath: string,
        regex: RegExp,
        maxMatches: number
    ): Promise<any[]> {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const matches: any[] = [];

        for (let i = 0; i < lines.length && matches.length < maxMatches; i++) {
            const line = lines[i];
            const match = line.match(regex);

            if (match) {
                matches.push({
                    file: filePath,
                    line: i + 1,
                    column: match.index !== undefined ? match.index + 1 : 0,
                    match: line.trim(),
                    context: {
                        before: lines.slice(Math.max(0, i - 2), i),
                        after: lines.slice(i + 1, Math.min(lines.length, i + 3)),
                    },
                });
            }
        }

        return matches;
    }
}

/**
 * Tool to analyze code structure and extract symbols
 */
export class AnalyzeCodeStructureTool extends BaseTool {
    constructor() {
        super({
            name: 'analyze_code_structure',
            description: 'Analyze code file structure to extract functions, classes, imports, and exports',
            category: 'code',
            parameters: [
                defineParameter('path', 'string', 'Path to code file to analyze'),
            ],
            returns: {
                type: 'object',
                description: 'Structure analysis with functions, classes, imports, and exports',
            },
            examples: [
                {
                    input: { path: './src/utils/helper.ts' },
                    output: {
                        functions: ['formatDate', 'parseJSON', 'calculateSum'],
                        classes: ['DataProcessor'],
                        imports: ['lodash', './types'],
                        exports: ['formatDate', 'DataProcessor'],
                    },
                    description: 'Analyze TypeScript file structure',
                },
            ],
            tags: ['code', 'analysis', 'ast', 'structure'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const filePath = params.path as string;
            const resolvedPath = context?.workingDirectory
                ? path.resolve(context.workingDirectory, filePath)
                : path.resolve(filePath);

            const content = await fs.readFile(resolvedPath, 'utf-8');
            const analysis = this.analyzeStructure(content);

            return this.createSuccessResult(analysis, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private analyzeStructure(code: string) {
        const analysis = {
            functions: [] as string[],
            classes: [] as string[],
            imports: [] as string[],
            exports: [] as string[],
            constants: [] as string[],
            interfaces: [] as string[],
            types: [] as string[],
        };

        const lines = code.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            // Functions
            const funcMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
            if (funcMatch) {
                analysis.functions.push(funcMatch[1]);
            }

            // Arrow functions
            const arrowMatch = trimmed.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/);
            if (arrowMatch) {
                analysis.functions.push(arrowMatch[1]);
            }

            // Classes
            const classMatch = trimmed.match(/(?:export\s+)?class\s+(\w+)/);
            if (classMatch) {
                analysis.classes.push(classMatch[1]);
            }

            // Imports
            const importMatch = trimmed.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                analysis.imports.push(importMatch[1]);
            }

            // Interfaces
            const interfaceMatch = trimmed.match(/(?:export\s+)?interface\s+(\w+)/);
            if (interfaceMatch) {
                analysis.interfaces.push(interfaceMatch[1]);
            }

            // Types
            const typeMatch = trimmed.match(/(?:export\s+)?type\s+(\w+)/);
            if (typeMatch) {
                analysis.types.push(typeMatch[1]);
            }

            // Constants
            const constMatch = trimmed.match(/(?:export\s+)?const\s+(\w+)\s*=/);
            if (constMatch && !arrowMatch) {
                analysis.constants.push(constMatch[1]);
            }

            // Exports
            if (trimmed.startsWith('export')) {
                const exportMatch = trimmed.match(/export\s+(?:default\s+)?(?:\{([^}]+)\}|\w+\s+(\w+))/);
                if (exportMatch) {
                    if (exportMatch[1]) {
                        // Named exports: export { a, b, c }
                        const names = exportMatch[1].split(',').map(n => n.trim());
                        analysis.exports.push(...names);
                    } else if (exportMatch[2]) {
                        // Declaration exports: export function name
                        analysis.exports.push(exportMatch[2]);
                    }
                }
            }
        }

        return analysis;
    }
}

/**
 * Tool to count lines of code
 */
export class CountCodeLinesTool extends BaseTool {
    constructor() {
        super({
            name: 'count_code_lines',
            description: 'Count lines of code in files or directories',
            category: 'analysis',
            parameters: [
                defineParameter('path', 'string', 'File or directory path'),
                defineParameter('extensions', 'array', 'File extensions to include', false, {
                    default: ['.ts', '.tsx', '.js', '.jsx'],
                }),
            ],
            returns: {
                type: 'object',
                description: 'Line count statistics',
            },
            examples: [
                {
                    input: { path: './src' },
                    output: {
                        totalLines: 5234,
                        codeLines: 4120,
                        commentLines: 892,
                        blankLines: 222,
                        fileCount: 47,
                    },
                    description: 'Count lines in a directory',
                },
            ],
            tags: ['code', 'analysis', 'metrics'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const targetPath = params.path as string;
            const extensions = (params.extensions as string[]) || ['.ts', '.tsx', '.js', '.jsx'];

            const resolvedPath = context?.workingDirectory
                ? path.resolve(context.workingDirectory, targetPath)
                : path.resolve(targetPath);

            const stats = await this.countLines(resolvedPath, extensions);

            return this.createSuccessResult(stats, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private async countLines(targetPath: string, extensions: string[]): Promise<any> {
        const stat = await fs.stat(targetPath);

        if (stat.isFile()) {
            return this.countFileLines(targetPath);
        } else {
            return this.countDirLines(targetPath, extensions);
        }
    }

    private async countFileLines(filePath: string) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        let codeLines = 0;
        let commentLines = 0;
        let blankLines = 0;
        let inBlockComment = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed === '') {
                blankLines++;
            } else if (inBlockComment) {
                commentLines++;
                if (trimmed.includes('*/')) {
                    inBlockComment = false;
                }
            } else if (trimmed.startsWith('//')) {
                commentLines++;
            } else if (trimmed.startsWith('/*')) {
                commentLines++;
                if (!trimmed.includes('*/')) {
                    inBlockComment = true;
                }
            } else {
                codeLines++;
            }
        }

        return {
            totalLines: lines.length,
            codeLines,
            commentLines,
            blankLines,
            fileCount: 1,
        };
    }

    private async countDirLines(dirPath: string, extensions: string[]) {
        const stats = {
            totalLines: 0,
            codeLines: 0,
            commentLines: 0,
            blankLines: 0,
            fileCount: 0,
        };

        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
                const dirStats = await this.countDirLines(fullPath, extensions);
                stats.totalLines += dirStats.totalLines;
                stats.codeLines += dirStats.codeLines;
                stats.commentLines += dirStats.commentLines;
                stats.blankLines += dirStats.blankLines;
                stats.fileCount += dirStats.fileCount;
            } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                const fileStats = await this.countFileLines(fullPath);
                stats.totalLines += fileStats.totalLines;
                stats.codeLines += fileStats.codeLines;
                stats.commentLines += fileStats.commentLines;
                stats.blankLines += fileStats.blankLines;
                stats.fileCount += fileStats.fileCount;
            }
        }

        return stats;
    }
}
