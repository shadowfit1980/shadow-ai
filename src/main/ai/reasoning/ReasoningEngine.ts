import { Thought, ThoughtChain } from './types';

export class ReasoningEngine {
    /**
     * Apply chain-of-thought reasoning to a problem
     */
    async reason(problem: string, context: Record<string, any> = {}): Promise<ThoughtChain> {
        console.log(`🧠 Reasoning about: ${problem}`);

        // Generate initial thoughts
        const thoughts = await this.generateThoughts(problem, context);

        // Evaluate each thought
        const evaluatedThoughts = this.evaluateThoughts(thoughts);

        // Select best reasoning path
        const selectedPath = this.selectBestPath(evaluatedThoughts);

        // Generate conclusion
        const conclusion = this.generateConclusion(selectedPath);
        const confidence = this.calculateConfidence(selectedPath);

        return {
            problem,
            thoughts: evaluatedThoughts,
            selectedPath,
            conclusion,
            confidence,
        };
    }

    /**
     * Generate multiple reasoning paths
     */
    private async generateThoughts(
        problem: string,
        context: Record<string, any>
    ): Promise<Thought[]> {
        const thoughts: Thought[] = [];

        // Analyze problem type
        const problemType = this.analyzeProblemType(problem);

        switch (problemType) {
            case 'breakdown':
                thoughts.push(this.createThought(
                    'Break into smaller steps',
                    'Complex tasks benefit from decomposition',
                    0.9
                ));
                break;

            case 'optimization':
                thoughts.push(this.createThought(
                    'Identify bottlenecks',
                    'Performance issues usually have specific causes',
                    0.85
                ));
                thoughts.push(this.createThought(
                    'Parallelize operations',
                    'Independent operations can run concurrently',
                    0.8
                ));
                break;

            case 'integration':
                thoughts.push(this.createThought(
                    'Map data flow',
                    'Understanding data movement prevents integration issues',
                    0.88
                ));
                thoughts.push(this.createThought(
                    'Test incrementally',
                    'Incremental testing catches issues early',
                    0.92
                ));
                break;

            default:
                thoughts.push(this.createThought(
                    'Analyze requirements',
                    'Clear requirements guide implementation',
                    0.75
                ));
        }

        // Add context-specific thoughts
        if (context.hasTimeConstraint) {
            thoughts.push(this.createThought(
                'Prioritize critical path',
                'Time constraints require focus on essentials',
                0.87
            ));
        }

        return thoughts;
    }

    /**
     * Create a thought with metadata
     */
    private createThought(
        content: string,
        reasoning: string,
        score: number,
        depth: number = 0
    ): Thought {
        return {
            id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content,
            reasoning,
            score,
            depth,
        };
    }

    /**
     * Analyze problem type
     */
    private analyzeProblemType(problem: string): string {
        const lower = problem.toLowerCase();

        if (/create|build|implement/.test(lower)) {
            return 'breakdown';
        }
        if (/optimize|improve|faster|slow/.test(lower)) {
            return 'optimization';
        }
        if (/integrate|connect|combine/.test(lower)) {
            return 'integration';
        }
        if (/fix|bug|error|issue/.test(lower)) {
            return 'debugging';
        }

        return 'general';
    }

    /**
     * Evaluate thoughts and expand promising ones
     */
    private evaluateThoughts(thoughts: Thought[]): Thought[] {
        return thoughts.map(thought => {
            // Expand high-scoring thoughts
            if (thought.score > 0.85 && thought.depth < 2) {
                thought.children = this.expandThought(thought);
            }
            return thought;
        });
    }

    /**
     * Expand a thought into sub-thoughts
     */
    private expandThought(parent: Thought): Thought[] {
        const children: Thought[] = [];

        if (parent.content.includes('Break into')) {
            children.push(
                this.createThought(
                    'Identify dependencies',
                    'Dependencies determine execution order',
                    0.88,
                    parent.depth + 1
                ),
                this.createThought(
                    'Estimate complexity',
                    'Complexity affects planning',
                    0.82,
                    parent.depth + 1
                )
            );
        } else if (parent.content.includes('Parallelize')) {
            children.push(
                this.createThought(
                    'Find independent operations',
                    'Independent operations are parallelizable',
                    0.9,
                    parent.depth + 1
                )
            );
        }

        return children;
    }

    /**
     * Select best reasoning path
     */
    private selectBestPath(thoughts: Thought[]): Thought[] {
        // Sort by score
        const sorted = [...thoughts].sort((a, b) => b.score - a.score);

        // Build path from highest-scoring thoughts
        const path: Thought[] = [];
        let current = sorted[0];

        while (current) {
            path.push(current);
            if (current.children && current.children.length > 0) {
                current = current.children.sort((a, b) => b.score - a.score)[0];
            } else {
                break;
            }
        }

        return path;
    }

    /**
     * Generate conclusion from selected path
     */
    private generateConclusion(path: Thought[]): string {
        if (path.length === 0) {
            return 'No clear reasoning path found';
        }

        const steps = path.map(t => t.content).join(' → ');
        return `Recommended approach: ${steps}`;
    }

    /**
     * Calculate confidence based on path scores
     */
    private calculateConfidence(path: Thought[]): number {
        if (path.length === 0) return 0;

        const avgScore = path.reduce((sum, t) => sum + t.score, 0) / path.length;
        return Math.round(avgScore * 100) / 100;
    }

    /**
     * Explain reasoning process
     */
    explainReasoning(chain: ThoughtChain): string {
        let explanation = `Problem: ${chain.problem}\n\n`;
        explanation += 'Reasoning Process:\n';

        chain.selectedPath.forEach((thought, index) => {
            explanation += `${index + 1}. ${thought.content}\n`;
            explanation += `   Reasoning: ${thought.reasoning}\n`;
            explanation += `   Confidence: ${(thought.score * 100).toFixed(0)}%\n\n`;
        });

        explanation += `Conclusion: ${chain.conclusion}\n`;
        explanation += `Overall Confidence: ${(chain.confidence * 100).toFixed(0)}%`;

        return explanation;
    }
}
