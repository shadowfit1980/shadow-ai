/**
 * ExecutionSandbox - Docker-based Code & Command Isolation
 * 
 * Provides secure execution environment for:
 * - Shell commands
 * - Code execution (Node.js, Python, etc.)
 * - Build processes
 * 
 * Security features:
 * - Network isolation (disabled by default)
 * - Resource limits (CPU, memory, time)
 * - Read-only code mounting
 * - Automatic container cleanup
 * 
 * Fallback: vm2 for JavaScript-only isolation when Docker unavailable
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface SandboxConfig {
    /** Docker image to use (e.g., 'node:20-alpine', 'python:3.11-slim') */
    image: string;
    /** Execution timeout in milliseconds */
    timeout: number;
    /** Memory limit (e.g., '256m', '1g') */
    memoryLimit: string;
    /** CPU limit (0.5 = 50% of one core) */
    cpuLimit: number;
    /** Disable network access */
    networkDisabled: boolean;
    /** Working directory inside container */
    workDir: string;
    /** Environment variables */
    env: Record<string, string>;
}

export interface ExecutionRequest {
    /** Command or code to execute */
    command: string;
    /** Language/runtime ('shell', 'node', 'python', 'typescript') */
    language: 'shell' | 'node' | 'python' | 'typescript';
    /** Optional working directory to mount */
    workingDirectory?: string;
    /** Optional files to include */
    files?: { name: string; content: string }[];
    /** Custom config overrides */
    config?: Partial<SandboxConfig>;
}

export interface ExecutionResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    duration: number;
    timedOut: boolean;
    resourceUsage: ResourceMetrics;
    containerId?: string;
}

export interface ResourceMetrics {
    memoryUsedMB: number;
    cpuPercent: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_CONFIG: SandboxConfig = {
    image: 'node:20-alpine',
    timeout: 30000,
    memoryLimit: '256m',
    cpuLimit: 0.5,
    networkDisabled: true,
    workDir: '/sandbox',
    env: {}
};

const LANGUAGE_IMAGES: Record<string, string> = {
    shell: 'alpine:3.19',
    node: 'node:20-alpine',
    python: 'python:3.11-slim',
    typescript: 'node:20-alpine'
};

const LANGUAGE_COMMANDS: Record<string, (code: string) => string[]> = {
    shell: (code) => ['sh', '-c', code],
    node: (code) => ['node', '-e', code],
    python: (code) => ['python3', '-c', code],
    typescript: (code) => ['npx', 'tsx', '-e', code]
};

// ============================================================================
// EXECUTION SANDBOX CLASS
// ============================================================================

export class ExecutionSandbox {
    private dockerAvailable: boolean = false;
    private initialized: boolean = false;
    private activeContainers: Set<string> = new Set();

    constructor() {
        console.log('[ExecutionSandbox] Initializing...');
    }

    /**
     * Initialize sandbox and check Docker availability
     */
    async initialize(): Promise<boolean> {
        if (this.initialized) return this.dockerAvailable;

        try {
            // Check if Docker is available
            const { stdout } = await execAsync('docker --version');
            console.log(`[ExecutionSandbox] Docker detected: ${stdout.trim()}`);

            // Check if Docker daemon is running
            await execAsync('docker info');
            this.dockerAvailable = true;
            console.log('[ExecutionSandbox] Docker daemon is running');

            // Pull common images in background
            this.prewarmImages();
        } catch (error) {
            console.warn('[ExecutionSandbox] Docker not available, using fallback mode');
            this.dockerAvailable = false;
        }

        this.initialized = true;
        return this.dockerAvailable;
    }

    /**
     * Pre-pull common images for faster execution
     */
    private async prewarmImages(): Promise<void> {
        const images = Object.values(LANGUAGE_IMAGES);
        for (const image of images) {
            try {
                await execAsync(`docker pull ${image}`, { timeout: 60000 });
                console.log(`[ExecutionSandbox] Prewarmed image: ${image}`);
            } catch {
                // Ignore pull failures, will try again at runtime
            }
        }
    }

    /**
     * Execute code/command in isolated sandbox
     */
    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        await this.initialize();

        const startTime = Date.now();
        const config = this.buildConfig(request);

        if (this.dockerAvailable) {
            return this.executeInDocker(request, config, startTime);
        } else {
            return this.executeInFallback(request, config, startTime);
        }
    }

    /**
     * Execute in Docker container
     */
    private async executeInDocker(
        request: ExecutionRequest,
        config: SandboxConfig,
        startTime: number
    ): Promise<ExecutionResult> {
        const containerId = `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        let tempDir: string | null = null;

        try {
            // Create temp directory for files if needed
            if (request.files && request.files.length > 0) {
                tempDir = await this.createTempDirectory(request.files);
            }

            // Build Docker command
            const dockerArgs = this.buildDockerArgs(containerId, config, tempDir);
            const cmdArgs = LANGUAGE_COMMANDS[request.language](request.command);

            // Execute in Docker
            const result = await this.runDockerContainer(
                dockerArgs,
                cmdArgs,
                config.timeout
            );

            this.activeContainers.add(containerId);

            return {
                success: result.exitCode === 0,
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                duration: Date.now() - startTime,
                timedOut: result.timedOut,
                resourceUsage: await this.getResourceUsage(containerId),
                containerId
            };
        } finally {
            // Cleanup
            await this.cleanupContainer(containerId);
            if (tempDir) {
                await fs.rm(tempDir, { recursive: true, force: true });
            }
        }
    }

    /**
     * Build Docker run arguments
     */
    private buildDockerArgs(
        containerId: string,
        config: SandboxConfig,
        tempDir: string | null
    ): string[] {
        const args: string[] = [
            'run',
            '--rm',
            '--name', containerId,
            '--memory', config.memoryLimit,
            '--cpus', config.cpuLimit.toString(),
            '--pids-limit', '100',
            '--read-only',
            '--security-opt', 'no-new-privileges',
            '--cap-drop', 'ALL'
        ];

        // Network isolation
        if (config.networkDisabled) {
            args.push('--network', 'none');
        }

        // Mount temp directory if files provided
        if (tempDir) {
            args.push('-v', `${tempDir}:${config.workDir}:ro`);
            args.push('-w', config.workDir);
        }

        // Writable tmp directory
        args.push('--tmpfs', '/tmp:rw,noexec,nosuid,size=64m');

        // Environment variables
        for (const [key, value] of Object.entries(config.env)) {
            args.push('-e', `${key}=${value}`);
        }

        // Image
        args.push(config.image);

        return args;
    }

    /**
     * Run Docker container and capture output
     */
    private async runDockerContainer(
        dockerArgs: string[],
        cmdArgs: string[],
        timeout: number
    ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
        return new Promise((resolve) => {
            const fullArgs = [...dockerArgs, ...cmdArgs];
            const proc = spawn('docker', fullArgs);

            let stdout = '';
            let stderr = '';
            let timedOut = false;

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                // Limit output size
                if (stdout.length > 1024 * 1024) {
                    stdout = stdout.substring(0, 1024 * 1024) + '\n[OUTPUT TRUNCATED]';
                    proc.kill('SIGKILL');
                }
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                if (stderr.length > 1024 * 1024) {
                    stderr = stderr.substring(0, 1024 * 1024) + '\n[OUTPUT TRUNCATED]';
                    proc.kill('SIGKILL');
                }
            });

            const timer = setTimeout(() => {
                timedOut = true;
                proc.kill('SIGKILL');
            }, timeout);

            proc.on('close', (code) => {
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr,
                    exitCode: code ?? 1,
                    timedOut
                });
            });

            proc.on('error', (error) => {
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr: error.message,
                    exitCode: 1,
                    timedOut: false
                });
            });
        });
    }

    /**
     * Fallback execution for when Docker is unavailable
     * Uses restricted child_process with timeouts
     */
    private async executeInFallback(
        request: ExecutionRequest,
        config: SandboxConfig,
        startTime: number
    ): Promise<ExecutionResult> {
        console.warn('[ExecutionSandbox] Using fallback mode - LIMITED ISOLATION');

        // Only allow specific safe languages in fallback
        if (!['node', 'shell'].includes(request.language)) {
            return {
                success: false,
                stdout: '',
                stderr: `Language '${request.language}' requires Docker for safe execution`,
                exitCode: 1,
                duration: Date.now() - startTime,
                timedOut: false,
                resourceUsage: { memoryUsedMB: 0, cpuPercent: 0 }
            };
        }

        const cmdArgs = LANGUAGE_COMMANDS[request.language](request.command);
        const cmd = cmdArgs.join(' ');

        try {
            const { stdout, stderr } = await execAsync(cmd, {
                timeout: config.timeout,
                maxBuffer: 1024 * 1024,
                env: { ...process.env, ...config.env }
            });

            return {
                success: true,
                stdout,
                stderr,
                exitCode: 0,
                duration: Date.now() - startTime,
                timedOut: false,
                resourceUsage: { memoryUsedMB: 0, cpuPercent: 0 }
            };
        } catch (error: any) {
            return {
                success: false,
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                exitCode: error.code || 1,
                duration: Date.now() - startTime,
                timedOut: error.killed || false,
                resourceUsage: { memoryUsedMB: 0, cpuPercent: 0 }
            };
        }
    }

    /**
     * Create temporary directory with files
     */
    private async createTempDirectory(files: { name: string; content: string }[]): Promise<string> {
        const tempDir = path.join(os.tmpdir(), `sandbox-${Date.now()}`);
        await fs.mkdir(tempDir, { recursive: true });

        for (const file of files) {
            const filePath = path.join(tempDir, file.name);
            const fileDir = path.dirname(filePath);
            await fs.mkdir(fileDir, { recursive: true });
            await fs.writeFile(filePath, file.content);
        }

        return tempDir;
    }

    /**
     * Get resource usage for container
     */
    private async getResourceUsage(containerId: string): Promise<ResourceMetrics> {
        try {
            const { stdout } = await execAsync(
                `docker stats ${containerId} --no-stream --format "{{.MemUsage}} {{.CPUPerc}}"`,
                { timeout: 5000 }
            );

            const [memStr, cpuStr] = stdout.trim().split(' ');
            const memMatch = memStr?.match(/(\d+\.?\d*)MiB/);
            const cpuMatch = cpuStr?.match(/(\d+\.?\d*)%/);

            return {
                memoryUsedMB: memMatch ? parseFloat(memMatch[1]) : 0,
                cpuPercent: cpuMatch ? parseFloat(cpuMatch[1]) : 0
            };
        } catch {
            return { memoryUsedMB: 0, cpuPercent: 0 };
        }
    }

    /**
     * Cleanup container
     */
    private async cleanupContainer(containerId: string): Promise<void> {
        try {
            await execAsync(`docker rm -f ${containerId}`, { timeout: 5000 });
            this.activeContainers.delete(containerId);
        } catch {
            // Container may already be removed
        }
    }

    /**
     * Build config from request
     */
    private buildConfig(request: ExecutionRequest): SandboxConfig {
        const image = LANGUAGE_IMAGES[request.language] || DEFAULT_CONFIG.image;
        return {
            ...DEFAULT_CONFIG,
            image,
            ...request.config
        };
    }

    /**
     * Cleanup all active containers (for shutdown)
     */
    async cleanupAll(): Promise<void> {
        const cleanups = Array.from(this.activeContainers).map(id =>
            this.cleanupContainer(id)
        );
        await Promise.all(cleanups);
        console.log('[ExecutionSandbox] All containers cleaned up');
    }

    /**
     * Check if execution is safe (validation before running)
     */
    validateRequest(request: ExecutionRequest): { valid: boolean; issues: string[] } {
        const issues: string[] = [];

        // Check for obviously dangerous patterns
        const dangerousPatterns = [
            /rm\s+-rf\s+\/(?!\w)/,        // rm -rf /
            /mkfs\./,                      // Format filesystem
            /dd\s+if=.*of=\/dev/,          // Direct disk write
            />\s*\/dev\/sd/,               // Write to device
            /:(){ :|:& };:/,               // Fork bomb
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(request.command)) {
                issues.push(`Dangerous command pattern detected: ${pattern.source}`);
            }
        }

        // Check timeout
        if (request.config?.timeout && request.config.timeout > 300000) {
            issues.push('Timeout exceeds maximum allowed (5 minutes)');
        }

        // Check memory limit
        const memLimit = request.config?.memoryLimit;
        if (memLimit) {
            const match = memLimit.match(/^(\d+)([mg])$/i);
            if (match) {
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                const mb = unit === 'g' ? value * 1024 : value;
                if (mb > 2048) {
                    issues.push('Memory limit exceeds maximum allowed (2GB)');
                }
            }
        }

        return { valid: issues.length === 0, issues };
    }

    /**
     * Get sandbox status
     */
    getStatus(): { dockerAvailable: boolean; activeContainers: number } {
        return {
            dockerAvailable: this.dockerAvailable,
            activeContainers: this.activeContainers.size
        };
    }
}

// Singleton instance
export const executionSandbox = new ExecutionSandbox();
