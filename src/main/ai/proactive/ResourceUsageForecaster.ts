/**
 * Resource Usage Forecaster
 * 
 * Predicts and optimizes resource consumption (CPU, memory, API calls, tokens)
 * Prevents resource exhaustion and optimizes costs
 */

import { ModelManager } from '../ModelManager';

export interface ResourceForecast {
    resource: 'cpu' | 'memory' | 'api-calls' | 'tokens' | 'storage' | 'bandwidth';
    current: number;
    predicted: number;
    timeframe: string; // e.g., "next hour", "next day"
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    alerts: Array<{
        severity: 'info' | 'warning' | 'critical';
        message: string;
        threshold: number;
    }>;
}

export interface ResourceOptimization {
    resource: string;
    currentUsage: number;
    potentialSavings: number;
    recommendations: Array<{
        action: string;
        impact: string;
        effort: 'low' | 'medium' | 'high';
        priority: number;
    }>;
}

export interface UsagePattern {
    pattern: string;
    typical: number;
    peak: number;
    offPeak: number;
    timeOfDay?: {
        hour: number;
        usage: number;
    }[];
}

export class ResourceUsageForecaster {
    private static instance: ResourceUsageForecaster;
    private modelManager: ModelManager;

    // Track resource usage over time
    private usageHistory: Map<string, Array<{
        timestamp: Date;
        value: number;
    }>> = new Map();

    // Budget limits
    private budgets: Map<string, number> = new Map();

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.initializeDefaults();
    }

    static getInstance(): ResourceUsageForecaster {
        if (!ResourceUsageForecaster.instance) {
            ResourceUsageForecaster.instance = new ResourceUsageForecaster();
        }
        return ResourceUsageForecaster.instance;
    }

    /**
     * Forecast resource usage
     */
    async forecastUsage(
        resource: string,
        timeframe: 'hour' | 'day' | 'week' | 'month'
    ): Promise<ResourceForecast> {
        console.log(`📈 Forecasting ${resource} usage for next ${timeframe}...`);

        const history = this.usageHistory.get(resource) || [];

        if (history.length < 2) {
            return this.getDefaultForecast(resource, timeframe);
        }

        // Calculate trend
        const recent = history.slice(-10);
        const current = recent[recent.length - 1]?.value || 0;
        const trend = this.calculateTrend(recent);

        //  Simple linear prediction
        const growthRate = this.calculateGrowthRate(recent);
        const multiplier = this.getTimeMultiplier(timeframe);
        const predicted = current * (1 + growthRate * multiplier);

        // Check against budgets
        const alerts = this.generateAlerts(resource, predicted);

        const forecast: ResourceForecast = {
            resource: resource as any,
            current,
            predicted,
            timeframe: `next ${timeframe}`,
            confidence: this.calculateConfidence(history.length),
            trend,
            alerts
        };

        console.log(`✅ Forecast: current=${current.toFixed(0)}, predicted=${predicted.toFixed(0)}, trend=${trend}`);
        return forecast;
    }

    /**
     * Record resource usage
     */
    recordUsage(resource: string, value: number): void {
        if (!this.usageHistory.has(resource)) {
            this.usageHistory.set(resource, []);
        }

        const history = this.usageHistory.get(resource)!;
        history.push({
            timestamp: new Date(),
            value
        });

        // Keep last 1000 records
        if (history.length > 1000) {
            this.usageHistory.set(resource, history.slice(-500));
        }

        // Check for immediate alerts
        const budget = this.budgets.get(resource);
        if (budget && value > budget * 0.9) {
            console.warn(`⚠️  ${resource} at ${((value / budget) * 100).toFixed(0)}% of budget!`);
        }
    }

    /**
     * Set resource budget
     */
    setBudget(resource: string, limit: number): void {
        this.budgets.set(resource, limit);
        console.log(`💰 Budget set for ${resource}: ${limit}`);
    }

    /**
     * Optimize resource usage
     */
    async optimizeResourceUsage(resource: string): Promise<ResourceOptimization> {
        console.log(`⚡ Optimizing ${resource} usage...`);

        const history = this.usageHistory.get(resource) || [];
        const currentUsage = history[history.length - 1]?.value || 0;

        const prompt = `Suggest optimizations for resource usage:

## Resource
${resource}

## Current Usage
${currentUsage.toFixed(0)} units

## Usage Pattern
Recent values: ${history.slice(-10).map(h => h.value.toFixed(0)).join(', ')}

Suggest 3-5 concrete optimization strategies:

Response in JSON:
\`\`\`json
{
  "potentialSavings": 30,
  "recommendations": [
    {
      "action": "Implement caching layer",
      "impact": "Reduce API calls by 40%",
      "effort": "medium",
      "priority": 1
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseOptimizationResponse(response);

        return {
            resource,
            currentUsage,
            potentialSavings: parsed.potentialSavings || 0,
            recommendations: parsed.recommendations || []
        };
    }

    /**
     * Analyze usage patterns
     */
    analyzePattern(resource: string): UsagePattern | null {
        const history = this.usageHistory.get(resource);
        if (!history || history.length < 10) return null;

        const values = history.map(h => h.value);
        const typical = values.reduce((sum, v) => sum + v, 0) / values.length;
        const peak = Math.max(...values);
        const offPeak = Math.min(...values);

        // Group by hour of day
        const hourlyUsage = new Map<number, number[]>();
        history.forEach(h => {
            const hour = h.timestamp.getHours();
            if (!hourlyUsage.has(hour)) hourlyUsage.set(hour, []);
            hourlyUsage.get(hour)!.push(h.value);
        });

        const timeOfDay = Array.from(hourlyUsage.entries())
            .map(([hour, values]) => ({
                hour,
                usage: values.reduce((sum, v) => sum + v, 0) / values.length
            }))
            .sort((a, b) => a.hour - b.hour);

        return {
            pattern: this.identifyPattern(values),
            typical,
            peak,
            offPeak,
            timeOfDay: timeOfDay.length > 0 ? timeOfDay : undefined
        };
    }

    /**
     * Predict cost based on usage forecast
     */
    async predictCost(
        forecasts: ResourceForecast[],
        pricing: Map<string, number> // cost per unit
    ): Promise<{
        currentCost: number;
        predictedCost: number;
        breakdown: Array<{
            resource: string;
            cost: number;
            percentage: number;
        }>;
    }> {
        let currentCost = 0;
        let predictedCost = 0;
        const breakdown: Array<{ resource: string; cost: number; percentage: number }> = [];

        for (const forecast of forecasts) {
            const unitCost = pricing.get(forecast.resource) || 0;
            const cost = forecast.predicted * unitCost;
            predictedCost += cost;
            currentCost += forecast.current * unitCost;

            breakdown.push({
                resource: forecast.resource,
                cost,
                percentage: 0 // Will calculate after
            });
        }

        // Calculate percentages
        breakdown.forEach(item => {
            item.percentage = (item.cost / predictedCost) * 100;
        });

        return {
            currentCost,
            predictedCost,
            breakdown: breakdown.sort((a, b) => b.cost - a.cost)
        };
    }

    // Private methods

    private calculateTrend(data: Array<{ timestamp: Date; value: number }>): 'increasing' | 'decreasing' | 'stable' {
        if (data.length < 3) return 'stable';

        const values = data.map(d => d.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

        const change = (secondAvg - firstAvg) / firstAvg;

        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    private calculateGrowthRate(data: Array<{ timestamp: Date; value: number }>): number {
        if (data.length < 2) return 0;

        const first = data[0].value;
        const last = data[data.length - 1].value;

        return (last - first) / first;
    }

    private getTimeMultiplier(timeframe: string): number {
        switch (timeframe) {
            case 'hour': return 1;
            case 'day': return 24;
            case 'week': return 168;
            case 'month': return 720;
            default: return 1;
        }
    }

    private calculateConfidence(historyLength: number): number {
        // More history = higher confidence
        if (historyLength > 100) return 0.9;
        if (historyLength > 50) return 0.8;
        if (historyLength > 20) return 0.7;
        if (historyLength > 10) return 0.6;
        return 0.5;
    }

    private generateAlerts(resource: string, predicted: number): Array<{
        severity: 'info' | 'warning' | 'critical';
        message: string;
        threshold: number;
    }> {
        const alerts: Array<{ severity: any; message: string; threshold: number }> = [];
        const budget = this.budgets.get(resource);

        if (budget) {
            const percentage = (predicted / budget) * 100;

            if (percentage > 100) {
                alerts.push({
                    severity: 'critical',
                    message: `${resource} predicted to exceed budget by ${(percentage - 100).toFixed(0)}%`,
                    threshold: budget
                });
            } else if (percentage > 90) {
                alerts.push({
                    severity: 'warning',
                    message: `${resource} approaching budget (${percentage.toFixed(0)}%)`,
                    threshold: budget * 0.9
                });
            } else if (percentage > 75) {
                alerts.push({
                    severity: 'info',
                    message: `${resource} at ${percentage.toFixed(0)}% of budget`,
                    threshold: budget * 0.75
                });
            }
        }

        return alerts;
    }

    private identifyPattern(values: number[]): string {
        const variance = this.calculateVariance(values);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const cv = Math.sqrt(variance) / mean; // Coefficient of variation

        if (cv < 0.1) return 'Very stable';
        if (cv < 0.3) return 'Stable';
        if (cv < 0.5) return 'Moderate variability';
        return 'High variability';
    }

    private calculateVariance(values: number[]): number {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    }

    private getDefaultForecast(resource: string, timeframe: string): ResourceForecast {
        return {
            resource: resource as any,
            current: 0,
            predicted: 0,
            timeframe: `next ${timeframe}`,
            confidence: 0.3,
            trend: 'stable',
            alerts: []
        };
    }

    private initializeDefaults(): void {
        // Set default budgets (can be overridden)
        this.budgets.set('api-calls', 10000);
        this.budgets.set('tokens', 1000000);
        this.budgets.set('memory', 1024 * 1024 * 1024); // 1GB
    }

    private parseOptimizationResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { potentialSavings: 0, recommendations: [] };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at analyzing and optimizing resource usage.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
            return response;
        } catch (error) {
            console.error('Error calling model:', error);
            return '{}';
        }
    }
}

// Export singleton
export const resourceUsageForecaster = ResourceUsageForecaster.getInstance();
