/**
 * Genetic Agent Breeding System
 * 
 * Uses genetic algorithms to "breed" new agents by combining traits
 * from existing ones, optimizing for specific metrics like speed or creativity.
 */

import { EventEmitter } from 'events';

// Inline CustomAgent interface to avoid cross-process import issues
export interface CustomAgent {
    id: string;
    name: string;
    description: string;
    icon: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    capabilities: string[];
    examples: { input: string; output: string }[];
    createdAt: Date;
    usageCount: number;
}

export interface AgentGenome {
    id: string;
    traits: AgentTraits;
    fitness: FitnessScores;
    generation: number;
    parents: string[];
    mutations: string[];
}

export interface AgentTraits {
    temperature: number;           // 0-1 creativity
    verbosity: number;             // 0-1 response length preference
    technicalDepth: number;        // 0-1 how deep into implementation
    codeStyle: 'concise' | 'verbose' | 'balanced';
    focusAreas: string[];          // e.g., ['security', 'performance']
    personality: PersonalityVector;
    systemPromptTemplate: string;
}

export interface PersonalityVector {
    assertiveness: number;   // 0-1
    empathy: number;         // 0-1
    patience: number;        // 0-1
    precision: number;       // 0-1
    creativity: number;      // 0-1
}

export interface FitnessScores {
    speed: number;           // Response time performance
    accuracy: number;        // Correctness of outputs
    creativity: number;      // Novelty of solutions
    userSatisfaction: number; // User feedback scores
    taskCompletion: number;  // Success rate
    overall: number;         // Weighted combination
}

export interface BreedingConfig {
    populationSize: number;
    mutationRate: number;     // 0-1 probability
    crossoverRate: number;    // 0-1 probability
    elitismCount: number;     // Top N agents preserved
    fitnessWeights: Partial<FitnessScores>;
}

const DEFAULT_CONFIG: BreedingConfig = {
    populationSize: 20,
    mutationRate: 0.1,
    crossoverRate: 0.7,
    elitismCount: 2,
    fitnessWeights: {
        accuracy: 0.3,
        userSatisfaction: 0.3,
        taskCompletion: 0.2,
        speed: 0.1,
        creativity: 0.1,
    },
};

export class GeneticAgentBreeder extends EventEmitter {
    private static instance: GeneticAgentBreeder;
    private population: Map<string, AgentGenome> = new Map();
    private generationCount: number = 0;
    private config: BreedingConfig = DEFAULT_CONFIG;
    private fitnessHistory: Map<string, FitnessScores[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): GeneticAgentBreeder {
        if (!GeneticAgentBreeder.instance) {
            GeneticAgentBreeder.instance = new GeneticAgentBreeder();
        }
        return GeneticAgentBreeder.instance;
    }

    // ========================================================================
    // GENOME CREATION
    // ========================================================================

    /**
     * Create a genome from an existing CustomAgent
     */
    createGenomeFromAgent(agent: CustomAgent): AgentGenome {
        const genome: AgentGenome = {
            id: `genome_${agent.id}`,
            traits: this.extractTraits(agent),
            fitness: this.initializeFitness(),
            generation: 0,
            parents: [],
            mutations: [],
        };

        this.population.set(genome.id, genome);
        return genome;
    }

    /**
     * Extract traits from agent configuration
     */
    private extractTraits(agent: CustomAgent): AgentTraits {
        // Analyze system prompt for focus areas
        const focusAreas = this.detectFocusAreas(agent.systemPrompt);

        // Infer personality from prompt style
        const personality = this.inferPersonality(agent.systemPrompt);

        return {
            temperature: agent.temperature,
            verbosity: this.estimateVerbosity(agent.systemPrompt),
            technicalDepth: this.estimateTechnicalDepth(agent.systemPrompt),
            codeStyle: this.detectCodeStyle(agent.systemPrompt),
            focusAreas,
            personality,
            systemPromptTemplate: agent.systemPrompt,
        };
    }

    private detectFocusAreas(prompt: string): string[] {
        const areas: string[] = [];
        const patterns = {
            security: /security|vulnerabil|auth|encrypt/i,
            performance: /performance|optimi|speed|efficien/i,
            testing: /test|spec|coverage|assert/i,
            documentation: /document|readme|jsdoc|comment/i,
            refactoring: /refactor|clean|improve|simplify/i,
            debugging: /debug|fix|error|bug/i,
        };

        for (const [area, pattern] of Object.entries(patterns)) {
            if (pattern.test(prompt)) areas.push(area);
        }

        return areas;
    }

    private inferPersonality(prompt: string): PersonalityVector {
        const lower = prompt.toLowerCase();

        return {
            assertiveness: /must|always|never|ensure/i.test(prompt) ? 0.8 : 0.5,
            empathy: /help|understand|support|guide/i.test(prompt) ? 0.8 : 0.4,
            patience: /step by step|careful|thorough/i.test(prompt) ? 0.9 : 0.5,
            precision: /exact|precise|accurate|specific/i.test(prompt) ? 0.9 : 0.6,
            creativity: /creative|innovative|novel|unique/i.test(prompt) ? 0.8 : 0.5,
        };
    }

    private estimateVerbosity(prompt: string): number {
        if (prompt.length > 500) return 0.8;
        if (prompt.length > 200) return 0.5;
        return 0.3;
    }

    private estimateTechnicalDepth(prompt: string): number {
        const technicalTerms = ['implementation', 'algorithm', 'complexity', 'architecture', 'pattern'];
        const matches = technicalTerms.filter(t => prompt.toLowerCase().includes(t));
        return Math.min(1, matches.length / 3);
    }

    private detectCodeStyle(prompt: string): 'concise' | 'verbose' | 'balanced' {
        if (/concise|brief|short/i.test(prompt)) return 'concise';
        if (/detailed|verbose|complete/i.test(prompt)) return 'verbose';
        return 'balanced';
    }

    private initializeFitness(): FitnessScores {
        return {
            speed: 0.5,
            accuracy: 0.5,
            creativity: 0.5,
            userSatisfaction: 0.5,
            taskCompletion: 0.5,
            overall: 0.5,
        };
    }

    // ========================================================================
    // GENETIC OPERATIONS
    // ========================================================================

    /**
     * Breed two genomes to create offspring
     */
    crossover(parent1: AgentGenome, parent2: AgentGenome): AgentGenome {
        const childTraits: AgentTraits = {
            temperature: this.blendValue(parent1.traits.temperature, parent2.traits.temperature),
            verbosity: this.blendValue(parent1.traits.verbosity, parent2.traits.verbosity),
            technicalDepth: this.blendValue(parent1.traits.technicalDepth, parent2.traits.technicalDepth),
            codeStyle: Math.random() > 0.5 ? parent1.traits.codeStyle : parent2.traits.codeStyle,
            focusAreas: this.mergeFocusAreas(parent1.traits.focusAreas, parent2.traits.focusAreas),
            personality: this.blendPersonality(parent1.traits.personality, parent2.traits.personality),
            systemPromptTemplate: this.blendPrompts(parent1.traits.systemPromptTemplate, parent2.traits.systemPromptTemplate),
        };

        const child: AgentGenome = {
            id: `genome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            traits: childTraits,
            fitness: this.initializeFitness(),
            generation: Math.max(parent1.generation, parent2.generation) + 1,
            parents: [parent1.id, parent2.id],
            mutations: [],
        };

        // Apply mutation
        if (Math.random() < this.config.mutationRate) {
            this.mutate(child);
        }

        this.population.set(child.id, child);
        this.emit('genome:bred', child);
        return child;
    }

    private blendValue(a: number, b: number): number {
        const ratio = Math.random();
        return a * ratio + b * (1 - ratio);
    }

    private blendPersonality(a: PersonalityVector, b: PersonalityVector): PersonalityVector {
        return {
            assertiveness: this.blendValue(a.assertiveness, b.assertiveness),
            empathy: this.blendValue(a.empathy, b.empathy),
            patience: this.blendValue(a.patience, b.patience),
            precision: this.blendValue(a.precision, b.precision),
            creativity: this.blendValue(a.creativity, b.creativity),
        };
    }

    private mergeFocusAreas(a: string[], b: string[]): string[] {
        const all = [...new Set([...a, ...b])];
        // Keep random subset
        return all.filter(() => Math.random() > 0.3);
    }

    private blendPrompts(a: string, b: string): string {
        // Simple blend: take sections from each
        const aSentences = a.split(/[.!?\n]+/).filter(s => s.trim());
        const bSentences = b.split(/[.!?\n]+/).filter(s => s.trim());

        const combined: string[] = [];
        const maxLen = Math.max(aSentences.length, bSentences.length);

        for (let i = 0; i < maxLen; i++) {
            if (i < aSentences.length && Math.random() > 0.5) {
                combined.push(aSentences[i].trim());
            } else if (i < bSentences.length) {
                combined.push(bSentences[i].trim());
            }
        }

        return combined.join('. ') + '.';
    }

    /**
     * Apply random mutations to a genome
     */
    mutate(genome: AgentGenome): void {
        const mutations: string[] = [];

        // Temperature mutation
        if (Math.random() < 0.3) {
            genome.traits.temperature = Math.max(0, Math.min(1,
                genome.traits.temperature + (Math.random() - 0.5) * 0.2
            ));
            mutations.push('temperature');
        }

        // Personality mutation
        if (Math.random() < 0.3) {
            const trait = ['assertiveness', 'empathy', 'patience', 'precision', 'creativity'][
                Math.floor(Math.random() * 5)
            ] as keyof PersonalityVector;
            genome.traits.personality[trait] = Math.max(0, Math.min(1,
                genome.traits.personality[trait] + (Math.random() - 0.5) * 0.2
            ));
            mutations.push(`personality.${trait}`);
        }

        genome.mutations.push(...mutations);
        if (mutations.length > 0) {
            this.emit('genome:mutated', { id: genome.id, mutations });
        }
    }

    // ========================================================================
    // EVOLUTION
    // ========================================================================

    /**
     * Run one generation of evolution
     */
    evolveGeneration(): AgentGenome[] {
        const sorted = this.getSortedByFitness();
        const newGeneration: AgentGenome[] = [];

        // Elitism: preserve top performers
        for (let i = 0; i < this.config.elitismCount && i < sorted.length; i++) {
            newGeneration.push(sorted[i]);
        }

        // Breed new offspring
        while (newGeneration.length < this.config.populationSize && sorted.length >= 2) {
            const parent1 = this.selectParent(sorted);
            const parent2 = this.selectParent(sorted);

            if (parent1.id !== parent2.id) {
                const child = this.crossover(parent1, parent2);
                newGeneration.push(child);
            }
        }

        this.generationCount++;
        this.emit('generation:complete', {
            generation: this.generationCount,
            populationSize: newGeneration.length
        });

        return newGeneration;
    }

    /**
     * Tournament selection for parent
     */
    private selectParent(sorted: AgentGenome[]): AgentGenome {
        const tournamentSize = Math.min(3, sorted.length);
        const contestants = [];

        for (let i = 0; i < tournamentSize; i++) {
            contestants.push(sorted[Math.floor(Math.random() * sorted.length)]);
        }

        return contestants.sort((a, b) => b.fitness.overall - a.fitness.overall)[0];
    }

    /**
     * Update fitness scores based on real usage
     */
    updateFitness(genomeId: string, scores: Partial<FitnessScores>): void {
        const genome = this.population.get(genomeId);
        if (!genome) return;

        // Blend with existing scores (exponential moving average)
        const alpha = 0.3;
        for (const [key, value] of Object.entries(scores)) {
            if (key !== 'overall' && typeof value === 'number') {
                const k = key as keyof FitnessScores;
                genome.fitness[k] = genome.fitness[k] * (1 - alpha) + value * alpha;
            }
        }

        // Recalculate overall
        genome.fitness.overall = this.calculateOverallFitness(genome.fitness);

        // Track history
        const history = this.fitnessHistory.get(genomeId) || [];
        history.push({ ...genome.fitness });
        this.fitnessHistory.set(genomeId, history.slice(-100)); // Keep last 100

        this.emit('fitness:updated', { genomeId, fitness: genome.fitness });
    }

    private calculateOverallFitness(scores: FitnessScores): number {
        const weights = this.config.fitnessWeights;
        let total = 0;
        let weightSum = 0;

        for (const [key, weight] of Object.entries(weights)) {
            if (key !== 'overall' && typeof weight === 'number') {
                total += scores[key as keyof FitnessScores] * weight;
                weightSum += weight;
            }
        }

        return weightSum > 0 ? total / weightSum : 0.5;
    }

    // ========================================================================
    // CONVERSION
    // ========================================================================

    /**
     * Convert genome back to CustomAgent format
     */
    genomeToAgent(genome: AgentGenome): Partial<CustomAgent> {
        return {
            id: genome.id.replace('genome_', 'evolved_'),
            name: `Evolved Agent Gen${genome.generation}`,
            description: `Bred from ${genome.parents.length} parents with ${genome.mutations.length} mutations`,
            icon: '🧬',
            systemPrompt: genome.traits.systemPromptTemplate,
            temperature: genome.traits.temperature,
            capabilities: genome.traits.focusAreas,
        };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSortedByFitness(): AgentGenome[] {
        return Array.from(this.population.values())
            .sort((a, b) => b.fitness.overall - a.fitness.overall);
    }

    getGenome(id: string): AgentGenome | undefined {
        return this.population.get(id);
    }

    getGenerationCount(): number {
        return this.generationCount;
    }

    getPopulationSize(): number {
        return this.population.size;
    }
}

export const geneticAgentBreeder = GeneticAgentBreeder.getInstance();
