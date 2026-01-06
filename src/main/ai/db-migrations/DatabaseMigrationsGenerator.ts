// Database Migrations Generator - Generate database migration scripts
import Anthropic from '@anthropic-ai/sdk';

interface MigrationConfig {
    name: string;
    tableName: string;
    columns: Array<{
        name: string;
        type: string;
        nullable?: boolean;
        defaultValue?: string;
        unique?: boolean;
        primaryKey?: boolean;
        references?: { table: string; column: string };
    }>;
}

class DatabaseMigrationsGenerator {
    private anthropic: Anthropic | null = null;

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic();
        }
        return this.anthropic;
    }

    generateKnexMigration(config: MigrationConfig): string {
        const columns = config.columns.map(col => {
            let line = `table.${this.knexType(col.type)}('${col.name}')`;
            if (col.primaryKey) line += '.primary()';
            if (col.unique) line += '.unique()';
            if (!col.nullable) line += '.notNullable()';
            if (col.defaultValue) line += `.defaultTo(${col.defaultValue})`;
            if (col.references) {
                line += `.references('${col.references.column}').inTable('${col.references.table}')`;
            }
            return `        ${line};`;
        }).join('\n');

        return `import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('${config.tableName}', (table) => {
${columns}
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('${config.tableName}');
}
`;
    }

    generatePrismaMigration(config: MigrationConfig): string {
        const fields = config.columns.map(col => {
            let line = `  ${col.name} ${this.prismaType(col.type)}`;
            if (col.primaryKey) line += ' @id @default(autoincrement())';
            else if (!col.nullable) line = line;
            else line += '?';
            if (col.unique) line += ' @unique';
            if (col.defaultValue) line += ` @default(${col.defaultValue})`;
            if (col.references) {
                line += `\n  ${col.references.table.toLowerCase()} ${col.references.table} @relation(fields: [${col.name}], references: [${col.references.column}])`;
            }
            return line;
        }).join('\n');

        return `// Prisma Migration for ${config.name}
// Run: npx prisma migrate dev --name ${config.name.toLowerCase().replace(/\\s+/g, '_')}

model ${config.tableName} {
${fields}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    }

    generateTypeORMMigration(config: MigrationConfig): string {
        const columns = config.columns.map(col => {
            const options: string[] = [];
            if (col.primaryKey) options.push('primary: true');
            if (col.unique) options.push('unique: true');
            if (col.nullable) options.push('nullable: true');
            if (col.defaultValue) options.push(`default: ${col.defaultValue}`);

            const optStr = options.length > 0 ? `, { ${options.join(', ')} }` : '';
            return `            { name: '${col.name}', type: '${this.sqlType(col.type)}'${optStr} },`;
        }).join('\n');

        return `import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class ${config.name.replace(/\\s+/g, '')}${Date.now()} implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: '${config.tableName}',
                columns: [
${columns}
                    { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('${config.tableName}');
    }
}
`;
    }

    generateDrizzleMigration(config: MigrationConfig): string {
        const columns = config.columns.map(col => {
            let line = `  ${col.name}: ${this.drizzleType(col.type)}('${col.name}')`;
            if (col.primaryKey) line += '.primaryKey()';
            if (!col.nullable && !col.primaryKey) line += '.notNull()';
            if (col.unique) line += '.unique()';
            if (col.defaultValue) line += `.default(${col.defaultValue})`;
            return `${line},`;
        }).join('\n');

        return `import { pgTable, serial, varchar, integer, boolean, timestamp, text } from 'drizzle-orm/pg-core';

export const ${config.tableName} = pgTable('${config.tableName}', {
${columns}
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export type for TypeScript
export type ${config.tableName.charAt(0).toUpperCase() + config.tableName.slice(1)} = typeof ${config.tableName}.$inferSelect;
export type New${config.tableName.charAt(0).toUpperCase() + config.tableName.slice(1)} = typeof ${config.tableName}.$inferInsert;
`;
    }

    generateSQLMigration(config: MigrationConfig): string {
        const columns = config.columns.map(col => {
            let line = `    ${col.name} ${this.sqlType(col.type)}`;
            if (col.primaryKey) line += ' PRIMARY KEY';
            if (!col.nullable) line += ' NOT NULL';
            if (col.unique) line += ' UNIQUE';
            if (col.defaultValue) line += ` DEFAULT ${col.defaultValue}`;
            if (col.references) {
                line += ` REFERENCES ${col.references.table}(${col.references.column})`;
            }
            return line;
        }).join(',\n');

        return `-- Migration: ${config.name}
-- Created: ${new Date().toISOString()}

-- UP
CREATE TABLE IF NOT EXISTS ${config.tableName} (
${columns},
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_${config.tableName}_created_at ON ${config.tableName}(created_at);

-- DOWN
DROP TABLE IF EXISTS ${config.tableName};
`;
    }

    private knexType(type: string): string {
        const map: Record<string, string> = {
            'string': 'string', 'varchar': 'string', 'text': 'text',
            'int': 'integer', 'integer': 'integer', 'bigint': 'bigInteger',
            'boolean': 'boolean', 'bool': 'boolean',
            'date': 'date', 'datetime': 'datetime', 'timestamp': 'timestamp',
            'json': 'json', 'uuid': 'uuid', 'float': 'float', 'decimal': 'decimal'
        };
        return map[type.toLowerCase()] || 'string';
    }

    private prismaType(type: string): string {
        const map: Record<string, string> = {
            'string': 'String', 'varchar': 'String', 'text': 'String',
            'int': 'Int', 'integer': 'Int', 'bigint': 'BigInt',
            'boolean': 'Boolean', 'bool': 'Boolean',
            'date': 'DateTime', 'datetime': 'DateTime', 'timestamp': 'DateTime',
            'json': 'Json', 'uuid': 'String', 'float': 'Float', 'decimal': 'Decimal'
        };
        return map[type.toLowerCase()] || 'String';
    }

    private drizzleType(type: string): string {
        const map: Record<string, string> = {
            'string': 'varchar', 'varchar': 'varchar', 'text': 'text',
            'int': 'integer', 'integer': 'integer', 'bigint': 'integer',
            'boolean': 'boolean', 'bool': 'boolean',
            'date': 'timestamp', 'datetime': 'timestamp', 'timestamp': 'timestamp',
            'json': 'text', 'uuid': 'varchar', 'float': 'integer', 'decimal': 'integer'
        };
        return map[type.toLowerCase()] || 'varchar';
    }

    private sqlType(type: string): string {
        const map: Record<string, string> = {
            'string': 'VARCHAR(255)', 'varchar': 'VARCHAR(255)', 'text': 'TEXT',
            'int': 'INTEGER', 'integer': 'INTEGER', 'bigint': 'BIGINT',
            'boolean': 'BOOLEAN', 'bool': 'BOOLEAN',
            'date': 'DATE', 'datetime': 'DATETIME', 'timestamp': 'TIMESTAMP',
            'json': 'JSON', 'uuid': 'UUID', 'float': 'FLOAT', 'decimal': 'DECIMAL(10,2)'
        };
        return map[type.toLowerCase()] || 'VARCHAR(255)';
    }
}

export const databaseMigrationsGenerator = new DatabaseMigrationsGenerator();
