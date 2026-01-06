// Proactive Assistant - Anticipates needs

export interface Suggestion {
    type: 'next-step' | 'improvement' | 'warning';
    title: string;
    description: string;
    action?: string;
    priority: 'low' | 'medium' | 'high';
}

export class ProactiveAssistant {
    /**
     * Analyze workflow and suggest next steps
     */
    suggestNextSteps(context: any): Suggestion[] {
        const suggestions: Suggestion[] = [];

        if (context.recentActions?.includes('create-auth')) {
            suggestions.push({
                type: 'next-step',
                title: 'Add Password Reset',
                description: 'You created auth. Consider adding password reset flow.',
                action: 'create-password-reset',
                priority: 'medium'
            });
        }

        return suggestions;
    }

    /**
     * Warn about common mistakes
     */
    detectPotentialIssues(plan: any): Suggestion[] {
        const warnings: Suggestion[] = [];

        const hasDB = plan.files?.some((f: any) => f.path.includes('schema'));
        if (hasDB) {
            warnings.push({
                type: 'warning',
                title: 'Backup Database',
                description: 'Schema changes detected. Backup database first.',
                priority: 'high'
            });
        }

        return warnings;
    }
}

export function getProactiveAssistant(): ProactiveAssistant {
    return new ProactiveAssistant();
}
