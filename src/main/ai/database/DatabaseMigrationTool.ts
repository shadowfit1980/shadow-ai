/**
 * Database Migration Tool
 * 
 * Generate and manage database migrations
 * for various ORMs and databases.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type MigrationORM = 'prisma' | 'drizzle' | 'knex' | 'typeorm' | 'sequelize' | 'mongoose';
export type ColumnType = 'string' | 'text' | 'integer' | 'bigint' | 'float' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'timestamp' | 'json' | 'uuid';

export interface Column {
    name: string;
    type: ColumnType;
    nullable?: boolean;
    unique?: boolean;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    defaultValue?: any;
    references?: { table: string; column: string };
}

export interface Index {
    name: string;
    columns: string[];
    unique?: boolean;
}

export interface TableSchema {
    name: string;
    columns: Column[];
    indexes?: Index[];
    timestamps?: boolean;
    softDeletes?: boolean;
}

export interface Migration {
    id: string;
    name: string;
    timestamp: Date;
    up: string;
    down: string;
    orm: MigrationORM;
}

export interface SchemaDiff {
    tablesToCreate: TableSchema[];
    tablesToDrop: string[];
    columnsToAdd: Array<{ table: string; column: Column }>;
    columnsToRemove: Array<{ table: string; column: string }>;
    columnsToModify: Array<{ table: string; column: Column; changes: string[] }>;
    indexesToAdd: Array<{ table: string; index: Index }>;
    indexesToRemove: Array<{ table: string; index: string }>;
}

// ============================================================================
// DATABASE MIGRATION TOOL
// ============================================================================

export class DatabaseMigrationTool extends EventEmitter {
    private static instance: DatabaseMigrationTool;
    private migrations: Migration[] = [];
    private currentSchema: Map<string, TableSchema> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): DatabaseMigrationTool {
        if (!DatabaseMigrationTool.instance) {
            DatabaseMigrationTool.instance = new DatabaseMigrationTool();
        }
        return DatabaseMigrationTool.instance;
    }

    // ========================================================================
    // PRISMA MIGRATIONS
    // ========================================================================

    generatePrismaSchema(tables: TableSchema[]): string {
        let schema = `// Generated Prisma Schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

        for (const table of tables) {
            schema += `model ${this.toPascalCase(table.name)} {\n`;

            for (const col of table.columns) {
                schema += `  ${col.name} ${this.toPrismaType(col)}`;
                if (col.primaryKey) schema += ' @id';
                if (col.autoIncrement) schema += ' @default(autoincrement())';
                if (col.unique) schema += ' @unique';
                if (col.defaultValue !== undefined) {
                    schema += ` @default(${this.formatPrismaDefault(col.defaultValue, col.type)})`;
                }
                if (!col.nullable && !col.primaryKey) schema += '';
                if (col.nullable) schema += '?';
                schema += '\n';
            }

            if (table.timestamps) {
                schema += '  createdAt DateTime @default(now())\n';
                schema += '  updatedAt DateTime @updatedAt\n';
            }

            if (table.softDeletes) {
                schema += '  deletedAt DateTime?\n';
            }

            if (table.indexes && table.indexes.length > 0) {
                schema += '\n';
                for (const idx of table.indexes) {
                    if (idx.unique) {
                        schema += `  @@unique([${idx.columns.join(', ')}])\n`;
                    } else {
                        schema += `  @@index([${idx.columns.join(', ')}])\n`;
                    }
                }
            }

            schema += '}\n\n';
        }

        return schema;
    }

    private toPrismaType(col: Column): string {
        const typeMap: Record<ColumnType, string> = {
            string: 'String',
            text: 'String',
            integer: 'Int',
            bigint: 'BigInt',
            float: 'Float',
            decimal: 'Decimal',
            boolean: 'Boolean',
            date: 'DateTime',
            datetime: 'DateTime',
            timestamp: 'DateTime',
            json: 'Json',
            uuid: 'String @db.Uuid',
        };
        return typeMap[col.type] || 'String';
    }

    private formatPrismaDefault(value: any, type: ColumnType): string {
        if (type === 'uuid') return 'uuid()';
        if (type === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'string') return `"${value}"`;
        return String(value);
    }

    // ========================================================================
    // DRIZZLE MIGRATIONS
    // ========================================================================

    generateDrizzleSchema(tables: TableSchema[]): string {
        let imports = new Set<string>();
        let schema = '';

        for (const table of tables) {
            const colDefs: string[] = [];

            for (const col of table.columns) {
                const { drizzleType, drizzleImport } = this.toDrizzleType(col);
                imports.add(drizzleImport);

                let def = `  ${col.name}: ${drizzleType}('${col.name}')`;
                if (col.primaryKey) def += '.primaryKey()';
                if (!col.nullable) def += '.notNull()';
                if (col.unique) def += '.unique()';
                if (col.defaultValue !== undefined) {
                    def += `.default(${JSON.stringify(col.defaultValue)})`;
                }
                colDefs.push(def + ',');
            }

            if (table.timestamps) {
                imports.add('timestamp');
                colDefs.push("  createdAt: timestamp('created_at').defaultNow().notNull(),");
                colDefs.push("  updatedAt: timestamp('updated_at').defaultNow().notNull(),");
            }

            schema += `
export const ${table.name} = pgTable('${table.name}', {
${colDefs.join('\n')}
});
`;
        }

        return `import { pgTable, ${Array.from(imports).join(', ')} } from 'drizzle-orm/pg-core';

${schema}`;
    }

    private toDrizzleType(col: Column): { drizzleType: string; drizzleImport: string } {
        const typeMap: Record<ColumnType, { drizzleType: string; drizzleImport: string }> = {
            string: { drizzleType: 'varchar', drizzleImport: 'varchar' },
            text: { drizzleType: 'text', drizzleImport: 'text' },
            integer: { drizzleType: 'integer', drizzleImport: 'integer' },
            bigint: { drizzleType: 'bigint', drizzleImport: 'bigint' },
            float: { drizzleType: 'real', drizzleImport: 'real' },
            decimal: { drizzleType: 'decimal', drizzleImport: 'decimal' },
            boolean: { drizzleType: 'boolean', drizzleImport: 'boolean' },
            date: { drizzleType: 'date', drizzleImport: 'date' },
            datetime: { drizzleType: 'timestamp', drizzleImport: 'timestamp' },
            timestamp: { drizzleType: 'timestamp', drizzleImport: 'timestamp' },
            json: { drizzleType: 'json', drizzleImport: 'json' },
            uuid: { drizzleType: 'uuid', drizzleImport: 'uuid' },
        };
        return typeMap[col.type] || { drizzleType: 'varchar', drizzleImport: 'varchar' };
    }

    // ========================================================================
    // KNEX MIGRATIONS
    // ========================================================================

    generateKnexMigration(table: TableSchema): Migration {
        const timestamp = new Date();
        const name = `create_${table.name}_table`;

        const up = `exports.up = function(knex) {
  return knex.schema.createTable('${table.name}', function(table) {
${table.columns.map(col => this.generateKnexColumn(col)).join('\n')}
${table.timestamps ? "    table.timestamps(true, true);" : ''}
${table.softDeletes ? "    table.timestamp('deleted_at');" : ''}
${table.indexes?.map(idx => `    table.${idx.unique ? 'unique' : 'index'}([${idx.columns.map(c => `'${c}'`).join(', ')}], '${idx.name}');`).join('\n') || ''}
  });
};`;

        const down = `exports.down = function(knex) {
  return knex.schema.dropTable('${table.name}');
};`;

        const migration: Migration = {
            id: `${timestamp.getTime()}_${name}`,
            name,
            timestamp,
            up,
            down,
            orm: 'knex',
        };

        this.migrations.push(migration);
        return migration;
    }

    private generateKnexColumn(col: Column): string {
        let def = '    table';

        const typeMap: Record<ColumnType, string> = {
            string: ".string('${name}', 255)",
            text: ".text('${name}')",
            integer: ".integer('${name}')",
            bigint: ".bigInteger('${name}')",
            float: ".float('${name}')",
            decimal: ".decimal('${name}', 10, 2)",
            boolean: ".boolean('${name}')",
            date: ".date('${name}')",
            datetime: ".datetime('${name}')",
            timestamp: ".timestamp('${name}')",
            json: ".json('${name}')",
            uuid: ".uuid('${name}')",
        };

        def += (typeMap[col.type] || ".string('${name}')").replace('${name}', col.name);

        if (col.primaryKey) def += '.primary()';
        if (col.autoIncrement) def = `    table.increments('${col.name}')`;
        if (!col.nullable) def += '.notNullable()';
        if (col.unique) def += '.unique()';
        if (col.defaultValue !== undefined) def += `.defaultTo(${JSON.stringify(col.defaultValue)})`;
        if (col.references) def += `.references('${col.references.column}').inTable('${col.references.table}')`;

        return def + ';';
    }

    // ========================================================================
    // TYPEORM MIGRATIONS
    // ========================================================================

    generateTypeORMEntity(table: TableSchema): string {
        const imports = new Set(['Entity', 'Column', 'PrimaryGeneratedColumn']);

        if (table.timestamps) {
            imports.add('CreateDateColumn');
            imports.add('UpdateDateColumn');
        }

        return `import { ${Array.from(imports).join(', ')} } from 'typeorm';

@Entity('${table.name}')
export class ${this.toPascalCase(table.name)} {
${table.columns.map(col => this.generateTypeORMColumn(col)).join('\n')}
${table.timestamps ? `
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
` : ''}
${table.softDeletes ? `
  @Column({ nullable: true })
  deletedAt: Date;
` : ''}
}
`;
    }

    private generateTypeORMColumn(col: Column): string {
        if (col.primaryKey && col.autoIncrement) {
            return `  @PrimaryGeneratedColumn()
  ${col.name}: number;`;
        }

        if (col.primaryKey && col.type === 'uuid') {
            return `  @PrimaryGeneratedColumn('uuid')
  ${col.name}: string;`;
        }

        const typeMap: Record<ColumnType, string> = {
            string: 'string',
            text: 'string',
            integer: 'number',
            bigint: 'bigint',
            float: 'number',
            decimal: 'string',
            boolean: 'boolean',
            date: 'Date',
            datetime: 'Date',
            timestamp: 'Date',
            json: 'object',
            uuid: 'string',
        };

        const options: string[] = [];
        if (col.nullable) options.push('nullable: true');
        if (col.unique) options.push('unique: true');
        if (col.defaultValue !== undefined) options.push(`default: ${JSON.stringify(col.defaultValue)}`);
        if (col.type === 'text') options.push("type: 'text'");

        const optionsStr = options.length > 0 ? `{ ${options.join(', ')} }` : '';

        return `  @Column(${optionsStr})
  ${col.name}${col.nullable ? '?' : ''}: ${typeMap[col.type] || 'string'};`;
    }

    // ========================================================================
    // SCHEMA DIFF
    // ========================================================================

    diffSchemas(currentTables: TableSchema[], desiredTables: TableSchema[]): SchemaDiff {
        const current = new Map(currentTables.map(t => [t.name, t]));
        const desired = new Map(desiredTables.map(t => [t.name, t]));

        const diff: SchemaDiff = {
            tablesToCreate: [],
            tablesToDrop: [],
            columnsToAdd: [],
            columnsToRemove: [],
            columnsToModify: [],
            indexesToAdd: [],
            indexesToRemove: [],
        };

        // Find tables to create
        for (const [name, table] of desired) {
            if (!current.has(name)) {
                diff.tablesToCreate.push(table);
            }
        }

        // Find tables to drop
        for (const name of current.keys()) {
            if (!desired.has(name)) {
                diff.tablesToDrop.push(name);
            }
        }

        // Compare existing tables
        for (const [name, desiredTable] of desired) {
            const currentTable = current.get(name);
            if (!currentTable) continue;

            const currentCols = new Map(currentTable.columns.map(c => [c.name, c]));
            const desiredCols = new Map(desiredTable.columns.map(c => [c.name, c]));

            // Columns to add
            for (const [colName, col] of desiredCols) {
                if (!currentCols.has(colName)) {
                    diff.columnsToAdd.push({ table: name, column: col });
                }
            }

            // Columns to remove
            for (const colName of currentCols.keys()) {
                if (!desiredCols.has(colName)) {
                    diff.columnsToRemove.push({ table: name, column: colName });
                }
            }

            // Columns to modify
            for (const [colName, desiredCol] of desiredCols) {
                const currentCol = currentCols.get(colName);
                if (currentCol) {
                    const changes = this.getColumnChanges(currentCol, desiredCol);
                    if (changes.length > 0) {
                        diff.columnsToModify.push({ table: name, column: desiredCol, changes });
                    }
                }
            }
        }

        return diff;
    }

    private getColumnChanges(current: Column, desired: Column): string[] {
        const changes: string[] = [];
        if (current.type !== desired.type) changes.push(`type: ${current.type} -> ${desired.type}`);
        if (current.nullable !== desired.nullable) changes.push(`nullable: ${current.nullable} -> ${desired.nullable}`);
        if (current.unique !== desired.unique) changes.push(`unique: ${current.unique} -> ${desired.unique}`);
        return changes;
    }

    // ========================================================================
    // SQL GENERATION
    // ========================================================================

    generateSQL(tables: TableSchema[], dialect: 'postgresql' | 'mysql' | 'sqlite' = 'postgresql'): string {
        return tables.map(table => this.generateCreateTableSQL(table, dialect)).join('\n\n');
    }

    private generateCreateTableSQL(table: TableSchema, dialect: string): string {
        const cols = table.columns.map(col => {
            let def = `  "${col.name}" ${this.toSQLType(col.type, dialect)}`;
            if (col.primaryKey) def += ' PRIMARY KEY';
            if (col.autoIncrement) {
                def = dialect === 'postgresql'
                    ? `  "${col.name}" SERIAL PRIMARY KEY`
                    : `  "${col.name}" INTEGER PRIMARY KEY AUTOINCREMENT`;
            }
            if (!col.nullable) def += ' NOT NULL';
            if (col.unique && !col.primaryKey) def += ' UNIQUE';
            if (col.defaultValue !== undefined) def += ` DEFAULT ${this.formatSQLDefault(col.defaultValue)}`;
            return def;
        });

        if (table.timestamps) {
            cols.push('  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            cols.push('  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }

        let sql = `CREATE TABLE "${table.name}" (\n${cols.join(',\n')}\n);`;

        if (table.indexes) {
            for (const idx of table.indexes) {
                sql += `\nCREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX "${idx.name}" ON "${table.name}" (${idx.columns.map(c => `"${c}"`).join(', ')});`;
            }
        }

        return sql;
    }

    private toSQLType(type: ColumnType, dialect: string): string {
        const types: Record<string, Record<ColumnType, string>> = {
            postgresql: {
                string: 'VARCHAR(255)',
                text: 'TEXT',
                integer: 'INTEGER',
                bigint: 'BIGINT',
                float: 'REAL',
                decimal: 'DECIMAL(10,2)',
                boolean: 'BOOLEAN',
                date: 'DATE',
                datetime: 'TIMESTAMP',
                timestamp: 'TIMESTAMP',
                json: 'JSONB',
                uuid: 'UUID',
            },
            mysql: {
                string: 'VARCHAR(255)',
                text: 'TEXT',
                integer: 'INT',
                bigint: 'BIGINT',
                float: 'FLOAT',
                decimal: 'DECIMAL(10,2)',
                boolean: 'TINYINT(1)',
                date: 'DATE',
                datetime: 'DATETIME',
                timestamp: 'TIMESTAMP',
                json: 'JSON',
                uuid: 'CHAR(36)',
            },
            sqlite: {
                string: 'TEXT',
                text: 'TEXT',
                integer: 'INTEGER',
                bigint: 'INTEGER',
                float: 'REAL',
                decimal: 'REAL',
                boolean: 'INTEGER',
                date: 'TEXT',
                datetime: 'TEXT',
                timestamp: 'TEXT',
                json: 'TEXT',
                uuid: 'TEXT',
            },
        };
        return types[dialect]?.[type] || 'TEXT';
    }

    private formatSQLDefault(value: any): string {
        if (value === null) return 'NULL';
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        return String(value);
    }

    private toPascalCase(str: string): string {
        return str.split(/[_-]/).map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    }
}

export const databaseMigrationTool = DatabaseMigrationTool.getInstance();
