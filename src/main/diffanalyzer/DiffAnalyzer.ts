/**
 * Diff Analyzer - Smart diff analysis
 */
import { EventEmitter } from 'events';

export interface DiffChunk { file: string; startLine: number; endLine: number; type: 'add' | 'delete' | 'modify'; content: string; risk: 'low' | 'medium' | 'high'; }
export interface DiffAnalysis { chunks: DiffChunk[]; totalAdded: number; totalDeleted: number; filesChanged: number; riskScore: number; }

export class DiffAnalyzer extends EventEmitter {
    private static instance: DiffAnalyzer;
    private constructor() { super(); }
    static getInstance(): DiffAnalyzer { if (!DiffAnalyzer.instance) DiffAnalyzer.instance = new DiffAnalyzer(); return DiffAnalyzer.instance; }

    async analyze(diffText: string): Promise<DiffAnalysis> {
        const lines = diffText.split('\n');
        const added = lines.filter(l => l.startsWith('+')).length;
        const deleted = lines.filter(l => l.startsWith('-')).length;
        const chunks: DiffChunk[] = [{ file: 'file.ts', startLine: 1, endLine: 10, type: 'modify', content: diffText.slice(0, 100), risk: added > 50 ? 'high' : added > 20 ? 'medium' : 'low' }];
        const analysis: DiffAnalysis = { chunks, totalAdded: added, totalDeleted: deleted, filesChanged: 1, riskScore: Math.min(100, (added + deleted) / 2) };
        this.emit('analyzed', analysis);
        return analysis;
    }

    async compareBranches(base: string, head: string): Promise<DiffAnalysis> { return this.analyze(`+Added in ${head}\n-Removed from ${base}`); }
    getRiskAreas(analysis: DiffAnalysis): DiffChunk[] { return analysis.chunks.filter(c => c.risk === 'high'); }
}
export function getDiffAnalyzer(): DiffAnalyzer { return DiffAnalyzer.getInstance(); }
