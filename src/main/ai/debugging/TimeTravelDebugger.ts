/**
 * ⏰ TimeTravelDebugger - Record & Replay Execution State
 * 
 * Records all execution state changes enabling:
 * - Rewinding to any point in execution
 * - Replaying with modifications
 * - Comparing execution paths
 * - Finding regression points
 * 
 * This is a MOONSHOT feature for next-gen debugging.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutionSnapshot {
    id: string;
    timestamp: Date;
    tickNumber: number;
    callStack: StackFrame[];
    variables: VariableState[];
    heapSize: number;
    eventLoop: EventLoopState;
    asyncOperations: AsyncOperation[];
    console: ConsoleEntry[];
    networkRequests: NetworkRequest[];
    fileOperations: FileOperation[];
}

export interface StackFrame {
    functionName: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    isAsync: boolean;
    thisBinding?: string;
    arguments?: any[];
}

export interface VariableState {
    name: string;
    value: any;
    type: string;
    scope: 'local' | 'closure' | 'global';
    mutable: boolean;
    previousValue?: any;
}

export interface EventLoopState {
    phase: 'timers' | 'pending' | 'idle' | 'poll' | 'check' | 'close';
    pendingCallbacks: number;
    pendingTimers: number;
    pendingMicrotasks: number;
}

export interface AsyncOperation {
    id: string;
    type: 'promise' | 'timer' | 'io' | 'network';
    status: 'pending' | 'resolved' | 'rejected';
    startTick: number;
    endTick?: number;
    result?: any;
}

export interface ConsoleEntry {
    level: 'log' | 'warn' | 'error' | 'debug' | 'info';
    message: string;
    tick: number;
    stack?: string;
}

export interface NetworkRequest {
    id: string;
    url: string;
    method: string;
    status?: number;
    startTick: number;
    endTick?: number;
    requestBody?: any;
    responseBody?: any;
}

export interface FileOperation {
    path: string;
    operation: 'read' | 'write' | 'delete' | 'create';
    tick: number;
    content?: string;
    previousContent?: string;
}

export interface RecordingSession {
    id: string;
    name: string;
    startTime: Date;
    endTime?: Date;
    snapshots: ExecutionSnapshot[];
    totalTicks: number;
    status: 'recording' | 'stopped' | 'replaying';
    metadata: {
        projectPath: string;
        entryPoint: string;
        nodeVersion: string;
    };
}

export interface ReplayOptions {
    speed: number; // 0.1x to 10x
    breakpoints: number[]; // tick numbers
    watchExpressions: string[];
    modifyVariables?: { tick: number; name: string; value: any }[];
}

export interface DiffResult {
    tick: number;
    changes: {
        type: 'variable' | 'callstack' | 'async' | 'network';
        before: any;
        after: any;
        description: string;
    }[];
}

// ============================================================================
// TIME TRAVEL DEBUGGER
// ============================================================================

export class TimeTravelDebugger extends EventEmitter {
    private static instance: TimeTravelDebugger;
    private sessions: Map<string, RecordingSession> = new Map();
    private activeSession: RecordingSession | null = null;
    private currentTick: number = 0;
    private recordingDir: string;

    private constructor() {
        super();
        this.recordingDir = path.join(process.cwd(), '.shadow-ai', 'time-travel');
    }

    public static getInstance(): TimeTravelDebugger {
        if (!TimeTravelDebugger.instance) {
            TimeTravelDebugger.instance = new TimeTravelDebugger();
        }
        return TimeTravelDebugger.instance;
    }

    /**
     * Initialize the debugger
     */
    public async initialize(): Promise<void> {
        await fs.mkdir(this.recordingDir, { recursive: true });
        await this.loadSessions();
    }

    /**
     * Start a new recording session
     */
    public startRecording(name: string, projectPath: string, entryPoint: string): RecordingSession {
        const session: RecordingSession = {
            id: this.generateId(),
            name,
            startTime: new Date(),
            snapshots: [],
            totalTicks: 0,
            status: 'recording',
            metadata: {
                projectPath,
                entryPoint,
                nodeVersion: process.version
            }
        };

        this.sessions.set(session.id, session);
        this.activeSession = session;
        this.currentTick = 0;

        this.emit('recording:started', session);
        console.log(`⏺️ Started recording: ${name}`);

        return session;
    }

    /**
     * Capture a snapshot at current tick
     */
    public captureSnapshot(data: Partial<ExecutionSnapshot>): ExecutionSnapshot {
        if (!this.activeSession || this.activeSession.status !== 'recording') {
            throw new Error('No active recording session');
        }

        this.currentTick++;

        const snapshot: ExecutionSnapshot = {
            id: this.generateId(),
            timestamp: new Date(),
            tickNumber: this.currentTick,
            callStack: data.callStack || [],
            variables: data.variables || [],
            heapSize: data.heapSize || 0,
            eventLoop: data.eventLoop || { phase: 'poll', pendingCallbacks: 0, pendingTimers: 0, pendingMicrotasks: 0 },
            asyncOperations: data.asyncOperations || [],
            console: data.console || [],
            networkRequests: data.networkRequests || [],
            fileOperations: data.fileOperations || []
        };

        this.activeSession.snapshots.push(snapshot);
        this.activeSession.totalTicks = this.currentTick;

        // Emit for real-time monitoring
        this.emit('snapshot:captured', { sessionId: this.activeSession.id, tick: this.currentTick });

        return snapshot;
    }

    /**
     * Stop recording
     */
    public stopRecording(): RecordingSession | null {
        if (!this.activeSession) {
            return null;
        }

        this.activeSession.status = 'stopped';
        this.activeSession.endTime = new Date();

        this.emit('recording:stopped', this.activeSession);
        console.log(`⏹️ Stopped recording: ${this.activeSession.name} (${this.activeSession.totalTicks} ticks)`);

        const session = this.activeSession;
        this.activeSession = null;

        // Save to disk
        this.saveSession(session);

        return session;
    }

    /**
     * Jump to a specific tick
     */
    public jumpToTick(sessionId: string, tick: number): ExecutionSnapshot | null {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const snapshot = session.snapshots.find(s => s.tickNumber === tick);
        if (!snapshot) {
            // Find closest
            const sorted = [...session.snapshots].sort((a, b) =>
                Math.abs(a.tickNumber - tick) - Math.abs(b.tickNumber - tick)
            );
            return sorted[0] || null;
        }

        this.emit('jump', { sessionId, tick, snapshot });
        return snapshot;
    }

    /**
     * Replay a session
     */
    public async replay(
        sessionId: string,
        options: ReplayOptions = { speed: 1, breakpoints: [], watchExpressions: [] }
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        session.status = 'replaying';
        this.emit('replay:started', { sessionId, options });

        const baseDelay = 100 / options.speed;

        for (const snapshot of session.snapshots) {
            // Check for breakpoints
            if (options.breakpoints.includes(snapshot.tickNumber)) {
                this.emit('breakpoint:hit', { sessionId, tick: snapshot.tickNumber });
                // Would pause here for user interaction
            }

            // Apply variable modifications
            if (options.modifyVariables) {
                for (const mod of options.modifyVariables) {
                    if (mod.tick === snapshot.tickNumber) {
                        const variable = snapshot.variables.find(v => v.name === mod.name);
                        if (variable) {
                            variable.previousValue = variable.value;
                            variable.value = mod.value;
                        }
                    }
                }
            }

            // Emit watch expressions
            for (const expr of options.watchExpressions) {
                const variable = snapshot.variables.find(v => v.name === expr);
                if (variable) {
                    this.emit('watch:update', {
                        expression: expr,
                        value: variable.value,
                        tick: snapshot.tickNumber
                    });
                }
            }

            this.emit('replay:tick', { sessionId, snapshot });

            await new Promise(r => setTimeout(r, baseDelay));
        }

        session.status = 'stopped';
        this.emit('replay:completed', { sessionId });
    }

    /**
     * Compare two execution paths
     */
    public compareExecutions(sessionId1: string, sessionId2: string): DiffResult[] {
        const session1 = this.sessions.get(sessionId1);
        const session2 = this.sessions.get(sessionId2);

        if (!session1 || !session2) {
            throw new Error('Session not found');
        }

        const diffs: DiffResult[] = [];
        const maxTicks = Math.max(session1.totalTicks, session2.totalTicks);

        for (let tick = 1; tick <= maxTicks; tick++) {
            const snap1 = session1.snapshots.find(s => s.tickNumber === tick);
            const snap2 = session2.snapshots.find(s => s.tickNumber === tick);

            const changes: DiffResult['changes'] = [];

            // Compare variables
            if (snap1 && snap2) {
                for (const v1 of snap1.variables) {
                    const v2 = snap2.variables.find(v => v.name === v1.name);
                    if (v2 && JSON.stringify(v1.value) !== JSON.stringify(v2.value)) {
                        changes.push({
                            type: 'variable',
                            before: v1.value,
                            after: v2.value,
                            description: `Variable '${v1.name}' differs`
                        });
                    }
                }

                // Compare call stacks
                if (snap1.callStack.length !== snap2.callStack.length) {
                    changes.push({
                        type: 'callstack',
                        before: snap1.callStack.length,
                        after: snap2.callStack.length,
                        description: 'Call stack depth differs'
                    });
                }
            } else if (snap1 || snap2) {
                changes.push({
                    type: 'callstack',
                    before: snap1 ? 'exists' : 'missing',
                    after: snap2 ? 'exists' : 'missing',
                    description: 'Execution diverged'
                });
            }

            if (changes.length > 0) {
                diffs.push({ tick, changes });
            }
        }

        return diffs;
    }

    /**
     * Find when a variable changed
     */
    public findVariableChanges(sessionId: string, variableName: string): { tick: number; before: any; after: any }[] {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const changes: { tick: number; before: any; after: any }[] = [];
        let previousValue: any = undefined;

        for (const snapshot of session.snapshots) {
            const variable = snapshot.variables.find(v => v.name === variableName);
            if (variable) {
                if (previousValue !== undefined && JSON.stringify(previousValue) !== JSON.stringify(variable.value)) {
                    changes.push({
                        tick: snapshot.tickNumber,
                        before: previousValue,
                        after: variable.value
                    });
                }
                previousValue = variable.value;
            }
        }

        return changes;
    }

    /**
     * Find regression point between two sessions
     */
    public findRegressionPoint(workingSessionId: string, failingSessionId: string): number | null {
        const working = this.sessions.get(workingSessionId);
        const failing = this.sessions.get(failingSessionId);

        if (!working || !failing) {
            throw new Error('Session not found');
        }

        // Find first divergence point
        const maxTicks = Math.min(working.totalTicks, failing.totalTicks);

        for (let tick = 1; tick <= maxTicks; tick++) {
            const workSnap = working.snapshots.find(s => s.tickNumber === tick);
            const failSnap = failing.snapshots.find(s => s.tickNumber === tick);

            if (workSnap && failSnap) {
                // Check for divergence in critical state
                const workHash = this.hashSnapshot(workSnap);
                const failHash = this.hashSnapshot(failSnap);

                if (workHash !== failHash) {
                    return tick;
                }
            }
        }

        return null;
    }

    /**
     * Get all sessions
     */
    public getSessions(): RecordingSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get a specific session
     */
    public getSession(sessionId: string): RecordingSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Delete a session
     */
    public async deleteSession(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
        try {
            await fs.unlink(path.join(this.recordingDir, `${sessionId}.json`));
        } catch {
            // File might not exist
        }
    }

    /**
     * Export session for sharing
     */
    public async exportSession(sessionId: string): Promise<string> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const exportPath = path.join(this.recordingDir, `export-${sessionId}.json`);
        await fs.writeFile(exportPath, JSON.stringify(session, null, 2));
        return exportPath;
    }

    /**
     * Import session from file
     */
    public async importSession(filePath: string): Promise<RecordingSession> {
        const content = await fs.readFile(filePath, 'utf-8');
        const session = JSON.parse(content) as RecordingSession;

        // Generate new ID to avoid conflicts
        session.id = this.generateId();
        this.sessions.set(session.id, session);

        return session;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async saveSession(session: RecordingSession): Promise<void> {
        const filePath = path.join(this.recordingDir, `${session.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(session));
    }

    private async loadSessions(): Promise<void> {
        try {
            const files = await fs.readdir(this.recordingDir);

            for (const file of files) {
                if (file.endsWith('.json') && !file.startsWith('export-')) {
                    const content = await fs.readFile(path.join(this.recordingDir, file), 'utf-8');
                    const session = JSON.parse(content) as RecordingSession;
                    this.sessions.set(session.id, session);
                }
            }
        } catch {
            // Directory might not exist yet
        }
    }

    private hashSnapshot(snapshot: ExecutionSnapshot): string {
        const data = {
            callStack: snapshot.callStack.map(f => `${f.fileName}:${f.lineNumber}`),
            variables: snapshot.variables.map(v => ({ name: v.name, value: v.value }))
        };
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Export singleton
export const timeTravelDebugger = TimeTravelDebugger.getInstance();
