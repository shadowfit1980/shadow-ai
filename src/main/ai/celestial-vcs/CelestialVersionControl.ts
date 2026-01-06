/**
 * Celestial Version Control
 * 
 * A version control system aligned with celestial events,
 * using moon phases and planetary alignments for commits.
 */

import { EventEmitter } from 'events';

export interface CelestialCommit {
    id: string;
    message: string;
    code: string;
    celestialEvent: CelestialEvent;
    cosmicAlignment: number;
    timestamp: Date;
}

export interface CelestialEvent {
    name: string;
    phase: string;
    energy: 'high' | 'medium' | 'low';
    auspiciousness: number;
}

export interface CelestialBranch {
    name: string;
    constellation: string;
    commits: CelestialCommit[];
    stability: number;
}

export class CelestialVersionControl extends EventEmitter {
    private static instance: CelestialVersionControl;
    private branches: Map<string, CelestialBranch> = new Map();

    private constructor() {
        super();
        this.createMainBranch();
    }

    static getInstance(): CelestialVersionControl {
        if (!CelestialVersionControl.instance) {
            CelestialVersionControl.instance = new CelestialVersionControl();
        }
        return CelestialVersionControl.instance;
    }

    private createMainBranch(): void {
        this.branches.set('main', {
            name: 'main',
            constellation: 'Polaris',
            commits: [],
            stability: 1.0,
        });
    }

    commit(branchName: string, message: string, code: string): CelestialCommit | undefined {
        const branch = this.branches.get(branchName);
        if (!branch) return undefined;

        const event = this.getCurrentCelestialEvent();

        const commit: CelestialCommit = {
            id: `celestial_commit_${Date.now()}`,
            message,
            code,
            celestialEvent: event,
            cosmicAlignment: event.auspiciousness,
            timestamp: new Date(),
        };

        branch.commits.push(commit);
        this.emit('commit:created', commit);
        return commit;
    }

    private getCurrentCelestialEvent(): CelestialEvent {
        const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
        const day = new Date().getDate();
        const phase = phases[day % phases.length];

        const energyLevels: Record<string, 'high' | 'medium' | 'low'> = {
            'Full Moon': 'high',
            'New Moon': 'high',
            'First Quarter': 'medium',
            'Last Quarter': 'medium',
        };

        return {
            name: `${phase} Transit`,
            phase,
            energy: energyLevels[phase] || 'low',
            auspiciousness: phase.includes('Full') || phase.includes('New') ? 0.9 : 0.6,
        };
    }

    createBranch(name: string, constellation: string): CelestialBranch {
        const branch: CelestialBranch = {
            name,
            constellation,
            commits: [],
            stability: 0.8,
        };
        this.branches.set(name, branch);
        this.emit('branch:created', branch);
        return branch;
    }

    getBranch(name: string): CelestialBranch | undefined {
        return this.branches.get(name);
    }

    getAllBranches(): CelestialBranch[] {
        return Array.from(this.branches.values());
    }

    getStats(): { totalBranches: number; totalCommits: number; avgAlignment: number } {
        const branches = Array.from(this.branches.values());
        const allCommits = branches.flatMap(b => b.commits);
        return {
            totalBranches: branches.length,
            totalCommits: allCommits.length,
            avgAlignment: allCommits.length > 0
                ? allCommits.reduce((s, c) => s + c.cosmicAlignment, 0) / allCommits.length
                : 0,
        };
    }
}

export const celestialVersionControl = CelestialVersionControl.getInstance();
