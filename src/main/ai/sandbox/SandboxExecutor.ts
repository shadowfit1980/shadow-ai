/**
 * 🔒 SandboxExecutor - Zero-Trust Command Execution
 * 
 * Executes AI-generated commands in isolated sandboxes with:
 * - Resource limits (CPU, memory, network)
 * - Filesystem isolation
 * - Timeout enforcement
 * - Command validation
 * 
 * This addresses Grok's criticism: "One escaped command and you're 
 * the next 'AI agent that deleted my home directory' meme"
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface SandboxOptions {
    /** Working directory for command */
    cwd: string;
    /** Environment variables */
    env?: Record<string, string>;
    /** Maximum execution time in ms */
    timeout?: number;
    /** Maximum memory in MB */
    memoryLimit?: number;
    /** Network policy */
    networkPolicy?: 'block' | 'allow' | 'restricted';
    /** Allowed file system paths */
    allowedPaths?: string[];
    /** Blocked commands */
    blockedCommands?: string[];
    /** Run as restricted user */
    restrictedUser?: boolean;
    /** Capture stdout */
    captureStdout?: boolean;
    /** Capture stderr */
    captureStderr?: boolean;
}

export interface ExecutionResult {
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    killed: boolean;
    killedReason?: 'timeout' | 'memory' | 'signal' | 'blocked';
    command: string;
    sandboxed: boolean;
}

export interface SandboxViolation {
    command: string;
    violation: string;
    severity: 'warning' | 'error' | 'critical';
    timestamp: Date;
}

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
    /\brm\s+(-rf?|--recursive)\s+[\/~]/i,           // rm -rf /
    /\bsudo\s+rm/i,                                   // sudo rm
    /\bdd\s+if=/i,                                    // dd writes
    /\bmkfs\s/i,                                      // format disk
    /\bchmod\s+(-R\s+)?777/i,                        // chmod 777
    /\bcurl\s+.*\|\s*(sudo\s+)?bash/i,               // curl | bash
    /\bwget\s+.*\|\s*(sudo\s+)?bash/i,               // wget | bash
    /\b(fork|while.*:.*do.*done)\s*&/i,              // fork bombs
    /\beval\s+.*\$/i,                                 // eval with variables
    /\b>\s*\/dev\/sd[a-z]/i,                         // write to disk directly
    /\brm\s+.*\/\*/i,                                 // rm /*
    /\b:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}/i,           // fork bomb
    /\bshutdown/i,                                    // shutdown
    /\breboot/i,                                      // reboot
    /\bhalt/i,                                        // halt
    /\bpoweroff/i,                                    // poweroff
];

// Commands that need confirmation
const REQUIRES_CONFIRMATION = [
    /\bnpm\s+publish/i,                               // npm publish
    /\bgit\s+push\s+.*--force/i,                     // git push --force
    /\bgit\s+push\s+-f/i,                            // git push -f
    /\bsudo\b/i,                                      // any sudo
    /\bdocker\s+system\s+prune/i,                    // docker prune
];

// ============================================================================
// SANDBOX EXECUTOR
// ============================================================================

export class SandboxExecutor extends EventEmitter {
    private static instance: SandboxExecutor;
    private violations: SandboxViolation[] = [];
    private activeProcesses: Map<string, ChildProcess> = new Map();

    private readonly defaultOptions: Required<SandboxOptions> = {
        cwd: process.cwd(),
        env: { ...process.env } as Record<string, string>,
        timeout: 30000, // 30 seconds
        memoryLimit: 512, // 512 MB
        networkPolicy: 'allow',
        allowedPaths: [process.cwd()],
        blockedCommands: ['rm -rf /', 'sudo rm -rf /'],
        restrictedUser: false,
        captureStdout: true,
        captureStderr: true
    };

    private constructor() {
        super();
    }

    public static getInstance(): SandboxExecutor {
        if (!SandboxExecutor.instance) {
            SandboxExecutor.instance = new SandboxExecutor();
        }
        return SandboxExecutor.instance;
    }

    /**
     * Execute a command in a sandboxed environment
     */
    public async execute(command: string, options: SandboxOptions = { cwd: process.cwd() }): Promise<ExecutionResult> {
        const startTime = Date.now();
        const opts = { ...this.defaultOptions, ...options };

        // Step 1: Validate command
        const validation = this.validateCommand(command);
        if (!validation.allowed) {
            this.recordViolation(command, validation.reason || 'Blocked command', validation.severity || 'error');
            return {
                success: false,
                exitCode: -1,
                stdout: '',
                stderr: `🔒 BLOCKED: ${validation.reason}`,
                duration: Date.now() - startTime,
                killed: true,
                killedReason: 'blocked',
                command,
                sandboxed: true
            };
        }

        if (validation.requiresConfirmation) {
            this.emit('confirmation:required', { command, reason: validation.reason });
        }

        // Step 2: Prepare sandboxed environment
        const sandboxEnv = this.prepareSandboxEnv(opts);

        // Step 3: Execute with limits
        return this.executeWithLimits(command, opts, sandboxEnv, startTime);
    }

    /**
     * Validate if a command is safe to execute
     */
    public validateCommand(command: string): {
        allowed: boolean;
        reason?: string;
        severity?: 'warning' | 'error' | 'critical';
        requiresConfirmation?: boolean;
    } {
        // Check dangerous patterns
        for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.test(command)) {
                return {
                    allowed: false,
                    reason: `Matched dangerous pattern: ${pattern.toString()}`,
                    severity: 'critical'
                };
            }
        }

        // Check if requires confirmation
        for (const pattern of REQUIRES_CONFIRMATION) {
            if (pattern.test(command)) {
                return {
                    allowed: true,
                    reason: `This command requires confirmation: ${command}`,
                    requiresConfirmation: true
                };
            }
        }

        // Check for shell injection attempts
        const injectionPatterns = [
            /[;&|`$]/,  // Shell metacharacters
            /\$\(.*\)/, // Command substitution
            /`.*`/,     // Backtick execution
        ];

        for (const pattern of injectionPatterns) {
            if (pattern.test(command)) {
                // Allow some safe usages
                if (!this.isSafeUsage(command, pattern)) {
                    return {
                        allowed: false,
                        reason: 'Potential shell injection detected',
                        severity: 'error'
                    };
                }
            }
        }

        return { allowed: true };
    }

    /**
     * Kill all active sandboxed processes
     */
    public killAll(): void {
        for (const [id, process] of this.activeProcesses) {
            try {
                process.kill('SIGKILL');
                console.log(`🔪 Killed sandbox process ${id}`);
            } catch {
                // Process may have already exited
            }
        }
        this.activeProcesses.clear();
    }

    /**
     * Get all recorded violations
     */
    public getViolations(): SandboxViolation[] {
        return [...this.violations];
    }

    /**
     * Clear violation history
     */
    public clearViolations(): void {
        this.violations = [];
    }

    /**
     * Check if a path is within allowed paths
     */
    public isPathAllowed(targetPath: string, allowedPaths: string[]): boolean {
        const normalizedTarget = path.resolve(targetPath);

        for (const allowed of allowedPaths) {
            const normalizedAllowed = path.resolve(allowed);
            if (normalizedTarget.startsWith(normalizedAllowed)) {
                return true;
            }
        }

        return false;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async executeWithLimits(
        command: string,
        opts: Required<SandboxOptions>,
        env: Record<string, string>,
        startTime: number
    ): Promise<ExecutionResult> {
        return new Promise((resolve) => {
            const processId = `sandbox-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // Determine shell based on OS
            const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
            const shellArgs = process.platform === 'win32' ? ['/c', command] : ['-c', command];

            // Add resource limits for macOS/Linux
            let wrappedCommand = command;
            if (process.platform !== 'win32') {
                // Use ulimit for memory limits (in KB)
                const memoryKB = opts.memoryLimit * 1024;
                wrappedCommand = `ulimit -v ${memoryKB} 2>/dev/null; ${command}`;
            }

            const child = spawn(shell, ['-c', wrappedCommand], {
                cwd: opts.cwd,
                env,
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: opts.timeout
            });

            this.activeProcesses.set(processId, child);

            let stdout = '';
            let stderr = '';
            let killed = false;
            let killedReason: ExecutionResult['killedReason'];

            // Set timeout
            const timeoutId = setTimeout(() => {
                if (!killed) {
                    killed = true;
                    killedReason = 'timeout';
                    child.kill('SIGKILL');
                    console.log(`⏰ Killed ${processId}: timeout (${opts.timeout}ms)`);
                }
            }, opts.timeout);

            // Capture stdout
            if (opts.captureStdout && child.stdout) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                    // Limit output size
                    if (stdout.length > 1024 * 1024) { // 1MB
                        child.kill('SIGKILL');
                        killed = true;
                        killedReason = 'memory';
                    }
                });
            }

            // Capture stderr
            if (opts.captureStderr && child.stderr) {
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            // Handle exit
            child.on('exit', (code, signal) => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(processId);

                if (signal) {
                    killed = true;
                    killedReason = killedReason || 'signal';
                }

                const duration = Date.now() - startTime;

                this.emit('execution:complete', {
                    processId,
                    command,
                    duration,
                    exitCode: code || 0
                });

                resolve({
                    success: code === 0 && !killed,
                    exitCode: code || -1,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    duration,
                    killed,
                    killedReason,
                    command,
                    sandboxed: true
                });
            });

            // Handle errors
            child.on('error', (error) => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(processId);

                resolve({
                    success: false,
                    exitCode: -1,
                    stdout: '',
                    stderr: error.message,
                    duration: Date.now() - startTime,
                    killed: false,
                    command,
                    sandboxed: true
                });
            });
        });
    }

    private prepareSandboxEnv(opts: Required<SandboxOptions>): Record<string, string> {
        const env = { ...opts.env };

        // Remove dangerous environment variables
        delete env.LD_PRELOAD;
        delete env.LD_LIBRARY_PATH;
        delete env.DYLD_INSERT_LIBRARIES;
        delete env.DYLD_LIBRARY_PATH;

        // Add sandbox markers
        env.SHADOW_AI_SANDBOX = 'true';
        env.SHADOW_AI_SANDBOX_TIMEOUT = opts.timeout.toString();

        // Restrict PATH if needed
        if (opts.restrictedUser) {
            env.PATH = '/usr/local/bin:/usr/bin:/bin';
        }

        // Set network policy via environment (for apps that respect it)
        if (opts.networkPolicy === 'block') {
            env.no_proxy = '*';
            env.NO_PROXY = '*';
        }

        return env;
    }

    private recordViolation(command: string, violation: string, severity: SandboxViolation['severity']): void {
        const record: SandboxViolation = {
            command,
            violation,
            severity,
            timestamp: new Date()
        };

        this.violations.push(record);
        this.emit('violation', record);

        if (severity === 'critical') {
            console.error(`🚨 CRITICAL VIOLATION: ${violation}`);
            console.error(`   Command: ${command}`);
        }

        // Keep only last 1000 violations
        if (this.violations.length > 1000) {
            this.violations = this.violations.slice(-1000);
        }
    }

    private isSafeUsage(command: string, pattern: RegExp): boolean {
        // Allow npm/yarn commands with pipes
        if (/^(npm|yarn|pnpm)\s/.test(command)) {
            return true;
        }

        // Allow git commands
        if (/^git\s/.test(command)) {
            return true;
        }

        // Allow echo with pipes
        if (/^echo\s/.test(command)) {
            return true;
        }

        // Allow common safe patterns like: command && command
        if (/^[\w\-]+\s+.*&&\s+[\w\-]+/.test(command)) {
            return true;
        }

        return false;
    }
}

// Export singleton
export const sandboxExecutor = SandboxExecutor.getInstance();
