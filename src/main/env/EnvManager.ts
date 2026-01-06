/**
 * Environment Manager
 * Manage .env files and environment variables
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EnvVariable {
    key: string;
    value: string;
    encrypted?: boolean;
    description?: string;
}

export interface EnvFile {
    path: string;
    variables: EnvVariable[];
    environment: string;
}

/**
 * EnvManager
 * Manage environment files securely
 */
export class EnvManager extends EventEmitter {
    private static instance: EnvManager;
    private envFiles: Map<string, EnvFile> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): EnvManager {
        if (!EnvManager.instance) {
            EnvManager.instance = new EnvManager();
        }
        return EnvManager.instance;
    }

    /**
     * Load .env file
     */
    async load(filePath: string): Promise<EnvFile> {
        const content = await fs.readFile(filePath, 'utf-8');
        const variables = this.parse(content);
        const environment = path.basename(filePath).replace('.env.', '').replace('.env', 'default');

        const envFile: EnvFile = { path: filePath, variables, environment };
        this.envFiles.set(filePath, envFile);
        this.emit('loaded', envFile);

        return envFile;
    }

    /**
     * Parse .env content
     */
    private parse(content: string): EnvVariable[] {
        const variables: EnvVariable[] = [];
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
            if (match) {
                variables.push({
                    key: match[1],
                    value: match[2].replace(/^["']|["']$/g, ''),
                });
            }
        }

        return variables;
    }

    /**
     * Save .env file
     */
    async save(filePath: string): Promise<void> {
        const envFile = this.envFiles.get(filePath);
        if (!envFile) throw new Error('File not loaded');

        const content = envFile.variables
            .map(v => `${v.key}=${v.value}`)
            .join('\n');

        await fs.writeFile(filePath, content);
        this.emit('saved', envFile);
    }

    /**
     * Get variable
     */
    get(filePath: string, key: string): string | undefined {
        const envFile = this.envFiles.get(filePath);
        return envFile?.variables.find(v => v.key === key)?.value;
    }

    /**
     * Set variable
     */
    set(filePath: string, key: string, value: string): void {
        const envFile = this.envFiles.get(filePath);
        if (!envFile) return;

        const existing = envFile.variables.find(v => v.key === key);
        if (existing) {
            existing.value = value;
        } else {
            envFile.variables.push({ key, value });
        }
        this.emit('variableSet', { filePath, key, value });
    }

    /**
     * Delete variable
     */
    delete(filePath: string, key: string): boolean {
        const envFile = this.envFiles.get(filePath);
        if (!envFile) return false;

        const index = envFile.variables.findIndex(v => v.key === key);
        if (index === -1) return false;

        envFile.variables.splice(index, 1);
        this.emit('variableDeleted', { filePath, key });
        return true;
    }

    /**
     * Create new .env file
     */
    async create(filePath: string, variables: EnvVariable[] = []): Promise<EnvFile> {
        const content = variables.map(v => `${v.key}=${v.value}`).join('\n');
        await fs.writeFile(filePath, content);

        return this.load(filePath);
    }

    /**
     * Get all loaded files
     */
    getAll(): EnvFile[] {
        return Array.from(this.envFiles.values());
    }

    /**
     * Compare environments
     */
    compare(path1: string, path2: string): { missing: string[]; different: string[] } {
        const env1 = this.envFiles.get(path1);
        const env2 = this.envFiles.get(path2);

        if (!env1 || !env2) return { missing: [], different: [] };

        const keys1 = new Set(env1.variables.map(v => v.key));
        const keys2 = new Set(env2.variables.map(v => v.key));

        const missing = [...keys1].filter(k => !keys2.has(k));
        const different: string[] = [];

        for (const v1 of env1.variables) {
            const v2 = env2.variables.find(v => v.key === v1.key);
            if (v2 && v1.value !== v2.value) {
                different.push(v1.key);
            }
        }

        return { missing, different };
    }
}

// Singleton getter
export function getEnvManager(): EnvManager {
    return EnvManager.getInstance();
}
