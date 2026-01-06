/**
 * UESE Self-Improvement Engine
 * 
 * Learns from executions, detects blind spots, calibrates accuracy,
 * and evolves the emulator's capabilities over time.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutionRecord {
    id: string;
    timestamp: number;
    universeId: string;
    code: string;
    language: string;
    result: 'success' | 'failure' | 'timeout';
    duration: number;
    memoryUsed: number;
    errors: string[];
    context: Record<string, any>;
}

export interface BlindSpot {
    id: string;
    category: 'language' | 'api' | 'behavior' | 'edge_case' | 'performance';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    occurrences: number;
    firstSeen: number;
    lastSeen: number;
    resolved: boolean;
}

export interface CalibrationRecord {
    id: string;
    timestamp: number;
    subsystem: string;
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
    correctionApplied: boolean;
}

export interface LearningInsight {
    id: string;
    category: string;
    insight: string;
    confidence: number;
    evidence: string[];
    actionable: boolean;
    suggestedAction?: string;
}

export interface EvolutionMetrics {
    executionsAnalyzed: number;
    blindSpotsFound: number;
    blindSpotsResolved: number;
    calibrationsPerformed: number;
    accuracyScore: number;
    learningRate: number;
}

// ============================================================================
// SELF-IMPROVEMENT ENGINE
// ============================================================================

export class SelfImprovementEngine extends EventEmitter {
    private static instance: SelfImprovementEngine;
    private executionRecords: ExecutionRecord[] = [];
    private blindSpots: Map<string, BlindSpot> = new Map();
    private calibrations: CalibrationRecord[] = [];
    private insights: LearningInsight[] = [];
    private patternDatabase: Map<string, number> = new Map();

    private constructor() {
        super();
        console.log('🧠 Self-Improvement Engine initialized');
    }

    static getInstance(): SelfImprovementEngine {
        if (!SelfImprovementEngine.instance) {
            SelfImprovementEngine.instance = new SelfImprovementEngine();
        }
        return SelfImprovementEngine.instance;
    }

    // ========================================================================
    // EXECUTION LEARNING
    // ========================================================================

    recordExecution(record: Omit<ExecutionRecord, 'id'>): ExecutionRecord {
        const fullRecord: ExecutionRecord = {
            ...record,
            id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        };

        this.executionRecords.push(fullRecord);
        this.analyzeExecution(fullRecord);
        this.emit('execution-recorded', fullRecord);

        // Keep last 10000 records
        if (this.executionRecords.length > 10000) {
            this.executionRecords = this.executionRecords.slice(-10000);
        }

        return fullRecord;
    }

    private analyzeExecution(record: ExecutionRecord): void {
        // Pattern recognition
        const pattern = `${record.language}:${record.result}`;
        this.patternDatabase.set(pattern, (this.patternDatabase.get(pattern) || 0) + 1);

        // Detect anomalies
        if (record.result === 'failure') {
            this.detectBlindSpot(record);
        }

        // Performance analysis
        if (record.duration > 5000) {
            this.recordInsight({
                category: 'performance',
                insight: `Slow execution detected: ${record.duration}ms`,
                confidence: 0.8,
                evidence: [record.id],
                actionable: true,
                suggestedAction: 'Consider code optimization or timeout adjustment'
            });
        }
    }

    private detectBlindSpot(record: ExecutionRecord): void {
        const errors = record.errors.join(' ').toLowerCase();
        let category: BlindSpot['category'] = 'edge_case';
        let description = 'Unknown failure pattern';

        // Categorize the failure
        if (errors.includes('not implemented') || errors.includes('unsupported')) {
            category = 'language';
            description = `Language feature not implemented: ${errors.substring(0, 100)}`;
        } else if (errors.includes('api') || errors.includes('method')) {
            category = 'api';
            description = `API behavior mismatch: ${errors.substring(0, 100)}`;
        } else if (errors.includes('timeout') || errors.includes('memory')) {
            category = 'performance';
            description = `Performance issue: ${errors.substring(0, 100)}`;
        }

        const spotId = `spot_${category}_${Buffer.from(description).toString('base64').substring(0, 10)}`;

        if (this.blindSpots.has(spotId)) {
            const existing = this.blindSpots.get(spotId)!;
            existing.occurrences++;
            existing.lastSeen = Date.now();
        } else {
            const spot: BlindSpot = {
                id: spotId,
                category,
                description,
                severity: this.calculateSeverity(category),
                occurrences: 1,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                resolved: false
            };
            this.blindSpots.set(spotId, spot);
            this.emit('blind-spot-detected', spot);
        }
    }

    private calculateSeverity(category: BlindSpot['category']): BlindSpot['severity'] {
        switch (category) {
            case 'language': return 'high';
            case 'api': return 'high';
            case 'behavior': return 'medium';
            case 'performance': return 'medium';
            case 'edge_case': return 'low';
            default: return 'low';
        }
    }

    // ========================================================================
    // CALIBRATION
    // ========================================================================

    calibrate(subsystem: string, metric: string, expected: number, actual: number): CalibrationRecord {
        const deviation = Math.abs(expected - actual) / expected;

        const record: CalibrationRecord = {
            id: `cal_${Date.now()}`,
            timestamp: Date.now(),
            subsystem,
            metric,
            expectedValue: expected,
            actualValue: actual,
            deviation,
            correctionApplied: deviation > 0.1 // Apply correction if >10% deviation
        };

        this.calibrations.push(record);

        if (record.correctionApplied) {
            this.emit('calibration-correction', record);
            this.recordInsight({
                category: 'calibration',
                insight: `${subsystem}.${metric} calibrated: ${(deviation * 100).toFixed(1)}% deviation corrected`,
                confidence: 0.9,
                evidence: [record.id],
                actionable: false
            });
        }

        return record;
    }

    runAutoCalibration(): CalibrationRecord[] {
        const records: CalibrationRecord[] = [];

        // Calibrate timing accuracy
        const start = performance.now();
        setTimeout(() => {
            const actual = performance.now() - start;
            records.push(this.calibrate('timing', 'setTimeout', 100, actual));
        }, 100);

        // Calibrate memory reporting
        const memBefore = process.memoryUsage().heapUsed;
        const arr = new Array(10000).fill(0);
        const memAfter = process.memoryUsage().heapUsed;
        const actualMem = (memAfter - memBefore) / 1024;
        records.push(this.calibrate('memory', 'allocation', 80, actualMem));

        this.emit('auto-calibration-complete', records);
        return records;
    }

    // ========================================================================
    // INSIGHT GENERATION
    // ========================================================================

    recordInsight(insight: Omit<LearningInsight, 'id'>): LearningInsight {
        const fullInsight: LearningInsight = {
            ...insight,
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
        };

        this.insights.push(fullInsight);
        this.emit('insight-generated', fullInsight);

        // Keep last 1000 insights
        if (this.insights.length > 1000) {
            this.insights = this.insights.slice(-1000);
        }

        return fullInsight;
    }

    generateReport(): {
        summary: string;
        metrics: EvolutionMetrics;
        topBlindSpots: BlindSpot[];
        recentInsights: LearningInsight[];
        recommendations: string[];
    } {
        const resolvedSpots = Array.from(this.blindSpots.values()).filter(s => s.resolved).length;
        const totalSpots = this.blindSpots.size;

        const metrics: EvolutionMetrics = {
            executionsAnalyzed: this.executionRecords.length,
            blindSpotsFound: totalSpots,
            blindSpotsResolved: resolvedSpots,
            calibrationsPerformed: this.calibrations.length,
            accuracyScore: this.calculateAccuracyScore(),
            learningRate: this.calculateLearningRate()
        };

        const topBlindSpots = Array.from(this.blindSpots.values())
            .filter(s => !s.resolved)
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 5);

        const recentInsights = this.insights.slice(-10);

        const recommendations = this.generateRecommendations(topBlindSpots, metrics);

        return {
            summary: `UESE has analyzed ${metrics.executionsAnalyzed} executions with ${metrics.accuracyScore.toFixed(1)}% accuracy`,
            metrics,
            topBlindSpots,
            recentInsights,
            recommendations
        };
    }

    private calculateAccuracyScore(): number {
        const total = this.executionRecords.length;
        if (total === 0) return 100;

        const successes = this.executionRecords.filter(r => r.result === 'success').length;
        return (successes / total) * 100;
    }

    private calculateLearningRate(): number {
        // Calculate improvement over time
        const recent = this.executionRecords.slice(-100);
        const older = this.executionRecords.slice(-200, -100);

        if (older.length === 0 || recent.length === 0) return 0;

        const recentSuccess = recent.filter(r => r.result === 'success').length / recent.length;
        const olderSuccess = older.filter(r => r.result === 'success').length / older.length;

        return (recentSuccess - olderSuccess) * 100;
    }

    private generateRecommendations(spots: BlindSpot[], metrics: EvolutionMetrics): string[] {
        const recommendations: string[] = [];

        if (metrics.accuracyScore < 90) {
            recommendations.push('Consider reviewing failing execution patterns');
        }

        spots.forEach(spot => {
            if (spot.occurrences > 5) {
                recommendations.push(`Address ${spot.category} issue: ${spot.description.substring(0, 50)}...`);
            }
        });

        if (metrics.learningRate < 0) {
            recommendations.push('Performance degradation detected - review recent changes');
        }

        return recommendations;
    }

    // ========================================================================
    // BLIND SPOT MANAGEMENT
    // ========================================================================

    resolveBlindSpot(spotId: string): boolean {
        const spot = this.blindSpots.get(spotId);
        if (spot) {
            spot.resolved = true;
            this.emit('blind-spot-resolved', spot);
            return true;
        }
        return false;
    }

    getBlindSpots(unresolvedOnly: boolean = false): BlindSpot[] {
        const spots = Array.from(this.blindSpots.values());
        return unresolvedOnly ? spots.filter(s => !s.resolved) : spots;
    }

    // ========================================================================
    // METRICS
    // ========================================================================

    getMetrics(): EvolutionMetrics {
        return {
            executionsAnalyzed: this.executionRecords.length,
            blindSpotsFound: this.blindSpots.size,
            blindSpotsResolved: Array.from(this.blindSpots.values()).filter(s => s.resolved).length,
            calibrationsPerformed: this.calibrations.length,
            accuracyScore: this.calculateAccuracyScore(),
            learningRate: this.calculateLearningRate()
        };
    }

    getPatterns(): Map<string, number> {
        return new Map(this.patternDatabase);
    }

    reset(): void {
        this.executionRecords = [];
        this.blindSpots.clear();
        this.calibrations = [];
        this.insights = [];
        this.patternDatabase.clear();
        this.emit('reset');
    }
}

export const selfImprovement = SelfImprovementEngine.getInstance();
