/**
 * Predictive Analytics Engine
 * 
 * Forecast project timelines, bug rates, and team burnout
 * using historical data and ML-like pattern analysis.
 */

import { EventEmitter } from 'events';

export interface ProjectMetrics {
    projectId: string;
    timestamp: Date;
    codeMetrics: CodeMetrics;
    velocityMetrics: VelocityMetrics;
    qualityMetrics: QualityMetrics;
    teamMetrics: TeamMetrics;
}

export interface CodeMetrics {
    totalLines: number;
    linesAdded: number;
    linesRemoved: number;
    filesChanged: number;
    complexity: number; // Cyclomatic complexity average
    techDebt: number;   // Estimated hours to fix
}

export interface VelocityMetrics {
    tasksCompleted: number;
    tasksInProgress: number;
    averageCompletionTime: number; // hours
    sprintProgress: number; // 0-100
    estimatedCompletion: Date;
}

export interface QualityMetrics {
    bugsFound: number;
    bugsFixed: number;
    testCoverage: number;
    buildSuccessRate: number;
    codeReviewTime: number; // hours
}

export interface TeamMetrics {
    activeMembers: number;
    averageWorkHours: number;
    burnoutRisk: number; // 0-1
    collaborationScore: number; // 0-1
    knowledgeDistribution: number; // 0-1 (1 = well distributed)
}

export interface Prediction {
    id: string;
    type: PredictionType;
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeframe: string;
    factors: PredictionFactor[];
    recommendation?: string;
}

export type PredictionType =
    | 'timeline'
    | 'bug_rate'
    | 'burnout'
    | 'velocity'
    | 'quality';

export interface PredictionFactor {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
}

export interface Alert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    type: AlertType;
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
    actions: string[];
    timestamp: Date;
}

export type AlertType =
    | 'deadline_risk'
    | 'quality_decline'
    | 'burnout_warning'
    | 'velocity_drop'
    | 'tech_debt_spike';

export class PredictiveAnalytics extends EventEmitter {
    private static instance: PredictiveAnalytics;
    private metricsHistory: ProjectMetrics[] = [];
    private predictions: Map<string, Prediction> = new Map();
    private alerts: Alert[] = [];
    private thresholds = {
        burnoutRisk: 0.7,
        velocityDropPercent: 20,
        bugRateSpike: 1.5, // 1.5x normal
        techDebtHours: 40,
        testCoverageMin: 60,
    };

    private constructor() {
        super();
    }

    static getInstance(): PredictiveAnalytics {
        if (!PredictiveAnalytics.instance) {
            PredictiveAnalytics.instance = new PredictiveAnalytics();
        }
        return PredictiveAnalytics.instance;
    }

    // ========================================================================
    // DATA COLLECTION
    // ========================================================================

    /**
     * Record current project metrics
     */
    recordMetrics(metrics: ProjectMetrics): void {
        this.metricsHistory.push(metrics);

        // Keep last 1000 entries
        if (this.metricsHistory.length > 1000) {
            this.metricsHistory.shift();
        }

        // Run analysis on new data
        this.analyzeAndPredict(metrics);
        this.checkAlerts(metrics);

        this.emit('metrics:recorded', metrics);
    }

    // ========================================================================
    // PREDICTION ENGINE
    // ========================================================================

    /**
     * Generate predictions based on historical data
     */
    private analyzeAndPredict(current: ProjectMetrics): void {
        const history = this.metricsHistory.slice(-30); // Last 30 data points
        if (history.length < 5) return; // Need minimum data

        // Timeline prediction
        this.predictTimeline(current, history);

        // Bug rate prediction
        this.predictBugRate(current, history);

        // Burnout prediction
        this.predictBurnout(current, history);

        // Velocity prediction
        this.predictVelocity(current, history);
    }

    private predictTimeline(current: ProjectMetrics, history: ProjectMetrics[]): void {
        const velocities = history.map(h => h.velocityMetrics.tasksCompleted);
        const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const trend = this.calculateTrend(velocities);

        const tasksRemaining = current.velocityMetrics.tasksInProgress;
        const adjustedVelocity = avgVelocity * (1 + trend);
        const daysToComplete = tasksRemaining / Math.max(0.1, adjustedVelocity);

        const factors: PredictionFactor[] = [];

        if (trend > 0.1) {
            factors.push({
                name: 'Increasing Velocity',
                impact: 'positive',
                weight: trend,
                description: `Team velocity is increasing by ${(trend * 100).toFixed(1)}%`,
            });
        } else if (trend < -0.1) {
            factors.push({
                name: 'Decreasing Velocity',
                impact: 'negative',
                weight: Math.abs(trend),
                description: `Team velocity is decreasing by ${(Math.abs(trend) * 100).toFixed(1)}%`,
            });
        }

        if (current.teamMetrics.burnoutRisk > 0.5) {
            factors.push({
                name: 'Burnout Risk',
                impact: 'negative',
                weight: current.teamMetrics.burnoutRisk,
                description: 'High burnout risk may slow progress',
            });
        }

        const prediction: Prediction = {
            id: `pred_timeline_${Date.now()}`,
            type: 'timeline',
            metric: 'days_to_complete',
            currentValue: current.velocityMetrics.sprintProgress,
            predictedValue: daysToComplete,
            confidence: Math.max(0.5, 1 - Math.abs(trend)),
            timeframe: `${Math.ceil(daysToComplete)} days`,
            factors,
            recommendation: daysToComplete > 14
                ? 'Consider adding resources or reducing scope'
                : undefined,
        };

        this.predictions.set('timeline', prediction);
        this.emit('prediction:updated', prediction);
    }

    private predictBugRate(current: ProjectMetrics, history: ProjectMetrics[]): void {
        const bugRates = history.map(h => h.qualityMetrics.bugsFound);
        const avgRate = bugRates.reduce((a, b) => a + b, 0) / bugRates.length;
        const currentRate = current.qualityMetrics.bugsFound;
        const trend = this.calculateTrend(bugRates);

        const factors: PredictionFactor[] = [];

        if (current.codeMetrics.complexity > 20) {
            factors.push({
                name: 'High Complexity',
                impact: 'negative',
                weight: 0.3,
                description: 'Complex code is more bug-prone',
            });
        }

        if (current.qualityMetrics.testCoverage < 50) {
            factors.push({
                name: 'Low Test Coverage',
                impact: 'negative',
                weight: 0.4,
                description: 'Insufficient tests may hide bugs',
            });
        }

        const predictedRate = avgRate * (1 + trend);

        const prediction: Prediction = {
            id: `pred_bugs_${Date.now()}`,
            type: 'bug_rate',
            metric: 'bugs_per_week',
            currentValue: currentRate,
            predictedValue: predictedRate,
            confidence: 0.7,
            timeframe: 'next week',
            factors,
            recommendation: predictedRate > avgRate * 1.5
                ? 'Increase code review and testing efforts'
                : undefined,
        };

        this.predictions.set('bug_rate', prediction);
    }

    private predictBurnout(current: ProjectMetrics, history: ProjectMetrics[]): void {
        const burnoutScores = history.map(h => h.teamMetrics.burnoutRisk);
        const trend = this.calculateTrend(burnoutScores);

        const factors: PredictionFactor[] = [];

        if (current.teamMetrics.averageWorkHours > 45) {
            factors.push({
                name: 'Long Work Hours',
                impact: 'negative',
                weight: 0.5,
                description: `Average ${current.teamMetrics.averageWorkHours}h/week is unsustainable`,
            });
        }

        if (current.teamMetrics.knowledgeDistribution < 0.3) {
            factors.push({
                name: 'Knowledge Silos',
                impact: 'negative',
                weight: 0.3,
                description: 'Few team members carry most of the load',
            });
        }

        const predictedBurnout = Math.min(1, current.teamMetrics.burnoutRisk + trend * 0.5);

        const prediction: Prediction = {
            id: `pred_burnout_${Date.now()}`,
            type: 'burnout',
            metric: 'burnout_risk',
            currentValue: current.teamMetrics.burnoutRisk,
            predictedValue: predictedBurnout,
            confidence: 0.75,
            timeframe: '2 weeks',
            factors,
            recommendation: predictedBurnout > 0.7
                ? 'Schedule team break or redistribute workload'
                : undefined,
        };

        this.predictions.set('burnout', prediction);
    }

    private predictVelocity(current: ProjectMetrics, history: ProjectMetrics[]): void {
        const velocities = history.map(h => h.velocityMetrics.tasksCompleted);
        const trend = this.calculateTrend(velocities);
        const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

        const prediction: Prediction = {
            id: `pred_velocity_${Date.now()}`,
            type: 'velocity',
            metric: 'tasks_per_day',
            currentValue: current.velocityMetrics.tasksCompleted,
            predictedValue: avgVelocity * (1 + trend),
            confidence: 0.8,
            timeframe: 'next sprint',
            factors: [],
        };

        this.predictions.set('velocity', prediction);
    }

    /**
     * Calculate trend using linear regression slope
     */
    private calculateTrend(data: number[]): number {
        if (data.length < 2) return 0;

        const n = data.length;
        const xSum = (n * (n - 1)) / 2;
        const ySum = data.reduce((a, b) => a + b, 0);
        const xySum = data.reduce((sum, y, x) => sum + x * y, 0);
        const xxSum = data.reduce((sum, _, x) => sum + x * x, 0);

        const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
        const avgY = ySum / n;

        return avgY !== 0 ? slope / avgY : 0; // Normalized trend
    }

    // ========================================================================
    // ALERT SYSTEM
    // ========================================================================

    private checkAlerts(metrics: ProjectMetrics): void {
        // Burnout warning
        if (metrics.teamMetrics.burnoutRisk > this.thresholds.burnoutRisk) {
            this.createAlert({
                severity: 'critical',
                type: 'burnout_warning',
                message: 'Team burnout risk is critically high',
                metric: 'burnout_risk',
                value: metrics.teamMetrics.burnoutRisk,
                threshold: this.thresholds.burnoutRisk,
                actions: [
                    'Schedule team retrospective',
                    'Consider workload redistribution',
                    'Enforce healthy work hours',
                ],
            });
        }

        // Tech debt warning
        if (metrics.codeMetrics.techDebt > this.thresholds.techDebtHours) {
            this.createAlert({
                severity: 'warning',
                type: 'tech_debt_spike',
                message: `Technical debt has exceeded ${this.thresholds.techDebtHours} hours`,
                metric: 'tech_debt',
                value: metrics.codeMetrics.techDebt,
                threshold: this.thresholds.techDebtHours,
                actions: [
                    'Schedule refactoring sprint',
                    'Prioritize debt reduction items',
                ],
            });
        }

        // Test coverage warning
        if (metrics.qualityMetrics.testCoverage < this.thresholds.testCoverageMin) {
            this.createAlert({
                severity: 'warning',
                type: 'quality_decline',
                message: `Test coverage is below ${this.thresholds.testCoverageMin}%`,
                metric: 'test_coverage',
                value: metrics.qualityMetrics.testCoverage,
                threshold: this.thresholds.testCoverageMin,
                actions: [
                    'Add tests for uncovered code paths',
                    'Enforce coverage gates in CI',
                ],
            });
        }
    }

    private createAlert(config: Omit<Alert, 'id' | 'timestamp'>): void {
        const alert: Alert = {
            ...config,
            id: `alert_${Date.now()}`,
            timestamp: new Date(),
        };

        this.alerts.push(alert);
        this.emit('alert:created', alert);
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getPrediction(type: PredictionType): Prediction | undefined {
        return this.predictions.get(type);
    }

    getAllPredictions(): Prediction[] {
        return Array.from(this.predictions.values());
    }

    getRecentAlerts(limit: number = 10): Alert[] {
        return this.alerts.slice(-limit);
    }

    getMetricsHistory(days: number = 7): ProjectMetrics[] {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.metricsHistory.filter(m => m.timestamp >= cutoff);
    }

    getDashboardData(): {
        predictions: Prediction[];
        alerts: Alert[];
        latestMetrics?: ProjectMetrics;
        trends: Record<string, number>;
    } {
        const history = this.getMetricsHistory(7);
        return {
            predictions: this.getAllPredictions(),
            alerts: this.getRecentAlerts(5),
            latestMetrics: this.metricsHistory[this.metricsHistory.length - 1],
            trends: {
                velocity: this.calculateTrend(history.map(h => h.velocityMetrics.tasksCompleted)),
                bugs: this.calculateTrend(history.map(h => h.qualityMetrics.bugsFound)),
                coverage: this.calculateTrend(history.map(h => h.qualityMetrics.testCoverage)),
            },
        };
    }
}

export const predictiveAnalytics = PredictiveAnalytics.getInstance();
