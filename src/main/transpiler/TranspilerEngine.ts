/**
 * Transpiler Engine - TS/JSX transpilation
 */
import { EventEmitter } from 'events';

export interface TranspileResult { id: string; input: string; output: string; sourceMap?: string; duration: number; }
export interface TranspileConfig { target: 'es2015' | 'es2020' | 'es2022' | 'esnext'; jsx: 'transform' | 'preserve' | 'automatic'; jsxFactory?: string; minify: boolean; }

export class TranspilerEngine extends EventEmitter {
    private static instance: TranspilerEngine;
    private config: TranspileConfig = { target: 'es2022', jsx: 'automatic', minify: false };
    private results: Map<string, TranspileResult> = new Map();
    private constructor() { super(); }
    static getInstance(): TranspilerEngine { if (!TranspilerEngine.instance) TranspilerEngine.instance = new TranspilerEngine(); return TranspilerEngine.instance; }

    async transpile(code: string, filename?: string): Promise<TranspileResult> {
        const start = Date.now();
        let output = code.replace(/: \w+/g, '').replace(/<\w+>/g, '').replace(/interface \w+ \{[^}]+\}/g, '').replace(/type \w+ = [^;]+;/g, '');
        if (this.config.minify) output = output.replace(/\s+/g, ' ').trim();
        const result: TranspileResult = { id: `transpile_${Date.now()}`, input: code, output, duration: Date.now() - start };
        this.results.set(result.id, result); this.emit('complete', result); return result;
    }

    async transpileFile(path: string): Promise<TranspileResult> { return this.transpile(`// Content of ${path}`, path); }
    setConfig(config: Partial<TranspileConfig>): void { Object.assign(this.config, config); }
    getConfig(): TranspileConfig { return { ...this.config }; }
    get(resultId: string): TranspileResult | null { return this.results.get(resultId) || null; }
}
export function getTranspilerEngine(): TranspilerEngine { return TranspilerEngine.getInstance(); }
