/**
 * Code Evolution Tracker
 * 
 * Track how files/functions evolve over time,
 * visualize complexity trends, and identify code rot.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface FileEvolution {
    file: string;
    commits: number;
    authors: string[];
    firstCommit: Date;
    lastCommit: Date;
    linesAdded: number;
    linesRemoved: number;
    churnRate: number;
    complexityTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface FunctionEvolution {
    name: string;
    file: string;
    changes: number;
    complexity: number;
    lines: number;
    age: number; // days
    lastModified: Date;
    authors: string[];
}

export interface CodeRotIndicator {
    file: string;
    type: 'high-churn' | 'stale' | 'complexity' | 'ownership';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
}

export interface EvolutionReport {
    projectPath: string;
    timestamp: Date;
    files: FileEvolution[];
    hotspots: string[];
    codeRot: CodeRotIndicator[];
    healthTrend: 'improving' | 'stable' | 'degrading';
}

// ============================================================================
// CODE EVOLUTION TRACKER
// ============================================================================

export class CodeEvolutionTracker extends EventEmitter {
    private static instance: CodeEvolutionTracker;

    private constructor() {
        super();
    }

    static getInstance(): CodeEvolutionTracker {
        if (!CodeEvolutionTracker.instance) {
            CodeEvolutionTracker.instance = new CodeEvolutionTracker();
        }
        return CodeEvolutionTracker.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    /**
     * Analyze project evolution
     */
    async analyzeProject(projectPath: string): Promise<EvolutionReport> {
        this.emit('analysis:started', { projectPath });

        const files = await this.analyzeFiles(projectPath);
        const hotspots = this.identifyHotspots(files);
        const codeRot = this.detectCodeRot(files);
        const healthTrend = this.calculateHealthTrend(files);

        const report: EvolutionReport = {
            projectPath,
            timestamp: new Date(),
            files,
            hotspots,
            codeRot,
            healthTrend,
        };

        this.emit('analysis:completed', report);
        return report;
    }

    /**
     * Analyze file evolution
     */
    async analyzeFiles(projectPath: string): Promise<FileEvolution[]> {
        const files: FileEvolution[] = [];

        try {
            // Get list of tracked files
            const { stdout } = await execAsync('git ls-files "*.ts" "*.js" "*.tsx" "*.jsx" | head -50', { cwd: projectPath });
            const fileList = stdout.trim().split('\n').filter(Boolean);

            for (const file of fileList) {
                const evolution = await this.analyzeFile(projectPath, file);
                if (evolution) files.push(evolution);
            }
        } catch { }

        return files;
    }

    /**
     * Analyze single file
     */
    async analyzeFile(projectPath: string, file: string): Promise<FileEvolution | null> {
        try {
            // Get commit count
            const { stdout: commitCount } = await execAsync(
                `git log --oneline -- "${file}" | wc -l`,
                { cwd: projectPath }
            );

            // Get authors
            const { stdout: authorsOut } = await execAsync(
                `git log --format="%an" -- "${file}" | sort -u`,
                { cwd: projectPath }
            );

            // Get first and last commit dates
            const { stdout: firstCommit } = await execAsync(
                `git log --reverse --format="%ai" -- "${file}" | head -1`,
                { cwd: projectPath }
            );
            const { stdout: lastCommit } = await execAsync(
                `git log -1 --format="%ai" -- "${file}"`,
                { cwd: projectPath }
            );

            // Get lines added/removed
            const { stdout: stat } = await execAsync(
                `git log --numstat --format="" -- "${file}" | awk '{add+=$1; del+=$2} END {print add, del}'`,
                { cwd: projectPath }
            );
            const [added, removed] = stat.trim().split(' ').map(n => parseInt(n) || 0);

            const commits = parseInt(commitCount.trim()) || 0;
            const authors = authorsOut.trim().split('\n').filter(Boolean);

            return {
                file,
                commits,
                authors,
                firstCommit: new Date(firstCommit.trim()),
                lastCommit: new Date(lastCommit.trim()),
                linesAdded: added,
                linesRemoved: removed,
                churnRate: commits > 0 ? (added + removed) / commits : 0,
                complexityTrend: this.estimateComplexityTrend(added, removed),
            };
        } catch {
            return null;
        }
    }

    private estimateComplexityTrend(added: number, removed: number): 'increasing' | 'stable' | 'decreasing' {
        const ratio = added / (removed || 1);
        if (ratio > 1.5) return 'increasing';
        if (ratio < 0.7) return 'decreasing';
        return 'stable';
    }

    // ========================================================================
    // HOTSPOTS & CODE ROT
    // ========================================================================

    /**
     * Identify code hotspots (frequently changed files)
     */
    identifyHotspots(files: FileEvolution[]): string[] {
        return files
            .filter(f => f.commits > 10 && f.churnRate > 50)
            .sort((a, b) => b.commits - a.commits)
            .slice(0, 10)
            .map(f => f.file);
    }

    /**
     * Detect code rot indicators
     */
    detectCodeRot(files: FileEvolution[]): CodeRotIndicator[] {
        const indicators: CodeRotIndicator[] = [];
        const now = new Date();

        for (const file of files) {
            // High churn
            if (file.churnRate > 100) {
                indicators.push({
                    file: file.file,
                    type: 'high-churn',
                    severity: file.churnRate > 200 ? 'high' : 'medium',
                    description: `High churn rate (${file.churnRate.toFixed(1)} lines/commit)`,
                    recommendation: 'Consider refactoring into smaller modules',
                });
            }

            // Stale code
            const daysSinceModified = (now.getTime() - file.lastCommit.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified > 365) {
                indicators.push({
                    file: file.file,
                    type: 'stale',
                    severity: daysSinceModified > 730 ? 'high' : 'medium',
                    description: `Not modified in ${Math.floor(daysSinceModified)} days`,
                    recommendation: 'Review if still needed or needs updating',
                });
            }

            // Complexity increase
            if (file.complexityTrend === 'increasing' && file.commits > 5) {
                indicators.push({
                    file: file.file,
                    type: 'complexity',
                    severity: 'medium',
                    description: 'Complexity has been increasing over time',
                    recommendation: 'Consider simplifying or breaking down',
                });
            }

            // Ownership issues (too many authors on recent changes)
            if (file.authors.length > 5 && file.commits > 20) {
                indicators.push({
                    file: file.file,
                    type: 'ownership',
                    severity: 'low',
                    description: `${file.authors.length} different authors`,
                    recommendation: 'Consider assigning clear ownership',
                });
            }
        }

        return indicators;
    }

    // ========================================================================
    // TRENDS
    // ========================================================================

    /**
     * Calculate overall health trend
     */
    private calculateHealthTrend(files: FileEvolution[]): 'improving' | 'stable' | 'degrading' {
        let increasing = 0;
        let decreasing = 0;

        for (const file of files) {
            if (file.complexityTrend === 'increasing') increasing++;
            if (file.complexityTrend === 'decreasing') decreasing++;
        }

        if (decreasing > increasing * 1.5) return 'improving';
        if (increasing > decreasing * 1.5) return 'degrading';
        return 'stable';
    }

    /**
     * Get file timeline
     */
    async getFileTimeline(projectPath: string, file: string): Promise<Array<{
        date: Date;
        commits: number;
        additions: number;
        deletions: number;
    }>> {
        const timeline: Array<{ date: Date; commits: number; additions: number; deletions: number }> = [];

        try {
            const { stdout } = await execAsync(
                `git log --format="%ai" --numstat -- "${file}"`,
                { cwd: projectPath }
            );

            // Parse the output to build timeline
            // Simplified: group by month
            const lines = stdout.trim().split('\n');
            const monthly = new Map<string, { commits: number; add: number; del: number }>();

            for (const line of lines) {
                if (line.match(/^\d{4}-\d{2}/)) {
                    const month = line.slice(0, 7);
                    if (!monthly.has(month)) {
                        monthly.set(month, { commits: 0, add: 0, del: 0 });
                    }
                    monthly.get(month)!.commits++;
                }
            }

            for (const [month, data] of monthly) {
                timeline.push({
                    date: new Date(month + '-01'),
                    commits: data.commits,
                    additions: data.add,
                    deletions: data.del,
                });
            }
        } catch { }

        return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
}

// Export singleton
export const codeEvolutionTracker = CodeEvolutionTracker.getInstance();
