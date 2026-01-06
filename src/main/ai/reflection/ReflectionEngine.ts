import { Critique, SelfEvaluation, Risk, Suggestion, ReflectionResult, Lesson } from './types';

export class ReflectionEngine {
    /**
     * Critique a plan before execution
     */
    async critiquePlan(plan: any): Promise<Critique> {
        console.log('🔍 Reflecting on plan...');

        const strengths = this.identifyStrengths(plan);
        const weaknesses = this.identifyWeaknesses(plan);
        const risks = this.assessRisks(plan);
        const suggestions = this.generateSuggestions(plan);
        const confidence = this.calculateConfidence(strengths, weaknesses, risks);
        const overallScore = this.scorePlan(plan, strengths, weaknesses, risks);

        return {
            planId: plan.id,
            overallScore,
            strengths,
            weaknesses,
            risks,
            suggestions,
            confidence
        };
    }

    /**
     * Evaluate results after execution
     */
    async evaluateResult(task: any, result: any): Promise<SelfEvaluation> {
        console.log('🎯 Evaluating execution...');

        const qualityScore = this.assessQuality(result);
        const completeness = this.assessCompleteness(task, result);
        const correctness = this.assessCorrectness(result);
        const efficiency = this.assessEfficiency(result);
        const lessons = this.extractLessons(task, result);
        const improvements = this.suggestImprovements(result);

        return {
            taskId: task.id,
            success: result.success,
            qualityScore,
            completeness,
            correctness,
            efficiency,
            lessons,
            improvements
        };
    }

    /**
     * Decide if plan should proceed
     */
    shouldProceed(critique: Critique): ReflectionResult {
        const criticalRisks = critique.risks.filter(r => r.severity === 'critical');
        const highRisks = critique.risks.filter(r => r.severity === 'high');

        const shouldProceed = criticalRisks.length === 0 && critique.overallScore >= 60;

        const mustAddress = criticalRisks.map(r => r.description);
        const recommended = highRisks.map(r => r.description);
        const alternativeApproaches = critique.suggestions
            .filter(s => s.type === 'alternative')
            .map(s => s.description);

        return {
            shouldProceed,
            mustAddress,
            recommended,
            alternativeApproaches
        };
    }

    private identifyStrengths(plan: any): string[] {
        const strengths: string[] = [];

        if (plan.phases && plan.phases.length > 0) {
            strengths.push('Well-structured with clear phases');
        }

        if (plan.files && plan.files.length > 0) {
            strengths.push('Specific file changes identified');
        }

        const hasVerification = plan.phases?.some((p: any) =>
            p.name.toLowerCase().includes('verif') || p.name.toLowerCase().includes('test')
        );
        if (hasVerification) {
            strengths.push('Includes verification steps');
        }

        return strengths;
    }

    private identifyWeaknesses(plan: any): string[] {
        const weaknesses: string[] = [];

        if (!plan.phases || plan.phases.length === 0) {
            weaknesses.push('No execution phases defined');
        }

        if (plan.estimatedTime && plan.estimatedTime > 3600000) {
            weaknesses.push('Very long execution time - consider breaking down');
        }

        const hasBackup = plan.phases?.some((p: any) =>
            p.steps?.some((s: any) => s.description.toLowerCase().includes('backup'))
        );
        if (!hasBackup) {
            weaknesses.push('No backup/rollback strategy');
        }

        return weaknesses;
    }

    private assessRisks(plan: any): Risk[] {
        const risks: Risk[] = [];

        // Check for breaking changes
        if (plan.risks && plan.risks.some((r: any) => r.description.includes('breaking'))) {
            risks.push({
                severity: 'high',
                category: 'technical',
                description: 'Potential breaking changes detected',
                likelihood: 0.7,
                impact: 'May break existing functionality',
                mitigation: 'Add comprehensive tests before deployment'
            });
        }

        // Check for security
        const hasAuth = plan.files?.some((f: any) =>
            f.path.includes('auth') || f.path.includes('security')
        );
        if (hasAuth) {
            risks.push({
                severity: 'high',
                category: 'security',
                description: 'Authentication/security changes',
                likelihood: 0.5,
                impact: 'Security vulnerabilities if not done correctly',
                mitigation: 'Security review and penetration testing'
            });
        }

        // Check for database changes
        const hasDB = plan.files?.some((f: any) =>
            f.path.includes('schema') || f.path.includes('migration')
        );
        if (hasDB) {
            risks.push({
                severity: 'medium',
                category: 'technical',
                description: 'Database schema changes',
                likelihood: 0.6,
                impact: 'Data loss or corruption possible',
                mitigation: 'Backup database before migration'
            });
        }

        return risks;
    }

    private generateSuggestions(plan: any): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Suggest tests if missing
        const hasTests = plan.phases?.some((p: any) =>
            p.name.toLowerCase().includes('test')
        );
        if (!hasTests) {
            suggestions.push({
                type: 'improvement',
                description: 'Add testing phase',
                priority: 'high',
                estimatedBenefit: 'Catch bugs early, ensure quality'
            });
        }

        // Suggest incremental approach for complex tasks
        if (plan.estimatedTime > 1800000) {
            suggestions.push({
                type: 'alternative',
                description: 'Break into smaller incremental changes',
                priority: 'medium',
                estimatedBenefit: 'Easier to test, lower risk'
            });
        }

        return suggestions;
    }

    private calculateConfidence(
        strengths: string[],
        weaknesses: string[],
        risks: Risk[]
    ): number {
        let confidence = 0.7; // Base confidence

        // Increase for strengths
        confidence += strengths.length * 0.05;

        // Decrease for weaknesses
        confidence -= weaknesses.length * 0.05;

        // Decrease for risks
        const criticalRisks = risks.filter(r => r.severity === 'critical').length;
        const highRisks = risks.filter(r => r.severity === 'high').length;

        confidence -= criticalRisks * 0.2;
        confidence -= highRisks * 0.1;

        return Math.max(0, Math.min(1, confidence));
    }

    private scorePlan(
        plan: any,
        strengths: string[],
        weaknesses: string[],
        risks: Risk[]
    ): number {
        let score = 70; // Base score

        score += strengths.length * 5;
        score -= weaknesses.length * 5;
        score -= risks.filter(r => r.severity === 'critical').length * 20;
        score -= risks.filter(r => r.severity === 'high').length * 10;

        return Math.max(0, Math.min(100, score));
    }

    private assessQuality(result: any): number {
        if (!result.success) return 0;

        const successRate = result.completedSteps / (result.completedSteps + result.failedSteps);
        return Math.round(successRate * 100);
    }

    private assessCompleteness(task: any, result: any): number {
        return result.completedSteps / (result.completedSteps + result.failedSteps);
    }

    private assessCorrectness(result: any): number {
        return result.errors.length === 0 ? 1 : 0.5;
    }

    private assessEfficiency(result: any): number {
        // Simple efficiency based on duration
        const expected = 5000; // Expected 5s per step
        const actual = result.duration / result.completedSteps;
        return Math.min(1, expected / actual);
    }

    private extractLessons(task: any, result: any): Lesson[] {
        const lessons: Lesson[] = [];

        if (result.errors.length > 0) {
            lessons.push({
                what: 'Encountered errors during execution',
                why: result.errors[0].message || 'Unknown error',
                howToApply: 'Add error handling and validation'
            });
        }

        return lessons;
    }

    private suggestImprovements(result: any): string[] {
        const improvements: string[] = [];

        if (result.duration > 30000) {
            improvements.push('Optimize execution time - current duration too long');
        }

        if (result.failedSteps > 0) {
            improvements.push('Investigate and fix failed steps');
        }

        return improvements;
    }
}

// Singleton
let instance: ReflectionEngine | null = null;

export function getReflectionEngine(): ReflectionEngine {
    if (!instance) {
        instance = new ReflectionEngine();
    }
    return instance;
}
