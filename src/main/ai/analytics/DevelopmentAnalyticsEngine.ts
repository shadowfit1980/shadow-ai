/**
 * Development Analytics Engine
 * 
 * Comprehensive development metrics:
 * - Coding velocity
 * - Bug introduction rate
 * - Review turnaround time
 * - Test coverage
 * - Predictive analytics
 */

import { EventEmitter } from 'events';

export interface DevelopmentMetrics {
    codingVelocity: number; // lines per hour
    bugIntroductionRate: number; // bugs per commit
    reviewTurnaroundTime: number; // hours
    testCoverage: number; // percentage
    codeComplexity: number; // cyclomatic score average
    documentationCoverage: number; // percentage
}

export interface PredictiveMetrics {
    estimatedBugCount: number;
    deadlineRisk: 'low' | 'medium' | 'high';
    bottlenecks: string[];
    recommendations: string[];
}

export interface MetricDataPoint {
    timestamp: number;
    metric: string;
    value: number;
    context?: Record<string, any>;
}

export class DevelopmentAnalyticsEngine extends EventEmitter {
    private static instance: DevelopmentAnalyticsEngine;
    private dataPoints: MetricDataPoint[] = [];
    private sessionMetrics: Partial<DevelopmentMetrics> = {};

    private constructor() { super(); }

    static getInstance(): DevelopmentAnalyticsEngine {
        if (!DevelopmentAnalyticsEngine.instance) {
            DevelopmentAnalyticsEngine.instance = new DevelopmentAnalyticsEngine();
        }
        return DevelopmentAnalyticsEngine.instance;
    }

    // Record metrics
    recordLinesWritten(lines: number): void {
        this.dataPoints.push({
            timestamp: Date.now(),
            metric: 'lines_written',
            value: lines,
        });
        this.updateVelocity();
    }

    recordCommit(bugCount: number = 0): void {
        this.dataPoints.push({
            timestamp: Date.now(),
            metric: 'commit',
            value: 1,
            context: { bugCount },
        });
        this.updateBugRate();
    }

    recordReview(turnaroundHours: number): void {
        this.dataPoints.push({
            timestamp: Date.now(),
            metric: 'review_turnaround',
            value: turnaroundHours,
        });
    }

    recordTestCoverage(coverage: number): void {
        this.sessionMetrics.testCoverage = coverage;
        this.dataPoints.push({
            timestamp: Date.now(),
            metric: 'test_coverage',
            value: coverage,
        });
    }

    recordComplexity(complexity: number): void {
        this.sessionMetrics.codeComplexity = complexity;
        this.dataPoints.push({
            timestamp: Date.now(),
            metric: 'complexity',
            value: complexity,
        });
    }

    // Calculate metrics
    private updateVelocity(): void {
        const linePoints = this.dataPoints.filter(d => d.metric === 'lines_written');
        if (linePoints.length < 2) return;

        const totalLines = linePoints.reduce((sum, d) => sum + d.value, 0);
        const timeSpanHours = (linePoints[linePoints.length - 1].timestamp - linePoints[0].timestamp) / (1000 * 60 * 60);

        this.sessionMetrics.codingVelocity = timeSpanHours > 0 ? totalLines / timeSpanHours : 0;
    }

    private updateBugRate(): void {
        const commitPoints = this.dataPoints.filter(d => d.metric === 'commit');
        if (commitPoints.length === 0) return;

        const totalBugs = commitPoints.reduce((sum, d) => sum + (d.context?.bugCount || 0), 0);
        this.sessionMetrics.bugIntroductionRate = totalBugs / commitPoints.length;
    }

    // Get current metrics
    getMetrics(): DevelopmentMetrics {
        const reviewPoints = this.dataPoints.filter(d => d.metric === 'review_turnaround');
        const avgReviewTime = reviewPoints.length > 0
            ? reviewPoints.reduce((sum, d) => sum + d.value, 0) / reviewPoints.length
            : 0;

        return {
            codingVelocity: this.sessionMetrics.codingVelocity || 0,
            bugIntroductionRate: this.sessionMetrics.bugIntroductionRate || 0,
            reviewTurnaroundTime: avgReviewTime,
            testCoverage: this.sessionMetrics.testCoverage || 0,
            codeComplexity: this.sessionMetrics.codeComplexity || 0,
            documentationCoverage: this.sessionMetrics.documentationCoverage || 0,
        };
    }

    // Predictive analytics
    estimateBugCount(linesOfCode: number, complexity: number): number {
        // Bug estimation formula (simplified)
        const baseRate = this.sessionMetrics.bugIntroductionRate || 0.1;
        const complexityFactor = complexity / 10;
        return Math.ceil(linesOfCode * baseRate * complexityFactor / 100);
    }

    predictDeadlineRisk(
        daysRemaining: number,
        tasksRemaining: number,
        averageTaskDays: number
    ): { risk: 'low' | 'medium' | 'high'; analysis: string } {
        const neededDays = tasksRemaining * averageTaskDays;
        const buffer = daysRemaining - neededDays;

        if (buffer >= neededDays * 0.3) {
            return { risk: 'low', analysis: 'On track with comfortable buffer' };
        } else if (buffer >= 0) {
            return { risk: 'medium', analysis: 'Tight timeline, minimal buffer' };
        } else {
            return { risk: 'high', analysis: `Behind schedule by approximately ${Math.abs(buffer).toFixed(1)} days` };
        }
    }

    identifyBottlenecks(): string[] {
        const bottlenecks: string[] = [];
        const metrics = this.getMetrics();

        if (metrics.codingVelocity < 20) {
            bottlenecks.push('Low coding velocity - consider reducing context switching');
        }
        if (metrics.bugIntroductionRate > 0.5) {
            bottlenecks.push('High bug rate - consider more code review or testing');
        }
        if (metrics.reviewTurnaroundTime > 24) {
            bottlenecks.push('Slow code reviews - bottleneck in review process');
        }
        if (metrics.testCoverage < 50) {
            bottlenecks.push('Low test coverage - risk of regressions');
        }
        if (metrics.codeComplexity > 15) {
            bottlenecks.push('High code complexity - refactoring recommended');
        }

        return bottlenecks;
    }

    // Trend analysis
    getMetricTrend(metric: string, days: number = 7): {
        trend: 'improving' | 'stable' | 'declining';
        change: number;
    } {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const recentPoints = this.dataPoints.filter(
            d => d.metric === metric && d.timestamp >= cutoff
        );

        if (recentPoints.length < 2) {
            return { trend: 'stable', change: 0 };
        }

        const halfPoint = Math.floor(recentPoints.length / 2);
        const firstHalf = recentPoints.slice(0, halfPoint);
        const secondHalf = recentPoints.slice(halfPoint);

        const avgFirst = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

        const change = ((avgSecond - avgFirst) / avgFirst) * 100;

        if (change > 10) return { trend: 'improving', change };
        if (change < -10) return { trend: 'declining', change };
        return { trend: 'stable', change };
    }

    // Export data
    exportData(): { metrics: DevelopmentMetrics; dataPoints: MetricDataPoint[] } {
        return {
            metrics: this.getMetrics(),
            dataPoints: this.dataPoints,
        };
    }

    // Clear old data
    pruneOldData(daysToKeep: number = 30): void {
        const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
        this.dataPoints = this.dataPoints.filter(d => d.timestamp >= cutoff);
    }
}

export const developmentAnalyticsEngine = DevelopmentAnalyticsEngine.getInstance();
