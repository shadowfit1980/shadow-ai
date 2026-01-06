import { TaskAnalysis, ImplementationPlan, Phase, Step, FileChange, Risk } from './types';

export class PlanGenerator {
    /**
     * Generate a structured implementation plan from task analysis
     */
    async generatePlan(analysis: TaskAnalysis, aiResponse?: string): Promise<ImplementationPlan> {
        const id = this.generateId();
        const title = this.generateTitle(analysis);
        const summary = this.generateSummary(analysis);

        // Generate phases and steps
        const phases = await this.generatePhases(analysis, aiResponse);

        // Identify file changes
        const files = this.identifyFileChanges(phases);

        // Compile risks
        const risks = this.compileRisks(analysis, phases);

        // Estimate time
        const estimatedTime = this.estimateTime(analysis.complexity, phases.length);

        return {
            id,
            title,
            summary,
            phases,
            files,
            risks,
            estimatedTime,
            createdAt: new Date(),
        };
    }

    private generateId(): string {
        return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateTitle(analysis: TaskAnalysis): string {
        const categoryPrefix = {
            feature: 'Feature:',
            bugfix: 'Fix:',
            refactor: 'Refactor:',
            optimization: 'Optimize:',
            documentation: 'Document:',
        };

        const prefix = categoryPrefix[analysis.category];
        const intent = analysis.intent.length > 50
            ? analysis.intent.substring(0, 47) + '...'
            : analysis.intent;

        return `${prefix} ${intent}`;
    }

    private generateSummary(analysis: TaskAnalysis): string {
        return `Implement ${analysis.category} with ${analysis.complexity} complexity. ` +
            `Estimated ${analysis.estimatedSteps} steps affecting ${analysis.affectedFiles.length} file(s).`;
    }

    private async generatePhases(analysis: TaskAnalysis, aiResponse?: string): Promise<Phase[]> {
        const phases: Phase[] = [];

        // Phase 1: Preparation (if needed)
        if (analysis.requiredTools.length > 0 || analysis.complexity !== 'simple') {
            phases.push({
                id: 'phase_prep',
                name: 'Preparation',
                description: 'Set up environment and dependencies',
                steps: this.generatePreparationSteps(analysis),
                dependencies: [],
                status: 'pending',
            });
        }

        // Phase 2: Implementation
        phases.push({
            id: 'phase_impl',
            name: 'Implementation',
            description: 'Execute main changes',
            steps: this.generateImplementationSteps(analysis),
            dependencies: phases.length > 0 ? ['phase_prep'] : [],
            status: 'pending',
        });

        // Phase 3: Verification (always)
        phases.push({
            id: 'phase_verify',
            name: 'Verification',
            description: 'Test and validate changes',
            steps: this.generateVerificationSteps(analysis),
            dependencies: ['phase_impl'],
            status: 'pending',
        });

        return phases;
    }

    private generatePreparationSteps(analysis: TaskAnalysis): Step[] {
        const steps: Step[] = [];

        if (analysis.requiredTools.includes('ai-codegen')) {
            steps.push({
                id: 'prep_1',
                description: 'Initialize AI code generation context',
                action: 'execute',
                completed: false,
            });
        }

        if (analysis.affectedFiles.length > 0) {
            steps.push({
                id: 'prep_2',
                description: 'Back up affected files',
                action: 'execute',
                completed: false,
            });
        }

        return steps;
    }

    private generateImplementationSteps(analysis: TaskAnalysis): Step[] {
        const steps: Step[] = [];

        analysis.affectedFiles.forEach((file, index) => {
            const action = file.includes('new') || !file.match(/\.\w+$/) ? 'create' : 'modify';
            steps.push({
                id: `impl_${index + 1}`,
                description: `${action === 'create' ? 'Create' : 'Update'} ${file}`,
                file,
                action,
                completed: false,
            });
        });

        // If no specific files, add generic step
        if (steps.length === 0) {
            steps.push({
                id: 'impl_1',
                description: 'Implement requested changes',
                action: 'execute',
                completed: false,
            });
        }

        return steps;
    }

    private generateVerificationSteps(analysis: TaskAnalysis): Step[] {
        return [
            {
                id: 'verify_1',
                description: 'Run build process',
                action: 'execute',
                completed: false,
            },
            {
                id: 'verify_2',
                description: 'Test functionality',
                action: 'execute',
                completed: false,
            },
            {
                id: 'verify_3',
                description: 'Verify no errors',
                action: 'execute',
                completed: false,
            },
        ];
    }

    private identifyFileChanges(phases: Phase[]): FileChange[] {
        const changes: FileChange[] = [];

        phases.forEach(phase => {
            phase.steps.forEach(step => {
                if (step.file && (step.action === 'create' || step.action === 'modify' || step.action === 'delete')) {
                    changes.push({
                        path: step.file,
                        action: step.action,
                        description: step.description,
                    });
                }
            });
        });

        return changes;
    }

    private compileRisks(analysis: TaskAnalysis, phases: Phase[]): Risk[] {
        const risks: Risk[] = [];

        analysis.risks.forEach(riskDesc => {
            risks.push({
                level: this.assessRiskLevel(riskDesc),
                description: riskDesc,
            });
        });

        // Add complexity-based risks
        if (analysis.complexity === 'complex') {
            risks.push({
                level: 'high',
                description: 'Complex implementation may require multiple iterations',
                mitigation: 'Break down into smaller phases and test incrementally',
            });
        }

        return risks;
    }

    private assessRiskLevel(description: string): 'low' | 'medium' | 'high' {
        const lowerDesc = description.toLowerCase();

        if (/breaking|migration|database.*change/.test(lowerDesc)) {
            return 'high';
        }
        if (/dependency|testing|complex/.test(lowerDesc)) {
            return 'medium';
        }

        return 'low';
    }

    private estimateTime(complexity: TaskAnalysis['complexity'], phaseCount: number): number {
        const baseTime = {
            simple: 15,
            medium: 45,
            complex: 120,
        };

        return baseTime[complexity] + (phaseCount * 10);
    }
}
