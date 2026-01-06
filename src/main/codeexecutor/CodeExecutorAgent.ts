/**
 * Code Executor - Agent code execution
 */
import { EventEmitter } from 'events';

export interface ExecutionResult { id: string; code: string; language: string; output: string; error?: string; duration: number; }

export class CodeExecutorAgent extends EventEmitter {
    private static instance: CodeExecutorAgent;
    private history: ExecutionResult[] = [];
    private sandboxed = true;
    private constructor() { super(); }
    static getInstance(): CodeExecutorAgent { if (!CodeExecutorAgent.instance) CodeExecutorAgent.instance = new CodeExecutorAgent(); return CodeExecutorAgent.instance; }

    setSandboxed(sandboxed: boolean): void { this.sandboxed = sandboxed; }

    async execute(code: string, language: string): Promise<ExecutionResult> {
        const start = Date.now();
        let output = '', error: string | undefined;
        try {
            if (language === 'javascript' && !this.sandboxed) { output = eval(code)?.toString() || 'undefined'; }
            else { output = `[Sandboxed] Would execute ${language} code: ${code.slice(0, 50)}...`; }
        } catch (e: any) { error = e.message; }
        const result: ExecutionResult = { id: `exec_${Date.now()}`, code, language, output, error, duration: Date.now() - start };
        this.history.push(result); this.emit('executed', result); return result;
    }

    getHistory(): ExecutionResult[] { return [...this.history]; }
    clearHistory(): void { this.history = []; }
}
export function getCodeExecutorAgent(): CodeExecutorAgent { return CodeExecutorAgent.getInstance(); }
