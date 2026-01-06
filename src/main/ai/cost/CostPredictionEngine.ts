/**
 * CostPredictionEngine - Infrastructure Cost Estimation
 * 
 * Predicts compute, storage, network, and third-party costs
 * from code changes. Projects costs at different user scales.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface CostAnalysisRequest {
    code: string;
    language?: string;
    context?: {
        cloudProvider?: 'aws' | 'gcp' | 'azure';
        region?: string;
        currentMonthlySpend?: number;
    };
}

export interface CostBreakdown {
    compute: CostComponent;
    storage: CostComponent;
    network: CostComponent;
    database: CostComponent;
    thirdParty: CostComponent;
    total: number;
    currency: string;
}

export interface CostComponent {
    monthlyCost: number;
    details: string;
    factors: CostFactor[];
}

export interface CostFactor {
    name: string;
    impact: 'low' | 'medium' | 'high';
    estimatedCost: number;
    lineReference?: number;
    suggestion?: string;
}

export interface ScaleProjection {
    users: number;
    requestsPerMonth: number;
    costs: CostBreakdown;
    bottlenecks: string[];
}

export interface CostOptimization {
    category: string;
    description: string;
    potentialSavings: number;
    effort: 'trivial' | 'minor' | 'moderate' | 'major';
    codeChange?: { before: string; after: string };
}

export interface CostPrediction {
    id: string;
    createdAt: Date;
    current: CostBreakdown;
    projections: {
        '1k_users': ScaleProjection;
        '10k_users': ScaleProjection;
        '100k_users': ScaleProjection;
        '1m_users': ScaleProjection;
    };
    optimizations: CostOptimization[];
    warnings: string[];
}

// ============================================================================
// COST PATTERNS
// ============================================================================

interface CostPattern {
    pattern: RegExp;
    category: 'compute' | 'storage' | 'network' | 'database' | 'thirdParty';
    costPerUnit: number; // $ per 1000 operations
    scaleFactor: number; // How cost scales with users
    description: string;
    optimization?: CostOptimization;
}

const COST_PATTERNS: CostPattern[] = [
    // Compute patterns
    {
        pattern: /(?:crypto\.pbkdf2|bcrypt|argon2)/gi,
        category: 'compute',
        costPerUnit: 0.05,
        scaleFactor: 1.0,
        description: 'CPU-intensive password hashing',
        optimization: {
            category: 'compute',
            description: 'Consider using bcrypt with appropriate cost factor',
            potentialSavings: 0.02,
            effort: 'trivial'
        }
    },
    {
        pattern: /for\s*\([^)]*\)\s*{[\s\S]*?for\s*\([^)]*\)/gi,
        category: 'compute',
        costPerUnit: 0.001,
        scaleFactor: 2.0,
        description: 'Nested loops (O(n²) complexity)'
    },
    {
        pattern: /JSON\.parse\s*\(\s*JSON\.stringify/gi,
        category: 'compute',
        costPerUnit: 0.001,
        scaleFactor: 1.5,
        description: 'JSON deep clone (CPU + memory intensive)',
        optimization: {
            category: 'compute',
            description: 'Use structuredClone() for better performance',
            potentialSavings: 0.0005,
            effort: 'trivial',
            codeChange: {
                before: 'JSON.parse(JSON.stringify(obj))',
                after: 'structuredClone(obj)'
            }
        }
    },

    // Storage patterns
    {
        pattern: /\.writeFile|\.upload|putObject/gi,
        category: 'storage',
        costPerUnit: 0.023, // S3 standard cost per GB
        scaleFactor: 1.0,
        description: 'File storage operation'
    },
    {
        pattern: /Buffer\.alloc\s*\(\s*(\d+)/gi,
        category: 'storage',
        costPerUnit: 0.0001,
        scaleFactor: 1.0,
        description: 'Memory buffer allocation'
    },
    {
        pattern: /localStorage|sessionStorage/gi,
        category: 'storage',
        costPerUnit: 0,
        scaleFactor: 0,
        description: 'Client-side storage (no server cost)'
    },

    // Network patterns
    {
        pattern: /fetch\s*\(|axios\.|http\.request/gi,
        category: 'network',
        costPerUnit: 0.0001, // Data transfer cost
        scaleFactor: 1.2,
        description: 'HTTP request (data transfer)'
    },
    {
        pattern: /WebSocket|socket\.io|ws\./gi,
        category: 'network',
        costPerUnit: 0.01,
        scaleFactor: 1.5,
        description: 'WebSocket connection (persistent)',
        optimization: {
            category: 'network',
            description: 'Consider HTTP polling for low-frequency updates',
            potentialSavings: 0.005,
            effort: 'moderate'
        }
    },
    {
        pattern: /\.pipe\s*\(|createReadStream/gi,
        category: 'network',
        costPerUnit: 0.02,
        scaleFactor: 1.0,
        description: 'Streaming data transfer'
    },

    // Database patterns
    {
        pattern: /\.find\s*\(|\.select\s*\(|SELECT\s+/gi,
        category: 'database',
        costPerUnit: 0.0001,
        scaleFactor: 1.3,
        description: 'Database read operation'
    },
    {
        pattern: /\.insert|\.create|\.save|INSERT\s+INTO/gi,
        category: 'database',
        costPerUnit: 0.0002,
        scaleFactor: 1.2,
        description: 'Database write operation'
    },
    {
        pattern: /\.aggregate|\.groupBy|GROUP\s+BY/gi,
        category: 'database',
        costPerUnit: 0.001,
        scaleFactor: 1.5,
        description: 'Database aggregation (CPU intensive)',
        optimization: {
            category: 'database',
            description: 'Consider caching aggregation results',
            potentialSavings: 0.0005,
            effort: 'moderate'
        }
    },
    {
        pattern: /\.findOne|\.first|LIMIT\s+1/gi,
        category: 'database',
        costPerUnit: 0.00005,
        scaleFactor: 1.0,
        description: 'Single record lookup'
    },

    // Third party patterns
    {
        pattern: /openai\.|ChatCompletion|gpt-/gi,
        category: 'thirdParty',
        costPerUnit: 0.03, // ~$0.03 per 1K tokens
        scaleFactor: 1.0,
        description: 'OpenAI API call',
        optimization: {
            category: 'thirdParty',
            description: 'Consider caching responses or using smaller models',
            potentialSavings: 0.015,
            effort: 'minor'
        }
    },
    {
        pattern: /anthropic|claude/gi,
        category: 'thirdParty',
        costPerUnit: 0.025,
        scaleFactor: 1.0,
        description: 'Anthropic API call'
    },
    {
        pattern: /stripe\.|paymentIntent/gi,
        category: 'thirdParty',
        costPerUnit: 0.0, // Stripe charges per transaction, not per call
        scaleFactor: 0,
        description: 'Stripe API (transaction-based pricing)'
    },
    {
        pattern: /sendgrid|mailgun|ses\.send/gi,
        category: 'thirdParty',
        costPerUnit: 0.0001,
        scaleFactor: 1.0,
        description: 'Email sending service'
    },
    {
        pattern: /twilio|sms\.send/gi,
        category: 'thirdParty',
        costPerUnit: 0.0075, // ~$0.0075 per SMS
        scaleFactor: 1.0,
        description: 'SMS sending service'
    }
];

// ============================================================================
// COST PREDICTION ENGINE
// ============================================================================

export class CostPredictionEngine extends EventEmitter {
    private static instance: CostPredictionEngine;

    private predictions: Map<string, CostPrediction> = new Map();

    // Base costs per user per month (infrastructure overhead)
    private readonly BASE_COSTS = {
        compute: 0.001,   // ~$1 per 1000 users
        storage: 0.0005,  // ~$0.50 per 1000 users
        network: 0.0002,  // ~$0.20 per 1000 users
        database: 0.001,  // ~$1 per 1000 users
        thirdParty: 0     // Depends on usage
    };

    private constructor() {
        super();
    }

    static getInstance(): CostPredictionEngine {
        if (!CostPredictionEngine.instance) {
            CostPredictionEngine.instance = new CostPredictionEngine();
        }
        return CostPredictionEngine.instance;
    }

    // ========================================================================
    // COST ANALYSIS
    // ========================================================================

    /**
     * Analyze code and predict costs
     */
    analyze(request: CostAnalysisRequest): CostPrediction {
        console.log(`💰 [CostPrediction] Analyzing code for cost factors...`);

        const factors = this.detectCostFactors(request.code);
        const current = this.calculateCurrentCosts(factors);
        const projections = this.calculateProjections(factors);
        const optimizations = this.generateOptimizations(factors);
        const warnings = this.generateWarnings(factors, projections);

        const prediction: CostPrediction = {
            id: this.generateId(),
            createdAt: new Date(),
            current,
            projections,
            optimizations,
            warnings
        };

        this.predictions.set(prediction.id, prediction);
        this.emit('prediction:created', prediction);

        console.log(`✅ [CostPrediction] Found ${factors.length} cost factors, ${optimizations.length} optimizations`);
        return prediction;
    }

    private detectCostFactors(code: string): Array<CostFactor & { category: CostComponent['details']; costPerUnit: number; scaleFactor: number }> {
        const factors: Array<CostFactor & { category: string; costPerUnit: number; scaleFactor: number }> = [];
        const lines = code.split('\n');

        for (const pattern of COST_PATTERNS) {
            let match;
            const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

            while ((match = regex.exec(code)) !== null) {
                const lineNumber = code.substring(0, match.index).split('\n').length;

                factors.push({
                    name: pattern.description,
                    impact: pattern.costPerUnit > 0.01 ? 'high' : pattern.costPerUnit > 0.001 ? 'medium' : 'low',
                    estimatedCost: pattern.costPerUnit,
                    lineReference: lineNumber,
                    category: pattern.category,
                    costPerUnit: pattern.costPerUnit,
                    scaleFactor: pattern.scaleFactor,
                    suggestion: pattern.optimization?.description
                });
            }
        }

        return factors;
    }

    private calculateCurrentCosts(factors: ReturnType<typeof this.detectCostFactors>): CostBreakdown {
        const breakdown: CostBreakdown = {
            compute: { monthlyCost: 0, details: 'Compute resources', factors: [] },
            storage: { monthlyCost: 0, details: 'Data storage', factors: [] },
            network: { monthlyCost: 0, details: 'Data transfer', factors: [] },
            database: { monthlyCost: 0, details: 'Database operations', factors: [] },
            thirdParty: { monthlyCost: 0, details: 'Third-party services', factors: [] },
            total: 0,
            currency: 'USD'
        };

        // Assume 10,000 operations per month baseline
        const operationsPerMonth = 10000;

        for (const factor of factors) {
            const category = factor.category as keyof Omit<CostBreakdown, 'total' | 'currency'>;
            const cost = factor.costPerUnit * (operationsPerMonth / 1000);

            breakdown[category].monthlyCost += cost;
            breakdown[category].factors.push({
                name: factor.name,
                impact: factor.impact,
                estimatedCost: cost,
                lineReference: factor.lineReference,
                suggestion: factor.suggestion
            });
        }

        breakdown.total = Object.values(breakdown)
            .filter((v): v is CostComponent => typeof v === 'object' && 'monthlyCost' in v)
            .reduce((sum, c) => sum + c.monthlyCost, 0);

        return breakdown;
    }

    private calculateProjections(factors: ReturnType<typeof this.detectCostFactors>): CostPrediction['projections'] {
        const scales = [
            { name: '1k_users', users: 1000, requestsPerMonth: 100000 },
            { name: '10k_users', users: 10000, requestsPerMonth: 1000000 },
            { name: '100k_users', users: 100000, requestsPerMonth: 10000000 },
            { name: '1m_users', users: 1000000, requestsPerMonth: 100000000 }
        ] as const;

        const projections = {} as CostPrediction['projections'];

        for (const scale of scales) {
            const costs = this.projectCostsAtScale(factors, scale.users, scale.requestsPerMonth);
            const bottlenecks = this.identifyBottlenecks(costs, scale.users);

            projections[scale.name] = {
                users: scale.users,
                requestsPerMonth: scale.requestsPerMonth,
                costs,
                bottlenecks
            };
        }

        return projections;
    }

    private projectCostsAtScale(
        factors: ReturnType<typeof this.detectCostFactors>,
        users: number,
        operations: number
    ): CostBreakdown {
        const breakdown: CostBreakdown = {
            compute: { monthlyCost: this.BASE_COSTS.compute * users, details: 'Compute resources', factors: [] },
            storage: { monthlyCost: this.BASE_COSTS.storage * users, details: 'Data storage', factors: [] },
            network: { monthlyCost: this.BASE_COSTS.network * users, details: 'Data transfer', factors: [] },
            database: { monthlyCost: this.BASE_COSTS.database * users, details: 'Database operations', factors: [] },
            thirdParty: { monthlyCost: 0, details: 'Third-party services', factors: [] },
            total: 0,
            currency: 'USD'
        };

        for (const factor of factors) {
            const category = factor.category as keyof Omit<CostBreakdown, 'total' | 'currency'>;
            // Apply scale factor (some operations scale super-linearly)
            const scaledOperations = operations * Math.pow(factor.scaleFactor, Math.log10(users / 1000));
            const cost = factor.costPerUnit * (scaledOperations / 1000);

            breakdown[category].monthlyCost += cost;
        }

        breakdown.total = Object.values(breakdown)
            .filter((v): v is CostComponent => typeof v === 'object' && 'monthlyCost' in v)
            .reduce((sum, c) => sum + c.monthlyCost, 0);

        return breakdown;
    }

    private identifyBottlenecks(costs: CostBreakdown, users: number): string[] {
        const bottlenecks: string[] = [];
        const perUserCost = costs.total / users;

        if (perUserCost > 0.10) {
            bottlenecks.push(`High per-user cost ($${perUserCost.toFixed(3)}/user)`);
        }

        if (costs.database.monthlyCost > costs.total * 0.5) {
            bottlenecks.push('Database costs dominate (>50% of total)');
        }

        if (costs.thirdParty.monthlyCost > costs.total * 0.3) {
            bottlenecks.push('Third-party API costs significant (>30% of total)');
        }

        if (users >= 100000 && costs.network.monthlyCost > 1000) {
            bottlenecks.push('Network transfer costs may require CDN optimization');
        }

        return bottlenecks;
    }

    // ========================================================================
    // OPTIMIZATIONS
    // ========================================================================

    private generateOptimizations(factors: ReturnType<typeof this.detectCostFactors>): CostOptimization[] {
        const optimizations: CostOptimization[] = [];
        const seenCategories = new Set<string>();

        for (const factor of factors) {
            if (factor.suggestion && !seenCategories.has(factor.name)) {
                seenCategories.add(factor.name);

                optimizations.push({
                    category: factor.category,
                    description: factor.suggestion,
                    potentialSavings: factor.estimatedCost * 0.5,
                    effort: factor.impact === 'high' ? 'moderate' : 'trivial'
                });
            }
        }

        // Add general optimizations
        optimizations.push({
            category: 'general',
            description: 'Implement response caching for frequently accessed data',
            potentialSavings: 0.1,
            effort: 'minor'
        });

        return optimizations;
    }

    // ========================================================================
    // WARNINGS
    // ========================================================================

    private generateWarnings(
        factors: ReturnType<typeof this.detectCostFactors>,
        projections: CostPrediction['projections']
    ): string[] {
        const warnings: string[] = [];

        // High-cost patterns
        const highCostFactors = factors.filter(f => f.impact === 'high');
        if (highCostFactors.length > 0) {
            warnings.push(`Found ${highCostFactors.length} high-cost patterns in code`);
        }

        // Scaling warnings
        if (projections['100k_users'].costs.total > 10000) {
            warnings.push('Monthly costs may exceed $10,000 at 100K users');
        }

        if (projections['1m_users'].costs.total > 100000) {
            warnings.push('Monthly costs may exceed $100,000 at 1M users - review architecture');
        }

        // Per-user cost warning
        const perUserAt100k = projections['100k_users'].costs.total / 100000;
        if (perUserAt100k > 0.05) {
            warnings.push(`Per-user cost ($${perUserAt100k.toFixed(3)}) may affect profitability at scale`);
        }

        return warnings;
    }

    // ========================================================================
    // COMPARISON
    // ========================================================================

    /**
     * Compare costs between two code versions
     */
    compare(before: string, after: string): {
        beforeTotal: number;
        afterTotal: number;
        difference: number;
        percentChange: number;
        improvements: string[];
        regressions: string[];
    } {
        const beforePrediction = this.analyze({ code: before });
        const afterPrediction = this.analyze({ code: after });

        const beforeTotal = beforePrediction.current.total;
        const afterTotal = afterPrediction.current.total;
        const difference = afterTotal - beforeTotal;
        const percentChange = beforeTotal > 0 ? (difference / beforeTotal) * 100 : 0;

        const improvements: string[] = [];
        const regressions: string[] = [];

        // Compare categories
        for (const key of ['compute', 'storage', 'network', 'database', 'thirdParty'] as const) {
            const beforeCat = beforePrediction.current[key].monthlyCost;
            const afterCat = afterPrediction.current[key].monthlyCost;

            if (afterCat < beforeCat * 0.9) {
                improvements.push(`${key} reduced by ${((1 - afterCat / beforeCat) * 100).toFixed(1)}%`);
            } else if (afterCat > beforeCat * 1.1) {
                regressions.push(`${key} increased by ${((afterCat / beforeCat - 1) * 100).toFixed(1)}%`);
            }
        }

        return {
            beforeTotal,
            afterTotal,
            difference,
            percentChange,
            improvements,
            regressions
        };
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    getPrediction(id: string): CostPrediction | undefined {
        return this.predictions.get(id);
    }

    getHistory(): CostPrediction[] {
        return Array.from(this.predictions.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 20);
    }

    private generateId(): string {
        return `cost-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    clear(): void {
        this.predictions.clear();
    }
}

// Export singleton
export const costPredictionEngine = CostPredictionEngine.getInstance();
