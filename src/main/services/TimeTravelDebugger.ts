/**
 * 🕰️ Time Travel Debugger
 * 
 * Revolutionary game debugging through temporal manipulation:
 * - Record game state at every frame
 * - Rewind to any point in time
 * - Branch timelines for "what-if" scenarios
 * - Visualize state changes over time
 * - Export timeline for bug reports
 */

import { EventEmitter } from 'events';

export interface GameSnapshot {
    tick: number;
    timestamp: number;
    entities: EntityState[];
    globalState: Record<string, any>;
    inputs: InputRecord[];
    events: GameEvent[];
}

export interface EntityState {
    id: string;
    type: string;
    position: { x: number; y: number; z?: number };
    velocity?: { x: number; y: number; z?: number };
    health?: number;
    state?: string;
    customData?: Record<string, any>;
}

export interface InputRecord {
    tick: number;
    player: string;
    input: string;
    value: any;
}

export interface GameEvent {
    tick: number;
    type: string;
    data: any;
}

export interface Timeline {
    id: string;
    name: string;
    branchPoint: number;
    snapshots: GameSnapshot[];
    isBranch: boolean;
}

export class TimeTravelDebugger extends EventEmitter {
    private static instance: TimeTravelDebugger;

    private mainTimeline: Timeline;
    private branches: Map<string, Timeline> = new Map();
    private currentTick: number = 0;
    private isRewinding: boolean = false;
    private maxSnapshots: number = 3600; // 1 minute at 60fps

    private constructor() {
        super();
        this.mainTimeline = {
            id: 'main',
            name: 'Main Timeline',
            branchPoint: 0,
            snapshots: [],
            isBranch: false
        };
    }

    static getInstance(): TimeTravelDebugger {
        if (!TimeTravelDebugger.instance) {
            TimeTravelDebugger.instance = new TimeTravelDebugger();
        }
        return TimeTravelDebugger.instance;
    }

    // ========================================================================
    // RECORDING
    // ========================================================================

    recordSnapshot(snapshot: Omit<GameSnapshot, 'tick'>): void {
        if (this.isRewinding) return;

        const fullSnapshot: GameSnapshot = {
            ...snapshot,
            tick: this.currentTick++
        };

        this.mainTimeline.snapshots.push(fullSnapshot);

        // Limit memory usage
        if (this.mainTimeline.snapshots.length > this.maxSnapshots) {
            this.mainTimeline.snapshots.shift();
        }

        this.emit('snapshotRecorded', fullSnapshot);
    }

    // ========================================================================
    // TIME TRAVEL
    // ========================================================================

    rewindTo(tick: number): GameSnapshot | null {
        const snapshot = this.mainTimeline.snapshots.find(s => s.tick === tick);

        if (snapshot) {
            this.isRewinding = true;
            this.currentTick = tick;
            this.emit('rewound', snapshot);
            return snapshot;
        }

        return null;
    }

    rewindBySeconds(seconds: number, fps: number = 60): GameSnapshot | null {
        const targetTick = this.currentTick - (seconds * fps);
        return this.rewindTo(Math.max(0, targetTick));
    }

    fastForwardTo(tick: number): GameSnapshot | null {
        const snapshot = this.mainTimeline.snapshots.find(s => s.tick === tick);

        if (snapshot && tick > this.currentTick) {
            this.currentTick = tick;
            this.emit('fastForwarded', snapshot);
            return snapshot;
        }

        return null;
    }

    resumeFromCurrent(): void {
        this.isRewinding = false;
        this.emit('resumed', this.currentTick);
    }

    // ========================================================================
    // BRANCHING TIMELINES
    // ========================================================================

    createBranch(name: string, fromTick?: number): Timeline {
        const branchPoint = fromTick ?? this.currentTick;
        const branchId = `branch_${Date.now()}`;

        // Copy snapshots up to branch point
        const branchSnapshots = this.mainTimeline.snapshots
            .filter(s => s.tick <= branchPoint)
            .map(s => ({ ...s }));

        const branch: Timeline = {
            id: branchId,
            name,
            branchPoint,
            snapshots: branchSnapshots,
            isBranch: true
        };

        this.branches.set(branchId, branch);
        this.emit('branchCreated', branch);

        return branch;
    }

    switchToBranch(branchId: string): boolean {
        const branch = this.branches.get(branchId);
        if (!branch) return false;

        this.emit('branchSwitched', branch);
        return true;
    }

    mergeBranch(branchId: string): boolean {
        const branch = this.branches.get(branchId);
        if (!branch) return false;

        // For visualization purposes only
        this.emit('branchMerged', branch);
        return true;
    }

    // ========================================================================
    // STATE ANALYSIS
    // ========================================================================

    findStateChange(entityId: string, property: string): GameSnapshot[] {
        const changedSnapshots: GameSnapshot[] = [];
        let prevValue: any = undefined;

        for (const snapshot of this.mainTimeline.snapshots) {
            const entity = snapshot.entities.find(e => e.id === entityId);
            if (entity) {
                const currentValue = (entity as any)[property] ?? entity.customData?.[property];

                if (currentValue !== prevValue) {
                    changedSnapshots.push(snapshot);
                    prevValue = currentValue;
                }
            }
        }

        return changedSnapshots;
    }

    findEventsByType(eventType: string): GameSnapshot[] {
        return this.mainTimeline.snapshots.filter(
            s => s.events.some(e => e.type === eventType)
        );
    }

    getEntityHistory(entityId: string): EntityState[] {
        return this.mainTimeline.snapshots
            .map(s => s.entities.find(e => e.id === entityId))
            .filter(Boolean) as EntityState[];
    }

    // ========================================================================
    // VISUALIZATION DATA
    // ========================================================================

    getTimelineVisualization(): any {
        return {
            main: {
                id: 'main',
                length: this.mainTimeline.snapshots.length,
                currentTick: this.currentTick,
                startTick: this.mainTimeline.snapshots[0]?.tick ?? 0,
                endTick: this.mainTimeline.snapshots[this.mainTimeline.snapshots.length - 1]?.tick ?? 0
            },
            branches: Array.from(this.branches.values()).map(b => ({
                id: b.id,
                name: b.name,
                branchPoint: b.branchPoint,
                length: b.snapshots.length
            }))
        };
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateDebuggerCode(): string {
        return `
// Time Travel Debugger Integration
class GameTimeTravelDebugger {
    constructor(game) {
        this.game = game;
        this.snapshots = [];
        this.currentTick = 0;
        this.maxSnapshots = 3600; // 60 seconds at 60 fps
        this.isRewinding = false;
    }

    // Call this every frame
    recordFrame() {
        if (this.isRewinding) return;

        const snapshot = {
            tick: this.currentTick++,
            timestamp: Date.now(),
            entities: this.serializeEntities(),
            globalState: this.serializeGlobalState(),
            inputs: [...this.game.inputBuffer],
            events: [...this.game.eventBuffer]
        };

        this.snapshots.push(snapshot);

        // Clear event buffer
        this.game.eventBuffer = [];

        // Memory management
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }

    serializeEntities() {
        return this.game.entities.map(e => ({
            id: e.id,
            type: e.constructor.name,
            position: { x: e.x, y: e.y },
            velocity: e.velocity ? { x: e.velocity.x, y: e.velocity.y } : null,
            health: e.health,
            state: e.currentState,
            customData: e.serialize?.() || {}
        }));
    }

    serializeGlobalState() {
        return {
            score: this.game.score,
            level: this.game.level,
            time: this.game.gameTime,
            paused: this.game.paused
        };
    }

    // Rewind to specific tick
    rewindTo(tick) {
        const snapshot = this.snapshots.find(s => s.tick === tick);
        if (!snapshot) return false;

        this.isRewinding = true;
        this.currentTick = tick;

        // Restore game state
        this.restoreSnapshot(snapshot);

        return snapshot;
    }

    restoreSnapshot(snapshot) {
        // Restore entities
        snapshot.entities.forEach(entityData => {
            const entity = this.game.getEntityById(entityData.id);
            if (entity) {
                entity.x = entityData.position.x;
                entity.y = entityData.position.y;
                if (entityData.velocity) {
                    entity.velocity.x = entityData.velocity.x;
                    entity.velocity.y = entityData.velocity.y;
                }
                entity.health = entityData.health;
                entity.deserialize?.(entityData.customData);
            }
        });

        // Restore global state
        Object.assign(this.game, snapshot.globalState);
    }

    // Playback recorded inputs
    async playback(fromTick, toTick, speed = 1) {
        for (let tick = fromTick; tick <= toTick; tick++) {
            const snapshot = this.snapshots.find(s => s.tick === tick);
            if (snapshot) {
                this.restoreSnapshot(snapshot);
                await this.delay(16 / speed); // ~60fps
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Export for bug report
    exportTimeline(startTick, endTick) {
        return {
            game: this.game.name,
            version: this.game.version,
            exportedAt: new Date().toISOString(),
            snapshots: this.snapshots.filter(
                s => s.tick >= startTick && s.tick <= endTick
            )
        };
    }
}

// Usage:
// const debugger = new GameTimeTravelDebugger(game);
// 
// // In game loop:
// debugger.recordFrame();
// 
// // To rewind 5 seconds:
// debugger.rewindTo(debugger.currentTick - 300);
// 
// // To playback in slow-mo:
// await debugger.playback(100, 200, 0.5);`;
    }
}

export const timeTravelDebugger = TimeTravelDebugger.getInstance();
