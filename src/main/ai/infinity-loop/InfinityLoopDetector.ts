/**
 * Infinity Loop Detector
 * 
 * Detects potential infinite loops and recursive patterns
 * that could cause the code to run forever.
 */

import { EventEmitter } from 'events';

export interface LoopAnalysis {
    id: string;
    code: string;
    loops: LoopInfo[];
    recursions: RecursionInfo[];
    infiniteRisk: number;
    recommendations: string[];
    createdAt: Date;
}

export interface LoopInfo {
    type: 'for' | 'while' | 'do-while';
    line: number;
    hasBreak: boolean;
    hasCondition: boolean;
    riskLevel: 'safe' | 'warning' | 'danger';
}

export interface RecursionInfo {
    functionName: string;
    line: number;
    hasBaseCase: boolean;
    depth: 'shallow' | 'medium' | 'deep';
    riskLevel: 'safe' | 'warning' | 'danger';
}

export class InfinityLoopDetector extends EventEmitter {
    private static instance: InfinityLoopDetector;
    private analyses: Map<string, LoopAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): InfinityLoopDetector {
        if (!InfinityLoopDetector.instance) {
            InfinityLoopDetector.instance = new InfinityLoopDetector();
        }
        return InfinityLoopDetector.instance;
    }

    analyze(code: string): LoopAnalysis {
        const loops = this.detectLoops(code);
        const recursions = this.detectRecursions(code);
        const infiniteRisk = this.calculateRisk(loops, recursions);
        const recommendations = this.generateRecommendations(loops, recursions);

        const analysis: LoopAnalysis = {
            id: `loop_${Date.now()}`,
            code,
            loops,
            recursions,
            infiniteRisk,
            recommendations,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private detectLoops(code: string): LoopInfo[] {
        const loops: LoopInfo[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // For loop
            if (line.includes('for')) {
                const hasBreak = this.checkForBreak(lines, i);
                loops.push({
                    type: 'for',
                    line: i + 1,
                    hasBreak,
                    hasCondition: line.includes(';'),
                    riskLevel: hasBreak ? 'safe' : 'warning',
                });
            }

            // While loop
            if (line.includes('while') && !line.includes('do')) {
                const condition = line.match(/while\s*\(([^)]+)\)/);
                const isTrue = condition && condition[1].trim() === 'true';
                const hasBreak = this.checkForBreak(lines, i);

                loops.push({
                    type: 'while',
                    line: i + 1,
                    hasBreak,
                    hasCondition: !!condition && !isTrue,
                    riskLevel: isTrue && !hasBreak ? 'danger' : hasBreak ? 'safe' : 'warning',
                });
            }
        }

        return loops;
    }

    private checkForBreak(lines: string[], startLine: number): boolean {
        let braceCount = 0;
        let started = false;

        for (let i = startLine; i < lines.length && i < startLine + 50; i++) {
            const line = lines[i];
            if (line.includes('{')) { braceCount++; started = true; }
            if (line.includes('}')) braceCount--;
            if (started && braceCount === 0) break;
            if (line.includes('break') || line.includes('return')) return true;
        }

        return false;
    }

    private detectRecursions(code: string): RecursionInfo[] {
        const recursions: RecursionInfo[] = [];
        const funcMatches = code.matchAll(/function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g);

        for (const match of funcMatches) {
            const funcName = match[1] || match[2];
            const funcIndex = code.indexOf(match[0]);
            const lineNumber = code.substring(0, funcIndex).split('\n').length;

            // Check if function calls itself
            const funcBody = this.extractFunctionBody(code, funcIndex);
            const callsItself = funcBody.includes(`${funcName}(`);

            if (callsItself) {
                const hasBaseCase = funcBody.includes('if') && funcBody.includes('return');
                recursions.push({
                    functionName: funcName,
                    line: lineNumber,
                    hasBaseCase,
                    depth: hasBaseCase ? 'shallow' : 'deep',
                    riskLevel: hasBaseCase ? 'safe' : 'danger',
                });
            }
        }

        return recursions;
    }

    private extractFunctionBody(code: string, startIndex: number): string {
        let braceCount = 0;
        let started = false;
        let body = '';

        for (let i = startIndex; i < code.length && i < startIndex + 1000; i++) {
            if (code[i] === '{') { braceCount++; started = true; }
            if (code[i] === '}') braceCount--;
            if (started) body += code[i];
            if (started && braceCount === 0) break;
        }

        return body;
    }

    private calculateRisk(loops: LoopInfo[], recursions: RecursionInfo[]): number {
        const loopRisk = loops.filter(l => l.riskLevel === 'danger').length * 0.3 +
            loops.filter(l => l.riskLevel === 'warning').length * 0.1;
        const recRisk = recursions.filter(r => r.riskLevel === 'danger').length * 0.4 +
            recursions.filter(r => r.riskLevel === 'warning').length * 0.1;
        return Math.min(1, loopRisk + recRisk);
    }

    private generateRecommendations(loops: LoopInfo[], recursions: RecursionInfo[]): string[] {
        const recs: string[] = [];

        for (const loop of loops.filter(l => l.riskLevel !== 'safe')) {
            recs.push(`Line ${loop.line}: Add break condition or limit to ${loop.type} loop`);
        }

        for (const rec of recursions.filter(r => !r.hasBaseCase)) {
            recs.push(`${rec.functionName}: Add clear base case to prevent stack overflow`);
        }

        return recs.slice(0, 5);
    }

    getStats(): { total: number; avgRisk: number; dangerLoops: number } {
        const analyses = Array.from(this.analyses.values());
        const dangerLoops = analyses.reduce((s, a) =>
            s + a.loops.filter(l => l.riskLevel === 'danger').length, 0);

        return {
            total: analyses.length,
            avgRisk: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.infiniteRisk, 0) / analyses.length
                : 0,
            dangerLoops,
        };
    }
}

export const infinityLoopDetector = InfinityLoopDetector.getInstance();
