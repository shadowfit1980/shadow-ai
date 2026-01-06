/**
 * Checkpoint Manager - Project checkpoints
 */
import { EventEmitter } from 'events';

export interface Checkpoint { id: string; name: string; timestamp: number; files: { path: string; content: string }[]; description?: string; }

export class CheckpointManager extends EventEmitter {
    private static instance: CheckpointManager;
    private checkpoints: Checkpoint[] = [];
    private maxCheckpoints = 50;
    private constructor() { super(); }
    static getInstance(): CheckpointManager { if (!CheckpointManager.instance) CheckpointManager.instance = new CheckpointManager(); return CheckpointManager.instance; }

    create(name: string, files: { path: string; content: string }[], description?: string): Checkpoint {
        const checkpoint: Checkpoint = { id: `cp_${Date.now()}`, name, timestamp: Date.now(), files, description };
        this.checkpoints.push(checkpoint);
        if (this.checkpoints.length > this.maxCheckpoints) this.checkpoints.shift();
        this.emit('created', checkpoint); return checkpoint;
    }

    restore(checkpointId: string): { path: string; content: string }[] | null { const cp = this.checkpoints.find(c => c.id === checkpointId); return cp?.files || null; }
    get(checkpointId: string): Checkpoint | null { return this.checkpoints.find(c => c.id === checkpointId) || null; }
    getRecent(limit = 10): Checkpoint[] { return this.checkpoints.slice(-limit).reverse(); }
    delete(checkpointId: string): boolean { const i = this.checkpoints.findIndex(c => c.id === checkpointId); if (i === -1) return false; this.checkpoints.splice(i, 1); return true; }
}
export function getCheckpointManager(): CheckpointManager { return CheckpointManager.getInstance(); }
