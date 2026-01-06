/**
 * Recovery Manager - Crash recovery
 */
import { EventEmitter } from 'events';

export interface RecoveryPoint { id: string; name: string; data: any; createdAt: number; }

export class RecoveryManager extends EventEmitter {
    private static instance: RecoveryManager;
    private points: Map<string, RecoveryPoint> = new Map();
    private autoSaveInterval?: NodeJS.Timeout;
    private constructor() { super(); }
    static getInstance(): RecoveryManager { if (!RecoveryManager.instance) RecoveryManager.instance = new RecoveryManager(); return RecoveryManager.instance; }

    createPoint(name: string, data: any): RecoveryPoint {
        const point: RecoveryPoint = { id: `rp_${Date.now()}`, name, data, createdAt: Date.now() };
        this.points.set(point.id, point);
        this.emit('pointCreated', point);
        return point;
    }

    restore(id: string): RecoveryPoint | null { const point = this.points.get(id); if (point) this.emit('restored', point); return point || null; }
    delete(id: string): boolean { return this.points.delete(id); }

    startAutoSave(intervalMs: number, getData: () => any): void {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => { this.createPoint('autosave', getData()); }, intervalMs);
    }

    stopAutoSave(): void { if (this.autoSaveInterval) { clearInterval(this.autoSaveInterval); this.autoSaveInterval = undefined; } }
    getLatest(): RecoveryPoint | null { const points = Array.from(this.points.values()); return points.length ? points[points.length - 1] : null; }
    getAll(): RecoveryPoint[] { return Array.from(this.points.values()); }
}

export function getRecoveryManager(): RecoveryManager { return RecoveryManager.getInstance(); }
