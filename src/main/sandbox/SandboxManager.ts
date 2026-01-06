/**
 * Sandbox Manager - Code sandboxing
 */
import { EventEmitter } from 'events';
import * as vm from 'vm';

export interface SandboxResult { success: boolean; result?: any; error?: string; duration: number; }
export interface SandboxConfig { timeout: number; memoryLimit?: number; allowedModules?: string[]; }

export class SandboxManager extends EventEmitter {
    private static instance: SandboxManager;
    private config: SandboxConfig = { timeout: 5000 };
    private constructor() { super(); }
    static getInstance(): SandboxManager { if (!SandboxManager.instance) SandboxManager.instance = new SandboxManager(); return SandboxManager.instance; }

    configure(config: Partial<SandboxConfig>): void { this.config = { ...this.config, ...config }; }

    async execute(code: string, context: Record<string, any> = {}): Promise<SandboxResult> {
        const start = Date.now();
        try {
            const sandbox = vm.createContext({ ...context, console: { log: () => { }, error: () => { }, warn: () => { } } });
            const result = vm.runInContext(code, sandbox, { timeout: this.config.timeout });
            const duration = Date.now() - start;
            this.emit('executed', { success: true, duration });
            return { success: true, result, duration };
        } catch (error: any) {
            const duration = Date.now() - start;
            this.emit('error', { error: error.message, duration });
            return { success: false, error: error.message, duration };
        }
    }

    async executeAsync(code: string, context: Record<string, any> = {}): Promise<SandboxResult> {
        const wrappedCode = `(async () => { ${code} })()`;
        return this.execute(wrappedCode, context);
    }

    getConfig(): SandboxConfig { return { ...this.config }; }
}

export function getSandboxManager(): SandboxManager { return SandboxManager.getInstance(); }
