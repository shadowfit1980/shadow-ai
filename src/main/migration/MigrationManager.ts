/**
 * Migration Manager - Database migrations
 */
import { EventEmitter } from 'events';

export interface Migration { id: string; name: string; version: number; up: string; down: string; appliedAt?: number; }

export class MigrationManager extends EventEmitter {
    private static instance: MigrationManager;
    private migrations: Migration[] = [];
    private applied: Set<string> = new Set();
    private constructor() { super(); }
    static getInstance(): MigrationManager { if (!MigrationManager.instance) MigrationManager.instance = new MigrationManager(); return MigrationManager.instance; }

    register(name: string, up: string, down: string): Migration {
        const migration: Migration = { id: `mig_${Date.now()}`, name, version: this.migrations.length + 1, up, down };
        this.migrations.push(migration);
        return migration;
    }

    async up(id: string): Promise<boolean> {
        const mig = this.migrations.find(m => m.id === id);
        if (!mig || this.applied.has(id)) return false;
        this.applied.add(id);
        mig.appliedAt = Date.now();
        this.emit('migrated', mig);
        return true;
    }

    async down(id: string): Promise<boolean> {
        if (!this.applied.has(id)) return false;
        this.applied.delete(id);
        this.emit('rolledBack', id);
        return true;
    }

    getPending(): Migration[] { return this.migrations.filter(m => !this.applied.has(m.id)); }
    getApplied(): Migration[] { return this.migrations.filter(m => this.applied.has(m.id)); }
    getAll(): Migration[] { return [...this.migrations]; }
}

export function getMigrationManager(): MigrationManager { return MigrationManager.getInstance(); }
