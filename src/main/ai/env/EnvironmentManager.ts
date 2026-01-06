/**
 * Environment Manager
 * 
 * Manage environment variables, .env files,
 * and configuration across environments.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface EnvVariable {
    key: string;
    value: string;
    description?: string;
    secret?: boolean;
    required?: boolean;
    defaultValue?: string;
}

export interface Environment {
    name: string;
    variables: EnvVariable[];
    inheritsFrom?: string;
}

export interface EnvConfig {
    environments: Environment[];
    schema: EnvSchema[];
    syncEnabled: boolean;
}

export interface EnvSchema {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'url' | 'email' | 'json';
    required: boolean;
    secret: boolean;
    description: string;
    defaultValue?: string;
    validation?: string; // regex pattern
    environments?: string[]; // which environments require this
}

export interface EnvValidationResult {
    valid: boolean;
    errors: Array<{ key: string; error: string }>;
    warnings: Array<{ key: string; warning: string }>;
    missing: string[];
    unused: string[];
}

// ============================================================================
// ENVIRONMENT MANAGER
// ============================================================================

export class EnvironmentManager extends EventEmitter {
    private static instance: EnvironmentManager;
    private config: EnvConfig;
    private currentEnv: string = 'development';

    private constructor() {
        super();
        this.config = {
            environments: [],
            schema: [],
            syncEnabled: false,
        };
    }

    static getInstance(): EnvironmentManager {
        if (!EnvironmentManager.instance) {
            EnvironmentManager.instance = new EnvironmentManager();
        }
        return EnvironmentManager.instance;
    }

    // ========================================================================
    // ENVIRONMENT MANAGEMENT
    // ========================================================================

    createEnvironment(name: string, inheritsFrom?: string): Environment {
        const env: Environment = {
            name,
            variables: [],
            inheritsFrom,
        };

        this.config.environments.push(env);
        this.emit('environmentCreated', env);
        return env;
    }

    setVariable(envName: string, variable: EnvVariable): boolean {
        const env = this.config.environments.find(e => e.name === envName);
        if (!env) return false;

        const existing = env.variables.findIndex(v => v.key === variable.key);
        if (existing >= 0) {
            env.variables[existing] = variable;
        } else {
            env.variables.push(variable);
        }

        this.emit('variableSet', { environment: envName, variable });
        return true;
    }

    getVariable(envName: string, key: string): string | undefined {
        const env = this.config.environments.find(e => e.name === envName);
        if (!env) return undefined;

        // Check current environment
        const variable = env.variables.find(v => v.key === key);
        if (variable) return variable.value;

        // Check inherited environment
        if (env.inheritsFrom) {
            return this.getVariable(env.inheritsFrom, key);
        }

        return undefined;
    }

    getAllVariables(envName: string): EnvVariable[] {
        const env = this.config.environments.find(e => e.name === envName);
        if (!env) return [];

        const variables = [...env.variables];

        // Add inherited variables
        if (env.inheritsFrom) {
            const inherited = this.getAllVariables(env.inheritsFrom);
            for (const v of inherited) {
                if (!variables.find(ev => ev.key === v.key)) {
                    variables.push(v);
                }
            }
        }

        return variables;
    }

    // ========================================================================
    // .ENV FILE OPERATIONS
    // ========================================================================

    parseEnvFile(content: string): EnvVariable[] {
        const variables: EnvVariable[] = [];
        const lines = content.split('\n');
        let currentComment = '';

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('#')) {
                currentComment = trimmed.slice(1).trim();
                continue;
            }

            if (!trimmed || !trimmed.includes('=')) continue;

            const eqIndex = trimmed.indexOf('=');
            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            variables.push({
                key,
                value,
                description: currentComment || undefined,
                secret: this.isLikelySecret(key),
            });

            currentComment = '';
        }

        return variables;
    }

    generateEnvFile(envName: string, options: {
        includeComments?: boolean;
        includeEmpty?: boolean;
        maskSecrets?: boolean;
    } = {}): string {
        const variables = this.getAllVariables(envName);
        const lines: string[] = [
            `# Environment: ${envName}`,
            `# Generated: ${new Date().toISOString()}`,
            '',
        ];

        for (const v of variables) {
            if (!options.includeEmpty && !v.value) continue;

            if (options.includeComments && v.description) {
                lines.push(`# ${v.description}`);
            }

            const value = options.maskSecrets && v.secret
                ? '***MASKED***'
                : v.value;

            lines.push(`${v.key}=${this.quoteIfNeeded(value)}`);
        }

        return lines.join('\n');
    }

    private quoteIfNeeded(value: string): string {
        if (value.includes(' ') || value.includes('#') || value.includes('\n')) {
            return `"${value.replace(/"/g, '\\"')}"`;
        }
        return value;
    }

    private isLikelySecret(key: string): boolean {
        const secretPatterns = [
            'SECRET', 'PASSWORD', 'KEY', 'TOKEN', 'CREDENTIAL',
            'AUTH', 'PRIVATE', 'API_KEY', 'ACCESS_KEY', 'ENCRYPTION',
        ];
        const upper = key.toUpperCase();
        return secretPatterns.some(p => upper.includes(p));
    }

    // ========================================================================
    // SCHEMA VALIDATION
    // ========================================================================

    defineSchema(schema: EnvSchema[]): void {
        this.config.schema = schema;
        this.emit('schemaUpdated', schema);
    }

    validate(envName: string): EnvValidationResult {
        const variables = this.getAllVariables(envName);
        const varMap = new Map(variables.map(v => [v.key, v]));

        const errors: Array<{ key: string; error: string }> = [];
        const warnings: Array<{ key: string; warning: string }> = [];
        const missing: string[] = [];
        const schemaKeys = new Set(this.config.schema.map(s => s.key));
        const unused: string[] = [];

        // Check schema requirements
        for (const schema of this.config.schema) {
            // Check if required for this environment
            if (schema.environments && !schema.environments.includes(envName)) {
                continue;
            }

            const variable = varMap.get(schema.key);

            if (!variable) {
                if (schema.required) {
                    errors.push({ key: schema.key, error: 'Required variable is missing' });
                    missing.push(schema.key);
                } else if (!schema.defaultValue) {
                    warnings.push({ key: schema.key, warning: 'Optional variable not set' });
                }
                continue;
            }

            // Type validation
            if (!this.validateType(variable.value, schema.type)) {
                errors.push({
                    key: schema.key,
                    error: `Invalid type: expected ${schema.type}`
                });
            }

            // Regex validation
            if (schema.validation && !new RegExp(schema.validation).test(variable.value)) {
                errors.push({
                    key: schema.key,
                    error: `Value doesn't match pattern: ${schema.validation}`
                });
            }
        }

        // Find unused variables
        for (const key of varMap.keys()) {
            if (!schemaKeys.has(key)) {
                unused.push(key);
                warnings.push({ key, warning: 'Variable not defined in schema' });
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            missing,
            unused,
        };
    }

    private validateType(value: string, type: EnvSchema['type']): boolean {
        switch (type) {
            case 'number':
                return !isNaN(Number(value));
            case 'boolean':
                return ['true', 'false', '1', '0'].includes(value.toLowerCase());
            case 'url':
                try { new URL(value); return true; } catch { return false; }
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'json':
                try { JSON.parse(value); return true; } catch { return false; }
            default:
                return true;
        }
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateEnvExample(): string {
        const lines: string[] = [
            '# Environment Configuration',
            '# Copy this file to .env and fill in the values',
            '',
        ];

        for (const schema of this.config.schema) {
            if (schema.description) {
                lines.push(`# ${schema.description}`);
            }
            lines.push(`# Type: ${schema.type}${schema.required ? ' (Required)' : ''}`);

            const value = schema.defaultValue ||
                (schema.secret ? 'your-secret-here' : 'your-value-here');
            lines.push(`${schema.key}=${value}`);
            lines.push('');
        }

        return lines.join('\n');
    }

    generateTypescriptEnvConfig(): string {
        return `// Auto-generated environment configuration
import { z } from 'zod';

const envSchema = z.object({
${this.config.schema.map(s => `  ${s.key}: ${this.getZodType(s)},`).join('\n')}
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
`;
    }

    private getZodType(schema: EnvSchema): string {
        let zodType: string;
        switch (schema.type) {
            case 'number':
                zodType = 'z.string().transform(Number)';
                break;
            case 'boolean':
                zodType = 'z.string().transform(v => v === "true" || v === "1")';
                break;
            case 'url':
                zodType = 'z.string().url()';
                break;
            case 'email':
                zodType = 'z.string().email()';
                break;
            case 'json':
                zodType = 'z.string().transform(JSON.parse)';
                break;
            default:
                zodType = 'z.string()';
        }

        if (!schema.required) {
            zodType += '.optional()';
            if (schema.defaultValue) {
                zodType += `.default("${schema.defaultValue}")`;
            }
        }

        return zodType;
    }

    generateNextConfigEnv(): string {
        const publicVars = this.config.schema.filter(s => s.key.startsWith('NEXT_PUBLIC_'));
        const serverVars = this.config.schema.filter(s => !s.key.startsWith('NEXT_PUBLIC_'));

        return `// next.config.js environment configuration
module.exports = {
  env: {
${publicVars.map(v => `    ${v.key}: process.env.${v.key},`).join('\n')}
  },
  serverRuntimeConfig: {
${serverVars.map(v => `    ${v.key}: process.env.${v.key},`).join('\n')}
  },
};
`;
    }

    // ========================================================================
    // SYNC & COMPARISON
    // ========================================================================

    compareEnvironments(env1: string, env2: string): {
        onlyInFirst: string[];
        onlyInSecond: string[];
        different: Array<{ key: string; value1: string; value2: string }>;
        same: string[];
    } {
        const vars1 = new Map(this.getAllVariables(env1).map(v => [v.key, v.value]));
        const vars2 = new Map(this.getAllVariables(env2).map(v => [v.key, v.value]));

        const onlyInFirst: string[] = [];
        const onlyInSecond: string[] = [];
        const different: Array<{ key: string; value1: string; value2: string }> = [];
        const same: string[] = [];

        for (const [key, value1] of vars1) {
            if (!vars2.has(key)) {
                onlyInFirst.push(key);
            } else if (vars2.get(key) !== value1) {
                different.push({ key, value1, value2: vars2.get(key)! });
            } else {
                same.push(key);
            }
        }

        for (const key of vars2.keys()) {
            if (!vars1.has(key)) {
                onlyInSecond.push(key);
            }
        }

        return { onlyInFirst, onlyInSecond, different, same };
    }
}

export const environmentManager = EnvironmentManager.getInstance();
