/**
 * Data Annotator - Labeling
 */
import { EventEmitter } from 'events';

export interface Annotation { id: string; dataId: string; label: string; annotator: string; timestamp: number; confidence?: number; }
export interface AnnotationProject { id: string; name: string; type: 'classification' | 'ner' | 'segmentation' | 'qa'; labels: string[]; annotations: Annotation[]; }

export class DataAnnotatorEngine extends EventEmitter {
    private static instance: DataAnnotatorEngine;
    private projects: Map<string, AnnotationProject> = new Map();
    private constructor() { super(); }
    static getInstance(): DataAnnotatorEngine { if (!DataAnnotatorEngine.instance) DataAnnotatorEngine.instance = new DataAnnotatorEngine(); return DataAnnotatorEngine.instance; }

    createProject(name: string, type: AnnotationProject['type'], labels: string[]): AnnotationProject { const project: AnnotationProject = { id: `annot_${Date.now()}`, name, type, labels, annotations: [] }; this.projects.set(project.id, project); return project; }

    annotate(projectId: string, dataId: string, label: string, annotator = 'user'): Annotation | null {
        const p = this.projects.get(projectId); if (!p || !p.labels.includes(label)) return null;
        const annotation: Annotation = { id: `ann_${Date.now()}`, dataId, label, annotator, timestamp: Date.now() };
        p.annotations.push(annotation); this.emit('annotated', annotation); return annotation;
    }

    getStats(projectId: string): { total: number; byLabel: Record<string, number> } | null { const p = this.projects.get(projectId); if (!p) return null; const byLabel: Record<string, number> = {}; p.labels.forEach(l => { byLabel[l] = p.annotations.filter(a => a.label === l).length; }); return { total: p.annotations.length, byLabel }; }
    export(projectId: string): Annotation[] { return this.projects.get(projectId)?.annotations || []; }
}
export function getDataAnnotatorEngine(): DataAnnotatorEngine { return DataAnnotatorEngine.getInstance(); }
