/**
 * Data Pipeline - ETL workflows
 */
import { EventEmitter } from 'events';

export interface PipelineStep { id: string; type: 'extract' | 'transform' | 'load' | 'validate'; config: Record<string, string>; status: 'pending' | 'running' | 'complete' | 'failed'; }
export interface Pipeline { id: string; name: string; steps: PipelineStep[]; schedule?: string; lastRun?: number; status: 'idle' | 'running' | 'complete' | 'failed'; }

export class DataPipelineEngine extends EventEmitter {
    private static instance: DataPipelineEngine;
    private pipelines: Map<string, Pipeline> = new Map();
    private constructor() { super(); }
    static getInstance(): DataPipelineEngine { if (!DataPipelineEngine.instance) DataPipelineEngine.instance = new DataPipelineEngine(); return DataPipelineEngine.instance; }

    create(name: string, steps: Omit<PipelineStep, 'id' | 'status'>[]): Pipeline {
        const pipeline: Pipeline = { id: `pipe_${Date.now()}`, name, steps: steps.map((s, i) => ({ ...s, id: `step_${i}`, status: 'pending' })), status: 'idle' };
        this.pipelines.set(pipeline.id, pipeline); return pipeline;
    }

    async run(pipelineId: string): Promise<boolean> {
        const p = this.pipelines.get(pipelineId); if (!p) return false;
        p.status = 'running'; p.lastRun = Date.now();
        for (const step of p.steps) { step.status = 'running'; await new Promise(r => setTimeout(r, 100)); step.status = 'complete'; this.emit('stepComplete', { pipelineId, stepId: step.id }); }
        p.status = 'complete'; this.emit('pipelineComplete', p); return true;
    }

    schedule(pipelineId: string, cron: string): boolean { const p = this.pipelines.get(pipelineId); if (!p) return false; p.schedule = cron; return true; }
    get(pipelineId: string): Pipeline | null { return this.pipelines.get(pipelineId) || null; }
    getAll(): Pipeline[] { return Array.from(this.pipelines.values()); }
}
export function getDataPipelineEngine(): DataPipelineEngine { return DataPipelineEngine.getInstance(); }
