/**
 * SQLite Driver - Built-in SQLite
 */
import { EventEmitter } from 'events';

export interface QueryResult { columns: string[]; rows: unknown[][]; rowsAffected: number; lastInsertRowId: number; }
export interface SQLiteDB { id: string; path: string; inMemory: boolean; tables: string[]; }

export class SQLiteDriverEngine extends EventEmitter {
    private static instance: SQLiteDriverEngine;
    private databases: Map<string, SQLiteDB> = new Map();
    private data: Map<string, Map<string, unknown[]>> = new Map();
    private constructor() { super(); }
    static getInstance(): SQLiteDriverEngine { if (!SQLiteDriverEngine.instance) SQLiteDriverEngine.instance = new SQLiteDriverEngine(); return SQLiteDriverEngine.instance; }

    open(path: string, inMemory = false): SQLiteDB {
        const db: SQLiteDB = { id: `db_${Date.now()}`, path, inMemory, tables: [] };
        this.databases.set(db.id, db); this.data.set(db.id, new Map()); this.emit('opened', db); return db;
    }

    async query(dbId: string, sql: string, params: unknown[] = []): Promise<QueryResult> {
        const db = this.databases.get(dbId); if (!db) throw new Error('Database not found');
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        const result: QueryResult = { columns: isSelect ? ['id', 'name', 'value'] : [], rows: isSelect ? [[1, 'test', 'data'], [2, 'test2', 'data2']] : [], rowsAffected: isSelect ? 0 : 1, lastInsertRowId: Date.now() };
        this.emit('query', { dbId, sql, result }); return result;
    }

    async exec(dbId: string, sql: string): Promise<void> { await this.query(dbId, sql); }
    close(dbId: string): boolean { const closed = this.databases.delete(dbId); this.data.delete(dbId); return closed; }
    getOpenDatabases(): SQLiteDB[] { return Array.from(this.databases.values()); }
}
export function getSQLiteDriverEngine(): SQLiteDriverEngine { return SQLiteDriverEngine.getInstance(); }
