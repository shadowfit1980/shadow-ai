import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseTool, defineParameter } from '../BaseTool';
import { ToolExecutionContext, ToolExecutionResult } from '../types';

/**
 * Tool to read file contents
 */
export class ReadFileTool extends BaseTool {
    constructor() {
        super({
            name: 'read_file',
            description: 'Read the contents of a file from the filesystem',
            category: 'file',
            parameters: [
                defineParameter('path', 'string', 'Absolute or relative path to the file'),
                defineParameter('encoding', 'string', 'File encoding', false, {
                    default: 'utf-8',
                    enum: ['utf-8', 'ascii', 'base64', 'binary'],
                }),
            ],
            returns: {
                type: 'string',
                description: 'The contents of the file',
            },
            examples: [
                {
                    input: { path: './README.md', encoding: 'utf-8' },
                    output: '# Project Title\n\nDescription...',
                    description: 'Read a markdown file',
                },
            ],
            tags: ['filesystem', 'io', 'read'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const filePath = params.path as string;
            const encoding = (params.encoding as BufferEncoding) || 'utf-8';

            // Resolve path relative to working directory if provided
            const resolvedPath = context?.workingDirectory
                ? path.resolve(context.workingDirectory, filePath)
                : path.resolve(filePath);

            const content = await fs.readFile(resolvedPath, encoding);

            return this.createSuccessResult(
                content,
                Date.now() - startTime,
                { filesRead: [resolvedPath] }
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}

/**
 * Tool to write file contents
 */
export class WriteFileTool extends BaseTool {
    constructor() {
        super({
            name: 'write_file',
            description: 'Write content to a file, creating it if it doesn\'t exist',
            category: 'file',
            parameters: [
                defineParameter('path', 'string', 'Absolute or relative path to the file'),
                defineParameter('content', 'string', 'Content to write to the file'),
                defineParameter('encoding', 'string', 'File encoding', false, {
                    default: 'utf-8',
                    enum: ['utf-8', 'ascii', 'base64'],
                }),
                defineParameter('createDirs', 'boolean', 'Create parent directories if they don\'t exist', false, {
                    default: true,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Write result with bytes written',
            },
            examples: [
                {
                    input: {
                        path: './output.txt',
                        content: 'Hello, World!',
                        createDirs: true,
                    },
                    output: { bytesWritten: 13, path: '/absolute/path/output.txt' },
                    description: 'Write text to a file',
                },
            ],
            tags: ['filesystem', 'io', 'write'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const filePath = params.path as string;
            const content = params.content as string;
            const encoding = (params.encoding as BufferEncoding) || 'utf-8';
            const createDirs = params.createDirs !== false;

            // Resolve path
            const resolvedPath = context?.workingDirectory
                ? path.resolve(context.workingDirectory, filePath)
                : path.resolve(filePath);

            // Create parent directories if needed
            if (createDirs) {
                const dir = path.dirname(resolvedPath);
                await fs.mkdir(dir, { recursive: true });
            }

            // Write file
            await fs.writeFile(resolvedPath, content, encoding);
            const stats = await fs.stat(resolvedPath);

            return this.createSuccessResult(
                {
                    bytesWritten: stats.size,
                    path: resolvedPath,
                },
                Date.now() - startTime,
                { filesModified: [resolvedPath] }
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}

/**
 * Tool to list directory contents
 */
export class ListDirectoryTool extends BaseTool {
    constructor() {
        super({
            name: 'list_directory',
            description: 'List all files and subdirectories in a directory',
            category: 'file',
            parameters: [
                defineParameter('path', 'string', 'Directory path to list'),
                defineParameter('recursive', 'boolean', 'Recursively list subdirectories', false, {
                    default: false,
                }),
                defineParameter('includeHidden', 'boolean', 'Include hidden files (starting with .)', false, {
                    default: false,
                }),
            ],
            returns: {
                type: 'array',
                description: 'Array of file/directory entries with metadata',
            },
            examples: [
                {
                    input: { path: './src', recursive: false },
                    output: [
                        { name: 'index.ts', type: 'file', size: 1234 },
                        { name: 'utils', type: 'directory' },
                    ],
                    description: 'List files in a directory',
                },
            ],
            tags: ['filesystem', 'directory', 'list'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const dirPath = params.path as string;
            const recursive = params.recursive === true;
            const includeHidden = params.includeHidden === true;

            const resolvedPath = context?.workingDirectory
                ? path.resolve(context.workingDirectory, dirPath)
                : path.resolve(dirPath);

            const entries = await this.listDir(resolvedPath, recursive, includeHidden);

            return this.createSuccessResult(entries, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private async listDir(
        dirPath: string,
        recursive: boolean,
        includeHidden: boolean,
        basePath: string = dirPath
    ): Promise<any[]> {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const results: any[] = [];

        for (const entry of entries) {
            // Skip hidden files if not included
            if (!includeHidden && entry.name.startsWith('.')) {
                continue;
            }

            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(basePath, fullPath);

            if (entry.isDirectory()) {
                const item = {
                    name: entry.name,
                    path: relativePath,
                    type: 'directory' as const,
                };

                results.push(item);

                // Recurse if needed
                if (recursive) {
                    const subEntries = await this.listDir(
                        fullPath,
                        recursive,
                        includeHidden,
                        basePath
                    );
                    results.push(...subEntries);
                }
            } else {
                const stats = await fs.stat(fullPath);
                results.push({
                    name: entry.name,
                    path: relativePath,
                    type: 'file' as const,
                    size: stats.size,
                    modified: stats.mtime,
                });
            }
        }

        return results;
    }
}

/**
 * Tool to search for files
 */
export class FindFilesTool extends BaseTool {
    constructor() {
        super({
            name: 'find_files',
            description: 'Find files matching a pattern in a directory tree',
            category: 'file',
            parameters: [
                defineParameter('path', 'string', 'Directory to search in'),
                defineParameter('pattern', 'string', 'Glob pattern or regex to match', false),
                defineParameter('extension', 'string', 'File extension to filter (e.g., .ts)', false),
                defineParameter('maxDepth', 'number', 'Maximum directory depth to search', false, {
                    default: 10,
                }),
            ],
            returns: {
                type: 'array',
                description: 'Array of matching file paths',
            },
            examples: [
                {
                    input: { path: './src', pattern: '*.test.ts' },
                    output: ['src/utils/helper.test.ts', 'src/components/Button.test.ts'],
                    description: 'Find all test files',
                },
            ],
            tags: ['filesystem', 'search', 'find'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const searchPath = params.path as string;
            const pattern = params.pattern as string | undefined;
            const extension = params.extension as string | undefined;
            const maxDepth = (params.maxDepth as number) || 10;

            const resolvedPath = context?.workingDirectory
                ? path.resolve(context.workingDirectory, searchPath)
                : path.resolve(searchPath);

            const matches = await this.findFiles(
                resolvedPath,
                pattern,
                extension,
                maxDepth,
                0
            );

            return this.createSuccessResult(matches, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private async findFiles(
        dirPath: string,
        pattern?: string,
        extension?: string,
        maxDepth: number = 10,
        currentDepth: number = 0
    ): Promise<string[]> {
        if (currentDepth > maxDepth) {
            return [];
        }

        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const matches: string[] = [];

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Skip node_modules and hidden directories
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                    continue;
                }

                // Recurse
                const subMatches = await this.findFiles(
                    fullPath,
                    pattern,
                    extension,
                    maxDepth,
                    currentDepth + 1
                );
                matches.push(...subMatches);
            } else {
                // Check if file matches criteria
                let isMatch = true;

                if (extension && !entry.name.endsWith(extension)) {
                    isMatch = false;
                }

                if (pattern) {
                    // Simple glob matching (*.ts, test.*, etc.)
                    const regexPattern = pattern
                        .replace(/\./g, '\\.')
                        .replace(/\*/g, '.*');
                    const regex = new RegExp(`^${regexPattern}$`);
                    if (!regex.test(entry.name)) {
                        isMatch = false;
                    }
                }

                if (isMatch) {
                    matches.push(fullPath);
                }
            }
        }

        return matches;
    }
}
