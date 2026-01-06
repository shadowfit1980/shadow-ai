import { KnowledgeBase } from './KnowledgeBase';
import fs from 'fs';
import path from 'path';

/**
 * Self-Improvement Engine
 * Analyzes performance and evolves the system
 */
export class SelfImprovement {
    private static instance: SelfImprovement;
    private kb: KnowledgeBase;
    private evolutionLogPath: string;

    private constructor() {
        this.kb = KnowledgeBase.getInstance();
        this.evolutionLogPath = path.join(process.cwd(), 'user-data', 'evolution-log.json');
        this.ensureLogFile();
    }

    static getInstance(): SelfImprovement {
        if (!SelfImprovement.instance) {
            SelfImprovement.instance = new SelfImprovement();
        }
        return SelfImprovement.instance;
    }

    private ensureLogFile(): void {
        const dir = path.dirname(this.evolutionLogPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.evolutionLogPath)) {
            fs.writeFileSync(this.evolutionLogPath, JSON.stringify({ evolutions: [] }, null, 2));
        }
    }

    /**
     * Analyze performance and suggest improvements
     */
    async analyzePerformance(): Promise<any> {
        const recentProjects = this.kb.getProjectHistory(20);
        const learnings = this.kb.queryLearnings();

        const analysis = {
            totalProjects: recentProjects.length,
            projectTypes: this.aggregateProjectTypes(recentProjects),
            commonPatterns: this.identifyPatterns(learnings),
            suggestions: this.generateSuggestions(recentProjects, learnings),
        };

        return analysis;
    }

    /**
     * Aggregate project types
     */
    private aggregateProjectTypes(projects: any[]): Record<string, number> {
        const types: Record<string, number> = {};
        projects.forEach((p) => {
            types[p.type] = (types[p.type] || 0) + 1;
        });
        return types;
    }

    /**
     * Identify patterns in learnings
     */
    private identifyPatterns(learnings: any[]): string[] {
        const patterns: string[] = [];

        // Group by category
        const byCategory: Record<string, any[]> = {};
        learnings.forEach((l) => {
            if (!byCategory[l.category]) {
                byCategory[l.category] = [];
            }
            byCategory[l.category].push(l);
        });

        // Identify high-confidence patterns
        Object.entries(byCategory).forEach(([category, items]) => {
            const highConfidence = items.filter((i) => i.confidence > 0.7);
            if (highConfidence.length > 0) {
                patterns.push(`Strong pattern in ${category}: ${highConfidence.length} high-confidence learnings`);
            }
        });

        return patterns;
    }

    /**
     * Generate improvement suggestions
     */
    private generateSuggestions(projects: any[], learnings: any[]): string[] {
        const suggestions: string[] = [];

        // Suggest based on project frequency
        const types = this.aggregateProjectTypes(projects);
        const mostCommon = Object.entries(types).sort((a, b) => b[1] - a[1])[0];

        if (mostCommon) {
            suggestions.push(
                `Consider creating templates for ${mostCommon[0]} projects (${mostCommon[1]} recent builds)`
            );
        }

        // Suggest based on learnings
        if (learnings.length < 10) {
            suggestions.push('Increase learning data by storing more project outcomes and feedback');
        }

        return suggestions;
    }

    /**
     * Log an evolution
     */
    logEvolution(description: string, changes: any): void {
        const log = JSON.parse(fs.readFileSync(this.evolutionLogPath, 'utf8'));

        log.evolutions.push({
            timestamp: new Date().toISOString(),
            description,
            changes,
        });

        fs.writeFileSync(this.evolutionLogPath, JSON.stringify(log, null, 2));

        // Store in knowledge base
        this.kb.storeLearning('evolution', description, JSON.stringify(changes), 0.8);
    }

    /**
     * Get evolution history
     */
    getEvolutionHistory(limit: number = 10): any[] {
        const log = JSON.parse(fs.readFileSync(this.evolutionLogPath, 'utf8'));
        return log.evolutions.slice(-limit);
    }

    /**
     * Apply improvement
     */
    async applyImprovement(improvement: any): Promise<void> {
        // Log the improvement
        this.logEvolution(improvement.description, improvement.changes);

        // Store as high-confidence learning
        this.kb.storeLearning(
            'improvement',
            improvement.description,
            JSON.stringify(improvement.changes),
            0.9
        );
    }
}
