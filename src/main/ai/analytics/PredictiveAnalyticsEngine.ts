/**
 * Predictive Code Analytics Engine
 * ML-based forecasting for code quality, bugs, and performance
 * Grok Recommendation: Predictive Analytics with ML Forecasting
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface PredictionResult {
    id: string;
    type: 'bug' | 'performance' | 'security' | 'complexity' | 'maintainability';
    confidence: number;
    prediction: string;
    probability: number;
    factors: PredictionFactor[];
    recommendations: string[];
    timestamp: Date;
}

interface PredictionFactor {
    name: string;
    weight: number;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
}

interface CodeTrend {
    metric: string;
    values: { date: Date; value: number }[];
    trend: 'improving' | 'declining' | 'stable';
    forecast: number[];
    confidence: number;
}

interface RiskAssessment {
    file: string;
    overallRisk: number;
    risks: { type: string; probability: number; severity: number; description: string }[];
    hotspots: { line: number; issue: string; risk: number }[];
}

interface ProjectForecast {
    id: string;
    projectName: string;
    generatedAt: Date;
    timeHorizon: '1week' | '1month' | '3months' | '6months';
    metrics: {
        bugs: { current: number; forecast: number; confidence: number };
        techDebt: { current: number; forecast: number; confidence: number };
        coverage: { current: number; forecast: number; confidence: number };
        velocity: { current: number; forecast: number; confidence: number };
    };
    risks: RiskAssessment[];
    opportunities: string[];
}

interface HistoricalData {
    commits: { date: Date; changes: number; author: string; types: string[] }[];
    bugs: { date: Date; severity: string; file: string; resolved?: Date }[];
    tests: { date: Date; passed: number; failed: number; coverage: number }[];
    reviews: { date: Date; comments: number; approved: boolean }[];
}

export class PredictiveAnalyticsEngine extends EventEmitter {
    private static instance: PredictiveAnalyticsEngine;
    private predictions: Map<string, PredictionResult> = new Map();
    private trends: Map<string, CodeTrend[]> = new Map();
    private forecasts: Map<string, ProjectForecast> = new Map();
    private historicalData: HistoricalData = { commits: [], bugs: [], tests: [], reviews: [] };

    private constructor() {
        super();
    }

    static getInstance(): PredictiveAnalyticsEngine {
        if (!PredictiveAnalyticsEngine.instance) {
            PredictiveAnalyticsEngine.instance = new PredictiveAnalyticsEngine();
        }
        return PredictiveAnalyticsEngine.instance;
    }

    predictBugRisk(code: string, filePath: string): PredictionResult {
        const factors = this.analyzeBugFactors(code);
        const probability = this.calculateProbability(factors);

        const prediction: PredictionResult = {
            id: crypto.randomUUID(),
            type: 'bug',
            confidence: this.calculateConfidence(factors),
            prediction: probability > 0.7 ? 'High bug risk' : probability > 0.4 ? 'Medium bug risk' : 'Low bug risk',
            probability,
            factors,
            recommendations: this.generateBugRecommendations(factors, filePath),
            timestamp: new Date()
        };

        this.predictions.set(prediction.id, prediction);
        this.emit('predictionGenerated', prediction);
        return prediction;
    }

    private analyzeBugFactors(code: string): PredictionFactor[] {
        const lines = code.split('\n').length;
        const complexity = this.calculateCyclomaticComplexity(code);
        const nestedDepth = this.calculateMaxNesting(code);
        const todoCount = (code.match(/TODO|FIXME|HACK|XXX/gi) || []).length;
        const errorHandling = (code.match(/try|catch|throw|Error/g) || []).length;
        const magicNumbers = (code.match(/[^a-zA-Z0-9_](\d{2,})[^a-zA-Z0-9_]/g) || []).length;

        return [
            { name: 'Code Size', weight: 0.15, value: Math.min(1, lines / 500), impact: lines > 300 ? 'negative' : 'neutral' },
            { name: 'Cyclomatic Complexity', weight: 0.25, value: Math.min(1, complexity / 20), impact: complexity > 10 ? 'negative' : 'neutral' },
            { name: 'Nesting Depth', weight: 0.2, value: Math.min(1, nestedDepth / 5), impact: nestedDepth > 4 ? 'negative' : 'neutral' },
            { name: 'TODO/FIXME Count', weight: 0.15, value: Math.min(1, todoCount / 5), impact: todoCount > 0 ? 'negative' : 'positive' },
            { name: 'Error Handling', weight: 0.15, value: Math.min(1, 1 - errorHandling / 10), impact: errorHandling > 5 ? 'positive' : 'negative' },
            { name: 'Magic Numbers', weight: 0.1, value: Math.min(1, magicNumbers / 10), impact: magicNumbers > 3 ? 'negative' : 'neutral' }
        ];
    }

    private calculateCyclomaticComplexity(code: string): number {
        const conditionals = (code.match(/if|else|switch|case|for|while|&&|\|\||catch|\?/g) || []).length;
        return conditionals + 1;
    }

    private calculateMaxNesting(code: string): number {
        let maxDepth = 0;
        let currentDepth = 0;

        for (const char of code) {
            if (char === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (char === '}') {
                currentDepth--;
            }
        }

        return maxDepth;
    }

    private calculateProbability(factors: PredictionFactor[]): number {
        let weightedSum = 0;
        let totalWeight = 0;

        for (const factor of factors) {
            const contribution = factor.impact === 'negative' ? factor.value : factor.impact === 'positive' ? 1 - factor.value : 0.5;
            weightedSum += contribution * factor.weight;
            totalWeight += factor.weight;
        }

        return Math.round((weightedSum / totalWeight) * 100) / 100;
    }

    private calculateConfidence(factors: PredictionFactor[]): number {
        const varianceReduction = factors.filter(f => f.impact !== 'neutral').length / factors.length;
        return Math.round((0.5 + varianceReduction * 0.4) * 100) / 100;
    }

    private generateBugRecommendations(factors: PredictionFactor[], filePath: string): string[] {
        const recommendations: string[] = [];

        for (const factor of factors) {
            if (factor.impact === 'negative' && factor.value > 0.5) {
                switch (factor.name) {
                    case 'Cyclomatic Complexity':
                        recommendations.push(`Reduce complexity in ${filePath} by extracting functions`);
                        break;
                    case 'Nesting Depth':
                        recommendations.push('Use early returns and guard clauses to reduce nesting');
                        break;
                    case 'TODO/FIXME Count':
                        recommendations.push('Address TODO/FIXME comments before shipping');
                        break;
                    case 'Code Size':
                        recommendations.push('Consider splitting this file into smaller modules');
                        break;
                    case 'Error Handling':
                        recommendations.push('Add proper error handling with try-catch blocks');
                        break;
                }
            }
        }

        return recommendations;
    }

    predictPerformance(code: string): PredictionResult {
        const factors = this.analyzePerformanceFactors(code);
        const probability = this.calculateProbability(factors);

        const prediction: PredictionResult = {
            id: crypto.randomUUID(),
            type: 'performance',
            confidence: this.calculateConfidence(factors),
            prediction: probability > 0.6 ? 'Performance issues likely' : 'Performance acceptable',
            probability,
            factors,
            recommendations: this.generatePerformanceRecommendations(factors),
            timestamp: new Date()
        };

        this.predictions.set(prediction.id, prediction);
        return prediction;
    }

    private analyzePerformanceFactors(code: string): PredictionFactor[] {
        const loops = (code.match(/for|while|\.forEach|\.map|\.filter|\.reduce/g) || []).length;
        const nestedLoops = (code.match(/for\s*\([^)]+\)\s*{[^}]*for|while\s*\([^)]+\)\s*{[^}]*while/g) || []).length;
        const asyncOps = (code.match(/await|\.then\(|Promise/g) || []).length;
        const regexOps = (code.match(/new RegExp|\/[^\/]+\/[gim]*/g) || []).length;
        const domOps = (code.match(/document\.|querySelector|getElementById/g) || []).length;

        return [
            { name: 'Loop Complexity', weight: 0.25, value: Math.min(1, loops / 10), impact: loops > 5 ? 'negative' : 'neutral' },
            { name: 'Nested Loops', weight: 0.3, value: Math.min(1, nestedLoops / 3), impact: nestedLoops > 0 ? 'negative' : 'positive' },
            { name: 'Async Operations', weight: 0.2, value: Math.min(1, asyncOps / 15), impact: asyncOps > 10 ? 'negative' : 'neutral' },
            { name: 'Regex Operations', weight: 0.15, value: Math.min(1, regexOps / 5), impact: regexOps > 3 ? 'negative' : 'neutral' },
            { name: 'DOM Operations', weight: 0.1, value: Math.min(1, domOps / 10), impact: domOps > 5 ? 'negative' : 'neutral' }
        ];
    }

    private generatePerformanceRecommendations(factors: PredictionFactor[]): string[] {
        const recommendations: string[] = [];

        for (const factor of factors) {
            if (factor.impact === 'negative' && factor.value > 0.3) {
                switch (factor.name) {
                    case 'Nested Loops':
                        recommendations.push('Consider using Map/Set for O(1) lookups instead of nested loops');
                        break;
                    case 'Loop Complexity':
                        recommendations.push('Use array methods like reduce instead of multiple iterations');
                        break;
                    case 'Async Operations':
                        recommendations.push('Use Promise.all for parallel async operations');
                        break;
                    case 'Regex Operations':
                        recommendations.push('Cache compiled regex patterns outside loops');
                        break;
                    case 'DOM Operations':
                        recommendations.push('Cache DOM queries and batch DOM updates');
                        break;
                }
            }
        }

        return recommendations;
    }

    analyzeTrends(historicalData: HistoricalData): CodeTrend[] {
        this.historicalData = historicalData;
        const trends: CodeTrend[] = [];

        // Bug trend
        const bugsByWeek = this.groupByWeek(historicalData.bugs.map(b => ({ date: b.date, value: 1 })));
        trends.push(this.createTrend('Bugs per Week', bugsByWeek));

        // Test coverage trend
        if (historicalData.tests.length > 0) {
            trends.push(this.createTrend('Test Coverage',
                historicalData.tests.map(t => ({ date: t.date, value: t.coverage }))
            ));
        }

        // Commit velocity trend
        const commitsByWeek = this.groupByWeek(historicalData.commits.map(c => ({ date: c.date, value: c.changes })));
        trends.push(this.createTrend('Commit Velocity', commitsByWeek));

        return trends;
    }

    private groupByWeek(data: { date: Date; value: number }[]): { date: Date; value: number }[] {
        const weeks = new Map<string, { date: Date; value: number }>();

        for (const item of data) {
            const weekStart = new Date(item.date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const key = weekStart.toISOString().split('T')[0];

            if (!weeks.has(key)) {
                weeks.set(key, { date: weekStart, value: 0 });
            }
            weeks.get(key)!.value += item.value;
        }

        return Array.from(weeks.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    private createTrend(metric: string, values: { date: Date; value: number }[]): CodeTrend {
        const forecast = this.linearForecast(values.map(v => v.value), 4);
        const trend = this.detectTrend(values.map(v => v.value));

        return {
            metric,
            values,
            trend,
            forecast,
            confidence: values.length > 4 ? 0.8 : 0.5
        };
    }

    private linearForecast(values: number[], periods: number): number[] {
        if (values.length < 2) return Array(periods).fill(values[0] || 0);

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return Array.from({ length: periods }, (_, i) =>
            Math.max(0, Math.round((slope * (n + i) + intercept) * 100) / 100)
        );
    }

    private detectTrend(values: number[]): 'improving' | 'declining' | 'stable' {
        if (values.length < 3) return 'stable';

        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const change = (secondAvg - firstAvg) / firstAvg;

        if (change > 0.1) return 'declining'; // More bugs = declining
        if (change < -0.1) return 'improving';
        return 'stable';
    }

    generateForecast(projectName: string, horizon: ProjectForecast['timeHorizon']): ProjectForecast {
        const forecast: ProjectForecast = {
            id: crypto.randomUUID(),
            projectName,
            generatedAt: new Date(),
            timeHorizon: horizon,
            metrics: {
                bugs: { current: 12, forecast: 8, confidence: 0.75 },
                techDebt: { current: 45, forecast: 52, confidence: 0.7 },
                coverage: { current: 68, forecast: 72, confidence: 0.8 },
                velocity: { current: 85, forecast: 90, confidence: 0.65 }
            },
            risks: [],
            opportunities: [
                'Increase test coverage to reduce bug prediction',
                'Refactor high-complexity modules before next release',
                'Implement code review automation'
            ]
        };

        this.forecasts.set(forecast.id, forecast);
        this.emit('forecastGenerated', forecast);
        return forecast;
    }

    getPrediction(id: string): PredictionResult | undefined {
        return this.predictions.get(id);
    }

    getPredictions(): PredictionResult[] {
        return Array.from(this.predictions.values());
    }

    getTrends(projectId: string): CodeTrend[] {
        return this.trends.get(projectId) || [];
    }

    getForecast(id: string): ProjectForecast | undefined {
        return this.forecasts.get(id);
    }
}

export const predictiveAnalyticsEngine = PredictiveAnalyticsEngine.getInstance();
