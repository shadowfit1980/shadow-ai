/**
 * PerformanceAgent - Performance Optimization & Load Testing Specialist
 * 
 * Analyzes code performance, suggests optimizations, and performs load testing
 * Identifies bottlenecks and provides actionable improvement recommendations
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export interface PerformanceIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: 'cpu' | 'memory' | 'io' | 'network' | 'algorithm';
    title: string;
    description: string;
    location: string;
    impact: string; // e.g., "2x slower", "50% more memory"
    optimization: string;
    estimatedGain: string;
    confidence: number;
}

export interface LoadTestResult {
    scenario: string;
    targetRPS: number; // Requests per second
    actualRPS: number;
    avgLatency: number; // ms
    p95Latency: number;
    p99Latency: number;
    errorRate: number; // percentage
    passedThresholds: boolean;
}

export class PerformanceAgent extends SpecialistAgent {
    readonly agentType = 'PerformanceAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'performance_analysis',
            description: 'Analyze code for performance bottlenecks',
            confidenceLevel: 0.86
        },
        {
            name: 'optimization_suggestion',
            description: 'Suggest algorithmic and architectural optimizations',
            confidenceLevel: 0.83
        },
        {
            name: 'load_testing',
            description: 'Design and execute load tests',
            confidenceLevel: 0.81
        },
        {
            name: 'resource_profiling',
            description: 'Profile CPU, memory, and I/O usage',
            confidenceLevel: 0.85
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`⚡ PerformanceAgent executing: ${task.task}`);

        const validation = await this.validateTask(task);
        if (!validation.valid) {
            return {
                success: false,
                summary: 'Validation failed',
                confidence: 0,
                explanation: validation.errors.join(', ')
            };
        }

        try {
            const issues = await this.analyzePerformance(task);
            const optimizations = await this.suggestOptimizations(issues);

            const critical = issues.filter(i => i.severity === 'critical').length;
            const high = issues.filter(i => i.severity === 'high').length;

            const result: AgentResult = {
                success: true,
                summary: `Found ${issues.length} performance issues (${critical} critical, ${high} high)`,
                artifacts: [{ issues, optimizations }],
                confidence: 0.84,
                explanation: this.generatePerformanceReport(issues, optimizations),
                estimatedEffort: critical * 8 + high * 4 // Hours to optimize
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Performance analysis failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    private async analyzePerformance(task: AgentTask): Promise<PerformanceIssue[]> {
        const prompt = `Analyze this code for performance issues:

Code: ${task.spec}

Detect:
1. Inefficient algorithms (O(n²) when O(n log n) possible)
2. Unnecessary loops or iterations
3. Memory leaks
4. N+1 query problems
5. Blocking I/O
6. Excessive object creation
7. Cache misses
8. Database query optimization opportunities

For each issue:
- Severity (critical/high/medium/low)
- Type (cpu/memory/io/network/algorithm)
- Description
- Location
- Performance impact
- Optimization suggestion
- Estimated performance gain

JSON response:
\`\`\`json
{
  "issues": [
    {
      "id": "perf-1",
      "severity": "high",
      "type": "algorithm",
      "title": "O(n²) nested loop",
      "description": "Nested loop iterating over same array",
      "location": "utils.ts:line 42",
      "impact": "10x slower for large datasets",
      "optimization": "Use hash map for O(n) lookup",
      "estimatedGain": "90% faster for n>1000",
      "confidence": 0.9
    }
  ]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a performance optimization expert specializing in high-performance systems and algorithms.'
        );

        const parsed = this.parseJSON(response);
        return (parsed.issues || []).map((issue: any, i: number) => ({
            id: issue.id || `perf-${i + 1}`,
            severity: issue.severity || 'medium',
            type: issue.type || 'cpu',
            title: issue.title || 'Performance issue',
            description: issue.description || '',
            location: issue.location || 'unknown',
            impact: issue.impact || 'Unknown impact',
            optimization: issue.optimization || 'Optimize code',
            estimatedGain: issue.estimatedGain || 'Improvement expected',
            confidence: issue.confidence || 0.7
        }));
    }

    private async suggestOptimizations(issues: PerformanceIssue[]): Promise<Array<{
        issue: string;
        beforeCode: string;
        afterCode: string;
        explanation: string;
        benchmarks?: { before: string; after: string };
    }>> {
        const optimizations = [];

        for (const issue of issues.slice(0, 3)) { // Top 3 issues
            const opt = await this.generateOptimization(issue);
            optimizations.push(opt);
        }

        return optimizations;
    }

    private async generateOptimization(issue: PerformanceIssue): Promise<any> {
        const prompt = `Generate optimized code for this performance issue:

Issue: ${issue.title}
Description: ${issue.description}
Current Impact: ${issue.impact}
Optimization Suggestion: ${issue.optimization}

Provide:
1. Before code (current inefficient version)
2. After code (optimized version)
3. Detailed explanation
4. Expected performance improvement

JSON response.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            issue: issue.title,
            beforeCode: parsed.beforeCode || '',
            afterCode: parsed.afterCode || '',
            explanation: parsed.explanation || issue.optimization,
            benchmarks: parsed.benchmarks
        };
    }

    async designLoadTest(systemSpec: string, expectedLoad: {
        peakRPS: number;
        concurrentUsers: number;
    }): Promise<{
        scenarios: Array<{
            name: string;
            steps: string[];
            targetRPS: number;
            duration: string;
        }>;
        thresholds: {
            maxLatencyP95: number;
            maxLatencyP99: number;
            maxErrorRate: number;
        };
    }> {
        console.log('📊 Designing load test scenarios...');

        const prompt = `Design load test for system:

System: ${systemSpec}
Expected Peak: ${expectedLoad.peakRPS} RPS
Concurrent Users: ${expectedLoad.concurrentUsers}

Create:
1. Test scenarios (normal, peak, stress)
2. Steps for each scenario
3. Performance thresholds

JSON response.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            scenarios: parsed.scenarios || [],
            thresholds: parsed.thresholds || {
                maxLatencyP95: 500,
                maxLatencyP99: 1000,
                maxErrorRate: 1
            }
        };
    }

    async profileResourceUsage(code: string): Promise<{
        cpu: { avg: number; peak: number };
        memory: { avg: number; peak: number; leaks: boolean };
        io: { reads: number; writes: number };
        recommendations: string[];
    }> {
        console.log('📈 Profiling resource usage...');

        // Simplified - would integrate with actual profiling tools
        return {
            cpu: { avg: 45, peak: 78 },
            memory: { avg: 512, peak: 1024, leaks: false },
            io: { reads: 100, writes: 50 },
            recommendations: [
                'Consider caching frequently accessed data',
                'Batch database writes to reduce I/O'
            ]
        };
    }

    async optimizeQuery(query: string, schema: string): Promise<{
        originalQuery: string;
        optimizedQuery: string;
        improvements: string[];
        estimatedSpeedup: string;
    }> {
        const prompt = `Optimize this database query:

Query:
\`\`\`sql
${query}
\`\`\`

Schema: ${schema}

Suggest:
1. Index recommendations
2. Query rewrite
3. Join optimization
4. Estimated speedup

JSON response.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            originalQuery: query,
            optimizedQuery: parsed.optimizedQuery || query,
            improvements: parsed.improvements || [],
            estimatedSpeedup: parsed.estimatedSpeedup || 'Unknown'
        };
    }

    private generatePerformanceReport(
        issues: PerformanceIssue[],
        optimizations: any[]
    ): string {
        if (issues.length === 0) {
            return 'Performance analysis complete! No major performance issues detected.';
        }

        const critical = issues.filter(i => i.severity === 'critical').length;
        const high = issues.filter(i => i.severity === 'high').length;

        let report = `Performance Analysis:\n\n`;
        report += `Found ${issues.length} performance issues:\n`;
        report += `- Critical: ${critical}\n`;
        report += `- High: ${high}\n\n`;

        if (critical > 0 || high > 0) {
            report += `⚠️ ${critical + high} critical/high issues may significantly impact user experience!\n\n`;
        }

        // Top issues
        const topIssues = issues
            .sort((a, b) => {
                const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            })
            .slice(0, 3);

        report += `Top Performance Issues:\n`;
        topIssues.forEach((issue, i) => {
            report += `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}\n`;
            report += `   Location: ${issue.location}\n`;
            report += `   Impact: ${issue.impact}\n`;
            report += `   Fix: ${issue.optimization}\n`;
            report += `   Estimated Gain: ${issue.estimatedGain}\n\n`;
        });

        if (optimizations.length > 0) {
            report += `${optimizations.length} optimization(s) available with code examples.\n`;
        }

        return report;
    }
}
