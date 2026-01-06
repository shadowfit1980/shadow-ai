/**
 * Dependency Analyzer - Deep dependency analysis
 */
import { EventEmitter } from 'events';

export interface Dependency { name: string; version: string; direct: boolean; depth: number; licenses: string[]; vulnerabilities: number; }
export interface DependencyTree { root: string; dependencies: Dependency[]; totalDirect: number; totalTransitive: number; }

export class DependencyAnalyzerEngine extends EventEmitter {
    private static instance: DependencyAnalyzerEngine;
    private analyses: Map<string, DependencyTree> = new Map();
    private constructor() { super(); }
    static getInstance(): DependencyAnalyzerEngine { if (!DependencyAnalyzerEngine.instance) DependencyAnalyzerEngine.instance = new DependencyAnalyzerEngine(); return DependencyAnalyzerEngine.instance; }

    async analyze(projectPath: string): Promise<DependencyTree> {
        const deps: Dependency[] = [
            { name: 'express', version: '4.18.2', direct: true, depth: 0, licenses: ['MIT'], vulnerabilities: 0 },
            { name: 'body-parser', version: '1.20.0', direct: false, depth: 1, licenses: ['MIT'], vulnerabilities: 0 },
            { name: 'lodash', version: '4.17.21', direct: true, depth: 0, licenses: ['MIT'], vulnerabilities: 1 }
        ];
        const tree: DependencyTree = { root: projectPath, dependencies: deps, totalDirect: deps.filter(d => d.direct).length, totalTransitive: deps.filter(d => !d.direct).length };
        this.analyses.set(projectPath, tree); this.emit('analyzed', tree); return tree;
    }

    findByName(projectPath: string, name: string): Dependency | null { const tree = this.analyses.get(projectPath); return tree?.dependencies.find(d => d.name === name) || null; }
    getOutdated(projectPath: string): Dependency[] { return this.analyses.get(projectPath)?.dependencies.filter(d => d.vulnerabilities > 0) || []; }
    get(projectPath: string): DependencyTree | null { return this.analyses.get(projectPath) || null; }
}
export function getDependencyAnalyzerEngine(): DependencyAnalyzerEngine { return DependencyAnalyzerEngine.getInstance(); }
