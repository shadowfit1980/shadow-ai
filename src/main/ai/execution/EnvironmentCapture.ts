/**
 * EnvironmentCapture - Reproducible Execution Environment
 * 
 * Captures and records runtime environment details for reproducibility:
 * - Runtime versions (Node, Python, Go, etc.)
 * - System information
 * - Dependency versions
 * - Environment variables (filtered)
 * - Execution metadata
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RuntimeInfo {
    name: string;
    version: string;
    path: string;
    available: boolean;
}

export interface SystemInfo {
    platform: string;
    arch: string;
    osVersion: string;
    hostname: string;
    cpuCount: number;
    totalMemoryMB: number;
    freeMemoryMB: number;
}

export interface DependencyInfo {
    name: string;
    version: string;
    resolved?: string;
    integrity?: string;
}

export interface EnvironmentSnapshot {
    id: string;
    capturedAt: string;
    system: SystemInfo;
    runtimes: RuntimeInfo[];
    dependencies: DependencyInfo[];
    environmentVariables: Record<string, string>;
    metadata: Record<string, any>;
}

export interface ExecutionRecord {
    executionId: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: 'success' | 'failed' | 'timeout';
    environment: EnvironmentSnapshot;
    inputs: {
        code: string;
        codeHash: string;
        language: string;
    };
    outputs: {
        stdout: string;
        stderr: string;
        exitCode: number;
    };
    reproducibilityHash: string;
}

export class EnvironmentCapture {
    private static instance: EnvironmentCapture;
    private cachedRuntimes: RuntimeInfo[] | null = null;
    private recordsPath: string;

    private constructor() {
        this.recordsPath = path.join(os.tmpdir(), 'shadow-execution-records');
        this.ensureRecordsDir();
    }

    static getInstance(): EnvironmentCapture {
        if (!EnvironmentCapture.instance) {
            EnvironmentCapture.instance = new EnvironmentCapture();
        }
        return EnvironmentCapture.instance;
    }

    private async ensureRecordsDir(): Promise<void> {
        try {
            await fs.mkdir(this.recordsPath, { recursive: true });
        } catch (error) {
            console.warn('[EnvironmentCapture] Failed to create records dir:', error);
        }
    }

    /**
     * Capture current system information
     */
    captureSystemInfo(): SystemInfo {
        return {
            platform: os.platform(),
            arch: os.arch(),
            osVersion: os.release(),
            hostname: os.hostname(),
            cpuCount: os.cpus().length,
            totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
            freeMemoryMB: Math.round(os.freemem() / (1024 * 1024))
        };
    }

    /**
     * Detect available runtimes
     */
    async detectRuntimes(): Promise<RuntimeInfo[]> {
        if (this.cachedRuntimes) {
            return this.cachedRuntimes;
        }

        const runtimes: RuntimeInfo[] = [];

        const checks = [
            { name: 'node', cmd: 'node --version' },
            { name: 'npm', cmd: 'npm --version' },
            { name: 'python', cmd: 'python3 --version' },
            { name: 'go', cmd: 'go version' },
            { name: 'rust', cmd: 'rustc --version' },
            { name: 'java', cmd: 'java --version 2>&1 | head -1' },
            { name: 'deno', cmd: 'deno --version 2>&1 | head -1' },
            { name: 'bun', cmd: 'bun --version' },
        ];

        for (const check of checks) {
            try {
                const { stdout } = await execAsync(check.cmd, { timeout: 5000 });
                const version = stdout.trim().replace(/^v/, '');

                // Get path
                let runtimePath = '';
                try {
                    const { stdout: pathOut } = await execAsync(`which ${check.name}`);
                    runtimePath = pathOut.trim();
                } catch {
                    runtimePath = 'unknown';
                }

                runtimes.push({
                    name: check.name,
                    version,
                    path: runtimePath,
                    available: true
                });
            } catch {
                runtimes.push({
                    name: check.name,
                    version: 'N/A',
                    path: '',
                    available: false
                });
            }
        }

        this.cachedRuntimes = runtimes;
        return runtimes;
    }

    /**
     * Parse dependencies from package.json
     */
    async parseDependencies(projectPath: string): Promise<DependencyInfo[]> {
        const deps: DependencyInfo[] = [];

        const packageJsonPath = path.join(projectPath, 'package.json');
        try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(content);

            const allDeps = {
                ...pkg.dependencies,
                ...pkg.devDependencies
            };

            for (const [name, version] of Object.entries(allDeps)) {
                deps.push({
                    name,
                    version: version as string
                });
            }
        } catch {
            // No package.json or parse error
        }

        return deps;
    }

    /**
     * Get filtered environment variables (safe to log)
     */
    getFilteredEnv(): Record<string, string> {
        const filtered: Record<string, string> = {};
        const safeVars = [
            'NODE_ENV', 'PATH', 'HOME', 'USER', 'SHELL', 'TERM',
            'LANG', 'LC_ALL', 'PWD', 'TMPDIR', 'EDITOR'
        ];

        for (const varName of safeVars) {
            if (process.env[varName]) {
                filtered[varName] = process.env[varName]!;
            }
        }

        return filtered;
    }

    /**
     * Create a complete environment snapshot
     */
    async createSnapshot(metadata: Record<string, any> = {}): Promise<EnvironmentSnapshot> {
        const runtimes = await this.detectRuntimes();

        return {
            id: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            capturedAt: new Date().toISOString(),
            system: this.captureSystemInfo(),
            runtimes,
            dependencies: [],
            environmentVariables: this.getFilteredEnv(),
            metadata
        };
    }

    /**
     * Create an execution record
     */
    async createExecutionRecord(params: {
        executionId: string;
        code: string;
        language: string;
        stdout: string;
        stderr: string;
        exitCode: number;
        startTime: Date;
        endTime: Date;
        status: 'success' | 'failed' | 'timeout';
    }): Promise<ExecutionRecord> {
        const environment = await this.createSnapshot({
            executionId: params.executionId,
            language: params.language
        });

        const record: ExecutionRecord = {
            executionId: params.executionId,
            startTime: params.startTime.toISOString(),
            endTime: params.endTime.toISOString(),
            duration: params.endTime.getTime() - params.startTime.getTime(),
            status: params.status,
            environment,
            inputs: {
                code: params.code,
                codeHash: this.hashString(params.code),
                language: params.language
            },
            outputs: {
                stdout: params.stdout,
                stderr: params.stderr,
                exitCode: params.exitCode
            },
            reproducibilityHash: this.computeReproducibilityHash(params.code, environment)
        };

        // Save to disk
        await this.saveRecord(record);

        return record;
    }

    /**
     * Save execution record to disk
     */
    private async saveRecord(record: ExecutionRecord): Promise<void> {
        const filename = `${record.executionId}.json`;
        const filepath = path.join(this.recordsPath, filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(record, null, 2));
            console.log(`[EnvironmentCapture] Saved record: ${filename}`);
        } catch (error) {
            console.warn('[EnvironmentCapture] Failed to save record:', error);
        }
    }

    /**
     * Load execution record from disk
     */
    async loadRecord(executionId: string): Promise<ExecutionRecord | null> {
        const filepath = path.join(this.recordsPath, `${executionId}.json`);

        try {
            const content = await fs.readFile(filepath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    /**
     * List all execution records
     */
    async listRecords(): Promise<string[]> {
        try {
            const files = await fs.readdir(this.recordsPath);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''));
        } catch {
            return [];
        }
    }

    /**
     * Simple hash function for strings
     */
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    /**
     * Compute reproducibility hash
     */
    private computeReproducibilityHash(
        code: string,
        environment: EnvironmentSnapshot
    ): string {
        const components = [
            this.hashString(code),
            environment.system.platform,
            environment.system.arch,
            environment.runtimes.filter(r => r.available).map(r => `${r.name}:${r.version}`).join(',')
        ];

        return this.hashString(components.join('|'));
    }

    /**
     * Compare two snapshots for compatibility
     */
    compareSnapshots(a: EnvironmentSnapshot, b: EnvironmentSnapshot): {
        compatible: boolean;
        differences: string[];
    } {
        const differences: string[] = [];

        if (a.system.platform !== b.system.platform) {
            differences.push(`Platform: ${a.system.platform} vs ${b.system.platform}`);
        }

        if (a.system.arch !== b.system.arch) {
            differences.push(`Architecture: ${a.system.arch} vs ${b.system.arch}`);
        }

        // Check runtime versions
        for (const runtimeA of a.runtimes.filter(r => r.available)) {
            const runtimeB = b.runtimes.find(r => r.name === runtimeA.name);
            if (!runtimeB?.available) {
                differences.push(`Runtime missing: ${runtimeA.name}`);
            } else if (runtimeA.version !== runtimeB.version) {
                differences.push(`${runtimeA.name}: ${runtimeA.version} vs ${runtimeB.version}`);
            }
        }

        return {
            compatible: differences.length === 0,
            differences
        };
    }
}

export const environmentCapture = EnvironmentCapture.getInstance();
