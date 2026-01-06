/**
 * Experiment Tracker - ML experiments
 */
import { EventEmitter } from 'events';

export interface Experiment { id: string; name: string; params: Record<string, number | string>; metrics: Record<string, number>; tags: string[]; status: 'running' | 'complete' | 'failed'; created: number; }

export class ExperimentTrackerEngine extends EventEmitter {
    private static instance: ExperimentTrackerEngine;
    private experiments: Map<string, Experiment> = new Map();
    private constructor() { super(); }
    static getInstance(): ExperimentTrackerEngine { if (!ExperimentTrackerEngine.instance) ExperimentTrackerEngine.instance = new ExperimentTrackerEngine(); return ExperimentTrackerEngine.instance; }

    create(name: string, params: Record<string, number | string> = {}, tags: string[] = []): Experiment { const exp: Experiment = { id: `exp_${Date.now()}`, name, params, metrics: {}, tags, status: 'running', created: Date.now() }; this.experiments.set(exp.id, exp); return exp; }
    logMetric(expId: string, name: string, value: number): boolean { const e = this.experiments.get(expId); if (!e) return false; e.metrics[name] = value; this.emit('metric', { expId, name, value }); return true; }
    logParams(expId: string, params: Record<string, number | string>): boolean { const e = this.experiments.get(expId); if (!e) return false; Object.assign(e.params, params); return true; }
    complete(expId: string): boolean { const e = this.experiments.get(expId); if (!e) return false; e.status = 'complete'; return true; }
    compare(expIds: string[]): Experiment[] { return expIds.map(id => this.experiments.get(id)!).filter(Boolean); }
    getByTag(tag: string): Experiment[] { return Array.from(this.experiments.values()).filter(e => e.tags.includes(tag)); }
}
export function getExperimentTrackerEngine(): ExperimentTrackerEngine { return ExperimentTrackerEngine.getInstance(); }
