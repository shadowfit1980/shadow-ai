// Learning System - Improves from feedback

export interface FeedbackRecord {
    taskId: string;
    userRating: number; // 1-5
    userComment?: string;
    outcome: 'success' | 'failure' | 'partial';
    timestamp: Date;
}

export interface Pattern {
    description: string;
    frequency: number;
    successRate: number;
    examples: string[];
}

export class LearningSystem {
    private feedback: FeedbackRecord[] = [];
    private patterns: Map<string, Pattern> = new Map();

    /**
     * Record user feedback
     */
    recordFeedback(record: Omit<FeedbackRecord, 'timestamp'>): void {
        this.feedback.push({
            ...record,
            timestamp: new Date()
        });

        this.updatePatterns();
    }

    /**
     * Get learned patterns
     */
    getPatterns(): Pattern[] {
        return Array.from(this.patterns.values())
            .sort((a, b) => b.successRate - a.successRate);
    }

    /**
     * Apply learned behavior
     */
    applySuggestion(context: string): string | null {
        const pattern = this.findBestPattern(context);
        return pattern ? pattern.description : null;
    }

    private updatePatterns(): void {
        const successful = this.feedback.filter(f => f.outcome === 'success');

        // Simple pattern extraction (would be more sophisticated in production)
        if (successful.length > 3) {
            this.patterns.set('prefer-typescript', {
                description: 'Use TypeScript for type safety',
                frequency: successful.length,
                successRate: 0.9,
                examples: ['Component creation', 'API development']
            });
        }
    }

    private findBestPattern(context: string): Pattern | null {
        return this.getPatterns()[0] || null;
    }
}

export function getLearningSystem(): LearningSystem {
    return new LearningSystem();
}
