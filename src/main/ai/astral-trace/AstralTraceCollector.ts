/**
 * Astral Trace Collector
 */
import { EventEmitter } from 'events';
export interface AstralTrace { id: string; name: string; spans: { name: string; duration: number }[]; totalDuration: number; }
export class AstralTraceCollector extends EventEmitter {
    private static instance: AstralTraceCollector;
    private traces: Map<string, AstralTrace> = new Map();
    private constructor() { super(); }
    static getInstance(): AstralTraceCollector { if (!AstralTraceCollector.instance) { AstralTraceCollector.instance = new AstralTraceCollector(); } return AstralTraceCollector.instance; }
    start(name: string): AstralTrace { const trace: AstralTrace = { id: `trace_${Date.now()}`, name, spans: [], totalDuration: 0 }; this.traces.set(trace.id, trace); return trace; }
    addSpan(traceId: string, name: string, duration: number): void { const trace = this.traces.get(traceId); if (trace) { trace.spans.push({ name, duration }); trace.totalDuration += duration; } }
    getStats(): { total: number } { return { total: this.traces.size }; }
}
export const astralTraceCollector = AstralTraceCollector.getInstance();
