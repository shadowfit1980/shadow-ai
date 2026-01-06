/**
 * Cloud Sync Service
 * 
 * Enables cloud synchronization of memories and settings:
 * - Memory backup & restore
 * - Cross-device sync
 * - Conflict resolution
 * - Offline support
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SyncConfig {
    provider: 'local' | 'firebase' | 's3' | 'gcs' | 'custom';
    endpoint?: string;
    apiKey?: string;
    bucket?: string;
    encryptionKey?: string;
    autoSync: boolean;
    syncInterval: number; // minutes
}

export interface SyncedItem {
    id: string;
    type: 'memory' | 'setting' | 'workflow' | 'template';
    data: any;
    hash: string;
    lastModified: Date;
    version: number;
}

export interface SyncStatus {
    lastSync: Date | null;
    itemsSynced: number;
    status: 'idle' | 'syncing' | 'error' | 'conflict';
    error?: string;
    conflicts: SyncConflict[];
}

export interface SyncConflict {
    itemId: string;
    localVersion: SyncedItem;
    remoteVersion: SyncedItem;
    resolvedAt?: Date;
    resolution?: 'local' | 'remote' | 'merged';
}

/**
 * CloudSyncService - Memory and settings synchronization
 */
export class CloudSyncService extends EventEmitter {
    private static instance: CloudSyncService;
    private config: SyncConfig | null = null;
    private items: Map<string, SyncedItem> = new Map();
    private status: SyncStatus = {
        lastSync: null,
        itemsSynced: 0,
        status: 'idle',
        conflicts: [],
    };
    private syncTimer: NodeJS.Timeout | null = null;
    private localCachePath: string;

    private constructor() {
        super();
        this.localCachePath = path.join(process.cwd(), '.shadow-sync');
        this.initializeCache();
    }

    static getInstance(): CloudSyncService {
        if (!CloudSyncService.instance) {
            CloudSyncService.instance = new CloudSyncService();
        }
        return CloudSyncService.instance;
    }

    /**
     * Initialize local cache directory
     */
    private async initializeCache(): Promise<void> {
        try {
            await fs.mkdir(this.localCachePath, { recursive: true });
            await this.loadLocalCache();
        } catch (error) {
            console.error('Failed to initialize sync cache:', error);
        }
    }

    /**
     * Load items from local cache
     */
    private async loadLocalCache(): Promise<void> {
        try {
            const cacheFile = path.join(this.localCachePath, 'sync-cache.json');
            const data = await fs.readFile(cacheFile, 'utf-8');
            const cached = JSON.parse(data);

            for (const item of cached.items) {
                this.items.set(item.id, {
                    ...item,
                    lastModified: new Date(item.lastModified),
                });
            }

            console.log(`📦 [CloudSync] Loaded ${this.items.size} items from cache`);
        } catch {
            // Cache doesn't exist yet, that's fine
        }
    }

    /**
     * Save items to local cache
     */
    private async saveLocalCache(): Promise<void> {
        try {
            const cacheFile = path.join(this.localCachePath, 'sync-cache.json');
            const data = {
                lastModified: new Date().toISOString(),
                items: Array.from(this.items.values()),
            };
            await fs.writeFile(cacheFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save sync cache:', error);
        }
    }

    /**
     * Configure sync settings
     */
    configure(config: SyncConfig): void {
        this.config = config;

        if (config.autoSync && config.syncInterval > 0) {
            this.startAutoSync(config.syncInterval);
        }

        this.emit('config:updated', config);
        console.log(`☁️ [CloudSync] Configured with provider: ${config.provider}`);
    }

    /**
     * Start automatic sync
     */
    startAutoSync(intervalMinutes: number): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(
            () => this.sync(),
            intervalMinutes * 60 * 1000
        );

        console.log(`☁️ [CloudSync] Auto-sync enabled every ${intervalMinutes} minutes`);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    /**
     * Add or update an item
     */
    async addItem(type: SyncedItem['type'], id: string, data: any): Promise<SyncedItem> {
        const hash = this.computeHash(data);
        const existing = this.items.get(id);

        const item: SyncedItem = {
            id,
            type,
            data,
            hash,
            lastModified: new Date(),
            version: existing ? existing.version + 1 : 1,
        };

        this.items.set(id, item);
        await this.saveLocalCache();

        this.emit('item:added', item);
        return item;
    }

    /**
     * Get an item by ID
     */
    getItem(id: string): SyncedItem | undefined {
        return this.items.get(id);
    }

    /**
     * Delete an item
     */
    async deleteItem(id: string): Promise<boolean> {
        const deleted = this.items.delete(id);
        if (deleted) {
            await this.saveLocalCache();
            this.emit('item:deleted', id);
        }
        return deleted;
    }

    /**
     * Get all items of a type
     */
    getItemsByType(type: SyncedItem['type']): SyncedItem[] {
        return Array.from(this.items.values())
            .filter(item => item.type === type);
    }

    /**
     * Compute hash of data
     */
    private computeHash(data: any): string {
        const json = JSON.stringify(data);
        return crypto.createHash('sha256').update(json).digest('hex').slice(0, 16);
    }

    /**
     * Encrypt data for cloud storage
     */
    private encrypt(data: string): string {
        if (!this.config?.encryptionKey) return data;

        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt data from cloud storage
     */
    private decrypt(encryptedData: string): string {
        if (!this.config?.encryptionKey) return encryptedData;

        const [ivHex, encrypted] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Sync with cloud
     */
    async sync(): Promise<SyncStatus> {
        if (!this.config) {
            return { ...this.status, status: 'error', error: 'Not configured' };
        }

        this.status.status = 'syncing';
        this.emit('sync:start');

        try {
            // Upload local changes
            const localItems = Array.from(this.items.values());
            let syncedCount = 0;

            for (const item of localItems) {
                try {
                    await this.uploadItem(item);
                    syncedCount++;
                } catch (error) {
                    console.error(`Failed to sync item ${item.id}:`, error);
                }
            }

            // Download remote changes
            const remoteItems = await this.fetchRemoteItems();

            for (const remoteItem of remoteItems) {
                const localItem = this.items.get(remoteItem.id);

                if (!localItem) {
                    // New remote item
                    this.items.set(remoteItem.id, remoteItem);
                } else if (remoteItem.version > localItem.version) {
                    // Remote is newer
                    this.items.set(remoteItem.id, remoteItem);
                } else if (remoteItem.version < localItem.version) {
                    // Local is newer, already uploaded
                } else if (remoteItem.hash !== localItem.hash) {
                    // Same version but different content = conflict
                    this.status.conflicts.push({
                        itemId: remoteItem.id,
                        localVersion: localItem,
                        remoteVersion: remoteItem,
                    });
                }
            }

            await this.saveLocalCache();

            this.status = {
                lastSync: new Date(),
                itemsSynced: syncedCount,
                status: this.status.conflicts.length > 0 ? 'conflict' : 'idle',
                conflicts: this.status.conflicts,
            };

            this.emit('sync:complete', this.status);
            console.log(`☁️ [CloudSync] Synced ${syncedCount} items`);

        } catch (error: any) {
            this.status = {
                ...this.status,
                status: 'error',
                error: error.message,
            };
            this.emit('sync:error', error);
        }

        return this.status;
    }

    /**
     * Upload item to cloud (stub - implement per provider)
     */
    private async uploadItem(item: SyncedItem): Promise<void> {
        if (!this.config) return;

        const payload = this.encrypt(JSON.stringify(item));

        switch (this.config.provider) {
            case 'local':
                const filePath = path.join(this.localCachePath, 'cloud', `${item.id}.json`);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, payload);
                break;

            case 'firebase':
            case 's3':
            case 'gcs':
            case 'custom':
                // Would implement actual cloud provider API calls here
                console.log(`Would upload item ${item.id} to ${this.config.provider}`);
                break;
        }
    }

    /**
     * Fetch remote items (stub - implement per provider)
     */
    private async fetchRemoteItems(): Promise<SyncedItem[]> {
        if (!this.config) return [];

        switch (this.config.provider) {
            case 'local':
                try {
                    const cloudDir = path.join(this.localCachePath, 'cloud');
                    const files = await fs.readdir(cloudDir);
                    const items: SyncedItem[] = [];

                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const content = await fs.readFile(path.join(cloudDir, file), 'utf-8');
                            const decrypted = this.decrypt(content);
                            const item = JSON.parse(decrypted);
                            item.lastModified = new Date(item.lastModified);
                            items.push(item);
                        }
                    }

                    return items;
                } catch {
                    return [];
                }

            case 'firebase':
            case 's3':
            case 'gcs':
            case 'custom':
                // Would implement actual cloud provider API calls here
                console.log(`Would fetch items from ${this.config.provider}`);
                return [];
        }

        return [];
    }

    /**
     * Resolve a conflict
     */
    async resolveConflict(itemId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: any): Promise<void> {
        const conflictIndex = this.status.conflicts.findIndex(c => c.itemId === itemId);
        if (conflictIndex === -1) return;

        const conflict = this.status.conflicts[conflictIndex];

        switch (resolution) {
            case 'local':
                // Keep local version, upload it
                await this.uploadItem(conflict.localVersion);
                break;
            case 'remote':
                // Use remote version
                this.items.set(itemId, conflict.remoteVersion);
                break;
            case 'merged':
                // Use merged data
                if (mergedData) {
                    const merged = await this.addItem(
                        conflict.localVersion.type,
                        itemId,
                        mergedData
                    );
                    await this.uploadItem(merged);
                }
                break;
        }

        this.status.conflicts[conflictIndex].resolvedAt = new Date();
        this.status.conflicts[conflictIndex].resolution = resolution;
        this.status.conflicts = this.status.conflicts.filter(c => !c.resolvedAt);

        await this.saveLocalCache();
        this.emit('conflict:resolved', { itemId, resolution });
    }

    /**
     * Export all memories
     */
    async exportMemories(): Promise<string> {
        const memories = this.getItemsByType('memory');
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            itemCount: memories.length,
            items: memories,
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import memories
     */
    async importMemories(jsonData: string): Promise<number> {
        const data = JSON.parse(jsonData);
        let imported = 0;

        for (const item of data.items) {
            await this.addItem('memory', item.id, item.data);
            imported++;
        }

        return imported;
    }

    /**
     * Get sync status
     */
    getStatus(): SyncStatus {
        return { ...this.status };
    }

    /**
     * Get item count
     */
    getItemCount(): { total: number; byType: Record<string, number> } {
        const byType: Record<string, number> = {};

        for (const item of this.items.values()) {
            byType[item.type] = (byType[item.type] || 0) + 1;
        }

        return { total: this.items.size, byType };
    }
}

export default CloudSyncService;
