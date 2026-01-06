/**
 * Code Quality Dashboard
 * 
 * Real-time metrics for code health, complexity, and maintainability.
 */

import { EventEmitter } from 'events';

interface FileMetrics {
    file: string;
    lines: number;
    complexity: number;
    maintainability: number;
    issues: number;
    coverage?: number;
}

interface ProjectMetrics {
    totalFiles: number;
    totalLines: number;
    avgComplexity: number;
    avgMaintainability: number;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    hotspots: FileMetrics[];
    trends: { date: number; score: number }[];
}

export class CodeQualityDashboard extends EventEmitter {
    private static instance: CodeQualityDashboard;
    private fileMetrics: Map<string, FileMetrics> = new Map();
    private history: Array<{ date: number; score: number }> = [];

    private constructor() {
        super();
    }

    static getInstance(): CodeQualityDashboard {
        if (!CodeQualityDashboard.instance) {
            CodeQualityDashboard.instance = new CodeQualityDashboard();
        }
        return CodeQualityDashboard.instance;
    }

    analyzeFile(file: string, content: string): FileMetrics {
        const lines = content.split('\n').length;
        const complexity = this.calcComplexity(content);
        const maintainability = this.calcMaintainability(lines, complexity);
        const issues = this.countIssues(content);

        const metrics: FileMetrics = { file, lines, complexity, maintainability, issues };
        this.fileMetrics.set(file, metrics);
        this.emit('file:analyzed', metrics);
        return metrics;
    }

    private calcComplexity(code: string): number {
        let c = 1;
        (code.match(/\b(if|else|for|while|switch|case|catch|&&|\|\||\?:?)\b/g) || []).forEach(() => c++);
        return c;
    }

    private calcMaintainability(lines: number, complexity: number): number {
        return Math.max(0, Math.min(100, 100 - complexity * 2 - lines / 50));
    }

    private countIssues(code: string): number {
        let issues = 0;
        if (/console\.(log|debug)/.test(code)) issues++;
        if (/\bvar\s/.test(code)) issues++;
        if (/password|secret|api.?key/i.test(code)) issues += 2;
        if (/==(?!=)/.test(code)) issues++;
        return issues;
    }

    getProjectMetrics(): ProjectMetrics {
        const files = Array.from(this.fileMetrics.values());
        const total = files.length || 1;

        const totalLines = files.reduce((s, f) => s + f.lines, 0);
        const avgComplexity = files.reduce((s, f) => s + f.complexity, 0) / total;
        const avgMaintainability = files.reduce((s, f) => s + f.maintainability, 0) / total;
        const totalIssues = files.reduce((s, f) => s + f.issues, 0);

        const score = Math.max(0, Math.min(100, avgMaintainability - totalIssues));
        const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
        const hotspots = files.sort((a, b) => b.complexity - a.complexity).slice(0, 5);

        this.history.push({ date: Date.now(), score });

        return { totalFiles: total, totalLines, avgComplexity, avgMaintainability, score, grade, hotspots, trends: this.history };
    }

    getSummary(): { score: number; grade: string; files: number; issues: number } {
        const metrics = this.getProjectMetrics();
        const issues = Array.from(this.fileMetrics.values()).reduce((s, f) => s + f.issues, 0);
        return { score: Math.round(metrics.score), grade: metrics.grade, files: metrics.totalFiles, issues };
    }

    clear(): void {
        this.fileMetrics.clear();
        this.history = [];
    }
}

export const codeQualityDashboard = CodeQualityDashboard.getInstance();
