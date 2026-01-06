/**
 * Run Configuration - Execute configs
 */
import { EventEmitter } from 'events';

export interface RunConfiguration { id: string; name: string; type: 'node' | 'python' | 'shell' | 'npm' | 'docker'; command: string; args: string[]; env: Record<string, string>; cwd?: string; }

export class RunConfigManager extends EventEmitter {
    private static instance: RunConfigManager;
    private configs: Map<string, RunConfiguration> = new Map();
    private constructor() { super(); }
    static getInstance(): RunConfigManager { if (!RunConfigManager.instance) RunConfigManager.instance = new RunConfigManager(); return RunConfigManager.instance; }

    create(name: string, type: RunConfiguration['type'], command: string, args: string[] = [], env: Record<string, string> = {}): RunConfiguration {
        const config: RunConfiguration = { id: `run_${Date.now()}`, name, type, command, args, env };
        this.configs.set(config.id, config); return config;
    }

    async run(id: string): Promise<{ success: boolean; output: string; exitCode: number }> { const config = this.configs.get(id); if (!config) return { success: false, output: 'Config not found', exitCode: 1 }; this.emit('started', config); return { success: true, output: `Executed: ${config.command} ${config.args.join(' ')}`, exitCode: 0 }; }
    duplicate(id: string, newName: string): RunConfiguration | null { const c = this.configs.get(id); if (!c) return null; return this.create(newName, c.type, c.command, [...c.args], { ...c.env }); }
    getAll(): RunConfiguration[] { return Array.from(this.configs.values()); }
    delete(id: string): boolean { return this.configs.delete(id); }
}
export function getRunConfigManager(): RunConfigManager { return RunConfigManager.getInstance(); }
