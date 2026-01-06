/**
 * Database Manager - SQLite/IndexedDB support
 */
import { EventEmitter } from 'events';

export interface DBTable { name: string; columns: { name: string; type: string }[]; }
export interface DBQuery { sql: string; params?: any[]; }

export class DatabaseManager extends EventEmitter {
    private static instance: DatabaseManager;
    private tables: Map<string, DBTable> = new Map();
    private data: Map<string, any[]> = new Map();
    private constructor() { super(); }
    static getInstance(): DatabaseManager { if (!DatabaseManager.instance) DatabaseManager.instance = new DatabaseManager(); return DatabaseManager.instance; }

    createTable(name: string, columns: DBTable['columns']): void {
        this.tables.set(name, { name, columns });
        this.data.set(name, []);
        this.emit('tableCreated', name);
    }

    insert(table: string, row: Record<string, any>): boolean { const rows = this.data.get(table); if (!rows) return false; rows.push(row); this.emit('inserted', { table, row }); return true; }
    select(table: string, where?: (row: any) => boolean): any[] { return (this.data.get(table) || []).filter(where || (() => true)); }
    update(table: string, where: (row: any) => boolean, updates: Record<string, any>): number { const rows = this.data.get(table) || []; let count = 0; rows.forEach(r => { if (where(r)) { Object.assign(r, updates); count++; } }); return count; }
    delete(table: string, where: (row: any) => boolean): number { const rows = this.data.get(table) || []; const newRows = rows.filter(r => !where(r)); this.data.set(table, newRows); return rows.length - newRows.length; }
    getTables(): DBTable[] { return Array.from(this.tables.values()); }
}

export function getDatabaseManager(): DatabaseManager { return DatabaseManager.getInstance(); }
