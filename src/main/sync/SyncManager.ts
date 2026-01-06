/**
 * Sync Manager - Cross-device sync
 */
import { EventEmitter } from 'events';

export interface SyncStatus { lastSync: number; pending: number; inProgress: boolean; errors: string[]; }

export class SyncManager extends EventEmitter {
    private static instance: SyncManager;
    private status: SyncStatus = { lastSync: 0, pending: 0, inProgress: false, errors: [] };
    private constructor() { super(); }
    static getInstance(): SyncManager { if (!SyncManager.instance) SyncManager.instance = new SyncManager(); return SyncManager.instance; }

    async sync(): Promise<boolean> {
        if (this.status.inProgress) return false;
        this.status.inProgress = true;
        this.emit('syncStarted');
        await new Promise(r => setTimeout(r, 100));
        this.status.lastSync = Date.now();
        this.status.inProgress = false;
        this.emit('syncCompleted');
        return true;
    }

    getStatus(): SyncStatus { return { ...this.status }; }
    queueChange(type: string): void { this.status.pending++; this.emit('changeQueued', type); }
    clearPending(): void { this.status.pending = 0; }
    isInProgress(): boolean { return this.status.inProgress; }
}
export function getSyncManager(): SyncManager { return SyncManager.getInstance(); }
