/**
 * Database Schema Designer
 * 
 * Design and generate database schemas.
 */

import { EventEmitter } from 'events';

interface Field {
    name: string;
    type: string;
    nullable: boolean;
    unique: boolean;
    default?: string;
    reference?: { table: string; field: string };
}

interface Table {
    name: string;
    fields: Field[];
    indexes?: string[];
}

interface Schema {
    name: string;
    tables: Table[];
}

export class DatabaseSchemaDesigner extends EventEmitter {
    private static instance: DatabaseSchemaDesigner;

    private constructor() { super(); }

    static getInstance(): DatabaseSchemaDesigner {
        if (!DatabaseSchemaDesigner.instance) {
            DatabaseSchemaDesigner.instance = new DatabaseSchemaDesigner();
        }
        return DatabaseSchemaDesigner.instance;
    }

    generateSQL(schema: Schema): string {
        let sql = `-- Schema: ${schema.name}\n\n`;
        for (const table of schema.tables) {
            sql += this.generateTableSQL(table) + '\n\n';
        }
        return sql;
    }

    private generateTableSQL(table: Table): string {
        const fields = table.fields.map(f => {
            let def = `  ${f.name} ${f.type}`;
            if (!f.nullable) def += ' NOT NULL';
            if (f.unique) def += ' UNIQUE';
            if (f.default) def += ` DEFAULT ${f.default}`;
            return def;
        });

        const refs = table.fields.filter(f => f.reference).map(f =>
            `  FOREIGN KEY (${f.name}) REFERENCES ${f.reference!.table}(${f.reference!.field})`
        );

        return `CREATE TABLE ${table.name} (\n${[...fields, ...refs].join(',\n')}\n);`;
    }

    generatePrisma(schema: Schema): string {
        let prisma = '';
        for (const table of schema.tables) {
            prisma += `model ${this.pascalCase(table.name)} {\n`;
            for (const f of table.fields) {
                const type = this.toPrismaType(f.type);
                prisma += `  ${f.name} ${type}${f.nullable ? '?' : ''}\n`;
            }
            prisma += '}\n\n';
        }
        return prisma;
    }

    private toPrismaType(sqlType: string): string {
        const map: Record<string, string> = {
            'VARCHAR': 'String', 'TEXT': 'String', 'INT': 'Int', 'INTEGER': 'Int',
            'BOOLEAN': 'Boolean', 'TIMESTAMP': 'DateTime', 'FLOAT': 'Float', 'SERIAL': 'Int @id @default(autoincrement())'
        };
        return map[sqlType.toUpperCase().split('(')[0]] || 'String';
    }

    private pascalCase(str: string): string {
        return str.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    }

    generateTypeScript(schema: Schema): string {
        let ts = '';
        for (const table of schema.tables) {
            ts += `export interface ${this.pascalCase(table.name)} {\n`;
            for (const f of table.fields) {
                const type = this.toTSType(f.type);
                ts += `  ${f.name}${f.nullable ? '?' : ''}: ${type};\n`;
            }
            ts += '}\n\n';
        }
        return ts;
    }

    private toTSType(sqlType: string): string {
        const map: Record<string, string> = {
            'VARCHAR': 'string', 'TEXT': 'string', 'INT': 'number', 'INTEGER': 'number',
            'BOOLEAN': 'boolean', 'TIMESTAMP': 'Date', 'FLOAT': 'number', 'SERIAL': 'number'
        };
        return map[sqlType.toUpperCase().split('(')[0]] || 'string';
    }

    suggestIndexes(table: Table): string[] {
        const suggestions: string[] = [];
        for (const f of table.fields) {
            if (f.name.endsWith('_id') || f.reference) suggestions.push(`CREATE INDEX idx_${table.name}_${f.name} ON ${table.name}(${f.name});`);
            if (f.unique) suggestions.push(`CREATE UNIQUE INDEX idx_${table.name}_${f.name} ON ${table.name}(${f.name});`);
        }
        return suggestions;
    }
}

export const databaseSchemaDesigner = DatabaseSchemaDesigner.getInstance();
