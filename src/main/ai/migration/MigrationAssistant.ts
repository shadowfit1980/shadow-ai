/**
 * Migration Assistant  
 * 
 * Helps with database and framework migrations.
 */

import { EventEmitter } from 'events';

interface Migration {
    id: string;
    name: string;
    type: 'schema' | 'data' | 'framework' | 'version';
    up: string;
    down: string;
    timestamp: number;
}

interface MigrationPlan {
    steps: Migration[];
    estimatedTime: number;
    riskLevel: 'low' | 'medium' | 'high';
    breakingChanges: string[];
}

export class MigrationAssistant extends EventEmitter {
    private static instance: MigrationAssistant;

    private constructor() { super(); }

    static getInstance(): MigrationAssistant {
        if (!MigrationAssistant.instance) {
            MigrationAssistant.instance = new MigrationAssistant();
        }
        return MigrationAssistant.instance;
    }

    generateSchemaMigration(tableName: string, changes: { action: 'add' | 'remove' | 'modify'; column: string; type?: string }[]): Migration {
        const id = `mig_${Date.now()}`;
        let up = '', down = '';

        for (const change of changes) {
            if (change.action === 'add') {
                up += `ALTER TABLE ${tableName} ADD COLUMN ${change.column} ${change.type};\n`;
                down += `ALTER TABLE ${tableName} DROP COLUMN ${change.column};\n`;
            } else if (change.action === 'remove') {
                up += `ALTER TABLE ${tableName} DROP COLUMN ${change.column};\n`;
                down += `ALTER TABLE ${tableName} ADD COLUMN ${change.column} ${change.type || 'TEXT'};\n`;
            } else if (change.action === 'modify') {
                up += `ALTER TABLE ${tableName} ALTER COLUMN ${change.column} TYPE ${change.type};\n`;
                down += `-- Manual rollback needed for ${change.column}\n`;
            }
        }

        return { id, name: `update_${tableName}`, type: 'schema', up, down, timestamp: Date.now() };
    }

    generateFrameworkMigration(from: string, to: string): MigrationPlan {
        const migrations: Migration[] = [];
        const breakingChanges: string[] = [];

        // React version migrations
        if (from.includes('react') && to.includes('react')) {
            migrations.push({
                id: 'react-hooks', name: 'Convert to hooks', type: 'framework',
                up: '// Convert class components to functional with hooks',
                down: '// Convert back to class components', timestamp: Date.now()
            });
            breakingChanges.push('Class lifecycle methods replaced with useEffect');
        }

        // Express to Fastify
        if (from === 'express' && to === 'fastify') {
            migrations.push({
                id: 'fastify-routing', name: 'Update routing syntax', type: 'framework',
                up: "// Replace app.get() with fastify.get()\n// Replace res.json() with return {}\n// Update middleware to plugins",
                down: '// Revert to Express syntax', timestamp: Date.now()
            });
            breakingChanges.push('Middleware syntax changed', 'Response API changed');
        }

        // JavaScript to TypeScript
        if (from === 'javascript' && to === 'typescript') {
            migrations.push({
                id: 'ts-setup', name: 'Setup TypeScript', type: 'framework',
                up: '// Add tsconfig.json\n// Rename .js to .ts\n// Add type annotations',
                down: '// Remove types, rename to .js', timestamp: Date.now()
            });
            breakingChanges.push('All files need type annotations');
        }

        return {
            steps: migrations,
            estimatedTime: migrations.length * 30,
            riskLevel: breakingChanges.length > 2 ? 'high' : breakingChanges.length > 0 ? 'medium' : 'low',
            breakingChanges
        };
    }

    generatePrismaMigration(changes: { model: string; fields: { name: string; type: string }[] }[]): string {
        let schema = '';
        for (const change of changes) {
            schema += `model ${change.model} {\n  id String @id @default(cuid())\n`;
            for (const field of change.fields) {
                schema += `  ${field.name} ${field.type}\n`;
            }
            schema += `  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\n`;
        }
        return schema;
    }
}

export const migrationAssistant = MigrationAssistant.getInstance();
