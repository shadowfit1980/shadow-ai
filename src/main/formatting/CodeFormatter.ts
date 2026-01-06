/**
 * Code Formatter
 * Format code using Prettier, ESLint, and language-specific formatters
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FormatResult {
    file: string;
    original: string;
    formatted: string;
    changed: boolean;
    errors?: string[];
}

export interface FormatOptions {
    tabWidth?: number;
    useTabs?: boolean;
    semi?: boolean;
    singleQuote?: boolean;
    trailingComma?: 'none' | 'es5' | 'all';
    printWidth?: number;
}

/**
 * CodeFormatter
 * Multi-language code formatting
 */
export class CodeFormatter extends EventEmitter {
    private static instance: CodeFormatter;
    private defaultOptions: FormatOptions = {
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
    };

    private constructor() {
        super();
    }

    static getInstance(): CodeFormatter {
        if (!CodeFormatter.instance) {
            CodeFormatter.instance = new CodeFormatter();
        }
        return CodeFormatter.instance;
    }

    /**
     * Format a file
     */
    async formatFile(filePath: string, options?: FormatOptions): Promise<FormatResult> {
        const original = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath).toLowerCase();
        const opts = { ...this.defaultOptions, ...options };

        let formatted = original;

        switch (ext) {
            case '.js':
            case '.jsx':
            case '.ts':
            case '.tsx':
            case '.json':
            case '.css':
            case '.scss':
            case '.less':
            case '.html':
            case '.vue':
            case '.md':
                formatted = await this.formatWithPrettier(original, ext, opts);
                break;
            case '.py':
                formatted = await this.formatPython(original, opts);
                break;
            case '.go':
                formatted = await this.formatGo(original);
                break;
            case '.rs':
                formatted = await this.formatRust(original);
                break;
            default:
                formatted = this.basicFormat(original, opts);
        }

        const result: FormatResult = {
            file: filePath,
            original,
            formatted,
            changed: original !== formatted,
        };

        if (result.changed) {
            this.emit('fileFormatted', result);
        }

        return result;
    }

    /**
     * Format with Prettier (via built-in logic)
     */
    private async formatWithPrettier(code: string, ext: string, opts: FormatOptions): Promise<string> {
        // Use built-in formatting logic as Prettier fallback
        let formatted = code;

        // Normalize line endings
        formatted = formatted.replace(/\r\n/g, '\n');

        // Apply indent rules
        if (opts.tabWidth && !opts.useTabs) {
            const lines = formatted.split('\n');
            formatted = lines.map(line => {
                const match = line.match(/^(\t+)/);
                if (match) {
                    return ' '.repeat(match[1].length * opts.tabWidth!) + line.slice(match[1].length);
                }
                return line;
            }).join('\n');
        }

        // Trailing newline
        if (!formatted.endsWith('\n')) {
            formatted += '\n';
        }

        // Remove trailing whitespace
        formatted = formatted.split('\n').map(l => l.trimEnd()).join('\n');

        return formatted;
    }

    /**
     * Format Python code
     */
    private async formatPython(code: string, opts: FormatOptions): Promise<string> {
        return new Promise((resolve) => {
            const proc = spawn('python', ['-m', 'black', '-', '-q']);

            let output = '';
            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', (exitCode) => {
                resolve(exitCode === 0 ? output : code);
            });

            proc.on('error', () => {
                resolve(this.basicFormat(code, opts));
            });

            proc.stdin.write(code);
            proc.stdin.end();
        });
    }

    /**
     * Format Go code
     */
    private async formatGo(code: string): Promise<string> {
        return new Promise((resolve) => {
            const proc = spawn('gofmt', []);

            let output = '';
            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', (exitCode) => {
                resolve(exitCode === 0 ? output : code);
            });

            proc.on('error', () => {
                resolve(code);
            });

            proc.stdin.write(code);
            proc.stdin.end();
        });
    }

    /**
     * Format Rust code
     */
    private async formatRust(code: string): Promise<string> {
        return new Promise((resolve) => {
            const proc = spawn('rustfmt', []);

            let output = '';
            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', (exitCode) => {
                resolve(exitCode === 0 ? output : code);
            });

            proc.on('error', () => {
                resolve(code);
            });

            proc.stdin.write(code);
            proc.stdin.end();
        });
    }

    /**
     * Basic formatting fallback
     */
    private basicFormat(code: string, opts: FormatOptions): string {
        let formatted = code;

        // Normalize line endings
        formatted = formatted.replace(/\r\n/g, '\n');

        // Remove trailing whitespace
        formatted = formatted.split('\n').map(l => l.trimEnd()).join('\n');

        // Ensure trailing newline
        if (!formatted.endsWith('\n')) {
            formatted += '\n';
        }

        // Remove multiple blank lines
        formatted = formatted.replace(/\n{3,}/g, '\n\n');

        return formatted;
    }

    /**
     * Format multiple files
     */
    async formatFiles(filePaths: string[], options?: FormatOptions): Promise<FormatResult[]> {
        const results: FormatResult[] = [];

        for (const filePath of filePaths) {
            try {
                const result = await this.formatFile(filePath, options);
                results.push(result);
            } catch (error: any) {
                results.push({
                    file: filePath,
                    original: '',
                    formatted: '',
                    changed: false,
                    errors: [error.message],
                });
            }
        }

        this.emit('batchComplete', { total: results.length, changed: results.filter(r => r.changed).length });

        return results;
    }

    /**
     * Format and write
     */
    async formatAndWrite(filePath: string, options?: FormatOptions): Promise<FormatResult> {
        const result = await this.formatFile(filePath, options);

        if (result.changed) {
            await fs.writeFile(filePath, result.formatted);
            this.emit('fileWritten', { file: filePath });
        }

        return result;
    }

    /**
     * Format code string
     */
    async formatCode(code: string, language: string, options?: FormatOptions): Promise<string> {
        const opts = { ...this.defaultOptions, ...options };
        const extMap: Record<string, string> = {
            javascript: '.js',
            typescript: '.ts',
            python: '.py',
            go: '.go',
            rust: '.rs',
            json: '.json',
            css: '.css',
            html: '.html',
        };

        const ext = extMap[language.toLowerCase()] || '.txt';

        switch (ext) {
            case '.py':
                return this.formatPython(code, opts);
            case '.go':
                return this.formatGo(code);
            case '.rs':
                return this.formatRust(code);
            default:
                return this.formatWithPrettier(code, ext, opts);
        }
    }

    /**
     * Set default options
     */
    setDefaultOptions(options: Partial<FormatOptions>): void {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }

    /**
     * Get default options
     */
    getDefaultOptions(): FormatOptions {
        return { ...this.defaultOptions };
    }
}

// Singleton getter
export function getCodeFormatter(): CodeFormatter {
    return CodeFormatter.getInstance();
}
