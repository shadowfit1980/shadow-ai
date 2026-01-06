/**
 * SandboxPolicy - Security Policy Enforcement
 * 
 * Defines and enforces security policies for code execution:
 * - Resource limits (CPU, memory, time)
 * - Network access control
 * - Filesystem access restrictions
 * - Syscall filtering
 */

import { SandboxLanguage } from './UniversalSandbox';

export interface SecurityPolicy {
    name: string;
    description: string;

    // Resource limits
    maxCpuTimeMs: number;
    maxWallTimeMs: number;
    maxMemoryMB: number;
    maxOutputBytes: number;
    maxFileDescriptors: number;
    maxProcesses: number;

    // Network
    allowNetwork: boolean;
    allowedHosts?: string[];
    allowedPorts?: number[];

    // Filesystem
    allowFilesystem: boolean;
    readOnlyPaths: string[];
    readWritePaths: string[];
    forbiddenPaths: string[];

    // Execution
    allowShellSpawn: boolean;
    allowDynamicCodeExec: boolean;  // eval, exec, etc.

    // Environment
    inheritEnv: boolean;
    allowedEnvVars: string[];
}

// Predefined security levels
export const SECURITY_POLICIES: Record<string, SecurityPolicy> = {
    // Strictest - for untrusted code
    strict: {
        name: 'strict',
        description: 'Maximum isolation for untrusted code',
        maxCpuTimeMs: 5000,
        maxWallTimeMs: 10000,
        maxMemoryMB: 128,
        maxOutputBytes: 1024 * 1024, // 1MB
        maxFileDescriptors: 32,
        maxProcesses: 1,
        allowNetwork: false,
        allowedHosts: [],
        allowedPorts: [],
        allowFilesystem: false,
        readOnlyPaths: [],
        readWritePaths: [],
        forbiddenPaths: ['/', '/etc', '/usr', '/bin', '/home', '/root'],
        allowShellSpawn: false,
        allowDynamicCodeExec: false,
        inheritEnv: false,
        allowedEnvVars: ['NODE_ENV', 'PATH']
    },

    // Standard - for internal code
    standard: {
        name: 'standard',
        description: 'Balanced security for internal code',
        maxCpuTimeMs: 30000,
        maxWallTimeMs: 60000,
        maxMemoryMB: 512,
        maxOutputBytes: 10 * 1024 * 1024, // 10MB
        maxFileDescriptors: 128,
        maxProcesses: 4,
        allowNetwork: false,
        allowedHosts: [],
        allowedPorts: [],
        allowFilesystem: true,
        readOnlyPaths: ['/usr', '/bin', '/lib'],
        readWritePaths: ['/tmp'],
        forbiddenPaths: ['/etc/passwd', '/etc/shadow', '/root'],
        allowShellSpawn: true,
        allowDynamicCodeExec: true,
        inheritEnv: true,
        allowedEnvVars: ['NODE_ENV', 'PATH', 'HOME', 'USER', 'LANG']
    },

    // Permissive - for trusted code that needs network
    permissive: {
        name: 'permissive',
        description: 'Less restrictive for trusted code',
        maxCpuTimeMs: 120000,
        maxWallTimeMs: 300000,
        maxMemoryMB: 2048,
        maxOutputBytes: 100 * 1024 * 1024, // 100MB
        maxFileDescriptors: 256,
        maxProcesses: 16,
        allowNetwork: true,
        allowedHosts: ['*'],
        allowedPorts: [80, 443, 8080, 3000],
        allowFilesystem: true,
        readOnlyPaths: ['/usr', '/bin', '/lib', '/etc'],
        readWritePaths: ['/tmp', '/var/tmp'],
        forbiddenPaths: ['/etc/shadow', '/root/.ssh'],
        allowShellSpawn: true,
        allowDynamicCodeExec: true,
        inheritEnv: true,
        allowedEnvVars: ['*']
    }
};

// Language-specific default policies
export const LANGUAGE_POLICIES: Record<SandboxLanguage, string> = {
    javascript: 'standard',
    typescript: 'standard',
    python: 'standard',
    go: 'standard',
    rust: 'standard',
    java: 'standard'
};

export class SandboxPolicyEnforcer {
    private policy: SecurityPolicy;

    constructor(policy: SecurityPolicy | string = 'standard') {
        if (typeof policy === 'string') {
            this.policy = SECURITY_POLICIES[policy] || SECURITY_POLICIES.standard;
        } else {
            this.policy = policy;
        }
    }

    /**
     * Get resource limit arguments for child process
     */
    getResourceLimitArgs(): string[] {
        const args: string[] = [];

        // Timeout
        args.push(`--timeout=${this.policy.maxWallTimeMs}`);

        // Memory (for Node.js)
        const memMB = this.policy.maxMemoryMB;
        args.push(`--max-old-space-size=${memMB}`);

        return args;
    }

    /**
     * Get environment variables for the sandbox
     */
    getSanitizedEnv(): Record<string, string> {
        const env: Record<string, string> = {};

        if (!this.policy.inheritEnv) {
            // Only add explicitly allowed vars
            for (const varName of this.policy.allowedEnvVars) {
                if (varName === '*') {
                    return { ...process.env } as Record<string, string>;
                }
                if (process.env[varName]) {
                    env[varName] = process.env[varName]!;
                }
            }
        } else {
            // Start with process.env, filter if needed
            if (this.policy.allowedEnvVars.includes('*')) {
                return { ...process.env } as Record<string, string>;
            }
            for (const varName of this.policy.allowedEnvVars) {
                if (process.env[varName]) {
                    env[varName] = process.env[varName]!;
                }
            }
        }

        // Always set sandbox indicator
        env.SHADOW_SANDBOX = '1';
        env.SANDBOX_POLICY = this.policy.name;

        return env;
    }

    /**
     * Check if a path is allowed for the given operation
     */
    isPathAllowed(filepath: string, operation: 'read' | 'write'): boolean {
        // Check forbidden paths first
        for (const forbidden of this.policy.forbiddenPaths) {
            if (filepath.startsWith(forbidden)) {
                return false;
            }
        }

        if (!this.policy.allowFilesystem) {
            return false;
        }

        if (operation === 'write') {
            // Check if in writable paths
            for (const writePath of this.policy.readWritePaths) {
                if (filepath.startsWith(writePath)) {
                    return true;
                }
            }
            return false;
        }

        // Read operation
        for (const readPath of [...this.policy.readOnlyPaths, ...this.policy.readWritePaths]) {
            if (filepath.startsWith(readPath)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a network request is allowed
     */
    isNetworkAllowed(host?: string, port?: number): boolean {
        if (!this.policy.allowNetwork) {
            return false;
        }

        if (host && this.policy.allowedHosts && !this.policy.allowedHosts.includes('*')) {
            if (!this.policy.allowedHosts.includes(host)) {
                return false;
            }
        }

        if (port && this.policy.allowedPorts && this.policy.allowedPorts.length > 0) {
            if (!this.policy.allowedPorts.includes(port)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validate code before execution (basic checks)
     */
    validateCode(code: string, language: SandboxLanguage): { valid: boolean; warnings: string[] } {
        const warnings: string[] = [];

        // Check for dangerous patterns
        const dangerousPatterns = [
            { pattern: /process\.exit/g, message: 'Process exit call detected' },
            { pattern: /require\s*\(\s*['"]child_process/g, message: 'Child process import detected' },
            { pattern: /require\s*\(\s*['"]fs['"]\s*\)/g, message: 'Direct fs import detected' },
            { pattern: /eval\s*\(/g, message: 'Eval usage detected' },
            { pattern: /new\s+Function\s*\(/g, message: 'Dynamic function creation detected' },
            { pattern: /__proto__|prototype\s*\./g, message: 'Prototype access detected' },
        ];

        if (!this.policy.allowDynamicCodeExec) {
            for (const { pattern, message } of dangerousPatterns) {
                if (pattern.test(code)) {
                    warnings.push(message);
                }
            }
        }

        if (!this.policy.allowShellSpawn) {
            if (/exec\s*\(|spawn\s*\(|execSync/.test(code)) {
                warnings.push('Shell execution detected');
            }
        }

        return {
            valid: warnings.length === 0,
            warnings
        };
    }

    /**
     * Get the current policy
     */
    getPolicy(): SecurityPolicy {
        return { ...this.policy };
    }

    /**
     * Get policy for a language
     */
    static getPolicyForLanguage(language: SandboxLanguage): SecurityPolicy {
        const policyName = LANGUAGE_POLICIES[language] || 'standard';
        return SECURITY_POLICIES[policyName];
    }
}

export const sandboxPolicyEnforcer = new SandboxPolicyEnforcer('standard');
