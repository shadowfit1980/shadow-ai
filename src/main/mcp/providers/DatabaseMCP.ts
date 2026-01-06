/**
 * Database MCP Provider
 * MCP integration for PostgreSQL and other databases
 */

import { EventEmitter } from 'events';

export interface DatabaseConnection {
    id: string;
    name: string;
    type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
    host: string;
    port: number;
    database: string;
    user: string;
    connected: boolean;
    lastUsed?: number;
}

export interface QueryResult {
    id: string;
    query: string;
    rows: any[];
    rowCount: number;
    fields: string[];
    duration: number;
    error?: string;
}

export interface TableSchema {
    name: string;
    columns: ColumnInfo[];
    primaryKey?: string;
    indexes: string[];
}

export interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
}

/**
 * DatabaseMCP
 * Database operations via MCP protocol
 */
export class DatabaseMCP extends EventEmitter {
    private static instance: DatabaseMCP;
    private connections: Map<string, DatabaseConnection> = new Map();
    private queryHistory: QueryResult[] = [];

    private constructor() {
        super();
    }

    static getInstance(): DatabaseMCP {
        if (!DatabaseMCP.instance) {
            DatabaseMCP.instance = new DatabaseMCP();
        }
        return DatabaseMCP.instance;
    }

    /**
     * Add a connection
     */
    addConnection(config: Omit<DatabaseConnection, 'id' | 'connected'>): DatabaseConnection {
        const conn: DatabaseConnection = {
            ...config,
            id: `db_${Date.now()}`,
            connected: false,
        };

        this.connections.set(conn.id, conn);
        this.emit('connectionAdded', conn);
        return conn;
    }

    /**
     * Connect to database
     */
    async connect(connectionId: string): Promise<boolean> {
        const conn = this.connections.get(connectionId);
        if (!conn) return false;

        try {
            // Simulate connection
            await this.delay(1000);
            conn.connected = true;
            conn.lastUsed = Date.now();
            this.emit('connected', conn);
            return true;
        } catch (error) {
            this.emit('connectionError', { connectionId, error });
            return false;
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect(connectionId: string): Promise<boolean> {
        const conn = this.connections.get(connectionId);
        if (!conn) return false;

        conn.connected = false;
        this.emit('disconnected', conn);
        return true;
    }

    /**
     * Execute query
     */
    async query(connectionId: string, sql: string): Promise<QueryResult> {
        const conn = this.connections.get(connectionId);
        if (!conn || !conn.connected) {
            throw new Error('Not connected to database');
        }

        const startTime = Date.now();
        const result: QueryResult = {
            id: `query_${Date.now()}`,
            query: sql,
            rows: [],
            rowCount: 0,
            fields: [],
            duration: 0,
        };

        try {
            // Simulate query execution
            await this.delay(500);

            // Mock results based on query type
            if (sql.toLowerCase().startsWith('select')) {
                result.rows = this.generateMockRows(5);
                result.rowCount = result.rows.length;
                result.fields = Object.keys(result.rows[0] || {});
            } else if (sql.toLowerCase().startsWith('insert')) {
                result.rowCount = 1;
            } else if (sql.toLowerCase().startsWith('update') || sql.toLowerCase().startsWith('delete')) {
                result.rowCount = Math.floor(Math.random() * 10) + 1;
            }

            result.duration = Date.now() - startTime;
            this.queryHistory.push(result);
            this.emit('queryExecuted', result);

            return result;
        } catch (error: any) {
            result.error = error.message;
            result.duration = Date.now() - startTime;
            this.queryHistory.push(result);
            throw error;
        }
    }

    /**
     * Get table schema
     */
    async getSchema(connectionId: string, tableName: string): Promise<TableSchema> {
        const conn = this.connections.get(connectionId);
        if (!conn || !conn.connected) {
            throw new Error('Not connected to database');
        }

        // Mock schema
        return {
            name: tableName,
            columns: [
                { name: 'id', type: 'integer', nullable: false },
                { name: 'name', type: 'varchar(255)', nullable: true },
                { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
            ],
            primaryKey: 'id',
            indexes: ['idx_name'],
        };
    }

    /**
     * List tables
     */
    async listTables(connectionId: string): Promise<string[]> {
        const conn = this.connections.get(connectionId);
        if (!conn || !conn.connected) {
            throw new Error('Not connected to database');
        }

        // Mock table list
        return ['users', 'products', 'orders', 'transactions', 'logs'];
    }

    /**
     * Get all connections
     */
    getConnections(): DatabaseConnection[] {
        return Array.from(this.connections.values());
    }

    /**
     * Get connection by ID
     */
    getConnection(id: string): DatabaseConnection | null {
        return this.connections.get(id) || null;
    }

    /**
     * Remove connection
     */
    removeConnection(id: string): boolean {
        const conn = this.connections.get(id);
        if (conn?.connected) {
            this.disconnect(id);
        }
        const deleted = this.connections.delete(id);
        if (deleted) {
            this.emit('connectionRemoved', { id });
        }
        return deleted;
    }

    /**
     * Get query history
     */
    getQueryHistory(limit = 50): QueryResult[] {
        return this.queryHistory.slice(-limit).reverse();
    }

    /**
     * Clear query history
     */
    clearHistory(): void {
        this.queryHistory = [];
        this.emit('historyCleared');
    }

    /**
     * Test connection
     */
    async testConnection(config: Omit<DatabaseConnection, 'id' | 'connected'>): Promise<boolean> {
        try {
            await this.delay(500);
            // Simulate connection test
            return true;
        } catch {
            return false;
        }
    }

    // Helper methods

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateMockRows(count: number): any[] {
        const rows = [];
        for (let i = 0; i < count; i++) {
            rows.push({
                id: i + 1,
                name: `Item ${i + 1}`,
                status: i % 2 === 0 ? 'active' : 'inactive',
                created_at: new Date().toISOString(),
            });
        }
        return rows;
    }
}

// Singleton getter
export function getDatabaseMCP(): DatabaseMCP {
    return DatabaseMCP.getInstance();
}
