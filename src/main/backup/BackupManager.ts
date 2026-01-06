/**
 * Backup Manager
 * File and data backup
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Backup {
    id: string;
    name: string;
    sourcePath: string;
    backupPath: string;
    size: number;
    createdAt: number;
}

export class BackupManager extends EventEmitter {
    private static instance: BackupManager;
    private backups: Map<string, Backup> = new Map();
    private backupDir = '';

    private constructor() { super(); }

    static getInstance(): BackupManager {
        if (!BackupManager.instance) BackupManager.instance = new BackupManager();
        return BackupManager.instance;
    }

    setBackupDir(dir: string): void { this.backupDir = dir; }

    async create(sourcePath: string, name?: string): Promise<Backup> {
        const id = `backup_${Date.now()}`;
        const backupPath = path.join(this.backupDir, `${id}_${path.basename(sourcePath)}`);

        await fs.copyFile(sourcePath, backupPath);
        const stats = await fs.stat(backupPath);

        const backup: Backup = { id, name: name || path.basename(sourcePath), sourcePath, backupPath, size: stats.size, createdAt: Date.now() };
        this.backups.set(id, backup);
        this.emit('created', backup);
        return backup;
    }

    async restore(id: string): Promise<boolean> {
        const backup = this.backups.get(id);
        if (!backup) return false;
        await fs.copyFile(backup.backupPath, backup.sourcePath);
        this.emit('restored', backup);
        return true;
    }

    async delete(id: string): Promise<boolean> {
        const backup = this.backups.get(id);
        if (!backup) return false;
        await fs.unlink(backup.backupPath);
        this.backups.delete(id);
        return true;
    }

    getAll(): Backup[] { return Array.from(this.backups.values()); }
}

export function getBackupManager(): BackupManager { return BackupManager.getInstance(); }
