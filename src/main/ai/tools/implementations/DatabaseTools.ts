/**
 * Database Tools
 * 
 * Tools for database operations including schema inspection,
 * query execution, and migration helpers.
 */

import { BaseTool, defineParameter } from '../BaseTool';
import { ToolExecutionContext, ToolExecutionResult } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface DatabaseConfig {
    type: 'sqlite' | 'mysql' | 'postgres';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
}

interface TableSchema {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        primaryKey: boolean;
        defaultValue?: string;
    }>;
    indexes: string[];
    foreignKeys: Array<{
        column: string;
        references: string;
    }>;
}

// ============================================================================
// SCHEMA INSPECTOR
// ============================================================================

export class SchemaInspectorTool extends BaseTool {
    constructor() {
        super({
            name: 'inspect_schema',
            description: 'Inspect database schema and return table/column information',
            category: 'database',
            parameters: [
                defineParameter('config', 'object', 'Database connection configuration'),
                defineParameter('table', 'string', 'Specific table to inspect', false),
            ],
            returns: {
                type: 'object',
                description: 'Schema information with tables and columns',
            },
            tags: ['database', 'schema', 'sql'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const config = params.config as DatabaseConfig;
            const table = params.table as string | undefined;

            // For now, return placeholder data
            // In production, this would connect to actual databases
            const schema = this.getMockSchema(config, table);

            return this.createSuccessResult(
                {
                    database: config.database,
                    type: config.type,
                    tables: schema,
                    note: 'Database inspection requires proper driver configuration',
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private getMockSchema(config: DatabaseConfig, table?: string): TableSchema[] {
        // Mock schema for demonstration
        const mockTables: TableSchema[] = [
            {
                name: 'users',
                columns: [
                    { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
                    { name: 'email', type: 'VARCHAR(255)', nullable: false, primaryKey: false },
                    { name: 'name', type: 'VARCHAR(100)', nullable: true, primaryKey: false },
                    { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, defaultValue: 'CURRENT_TIMESTAMP' },
                ],
                indexes: ['idx_users_email'],
                foreignKeys: [],
            },
            {
                name: 'posts',
                columns: [
                    { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
                    { name: 'user_id', type: 'INTEGER', nullable: false, primaryKey: false },
                    { name: 'title', type: 'VARCHAR(200)', nullable: false, primaryKey: false },
                    { name: 'content', type: 'TEXT', nullable: true, primaryKey: false },
                ],
                indexes: ['idx_posts_user_id'],
                foreignKeys: [{ column: 'user_id', references: 'users.id' }],
            },
        ];

        if (table) {
            return mockTables.filter(t => t.name === table);
        }
        return mockTables;
    }
}

// ============================================================================
// QUERY BUILDER
// ============================================================================

export class QueryBuilderTool extends BaseTool {
    constructor() {
        super({
            name: 'build_query',
            description: 'Build SQL queries from natural language or structured input',
            category: 'database',
            parameters: [
                defineParameter('type', 'string', 'Query type', true, {
                    enum: ['select', 'insert', 'update', 'delete'],
                }),
                defineParameter('table', 'string', 'Target table'),
                defineParameter('columns', 'array', 'Columns to select/insert', false),
                defineParameter('where', 'object', 'WHERE conditions', false),
                defineParameter('values', 'object', 'Values for insert/update', false),
                defineParameter('orderBy', 'string', 'ORDER BY clause', false),
                defineParameter('limit', 'number', 'LIMIT clause', false),
            ],
            returns: {
                type: 'object',
                description: 'Generated SQL query',
            },
            tags: ['database', 'sql', 'query'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const type = params.type as string;
            const table = params.table as string;
            const columns = params.columns as string[] || ['*'];
            const where = params.where as Record<string, any> | undefined;
            const values = params.values as Record<string, any> | undefined;
            const orderBy = params.orderBy as string | undefined;
            const limit = params.limit as number | undefined;

            if (!table) {
                throw new Error('Table name is required');
            }

            let query: string;
            const queryParams: any[] = [];

            switch (type) {
                case 'select':
                    query = this.buildSelect(table, columns, where, orderBy, limit, queryParams);
                    break;
                case 'insert':
                    if (!values) throw new Error('Values required for INSERT');
                    query = this.buildInsert(table, values, queryParams);
                    break;
                case 'update':
                    if (!values) throw new Error('Values required for UPDATE');
                    query = this.buildUpdate(table, values, where, queryParams);
                    break;
                case 'delete':
                    query = this.buildDelete(table, where, queryParams);
                    break;
                default:
                    throw new Error(`Unknown query type: ${type}`);
            }

            return this.createSuccessResult(
                {
                    query,
                    params: queryParams,
                    type,
                    table,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private buildSelect(
        table: string,
        columns: string[],
        where?: Record<string, any>,
        orderBy?: string,
        limit?: number,
        params: any[] = []
    ): string {
        let query = `SELECT ${columns.join(', ')} FROM ${table}`;

        if (where && Object.keys(where).length > 0) {
            const whereClauses = Object.entries(where).map(([key, value]) => {
                params.push(value);
                return `${key} = ?`;
            });
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        if (orderBy) query += ` ORDER BY ${orderBy}`;
        if (limit) query += ` LIMIT ${limit}`;

        return query;
    }

    private buildInsert(table: string, values: Record<string, any>, params: any[]): string {
        const columns = Object.keys(values);
        const placeholders = columns.map(() => '?');
        params.push(...Object.values(values));
        return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    }

    private buildUpdate(
        table: string,
        values: Record<string, any>,
        where?: Record<string, any>,
        params: any[] = []
    ): string {
        const setClauses = Object.entries(values).map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
        });

        let query = `UPDATE ${table} SET ${setClauses.join(', ')}`;

        if (where && Object.keys(where).length > 0) {
            const whereClauses = Object.entries(where).map(([key, value]) => {
                params.push(value);
                return `${key} = ?`;
            });
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        return query;
    }

    private buildDelete(table: string, where?: Record<string, any>, params: any[] = []): string {
        let query = `DELETE FROM ${table}`;

        if (where && Object.keys(where).length > 0) {
            const whereClauses = Object.entries(where).map(([key, value]) => {
                params.push(value);
                return `${key} = ?`;
            });
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        } else {
            // Safety: require WHERE for DELETE
            throw new Error('DELETE requires WHERE clause for safety');
        }

        return query;
    }
}

// ============================================================================
// MIGRATION GENERATOR
// ============================================================================

export class MigrationGeneratorTool extends BaseTool {
    constructor() {
        super({
            name: 'generate_migration',
            description: 'Generate database migration SQL from schema changes',
            category: 'database',
            parameters: [
                defineParameter('action', 'string', 'Migration action', true, {
                    enum: ['create_table', 'alter_table', 'drop_table', 'add_column', 'drop_column', 'add_index'],
                }),
                defineParameter('table', 'string', 'Target table'),
                defineParameter('columns', 'array', 'Column definitions for create_table/add_column', false),
                defineParameter('column', 'string', 'Single column name for drop_column', false),
                defineParameter('indexColumns', 'array', 'Columns for index', false),
            ],
            returns: {
                type: 'object',
                description: 'Migration SQL with up and down scripts',
            },
            tags: ['database', 'migration', 'sql'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const action = params.action as string;
            const table = params.table as string;
            const columns = params.columns as Array<{
                name: string;
                type: string;
                nullable?: boolean;
                primaryKey?: boolean;
                defaultValue?: string;
                unique?: boolean;
            }> | undefined;
            const column = params.column as string | undefined;
            const indexColumns = params.indexColumns as string[] | undefined;

            if (!table) {
                throw new Error('Table name is required');
            }

            let up: string;
            let down: string;

            switch (action) {
                case 'create_table':
                    if (!columns || columns.length === 0) {
                        throw new Error('Columns required for create_table');
                    }
                    up = this.generateCreateTable(table, columns);
                    down = `DROP TABLE IF EXISTS ${table};`;
                    break;

                case 'drop_table':
                    up = `DROP TABLE IF EXISTS ${table};`;
                    down = '-- Cannot auto-generate: table structure unknown';
                    break;

                case 'add_column':
                    if (!columns || columns.length === 0) {
                        throw new Error('Columns required for add_column');
                    }
                    up = columns.map(col =>
                        `ALTER TABLE ${table} ADD COLUMN ${this.columnDef(col)};`
                    ).join('\n');
                    down = columns.map(col =>
                        `ALTER TABLE ${table} DROP COLUMN ${col.name};`
                    ).join('\n');
                    break;

                case 'drop_column':
                    if (!column) {
                        throw new Error('Column name required for drop_column');
                    }
                    up = `ALTER TABLE ${table} DROP COLUMN ${column};`;
                    down = '-- Cannot auto-generate: column definition unknown';
                    break;

                case 'add_index':
                    if (!indexColumns || indexColumns.length === 0) {
                        throw new Error('Index columns required');
                    }
                    const indexName = `idx_${table}_${indexColumns.join('_')}`;
                    up = `CREATE INDEX ${indexName} ON ${table} (${indexColumns.join(', ')});`;
                    down = `DROP INDEX IF EXISTS ${indexName};`;
                    break;

                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            return this.createSuccessResult(
                {
                    action,
                    table,
                    migration: {
                        up,
                        down,
                    },
                    timestamp: new Date().toISOString(),
                    filename: `${Date.now()}_${action}_${table}.sql`,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private generateCreateTable(table: string, columns: any[]): string {
        const columnDefs = columns.map(col => this.columnDef(col));
        return `CREATE TABLE ${table} (\n  ${columnDefs.join(',\n  ')}\n);`;
    }

    private columnDef(col: any): string {
        let def = `${col.name} ${col.type}`;
        if (col.primaryKey) def += ' PRIMARY KEY';
        if (col.unique) def += ' UNIQUE';
        if (!col.nullable) def += ' NOT NULL';
        if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
        return def;
    }
}

// ============================================================================
// QUERY VALIDATOR
// ============================================================================

export class QueryValidatorTool extends BaseTool {
    constructor() {
        super({
            name: 'validate_query',
            description: 'Validate SQL query for safety and correctness',
            category: 'database',
            parameters: [
                defineParameter('query', 'string', 'SQL query to validate'),
                defineParameter('allowMutations', 'boolean', 'Allow INSERT/UPDATE/DELETE', false, {
                    default: false,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Validation result with issues',
            },
            tags: ['database', 'sql', 'validation', 'security'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const query = params.query as string;
            const allowMutations = params.allowMutations === true;

            const issues: Array<{ type: 'error' | 'warning'; message: string }> = [];
            const normalizedQuery = query.toLowerCase().trim();

            // Check for dangerous patterns
            const dangerousPatterns = [
                { pattern: /drop\s+database/i, message: 'DROP DATABASE is not allowed' },
                { pattern: /drop\s+table/i, message: 'DROP TABLE detected - use with caution', type: 'warning' as const },
                { pattern: /truncate/i, message: 'TRUNCATE detected - will delete all data', type: 'warning' as const },
                { pattern: /;\s*--/i, message: 'Potential SQL comment injection detected' },
                { pattern: /union\s+select/i, message: 'UNION SELECT detected - potential injection', type: 'warning' as const },
                { pattern: /into\s+outfile/i, message: 'INTO OUTFILE is not allowed' },
                { pattern: /load\s+data/i, message: 'LOAD DATA is not allowed' },
            ];

            for (const { pattern, message, type } of dangerousPatterns) {
                if (pattern.test(query)) {
                    issues.push({ type: type || 'error', message });
                }
            }

            // Check mutation queries
            const isMutation = /^(insert|update|delete|alter|create|drop)/i.test(normalizedQuery);
            if (isMutation && !allowMutations) {
                issues.push({
                    type: 'error',
                    message: 'Mutation query not allowed. Set allowMutations=true to enable.',
                });
            }

            // Check for WHERE clause on UPDATE/DELETE
            if (/^(update|delete)/i.test(normalizedQuery) && !/where/i.test(normalizedQuery)) {
                issues.push({
                    type: 'warning',
                    message: 'UPDATE/DELETE without WHERE clause will affect all rows',
                });
            }

            // Check for SELECT *
            if (/select\s+\*/i.test(normalizedQuery)) {
                issues.push({
                    type: 'warning',
                    message: 'SELECT * is not recommended. Specify columns explicitly.',
                });
            }

            const hasErrors = issues.some(i => i.type === 'error');

            return this.createSuccessResult(
                {
                    valid: !hasErrors,
                    query,
                    issues,
                    isMutation,
                    queryType: this.getQueryType(normalizedQuery),
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private getQueryType(query: string): string {
        const firstWord = query.split(/\s+/)[0].toUpperCase();
        return firstWord || 'UNKNOWN';
    }
}

// Export all tools
export const databaseTools = [
    new SchemaInspectorTool(),
    new QueryBuilderTool(),
    new MigrationGeneratorTool(),
    new QueryValidatorTool(),
];
