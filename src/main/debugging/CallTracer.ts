/**
 * Call Tracer
 * Step-by-step debugging and visualization of agent processing
 * Similar to Cognigy Call Tracing
 */

import { EventEmitter } from 'events';

export interface TraceEvent {
    id: string;
    traceId: string;
    type: TraceEventType;
    name: string;
    timestamp: number;
    duration?: number;
    input?: any;
    output?: any;
    metadata?: Record<string, any>;
    error?: string;
    parentId?: string;
    children?: string[];
}

export enum TraceEventType {
    INPUT = 'input',
    OUTPUT = 'output',
    LLM_CALL = 'llm_call',
    TOOL_CALL = 'tool_call',
    CONDITION = 'condition',
    FLOW_START = 'flow_start',
    FLOW_END = 'flow_end',
    NODE_ENTER = 'node_enter',
    NODE_EXIT = 'node_exit',
    ERROR = 'error',
    HANDOFF = 'handoff',
    CUSTOM = 'custom',
}

export interface Trace {
    id: string;
    sessionId: string;
    startTime: number;
    endTime?: number;
    events: TraceEvent[];
    status: 'running' | 'completed' | 'failed';
    summary?: TraceSummary;
}

export interface TraceSummary {
    totalDuration: number;
    eventCount: number;
    llmCalls: number;
    toolCalls: number;
    errors: number;
    longestEvent: { name: string; duration: number };
}

/**
 * CallTracer
 * Records and visualizes agent processing steps
 */
export class CallTracer extends EventEmitter {
    private static instance: CallTracer;
    private traces: Map<string, Trace> = new Map();
    private activeTraces: Map<string, string> = new Map(); // sessionId -> traceId
    private eventCounter = 0;

    private constructor() {
        super();
    }

    static getInstance(): CallTracer {
        if (!CallTracer.instance) {
            CallTracer.instance = new CallTracer();
        }
        return CallTracer.instance;
    }

    /**
     * Start a new trace
     */
    startTrace(sessionId: string): Trace {
        const id = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const trace: Trace = {
            id,
            sessionId,
            startTime: Date.now(),
            events: [],
            status: 'running',
        };

        this.traces.set(id, trace);
        this.activeTraces.set(sessionId, id);

        this.emit('traceStarted', trace);
        return trace;
    }

    /**
     * End a trace
     */
    endTrace(traceId: string, status: 'completed' | 'failed' = 'completed'): Trace | null {
        const trace = this.traces.get(traceId);
        if (!trace) return null;

        trace.endTime = Date.now();
        trace.status = status;
        trace.summary = this.generateSummary(trace);

        // Remove from active
        for (const [sessionId, id] of this.activeTraces) {
            if (id === traceId) {
                this.activeTraces.delete(sessionId);
                break;
            }
        }

        this.emit('traceEnded', trace);
        return trace;
    }

    /**
     * Add event to trace
     */
    addEvent(traceId: string, event: Omit<TraceEvent, 'id' | 'traceId' | 'timestamp'>): TraceEvent {
        const trace = this.traces.get(traceId);

        const fullEvent: TraceEvent = {
            id: `evt_${++this.eventCounter}_${Date.now()}`,
            traceId,
            timestamp: Date.now(),
            ...event,
        };

        if (trace) {
            trace.events.push(fullEvent);
        }

        this.emit('eventAdded', fullEvent);
        return fullEvent;
    }

    /**
     * Get trace by ID
     */
    getTrace(traceId: string): Trace | null {
        return this.traces.get(traceId) || null;
    }

    /**
     * Get active trace for session
     */
    getActiveTrace(sessionId: string): Trace | null {
        const traceId = this.activeTraces.get(sessionId);
        return traceId ? this.traces.get(traceId) || null : null;
    }

    /**
     * Get all traces
     */
    getAllTraces(limit = 50): Trace[] {
        return Array.from(this.traces.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }

    /**
     * Get traces for session
     */
    getTracesForSession(sessionId: string): Trace[] {
        return Array.from(this.traces.values())
            .filter(t => t.sessionId === sessionId)
            .sort((a, b) => b.startTime - a.startTime);
    }

    /**
     * Log input
     */
    logInput(traceId: string, input: any): TraceEvent {
        return this.addEvent(traceId, {
            type: TraceEventType.INPUT,
            name: 'User Input',
            input,
        });
    }

    /**
     * Log output
     */
    logOutput(traceId: string, output: any): TraceEvent {
        return this.addEvent(traceId, {
            type: TraceEventType.OUTPUT,
            name: 'Agent Output',
            output,
        });
    }

    /**
     * Log LLM call
     */
    logLLMCall(traceId: string, data: {
        model: string;
        prompt: string;
        response?: string;
        duration?: number;
        tokens?: { input: number; output: number };
    }): TraceEvent {
        return this.addEvent(traceId, {
            type: TraceEventType.LLM_CALL,
            name: `LLM: ${data.model}`,
            input: data.prompt,
            output: data.response,
            duration: data.duration,
            metadata: { tokens: data.tokens },
        });
    }

    /**
     * Log tool call
     */
    logToolCall(traceId: string, data: {
        tool: string;
        input: any;
        output?: any;
        duration?: number;
        success?: boolean;
        error?: string;
    }): TraceEvent {
        return this.addEvent(traceId, {
            type: data.success === false ? TraceEventType.ERROR : TraceEventType.TOOL_CALL,
            name: `Tool: ${data.tool}`,
            input: data.input,
            output: data.output,
            duration: data.duration,
            error: data.error,
            metadata: { success: data.success },
        });
    }

    /**
     * Log condition check
     */
    logCondition(traceId: string, data: {
        condition: string;
        result: boolean;
    }): TraceEvent {
        return this.addEvent(traceId, {
            type: TraceEventType.CONDITION,
            name: `Condition: ${data.condition.substring(0, 50)}`,
            input: data.condition,
            output: data.result,
        });
    }

    /**
     * Log error
     */
    logError(traceId: string, error: string, context?: any): TraceEvent {
        return this.addEvent(traceId, {
            type: TraceEventType.ERROR,
            name: 'Error',
            error,
            input: context,
        });
    }

    /**
     * Log custom event
     */
    logCustom(traceId: string, name: string, data?: any): TraceEvent {
        return this.addEvent(traceId, {
            type: TraceEventType.CUSTOM,
            name,
            input: data,
        });
    }

    /**
     * Generate trace visualization (ASCII)
     */
    visualizeTrace(traceId: string): string {
        const trace = this.traces.get(traceId);
        if (!trace) return 'Trace not found';

        const lines: string[] = [
            `Trace: ${trace.id}`,
            `Session: ${trace.sessionId}`,
            `Status: ${trace.status}`,
            `Duration: ${trace.endTime ? trace.endTime - trace.startTime : 'ongoing'}ms`,
            '',
            'Events:',
        ];

        for (const event of trace.events) {
            const icon = this.getEventIcon(event.type);
            const duration = event.duration ? ` (${event.duration}ms)` : '';
            const status = event.error ? ' ❌' : '';
            lines.push(`  ${icon} ${event.name}${duration}${status}`);

            if (event.input) {
                const inputStr = typeof event.input === 'string'
                    ? event.input.substring(0, 60)
                    : JSON.stringify(event.input).substring(0, 60);
                lines.push(`     → ${inputStr}...`);
            }
        }

        if (trace.summary) {
            lines.push('');
            lines.push('Summary:');
            lines.push(`  Total Duration: ${trace.summary.totalDuration}ms`);
            lines.push(`  Events: ${trace.summary.eventCount}`);
            lines.push(`  LLM Calls: ${trace.summary.llmCalls}`);
            lines.push(`  Tool Calls: ${trace.summary.toolCalls}`);
            lines.push(`  Errors: ${trace.summary.errors}`);
        }

        return lines.join('\n');
    }

    /**
     * Export trace as JSON
     */
    exportTrace(traceId: string): string | null {
        const trace = this.traces.get(traceId);
        if (!trace) return null;
        return JSON.stringify(trace, null, 2);
    }

    /**
     * Clear old traces
     */
    clearOldTraces(maxAge = 24 * 60 * 60 * 1000): number {
        const cutoff = Date.now() - maxAge;
        let cleared = 0;

        for (const [id, trace] of this.traces) {
            if (trace.startTime < cutoff && trace.status !== 'running') {
                this.traces.delete(id);
                cleared++;
            }
        }

        return cleared;
    }

    // Private methods

    private generateSummary(trace: Trace): TraceSummary {
        let llmCalls = 0;
        let toolCalls = 0;
        let errors = 0;
        let longestEvent = { name: '', duration: 0 };

        for (const event of trace.events) {
            if (event.type === TraceEventType.LLM_CALL) llmCalls++;
            if (event.type === TraceEventType.TOOL_CALL) toolCalls++;
            if (event.type === TraceEventType.ERROR || event.error) errors++;

            if (event.duration && event.duration > longestEvent.duration) {
                longestEvent = { name: event.name, duration: event.duration };
            }
        }

        return {
            totalDuration: (trace.endTime || Date.now()) - trace.startTime,
            eventCount: trace.events.length,
            llmCalls,
            toolCalls,
            errors,
            longestEvent,
        };
    }

    private getEventIcon(type: TraceEventType): string {
        const icons: Record<TraceEventType, string> = {
            [TraceEventType.INPUT]: '📥',
            [TraceEventType.OUTPUT]: '📤',
            [TraceEventType.LLM_CALL]: '🤖',
            [TraceEventType.TOOL_CALL]: '🔧',
            [TraceEventType.CONDITION]: '❓',
            [TraceEventType.FLOW_START]: '▶️',
            [TraceEventType.FLOW_END]: '⏹️',
            [TraceEventType.NODE_ENTER]: '➡️',
            [TraceEventType.NODE_EXIT]: '⬅️',
            [TraceEventType.ERROR]: '❌',
            [TraceEventType.HANDOFF]: '🤝',
            [TraceEventType.CUSTOM]: '📌',
        };
        return icons[type] || '•';
    }
}

// Singleton getter
export function getCallTracer(): CallTracer {
    return CallTracer.getInstance();
}
