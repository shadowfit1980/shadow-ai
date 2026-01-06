/**
 * Evolution Agent - Autonomous project evolution
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DependencyUpdate {
    name: string;
    currentVersion: string;
    latestVersion: string;
    type: 'major' | 'minor' | 'patch';
    breaking: boolean;
    securityPatch: boolean;
}

export interface TechnicalDebt {
    id: string;
    type: 'complexity' | 'duplication' | 'deprecated' | 'todo' | 'style';
    file: string;
    line?: number;
    description: string;
}

export interface EvolutionReport {
    timestamp: number;
    dependencyUpdates: DependencyUpdate[];
    technicalDebt: TechnicalDebt[];
    healthScore: number;
}

export class EvolutionAgent extends EventEmitter {
    private static instance: EvolutionAgent;
    private projectRoot: string = '';

    private constructor() { super(); }

    static getInstance(): EvolutionAgent {
        if (!EvolutionAgent.instance) {
            EvolutionAgent.instance = new EvolutionAgent();
        }
        return EvolutionAgent.instance;
    }

    setProjectRoot(root: string): void {
        this.projectRoot = root;
    }

    async checkDependencyUpdates(): Promise<DependencyUpdate[]> {
        const updates: DependencyUpdate[] = [];
        try {
            const { stdout } = await execAsync('npm outdated --json 2>/dev/null || echo "{}"', { cwd: this.projectRoot });
            const outdated = JSON.parse(stdout || '{}');
            for (const [name, info] of Object.entries(outdated) as [string, any][]) {
                const current = info.current || '0.0.0';
                const latest = info.latest || current;
                const type = this.determineUpdateType(current, latest);
                updates.push({ name, currentVersion: current, latestVersion: latest, type, breaking: type === 'major', securityPatch: false });
            }
        } catch { }
        return updates;
    }

    private determineUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' {
        const [cMajor, cMinor] = current.split('.').map(Number);
        const [lMajor, lMinor] = latest.split('.').map(Number);
        if (lMajor > cMajor) return 'major';
        if (lMinor > cMinor) return 'minor';
        return 'patch';
    }

    async applySecurityPatches(): Promise<DependencyUpdate[]> {
        try {
            await execAsync('npm audit fix', { cwd: this.projectRoot });
        } catch { }
        return [];
    }

    async analyzeTechnicalDebt(): Promise<TechnicalDebt[]> {
        const debt: TechnicalDebt[] = [];
        try {
            const { stdout } = await execAsync(
                'grep -rn "TODO\\|FIXME\\|HACK" --include="*.ts" --include="*.tsx" . 2>/dev/null | head -20 || true',
                { cwd: this.projectRoot }
            );
            for (const line of stdout.split('\n').filter(Boolean)) {
                const match = line.match(/^(.+):(\d+):(.+)$/);
                if (match) {
                    debt.push({ id: `todo_${debt.length}`, type: 'todo', file: match[1], line: parseInt(match[2]), description: match[3].trim() });
                }
            }
        } catch { }
        return debt;
    }

    async suggestModernizations(): Promise<string[]> {
        return ['Consider using async/await', 'Use const/let instead of var'];
    }

    async generateEvolutionReport(): Promise<EvolutionReport> {
        const [dependencyUpdates, technicalDebt] = await Promise.all([
            this.checkDependencyUpdates(),
            this.analyzeTechnicalDebt(),
        ]);
        const healthScore = Math.max(0, 100 - dependencyUpdates.length * 2 - technicalDebt.length);
        return { timestamp: Date.now(), dependencyUpdates, technicalDebt, healthScore };
    }
}

export const evolutionAgent = EvolutionAgent.getInstance();
