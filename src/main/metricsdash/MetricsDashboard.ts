/**
 * Metrics Dashboard - Code metrics
 */
import { EventEmitter } from 'events';

export interface ProjectMetrics { coverage: number; duplications: number; complexity: number; bugs: number; vulnerabilities: number; smells: number; debt: number; rating: { reliability: 'A' | 'B' | 'C' | 'D' | 'E'; security: 'A' | 'B' | 'C' | 'D' | 'E'; maintainability: 'A' | 'B' | 'C' | 'D' | 'E' }; }

export class MetricsDashboard extends EventEmitter {
    private static instance: MetricsDashboard;
    private metrics: Map<string, ProjectMetrics> = new Map();
    private constructor() { super(); }
    static getInstance(): MetricsDashboard { if (!MetricsDashboard.instance) MetricsDashboard.instance = new MetricsDashboard(); return MetricsDashboard.instance; }

    update(projectId: string, metrics: Partial<ProjectMetrics>): ProjectMetrics {
        const existing = this.metrics.get(projectId) || { coverage: 0, duplications: 0, complexity: 0, bugs: 0, vulnerabilities: 0, smells: 0, debt: 0, rating: { reliability: 'A' as const, security: 'A' as const, maintainability: 'A' as const } };
        const updated = { ...existing, ...metrics };
        updated.rating.reliability = updated.bugs === 0 ? 'A' : updated.bugs < 5 ? 'B' : updated.bugs < 10 ? 'C' : updated.bugs < 20 ? 'D' : 'E';
        updated.rating.security = updated.vulnerabilities === 0 ? 'A' : updated.vulnerabilities < 3 ? 'B' : 'C';
        updated.rating.maintainability = updated.debt < 60 ? 'A' : updated.debt < 240 ? 'B' : updated.debt < 480 ? 'C' : 'D';
        this.metrics.set(projectId, updated); this.emit('updated', updated); return updated;
    }

    get(projectId: string): ProjectMetrics | null { return this.metrics.get(projectId) || null; }
    getQualityGate(projectId: string): { passed: boolean; conditions: { metric: string; status: 'ok' | 'warn' | 'error' }[] } { const m = this.metrics.get(projectId); if (!m) return { passed: true, conditions: [] }; const conditions = [{ metric: 'coverage', status: m.coverage >= 80 ? 'ok' as const : m.coverage >= 50 ? 'warn' as const : 'error' as const }, { metric: 'bugs', status: m.bugs === 0 ? 'ok' as const : 'error' as const }]; return { passed: !conditions.some(c => c.status === 'error'), conditions }; }
}
export function getMetricsDashboard(): MetricsDashboard { return MetricsDashboard.getInstance(); }
