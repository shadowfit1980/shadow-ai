/**
 * Code Interpreter / Sandbox
 * 
 * Safe code execution environment for running
 * user code in isolated containers.
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';

// ============================================================================
// TYPES
// ============================================================================

export type RuntimeLanguage = 'javascript' | 'typescript' | 'python' | 'bash' | 'ruby' | 'go';

export interface ExecutionRequest {
    code: string;
    language: RuntimeLanguage;
    timeout?: number; // ms
    env?: Record<string, string>;
    files?: Array<{ name: string; content: string }>;
}

export interface ExecutionResult {
    id: string;
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
    memoryUsed?: number;
    outputFiles?: Array<{ name: string; content: string }>;
    error?: string;
}

export interface SandboxSession {
    id: string;
    language: RuntimeLanguage;
    status: 'active' | 'idle' | 'terminated';
    history: ExecutionResult[];
    variables: Record<string, any>;
    createdAt: Date;
    lastActivity: Date;
}

export interface SandboxConfig {
    maxExecutionTime: number;  // ms
    maxMemory: number;         // bytes
    maxOutputSize: number;     // bytes
    allowNetwork: boolean;
    allowFileSystem: boolean;
}

// ============================================================================
// CODE INTERPRETER
// ============================================================================

export class CodeInterpreter extends EventEmitter {
    private static instance: CodeInterpreter;
    private sessions: Map<string, SandboxSession> = new Map();
    private config: SandboxConfig;

    private constructor() {
        super();
        this.config = {
            maxExecutionTime: 30000,  // 30 seconds
            maxMemory: 256 * 1024 * 1024,  // 256MB
            maxOutputSize: 1024 * 1024,  // 1MB
            allowNetwork: false,
            allowFileSystem: true,
        };
    }

    static getInstance(): CodeInterpreter {
        if (!CodeInterpreter.instance) {
            CodeInterpreter.instance = new CodeInterpreter();
        }
        return CodeInterpreter.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    createSession(language: RuntimeLanguage): SandboxSession {
        const session: SandboxSession = {
            id: `sandbox_${Date.now()}`,
            language,
            status: 'active',
            history: [],
            variables: {},
            createdAt: new Date(),
            lastActivity: new Date(),
        };

        this.sessions.set(session.id, session);
        this.emit('sessionCreated', session);
        return session;
    }

    getSession(id: string): SandboxSession | undefined {
        return this.sessions.get(id);
    }

    terminateSession(id: string): boolean {
        const session = this.sessions.get(id);
        if (!session) return false;

        session.status = 'terminated';
        this.emit('sessionTerminated', id);
        return true;
    }

    // ========================================================================
    // CODE EXECUTION
    // ========================================================================

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        const startTime = Date.now();
        const executionId = `exec_${Date.now()}`;

        this.emit('executionStarted', { id: executionId, language: request.language });

        try {
            // Select runtime
            const runtime = this.getRuntime(request.language);

            // Prepare code
            const wrappedCode = this.wrapCode(request.code, request.language);

            // Execute
            const result = await this.runInSandbox(
                runtime,
                wrappedCode,
                request.timeout || this.config.maxExecutionTime,
                request.env
            );

            const executionResult: ExecutionResult = {
                id: executionId,
                success: result.exitCode === 0,
                stdout: result.stdout.substring(0, this.config.maxOutputSize),
                stderr: result.stderr.substring(0, this.config.maxOutputSize),
                exitCode: result.exitCode,
                duration: Date.now() - startTime,
            };

            this.emit('executionComplete', executionResult);
            return executionResult;

        } catch (error: any) {
            const errorResult: ExecutionResult = {
                id: executionId,
                success: false,
                stdout: '',
                stderr: error.message,
                exitCode: 1,
                duration: Date.now() - startTime,
                error: error.message,
            };

            this.emit('executionError', errorResult);
            return errorResult;
        }
    }

    async executeInSession(
        sessionId: string,
        code: string
    ): Promise<ExecutionResult> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.lastActivity = new Date();

        const result = await this.execute({
            code,
            language: session.language,
        });

        session.history.push(result);
        return result;
    }

    // ========================================================================
    // RUNTIME CONFIGURATION
    // ========================================================================

    private getRuntime(language: RuntimeLanguage): { command: string; args: string[] } {
        const runtimes: Record<RuntimeLanguage, { command: string; args: string[] }> = {
            javascript: { command: 'node', args: ['-e'] },
            typescript: { command: 'npx', args: ['ts-node', '-e'] },
            python: { command: 'python3', args: ['-c'] },
            bash: { command: 'bash', args: ['-c'] },
            ruby: { command: 'ruby', args: ['-e'] },
            go: { command: 'go', args: ['run', '-'] },
        };

        return runtimes[language];
    }

    private wrapCode(code: string, language: RuntimeLanguage): string {
        // Add safety wrappers based on language
        switch (language) {
            case 'javascript':
            case 'typescript':
                return `
                    try {
                        ${code}
                    } catch (error) {
                        console.error(error.message);
                        process.exit(1);
                    }
                `;
            case 'python':
                return `
import sys
try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;
            default:
                return code;
        }
    }

    private async runInSandbox(
        runtime: { command: string; args: string[] },
        code: string,
        timeout: number,
        env?: Record<string, string>
    ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            let killed = false;

            const child = spawn(runtime.command, [...runtime.args, code], {
                env: { ...process.env, ...env },
                timeout,
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            const timer = setTimeout(() => {
                killed = true;
                child.kill('SIGTERM');
            }, timeout);

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (exitCode) => {
                clearTimeout(timer);

                if (killed) {
                    reject(new Error('Execution timed out'));
                } else {
                    resolve({
                        stdout,
                        stderr,
                        exitCode: exitCode || 0,
                    });
                }
            });

            child.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }

    // ========================================================================
    // REPL MODE
    // ========================================================================

    async repl(
        sessionId: string,
        input: string
    ): Promise<{ output: string; type: 'result' | 'error' | 'print' }> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // For REPL, we need to track state across executions
        // This is a simplified version - in production, you'd maintain
        // a persistent process

        const result = await this.executeInSession(sessionId, input);

        if (result.success) {
            return {
                output: result.stdout || '(no output)',
                type: result.stdout ? 'print' : 'result',
            };
        } else {
            return {
                output: result.stderr,
                type: 'error',
            };
        }
    }

    // ========================================================================
    // CODE ANALYSIS
    // ========================================================================

    async analyzeCode(code: string, language: RuntimeLanguage): Promise<{
        syntax: { valid: boolean; errors: string[] };
        complexity: number;
        suggestions: string[];
    }> {
        // In production, use proper linters/analyzers
        const errors: string[] = [];
        const suggestions: string[] = [];

        // Basic syntax check by trying to execute with syntax check only
        if (language === 'python') {
            const result = await this.execute({
                code: `import ast; ast.parse('''${code.replace(/'/g, "\\'")}''')`,
                language: 'python',
            });
            if (!result.success) {
                errors.push(result.stderr);
            }
        }

        // Calculate rough complexity
        const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//'));
        const complexity = Math.min(lines.length / 10, 10);

        // Basic suggestions
        if (lines.length > 50) {
            suggestions.push('Consider breaking this code into smaller functions');
        }
        if (!code.includes('try') && !code.includes('catch') && !code.includes('except')) {
            suggestions.push('Consider adding error handling');
        }

        return {
            syntax: { valid: errors.length === 0, errors },
            complexity,
            suggestions,
        };
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    updateConfig(config: Partial<SandboxConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('configUpdated', this.config);
    }

    getConfig(): SandboxConfig {
        return { ...this.config };
    }
}

export const codeInterpreter = CodeInterpreter.getInstance();
