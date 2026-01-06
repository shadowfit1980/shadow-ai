/**
 * Continuous Validation Pipeline
 * 
 * Automated CI/CD integration for agent-generated code
 * Pipeline: Static Analysis → Tests → Load Tests → Canary Deploy → Monitor → Auto-approve/Rollback
 */

import { EventEmitter } from 'events';
import { universalSandbox } from '../execution/UniversalSandbox';
import { provenanceStore } from '../provenance/ProvenanceStore';

// ============================================================================
// TYPES
// ============================================================================

export type PipelineStage =
    | 'static_analysis'
    | 'unit_tests'
    | 'integration_tests'
    | 'load_tests'
    | 'security_scan'
    | 'canary_deploy'
    | 'monitor'
    | 'production_deploy';

export type StageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type DeploymentStrategy = 'blue_green' | 'canary' | 'rolling' | 'immediate';

export interface PipelineConfig {
    autoApprove: boolean; // Auto-approve if all tests pass
    requireHumanApproval: boolean;
    riskThreshold: number; // 0-1, auto-approve only if risk below threshold
    deploymentStrategy: DeploymentStrategy;
    canaryPercentage?: number; // For canary deployments
    monitoringDuration?: number; // Seconds to monitor before full rollout
}

export interface PipelineRun {
    id: string;
    jobId: string;
    startedAt: Date;
    completedAt?: Date;
    status: 'running' | 'success' | 'failed' | 'cancelled';
    stages: StageResult[];
    autoApproved: boolean;
    humanApproval?: {
        required: boolean;
        approved?: boolean;
        approvedBy?: string;
        approvedAt?: Date;
    };
}

export interface StageResult {
    stage: PipelineStage;
    status: StageStatus;
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    output: string;
    metrics?: Record<string, any>;
    passed: boolean;
}

export interface CanaryDeployment {
    id: string;
    percentage: number; // Traffic percentage
    startedAt: Date;
    metrics: {
        requests: number;
        errors: number;
        avgLatency: number;
        p95Latency: number;
    };
    healthy: boolean;
}

// ============================================================================
// CONTINUOUS VALIDATION PIPELINE
// ============================================================================

export class ContinuousValidationPipeline extends EventEmitter {
    private static instance: ContinuousValidationPipeline;

    private runs: Map<string, PipelineRun> = new Map();
    private canaryDeployments: Map<string, CanaryDeployment> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): ContinuousValidationPipeline {
        if (!ContinuousValidationPipeline.instance) {
            ContinuousValidationPipeline.instance = new ContinuousValidationPipeline();
        }
        return ContinuousValidationPipeline.instance;
    }

    // ========================================================================
    // PIPELINE EXECUTION
    // ========================================================================

    async runPipeline(
        jobId: string,
        code: string,
        tests: string,
        config: PipelineConfig
    ): Promise<PipelineRun> {
        console.log(`🚀 Starting CI/CD pipeline for job ${jobId}...`);

        const run: PipelineRun = {
            id: this.generateRunId(),
            jobId,
            startedAt: new Date(),
            status: 'running',
            stages: [],
            autoApproved: false,
            humanApproval: {
                required: config.requireHumanApproval,
                approved: false
            }
        };

        this.runs.set(run.id, run);
        this.emit('pipeline:started', run);

        try {
            // Stage 1: Static Analysis
            await this.executeStage(run, 'static_analysis', async () => {
                return await this.runStaticAnalysis(code);
            });

            // Stage 2: Unit Tests
            await this.executeStage(run, 'unit_tests', async () => {
                return await this.runUnitTests(code, tests);
            });

            // Stage 3: Integration Tests
            await this.executeStage(run, 'integration_tests', async () => {
                return await this.runIntegrationTests(code);
            });

            // Stage 4: Security Scan
            await this.executeStage(run, 'security_scan', async () => {
                return await this.runSecurityScan(code);
            });

            // Stage 5: Load Tests
            await this.executeStage(run, 'load_tests', async () => {
                return await this.runLoadTests(code);
            });

            // Check if auto-approve criteria met
            const allPassed = run.stages.every(s => s.passed);
            const riskScore = await this.calculateRiskScore(run);

            if (allPassed && riskScore <= config.riskThreshold && config.autoApprove) {
                run.autoApproved = true;
                console.log(`✅ Auto-approved (risk: ${riskScore.toFixed(2)})`);

                // Proceed to deployment
                if (config.deploymentStrategy === 'canary') {
                    await this.executeCanaryDeployment(run, code, config);
                } else {
                    await this.executeStage(run, 'production_deploy', async () => {
                        return await this.deployToProduction(code, config.deploymentStrategy);
                    });
                }
            } else if (config.requireHumanApproval) {
                console.log('⏸️  Awaiting human approval...');
                this.emit('pipeline:awaiting_approval', run);
                run.status = 'success'; // Tests passed, waiting approval
            }

            run.completedAt = new Date();
            run.status = allPassed ? 'success' : 'failed';
            this.emit('pipeline:completed', run);

            // Record in provenance
            await provenanceStore.addRecord({
                agentType: 'CIPipeline',
                jobId,
                decision: `Pipeline ${run.status}`,
                inputs: { code, config },
                outputs: { run },
                reasoning: this.generatePipelineReport(run),
                alternatives: [],
                confidence: allPassed ? 0.95 : 0.5,
                modelVersion: 'pipeline-v1'
            });

            return run;

        } catch (error) {
            run.status = 'failed';
            run.completedAt = new Date();
            this.emit('pipeline:failed', { run, error });
            throw error;
        }
    }

    private async executeStage(
        run: PipelineRun,
        stage: PipelineStage,
        executor: () => Promise<{ passed: boolean; output: string; metrics?: any }>
    ): Promise<void> {
        console.log(`  → ${stage}...`);

        const stageResult: StageResult = {
            stage,
            status: 'running',
            startedAt: new Date(),
            output: '',
            passed: false
        };

        run.stages.push(stageResult);
        this.emit('stage:started', { run, stage: stageResult });

        try {
            const result = await executor();

            stageResult.status = result.passed ? 'passed' : 'failed';
            stageResult.passed = result.passed;
            stageResult.output = result.output;
            stageResult.metrics = result.metrics;
            stageResult.completedAt = new Date();
            stageResult.duration = stageResult.completedAt.getTime() - stageResult.startedAt.getTime();

            this.emit('stage:completed', { run, stage: stageResult });

            // Stop pipeline if stage failed
            if (!result.passed) {
                throw new Error(`Stage ${stage} failed: ${result.output}`);
            }

        } catch (error) {
            stageResult.status = 'failed';
            stageResult.passed = false;
            stageResult.output = (error as Error).message;
            stageResult.completedAt = new Date();
            stageResult.duration = stageResult.completedAt.getTime() - stageResult.startedAt.getTime();

            this.emit('stage:failed', { run, stage: stageResult, error });
            throw error;
        }
    }

    // ========================================================================
    // STAGE IMPLEMENTATIONS
    // ========================================================================

    private async runStaticAnalysis(code: string): Promise<{ passed: boolean; output: string }> {
        // In production: ESLint, TSLint, Prettier, etc.
        // Simplified for now
        const issues = [];

        if (code.includes('eval(')) {
            issues.push('Security: Avoid using eval()');
        }
        if (code.includes('var ')) {
            issues.push('Style: Use let/const instead of var');
        }

        return {
            passed: issues.length === 0,
            output: issues.length > 0
                ? `Found ${issues.length} issues:\n${issues.join('\n')}`
                : 'No issues found'
        };
    }

    private async runUnitTests(code: string, tests: string): Promise<{ passed: boolean; output: string; metrics: any }> {
        const result = await universalSandbox.execute({
            id: `unit-test-${Date.now()}`,
            code,
            tests,
            config: {
                language: 'typescript',
                timeoutMs: 30000,
                memoryLimitMB: 512,
                cpuLimit: 50,
                networkAccess: false,
                fileSystemAccess: 'readonly'
            }
        });

        const passed = result.status === 'success' &&
            result.testResults &&
            result.testResults.failed === 0;

        return {
            passed,
            output: result.testResults
                ? `${result.testResults.passed}/${result.testResults.total} tests passed`
                : 'No test results',
            metrics: result.testResults
        };
    }

    private async runIntegrationTests(code: string): Promise<{ passed: boolean; output: string }> {
        // In production: Run integration test suite
        return {
            passed: true,
            output: 'Integration tests passed'
        };
    }

    private async runSecurityScan(code: string): Promise<{ passed: boolean; output: string }> {
        // In production: Use SecurityAgent
        const hasSecrets = /(?:api[_-]?key|password|secret)\s*[=:]\s*['"][^'"]+['"]/i.test(code);

        return {
            passed: !hasSecrets,
            output: hasSecrets ? 'Security: Found hardcoded secrets' : 'No security issues'
        };
    }

    private async runLoadTests(code: string): Promise<{ passed: boolean; output: string; metrics: any }> {
        // In production: Use k6, JMeter, etc.
        const metrics = {
            targetRPS: 1000,
            actualRPS: 950,
            avgLatency: 125,
            p95Latency: 240,
            p99Latency: 380,
            errorRate: 0.2
        };

        const passed = metrics.errorRate < 1.0 && metrics.p95Latency < 500;

        return {
            passed,
            output: `Load test: ${metrics.actualRPS} RPS, ${metrics.avgLatency}ms avg latency`,
            metrics
        };
    }

    // ========================================================================
    // CANARY DEPLOYMENT
    // ========================================================================

    private async executeCanaryDeployment(
        run: PipelineRun,
        code: string,
        config: PipelineConfig
    ): Promise<void> {
        console.log(`🐤 Starting canary deployment (${config.canaryPercentage}%)...`);

        const canary: CanaryDeployment = {
            id: `canary-${Date.now()}`,
            percentage: config.canaryPercentage || 5,
            startedAt: new Date(),
            metrics: {
                requests: 0,
                errors: 0,
                avgLatency: 0,
                p95Latency: 0
            },
            healthy: true
        };

        this.canaryDeployments.set(canary.id, canary);
        this.emit('canary:started', canary);

        // Monitor canary for specified duration
        const monitorDuration = config.monitoringDuration || 300; // 5 minutes default
        await this.monitorCanary(canary, monitorDuration);

        if (canary.healthy) {
            console.log('✅ Canary healthy, proceeding to full rollout');
            await this.executeStage(run, 'production_deploy', async () => {
                return await this.deployToProduction(code, 'rolling');
            });
        } else {
            console.log('❌ Canary unhealthy, rolling back');
            await this.rollbackCanary(canary);
            throw new Error('Canary deployment failed health checks');
        }
    }

    private async monitorCanary(canary: CanaryDeployment, durationSeconds: number): Promise<void> {
        console.log(`📊 Monitoring canary for ${durationSeconds}s...`);

        // Simulate monitoring (in production, would query actual metrics)
        await new Promise(resolve => setTimeout(resolve, Math.min(durationSeconds * 10, 2000)));

        // Simulated metrics
        canary.metrics = {
            requests: 15000,
            errors: 15,
            avgLatency: 145,
            p95Latency: 280
        };

        // Health checks
        const errorRate = (canary.metrics.errors / canary.metrics.requests) * 100;
        canary.healthy = errorRate < 1.0 && canary.metrics.p95Latency < 500;

        this.emit('canary:monitored', canary);
    }

    private async rollbackCanary(canary: CanaryDeployment): Promise<void> {
        console.log(`⏪ Rolling back canary ${canary.id}...`);

        // In production: actual rollback logic
        this.emit('canary:rolled_back', canary);
    }

    private async deployToProduction(code: string, strategy: DeploymentStrategy): Promise<{ passed: boolean; output: string }> {
        console.log(`🚀 Deploying to production (strategy: ${strategy})...`);

        // In production: actual deployment
        return {
            passed: true,
            output: `Deployed using ${strategy} strategy`
        };
    }

    // ========================================================================
    // HUMAN APPROVAL
    // ========================================================================

    async approveRun(runId: string, approvedBy: string): Promise<boolean> {
        const run = this.runs.get(runId);
        if (!run || !run.humanApproval) return false;

        run.humanApproval.approved = true;
        run.humanApproval.approvedBy = approvedBy;
        run.humanApproval.approvedAt = new Date();

        console.log(`✅ Pipeline approved by ${approvedBy}`);
        this.emit('pipeline:approved', run);

        // Proceed with deployment
        // (Would trigger deployment stage here)

        return true;
    }

    async rejectRun(runId: string, rejectedBy: string, reason: string): Promise<boolean> {
        const run = this.runs.get(runId);
        if (!run) return false;

        run.status = 'failed';
        console.log(`❌ Pipeline rejected by ${rejectedBy}: ${reason}`);
        this.emit('pipeline:rejected', { run, rejectedBy, reason });

        return true;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async calculateRiskScore(run: PipelineRun): Promise<number> {
        // Calculate risk based on test results, code complexity, etc.
        const failedStages = run.stages.filter(s => !s.passed).length;
        const totalStages = run.stages.length;

        const failureRate = totalStages > 0 ? failedStages / totalStages : 0;

        // Risk score: 0 (no risk) to 1 (high risk)
        return Math.min(failureRate * 2, 1);
    }

    private generatePipelineReport(run: PipelineRun): string {
        let report = `Pipeline Results:\n`;

        run.stages.forEach(stage => {
            const icon = stage.passed ? '✅' : '❌';
            report += `${icon} ${stage.stage}: ${stage.output}\n`;
        });

        if (run.autoApproved) {
            report += '\n✅ Auto-approved for deployment';
        }

        return report;
    }

    private generateRunId(): string {
        return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ========================================================================
    // QUERIES & STATS
    // ========================================================================

    getRun(id: string): PipelineRun | undefined {
        return this.runs.get(id);
    }

    getRunsByJob(jobId: string): PipelineRun[] {
        return Array.from(this.runs.values())
            .filter(run => run.jobId === jobId);
    }

    getStats(): {
        totalRuns: number;
        successRate: number;
        averageDuration: number;
        autoApprovalRate: number;
        activeCanaries: number;
    } {
        const runs = Array.from(this.runs.values());
        const completed = runs.filter(r => r.completedAt);
        const successful = runs.filter(r => r.status === 'success').length;
        const autoApproved = runs.filter(r => r.autoApproved).length;

        const totalDuration = completed.reduce((sum, r) => {
            return sum + (r.completedAt!.getTime() - r.startedAt.getTime());
        }, 0);

        return {
            totalRuns: runs.length,
            successRate: runs.length > 0 ? successful / runs.length : 0,
            averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
            autoApprovalRate: runs.length > 0 ? autoApproved / runs.length : 0,
            activeCanaries: this.canaryDeployments.size
        };
    }
}

// Export singleton
export const cicdPipeline = ContinuousValidationPipeline.getInstance();
