/**
 * Complexity Analyzer - Cyclomatic complexity
 */
import { EventEmitter } from 'events';

export interface ComplexityResult { file: string; functions: { name: string; line: number; complexity: number; rating: 'A' | 'B' | 'C' | 'D' | 'F' }[]; average: number; max: number; }

export class ComplexityAnalyzer extends EventEmitter {
    private static instance: ComplexityAnalyzer;
    private results: Map<string, ComplexityResult> = new Map();
    private constructor() { super(); }
    static getInstance(): ComplexityAnalyzer { if (!ComplexityAnalyzer.instance) ComplexityAnalyzer.instance = new ComplexityAnalyzer(); return ComplexityAnalyzer.instance; }

    analyze(file: string, code: string): ComplexityResult {
        const functions: ComplexityResult['functions'] = [];
        const fnMatches = code.matchAll(/(?:function|const|let)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|\()/g);
        for (const m of fnMatches) {
            const fnStart = m.index!; const fnEnd = code.indexOf('}', fnStart + 50) + 1;
            const fnBody = code.slice(fnStart, fnEnd);
            let complexity = 1;
            complexity += (fnBody.match(/if\s*\(/g) || []).length;
            complexity += (fnBody.match(/else\s*{/g) || []).length;
            complexity += (fnBody.match(/for\s*\(/g) || []).length;
            complexity += (fnBody.match(/while\s*\(/g) || []).length;
            complexity += (fnBody.match(/case\s+/g) || []).length;
            complexity += (fnBody.match(/\?\s*[^:]+:/g) || []).length;
            const rating = complexity <= 5 ? 'A' : complexity <= 10 ? 'B' : complexity <= 20 ? 'C' : complexity <= 30 ? 'D' : 'F';
            functions.push({ name: m[1], line: code.slice(0, fnStart).split('\n').length, complexity, rating });
        }
        const result: ComplexityResult = { file, functions, average: functions.reduce((s, f) => s + f.complexity, 0) / (functions.length || 1), max: Math.max(...functions.map(f => f.complexity), 0) };
        this.results.set(file, result); this.emit('analyzed', result); return result;
    }

    get(file: string): ComplexityResult | null { return this.results.get(file) || null; }
    getHighComplexity(threshold = 15): ComplexityResult['functions'] { return Array.from(this.results.values()).flatMap(r => r.functions.filter(f => f.complexity >= threshold)); }
}
export function getComplexityAnalyzer(): ComplexityAnalyzer { return ComplexityAnalyzer.getInstance(); }
