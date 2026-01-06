/**
 * Tool Execution - Agent tools
 */
import { EventEmitter } from 'events';

export interface ToolCall { id: string; tool: string; args: Record<string, string>; status: 'pending' | 'running' | 'success' | 'error'; result?: string; duration?: number; }

export class ToolExecution extends EventEmitter {
    private static instance: ToolExecution;
    private tools: Map<string, (args: Record<string, string>) => Promise<string>> = new Map();
    private history: ToolCall[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ToolExecution { if (!ToolExecution.instance) ToolExecution.instance = new ToolExecution(); return ToolExecution.instance; }

    private initDefaults(): void {
        this.tools.set('read_file', async (args) => `Content of ${args.path}`);
        this.tools.set('write_file', async (args) => `Wrote to ${args.path}`);
        this.tools.set('search', async (args) => `Search results for ${args.query}`);
        this.tools.set('terminal', async (args) => `$ ${args.command}`);
    }

    register(name: string, fn: (args: Record<string, string>) => Promise<string>): void { this.tools.set(name, fn); }

    async execute(tool: string, args: Record<string, string>): Promise<ToolCall> {
        const call: ToolCall = { id: `tc_${Date.now()}`, tool, args, status: 'pending' };
        const start = Date.now();
        const fn = this.tools.get(tool);
        if (!fn) { call.status = 'error'; call.result = 'Tool not found'; }
        else { try { call.status = 'running'; call.result = await fn(args); call.status = 'success'; } catch (e: any) { call.status = 'error'; call.result = e.message; } }
        call.duration = Date.now() - start; this.history.push(call); this.emit('executed', call); return call;
    }

    getAvailable(): string[] { return Array.from(this.tools.keys()); }
    getHistory(): ToolCall[] { return [...this.history]; }
}
export function getToolExecution(): ToolExecution { return ToolExecution.getInstance(); }
