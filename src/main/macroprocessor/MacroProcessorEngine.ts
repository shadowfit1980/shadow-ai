/**
 * Macro Processor - Build-time code transforms
 */
import { EventEmitter } from 'events';

export interface Macro { name: string; pattern: RegExp; transform: (match: string, ...args: string[]) => string; }
export interface MacroResult { id: string; input: string; output: string; macrosApplied: string[]; }

export class MacroProcessorEngine extends EventEmitter {
    private static instance: MacroProcessorEngine;
    private macros: Map<string, Macro> = new Map();
    private constructor() { super(); this.initBuiltins(); }
    static getInstance(): MacroProcessorEngine { if (!MacroProcessorEngine.instance) MacroProcessorEngine.instance = new MacroProcessorEngine(); return MacroProcessorEngine.instance; }

    private initBuiltins(): void {
        this.register({ name: 'env', pattern: /\$env\(["'](\w+)["']\)/g, transform: (_, key) => `process.env.${key}` });
        this.register({ name: 'inline', pattern: /@inline\s+import\s+["']([^"']+)["']/g, transform: (_, path) => `/* inlined: ${path} */` });
        this.register({ name: 'debug', pattern: /@debug\s*\((.*?)\)/g, transform: (_, expr) => `console.log("DEBUG:", ${expr})` });
    }

    register(macro: Macro): void { this.macros.set(macro.name, macro); }
    unregister(name: string): boolean { return this.macros.delete(name); }

    async process(code: string): Promise<MacroResult> {
        let output = code; const applied: string[] = [];
        this.macros.forEach((macro, name) => { if (macro.pattern.test(output)) { output = output.replace(macro.pattern, macro.transform); applied.push(name); } });
        const result: MacroResult = { id: `macro_${Date.now()}`, input: code, output, macrosApplied: applied };
        this.emit('processed', result); return result;
    }

    getMacros(): string[] { return Array.from(this.macros.keys()); }
}
export function getMacroProcessorEngine(): MacroProcessorEngine { return MacroProcessorEngine.getInstance(); }
