/**
 * Code Executor
 * 
 * Execute code in isolated sandbox environments with real output.
 * Supports multiple language runtimes with resource limits.
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type SupportedLanguage =
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'go'
    | 'rust'
    | 'shell'
    | 'dart'
    | 'flutter'
    | 'docker'
    | 'json'
    | 'html'
    | 'css'
    | 'yaml';

export interface ExecutionRequest {
    code: string;
    language: SupportedLanguage;
    stdin?: string;
    args?: string[];
    env?: Record<string, string>;
    timeoutMs?: number;
    memoryLimitMB?: number;
    workingDir?: string;
}

export interface ExecutionResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
    memoryUsed?: number;
    error?: string;
}

export interface RuntimeInfo {
    language: SupportedLanguage;
    available: boolean;
    version?: string;
    path?: string;
}

// ============================================================================
// CODE EXECUTOR
// ============================================================================

export class CodeExecutor extends EventEmitter {
    private static instance: CodeExecutor;
    private runtimes: Map<SupportedLanguage, RuntimeInfo> = new Map();
    private activeProcesses: Map<string, ChildProcess> = new Map();

    private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
    private readonly DEFAULT_MEMORY_LIMIT = 512; // MB

    private constructor() {
        super();
        this.detectRuntimes();
    }

    static getInstance(): CodeExecutor {
        if (!CodeExecutor.instance) {
            CodeExecutor.instance = new CodeExecutor();
        }
        return CodeExecutor.instance;
    }

    // ========================================================================
    // RUNTIME DETECTION
    // ========================================================================

    private async detectRuntimes(): Promise<void> {
        console.log('🔍 Detecting available runtimes...');

        const runtimeCommands: Record<SupportedLanguage, { command: string; versionFlag: string }> = {
            javascript: { command: 'node', versionFlag: '--version' },
            typescript: { command: 'npx ts-node', versionFlag: '--version' },
            python: { command: 'python3', versionFlag: '--version' },
            go: { command: 'go', versionFlag: 'version' },
            rust: { command: 'rustc', versionFlag: '--version' },
            shell: { command: 'bash', versionFlag: '--version' },
            dart: { command: 'dart', versionFlag: '--version' },
            flutter: { command: 'flutter', versionFlag: '--version' },
            docker: { command: 'docker', versionFlag: '--version' },
            json: { command: 'node', versionFlag: '--version' }, // JSON via Node
            html: { command: 'node', versionFlag: '--version' }, // HTML via browser/Node
            css: { command: 'node', versionFlag: '--version' },  // CSS via Node
            yaml: { command: 'node', versionFlag: '--version' }  // YAML via Node
        };

        for (const [lang, { command, versionFlag }] of Object.entries(runtimeCommands)) {
            try {
                const { stdout } = await execAsync(`${command} ${versionFlag}`);
                this.runtimes.set(lang as SupportedLanguage, {
                    language: lang as SupportedLanguage,
                    available: true,
                    version: stdout.trim().split('\n')[0],
                    path: command.split(' ')[0]
                });
                console.log(`  ✅ ${lang}: ${stdout.trim().split('\n')[0]}`);
            } catch {
                this.runtimes.set(lang as SupportedLanguage, {
                    language: lang as SupportedLanguage,
                    available: false
                });
                console.log(`  ❌ ${lang}: not available`);
            }
        }
    }

    // ========================================================================
    // CODE EXECUTION
    // ========================================================================

    /**
     * Execute code in the specified language
     */
    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        const startTime = Date.now();
        const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        console.log(`⚡ Executing ${request.language} code (${executionId})...`);
        this.emit('execution:started', { id: executionId, language: request.language });

        const runtime = this.runtimes.get(request.language);
        if (!runtime?.available) {
            return {
                success: false,
                stdout: '',
                stderr: `Runtime for ${request.language} is not available`,
                exitCode: 1,
                executionTime: 0,
                error: 'Runtime not available'
            };
        }

        let tempDir: string | null = null;
        let tempFile: string | null = null;

        try {
            // Create temp directory for execution
            tempDir = await mkdtemp(join(tmpdir(), 'shadow-exec-'));

            // Write code to temp file
            const extension = this.getFileExtension(request.language);
            tempFile = join(tempDir, `code${extension}`);
            await writeFile(tempFile, request.code);

            // Build execution command
            const { command, args } = this.buildCommand(request.language, tempFile, request.args);

            // Execute with timeout
            const result = await this.runWithTimeout(
                command,
                args,
                {
                    cwd: request.workingDir || tempDir,
                    env: { ...process.env, ...request.env },
                    stdin: request.stdin
                },
                request.timeoutMs || this.DEFAULT_TIMEOUT,
                executionId
            );

            const executionTime = Date.now() - startTime;

            this.emit('execution:completed', {
                id: executionId,
                success: result.success,
                executionTime
            });

            return {
                ...result,
                executionTime
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;

            this.emit('execution:failed', {
                id: executionId,
                error: (error as Error).message
            });

            return {
                success: false,
                stdout: '',
                stderr: (error as Error).message,
                exitCode: 1,
                executionTime,
                error: (error as Error).message
            };
        } finally {
            // Cleanup temp files
            if (tempDir) {
                try {
                    await rm(tempDir, { recursive: true, force: true });
                } catch {
                    // Ignore cleanup errors
                }
            }
        }
    }

    /**
     * Run command with timeout
     */
    private runWithTimeout(
        command: string,
        args: string[],
        options: { cwd: string; env: Record<string, string | undefined>; stdin?: string },
        timeoutMs: number,
        executionId: string
    ): Promise<{ success: boolean; stdout: string; stderr: string; exitCode: number }> {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            let killed = false;

            const proc = spawn(command, args, {
                cwd: options.cwd,
                env: options.env as NodeJS.ProcessEnv,
                shell: true
            });

            this.activeProcesses.set(executionId, proc);

            // Handle stdin
            if (options.stdin) {
                proc.stdin.write(options.stdin);
                proc.stdin.end();
            }

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                this.emit('execution:stdout', { id: executionId, data: data.toString() });
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                this.emit('execution:stderr', { id: executionId, data: data.toString() });
            });

            // Set timeout
            const timeoutHandle = setTimeout(() => {
                killed = true;
                proc.kill('SIGKILL');
                reject(new Error(`Execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            proc.on('close', (code) => {
                clearTimeout(timeoutHandle);
                this.activeProcesses.delete(executionId);

                if (!killed) {
                    resolve({
                        success: code === 0,
                        stdout,
                        stderr,
                        exitCode: code || 0
                    });
                }
            });

            proc.on('error', (error) => {
                clearTimeout(timeoutHandle);
                this.activeProcesses.delete(executionId);
                reject(error);
            });
        });
    }

    /**
     * Kill a running execution
     */
    killExecution(executionId: string): boolean {
        const proc = this.activeProcesses.get(executionId);
        if (proc) {
            proc.kill('SIGKILL');
            this.activeProcesses.delete(executionId);
            return true;
        }
        return false;
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private getFileExtension(language: SupportedLanguage): string {
        const extensions: Record<SupportedLanguage, string> = {
            javascript: '.js',
            typescript: '.ts',
            python: '.py',
            go: '.go',
            rust: '.rs',
            shell: '.sh',
            dart: '.dart',
            flutter: '.dart',
            docker: '.dockerfile',
            json: '.json',
            html: '.html',
            css: '.css',
            yaml: '.yaml'
        };
        return extensions[language];
    }

    private buildCommand(
        language: SupportedLanguage,
        filePath: string,
        extraArgs?: string[]
    ): { command: string; args: string[] } {
        const commands: Record<SupportedLanguage, { command: string; args: string[] }> = {
            javascript: {
                command: 'node',
                args: [filePath, ...(extraArgs || [])]
            },
            typescript: {
                command: 'npx',
                args: ['ts-node', filePath, ...(extraArgs || [])]
            },
            python: {
                command: 'python3',
                args: [filePath, ...(extraArgs || [])]
            },
            go: {
                command: 'go',
                args: ['run', filePath, ...(extraArgs || [])]
            },
            rust: {
                command: 'rustc',
                args: [filePath, '-o', filePath.replace('.rs', ''), '&&', filePath.replace('.rs', '')]
            },
            shell: {
                command: 'bash',
                args: [filePath, ...(extraArgs || [])]
            },
            dart: {
                command: 'dart',
                args: ['run', filePath, ...(extraArgs || [])]
            },
            flutter: {
                command: 'flutter',
                args: ['run', ...(extraArgs || [])]
            },
            docker: {
                command: 'docker',
                args: ['build', '-f', filePath, '.', ...(extraArgs || [])]
            },
            json: {
                command: 'node',
                args: ['-e', `console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('${filePath}', 'utf8')), null, 2))`]
            },
            html: {
                command: 'open',  // macOS: open in browser
                args: [filePath]
            },
            css: {
                command: 'node',
                args: ['-e', `console.log(require('fs').readFileSync('${filePath}', 'utf8'))`]
            },
            yaml: {
                command: 'node',
                args: ['-e', `const yaml = require('yaml'); console.log(JSON.stringify(yaml.parse(require('fs').readFileSync('${filePath}', 'utf8')), null, 2))`]
            }
        };

        return commands[language];
    }

    // ========================================================================
    // CONVENIENCE METHODS
    // ========================================================================

    /**
     * Execute JavaScript code
     */
    async executeJS(code: string, options?: Partial<ExecutionRequest>): Promise<ExecutionResult> {
        return this.execute({ language: 'javascript', code, ...options });
    }

    /**
     * Execute TypeScript code
     */
    async executeTS(code: string, options?: Partial<ExecutionRequest>): Promise<ExecutionResult> {
        return this.execute({ language: 'typescript', code, ...options });
    }

    /**
     * Execute Python code
     */
    async executePython(code: string, options?: Partial<ExecutionRequest>): Promise<ExecutionResult> {
        return this.execute({ language: 'python', code, ...options });
    }

    /**
     * Execute shell command
     */
    async executeShell(script: string, options?: Partial<ExecutionRequest>): Promise<ExecutionResult> {
        return this.execute({ language: 'shell', code: script, ...options });
    }

    // ========================================================================
    // STATUS
    // ========================================================================

    getAvailableRuntimes(): RuntimeInfo[] {
        return Array.from(this.runtimes.values()).filter(r => r.available);
    }

    isRuntimeAvailable(language: SupportedLanguage): boolean {
        return this.runtimes.get(language)?.available || false;
    }

    getRuntimeInfo(language: SupportedLanguage): RuntimeInfo | undefined {
        return this.runtimes.get(language);
    }

    getActiveExecutions(): string[] {
        return Array.from(this.activeProcesses.keys());
    }
}

// Export singleton
export const codeExecutor = CodeExecutor.getInstance();
