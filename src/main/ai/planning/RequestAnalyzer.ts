import { TaskAnalysis } from './types';

export class RequestAnalyzer {
    /**
     * Analyze user request to determine intent, complexity, and scope
     */
    async analyze(userInput: string): Promise<TaskAnalysis> {
        // Classify complexity based on keywords and structure
        const complexity = this.classifyComplexity(userInput);

        // Determine category
        const category = this.categorizeRequest(userInput);

        // Identify potential file impacts
        const affectedFiles = await this.identifyAffectedFiles(userInput);

        // Determine required tools/capabilities
        const requiredTools = this.identifyRequiredTools(userInput);

        // Estimate number of steps
        const estimatedSteps = this.estimateSteps(complexity);

        // Identify risks
        const risks = this.identifyRisks(userInput, complexity);

        return {
            intent: userInput,
            complexity,
            affectedFiles,
            requiredTools,
            estimatedSteps,
            risks,
            category,
        };
    }

    private classifyComplexity(input: string): 'simple' | 'medium' | 'complex' {
        const lowerInput = input.toLowerCase();

        // Complex indicators
        const complexIndicators = [
            'refactor',
            'migrate',
            'restructure',
            'implement.*system',
            'multiple.*files',
            'architecture',
            'integration',
        ];

        if (complexIndicators.some(pattern => new RegExp(pattern).test(lowerInput))) {
            return 'complex';
        }

        // Medium indicators
        const mediumIndicators = [
            'add.*feature',
            'create.*component',
            'update.*logic',
            'implement',
            'build',
        ];

        if (mediumIndicators.some(pattern => new RegExp(pattern).test(lowerInput))) {
            return 'medium';
        }

        // Simple by default
        return 'simple';
    }

    private categorizeRequest(input: string): TaskAnalysis['category'] {
        const lowerInput = input.toLowerCase();

        if (/fix|bug|error|issue|problem/.test(lowerInput)) {
            return 'bugfix';
        }
        if (/refactor|restructure|reorganize|cleanup/.test(lowerInput)) {
            return 'refactor';
        }
        if (/optimize|improve.*performance|speed up|faster/.test(lowerInput)) {
            return 'optimization';
        }
        if (/document|comment|readme|guide|tutorial/.test(lowerInput)) {
            return 'documentation';
        }

        return 'feature';
    }

    private async identifyAffectedFiles(input: string): Promise<string[]> {
        const files: string[] = [];

        // Extract file mentions
        const filePattern = /(?:src|components|pages|lib)\/[\w\/.]+\.(?:tsx?|jsx?|css|html)/g;
        const matches = input.match(filePattern);

        if (matches) {
            files.push(...matches);
        }

        // Infer files from component/feature names
        const componentMatch = input.match(/(?:create|add|update)\s+(?:a\s+)?(\w+)\s+component/i);
        if (componentMatch) {
            files.push(`src/components/${componentMatch[1]}.tsx`);
        }

        return [...new Set(files)]; // Deduplicate
    }

    private identifyRequiredTools(input: string): string[] {
        const tools: string[] = [];
        const lowerInput = input.toLowerCase();

        if (/figma|design|import.*design/.test(lowerInput)) {
            tools.push('figma');
        }
        if (/database|supabase|query|insert|update/.test(lowerInput)) {
            tools.push('supabase');
        }
        if (/canva|presentation|social.*post/.test(lowerInput)) {
            tools.push('canva');
        }
        if (/code.*generation|generate.*code/.test(lowerInput)) {
            tools.push('ai-codegen');
        }

        return tools;
    }

    private estimateSteps(complexity: TaskAnalysis['complexity']): number {
        switch (complexity) {
            case 'simple':
                return 3;
            case 'medium':
                return 7;
            case 'complex':
                return 12;
        }
    }

    private identifyRisks(input: string, complexity: TaskAnalysis['complexity']): string[] {
        const risks: string[] = [];
        const lowerInput = input.toLowerCase();

        // Breaking change risks
        if (/refactor|migrate|restructure|change.*api/.test(lowerInput)) {
            risks.push('Potential breaking changes');
        }

        // Database risks
        if (/database|migration|schema.*change/.test(lowerInput)) {
            risks.push('Database migration required');
        }

        // Dependency risks
        if (/install|add.*package|dependency/.test(lowerInput)) {
            risks.push('New dependencies required');
        }

        // Complexity risk
        if (complexity === 'complex') {
            risks.push('High complexity - thorough testing needed');
        }

        return risks;
    }
}
