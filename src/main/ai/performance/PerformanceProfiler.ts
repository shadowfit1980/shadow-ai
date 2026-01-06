/**
 * Performance Profiling Agent
 * 
 * Auto-detect bottlenecks, suggest optimizations,
 * and memory leak detection.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    threshold?: number;
    status: 'good' | 'warning' | 'critical';
}

export interface Bottleneck {
    type: 'cpu' | 'memory' | 'io' | 'network' | 'code';
    location: string;
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
}

export interface Optimization {
    id: string;
    file: string;
    line?: number;
    currentCode?: string;
    optimizedCode: string;
    description: string;
    expectedImprovement: string;
    complexity: 'easy' | 'medium' | 'hard';
}

export interface MemoryLeak {
    type: 'closure' | 'event_listener' | 'timer' | 'dom' | 'cache';
    file: string;
    line: number;
    description: string;
    code: string;
    fix: string;
}

export interface ProfileReport {
    id: string;
    projectPath: string;
    timestamp: Date;
    metrics: PerformanceMetric[];
    bottlenecks: Bottleneck[];
    optimizations: Optimization[];
    memoryLeaks: MemoryLeak[];
    score: number; // 0-100
}

// ============================================================================
// PERFORMANCE PROFILER
// ============================================================================

export class PerformanceProfiler extends EventEmitter {
    private static instance: PerformanceProfiler;
    private modelManager: ModelManager;
    private reports: Map<string, ProfileReport> = new Map();

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): PerformanceProfiler {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }

    // ========================================================================
    // PROFILING
    // ========================================================================

    /**
     * Run full performance profile
     */
    async profileProject(projectPath: string): Promise<ProfileReport> {
        const report: ProfileReport = {
            id: `profile_${Date.now()}`,
            projectPath,
            timestamp: new Date(),
            metrics: [],
            bottlenecks: [],
            optimizations: [],
            memoryLeaks: [],
            score: 0,
        };

        this.emit('profile:started', { projectPath });

        // Collect metrics
        report.metrics = await this.collectMetrics(projectPath);

        // Analyze code for bottlenecks
        const code = await this.getMainCode(projectPath);
        if (code) {
            const analysis = await this.analyzeCode(code);
            report.bottlenecks = analysis.bottlenecks;
            report.optimizations = analysis.optimizations;
            report.memoryLeaks = analysis.memoryLeaks;
        }

        // Calculate score
        report.score = this.calculateScore(report);

        this.reports.set(report.id, report);
        this.emit('profile:completed', report);

        return report;
    }

    /**
     * Collect performance metrics
     */
    private async collectMetrics(projectPath: string): Promise<PerformanceMetric[]> {
        const metrics: PerformanceMetric[] = [];
        const now = new Date();

        // Bundle size (if available)
        try {
            const { stdout } = await execAsync('du -sh dist 2>/dev/null || du -sh build 2>/dev/null', { cwd: projectPath });
            const size = stdout.trim().split('\t')[0];
            metrics.push({
                name: 'Bundle Size',
                value: parseFloat(size) || 0,
                unit: size.replace(/[0-9.]/g, ''),
                timestamp: now,
                status: 'good',
            });
        } catch { }

        // Dependencies count
        try {
            const { stdout } = await execAsync('npm ls --depth=0 --json 2>/dev/null', { cwd: projectPath });
            const deps = JSON.parse(stdout);
            const count = Object.keys(deps.dependencies || {}).length;
            metrics.push({
                name: 'Dependencies',
                value: count,
                unit: 'packages',
                timestamp: now,
                threshold: 100,
                status: count > 100 ? 'warning' : 'good',
            });
        } catch { }

        // Source files count
        try {
            const { stdout } = await execAsync('find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" | grep -v node_modules | wc -l', { cwd: projectPath });
            metrics.push({
                name: 'Source Files',
                value: parseInt(stdout.trim()),
                unit: 'files',
                timestamp: now,
                status: 'good',
            });
        } catch { }

        return metrics;
    }

    /**
     * Get main code files for analysis
     */
    private async getMainCode(projectPath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync(
                'find . -name "*.ts" -o -name "*.js" | grep -v node_modules | head -5 | xargs cat 2>/dev/null',
                { cwd: projectPath, maxBuffer: 1024 * 1024 }
            );
            return stdout.slice(0, 10000); // Limit size
        } catch {
            return null;
        }
    }

    /**
     * Analyze code for performance issues
     */
    private async analyzeCode(code: string): Promise<{
        bottlenecks: Bottleneck[];
        optimizations: Optimization[];
        memoryLeaks: MemoryLeak[];
    }> {
        const prompt = `Analyze this code for performance issues.

\`\`\`
${code.slice(0, 8000)}
\`\`\`

Find:
1. Performance bottlenecks
2. Optimization opportunities
3. Potential memory leaks

Respond in JSON:
\`\`\`json
{
    "bottlenecks": [
        { "type": "cpu|memory|io|network|code", "location": "file:line", "description": "...", "impact": "low|medium|high|critical", "suggestion": "..." }
    ],
    "optimizations": [
        { "file": "...", "line": 10, "currentCode": "...", "optimizedCode": "...", "description": "...", "expectedImprovement": "...", "complexity": "easy|medium|hard" }
    ],
    "memoryLeaks": [
        { "type": "closure|event_listener|timer|dom|cache", "file": "...", "line": 10, "description": "...", "code": "...", "fix": "..." }
    ]
}
\`\`\``;

        const response = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        const parsed = this.parseJSON(response);

        return {
            bottlenecks: parsed.bottlenecks || [],
            optimizations: (parsed.optimizations || []).map((o: any, i: number) => ({
                ...o,
                id: `opt_${Date.now()}_${i}`,
            })),
            memoryLeaks: parsed.memoryLeaks || [],
        };
    }

    /**
     * Calculate performance score
     */
    private calculateScore(report: ProfileReport): number {
        let score = 100;

        // Deduct for bottlenecks
        for (const b of report.bottlenecks) {
            if (b.impact === 'critical') score -= 20;
            else if (b.impact === 'high') score -= 10;
            else if (b.impact === 'medium') score -= 5;
            else score -= 2;
        }

        // Deduct for memory leaks
        score -= report.memoryLeaks.length * 10;

        // Deduct for warnings in metrics
        for (const m of report.metrics) {
            if (m.status === 'critical') score -= 15;
            else if (m.status === 'warning') score -= 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    // ========================================================================
    // REAL-TIME MONITORING
    // ========================================================================

    /**
     * Start monitoring a process
     */
    async monitorProcess(pid: number): Promise<NodeJS.Timeout> {
        const interval = setInterval(async () => {
            try {
                const { stdout } = await execAsync(`ps -p ${pid} -o %cpu,%mem,rss`);
                const lines = stdout.trim().split('\n');
                if (lines.length > 1) {
                    const [cpu, mem, rss] = lines[1].trim().split(/\s+/).map(parseFloat);
                    this.emit('metrics:update', {
                        pid,
                        cpu,
                        memory: mem,
                        rss,
                        timestamp: new Date(),
                    });
                }
            } catch {
                clearInterval(interval);
            }
        }, 1000);

        return interval;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getReport(id: string): ProfileReport | undefined {
        return this.reports.get(id);
    }

    getReports(): ProfileReport[] {
        return Array.from(this.reports.values());
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }
}

// Export singleton
export const performanceProfiler = PerformanceProfiler.getInstance();
