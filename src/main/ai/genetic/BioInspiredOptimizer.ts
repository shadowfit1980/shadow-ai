/**
 * Bio-Inspired Code Optimizer
 * 
 * Uses genetic algorithms to evolve code towards optimal solutions,
 * with neural-like learning patterns and adaptive optimization.
 */

import { EventEmitter } from 'events';

export interface GeneticOptimization {
    id: string;
    originalCode: string;
    optimizedCode: string;
    fitness: number;
    generations: number;
    population: CodeGenome[];
    history: GenerationHistory[];
    timestamp: Date;
}

export interface CodeGenome {
    id: string;
    code: string;
    fitness: number;
    mutations: string[];
    generation: number;
    parentIds: string[];
}

export interface GenerationHistory {
    generation: number;
    bestFitness: number;
    avgFitness: number;
    diversity: number;
}

export interface OptimizationGoal {
    metric: 'performance' | 'readability' | 'size' | 'complexity';
    weight: number;
    target?: number;
}

export interface MutationType {
    name: string;
    probability: number;
    apply: (code: string) => string;
}

export interface NeuralPattern {
    id: string;
    pattern: string;
    replacement: string;
    successRate: number;
    usageCount: number;
}

export class BioInspiredOptimizer extends EventEmitter {
    private static instance: BioInspiredOptimizer;
    private optimizations: Map<string, GeneticOptimization> = new Map();
    private learnedPatterns: Map<string, NeuralPattern> = new Map();
    private mutations: MutationType[] = [];

    private constructor() {
        super();
        this.initializeMutations();
        this.initializeLearnedPatterns();
    }

    static getInstance(): BioInspiredOptimizer {
        if (!BioInspiredOptimizer.instance) {
            BioInspiredOptimizer.instance = new BioInspiredOptimizer();
        }
        return BioInspiredOptimizer.instance;
    }

    private initializeMutations(): void {
        this.mutations = [
            {
                name: 'constToLet',
                probability: 0.1,
                apply: (code) => code.replace(/\blet\s+(\w+)\s*=\s*([^;]+);(?![^]*\1\s*=)/g, 'const $1 = $2;'),
            },
            {
                name: 'arrowFunction',
                probability: 0.2,
                apply: (code) => code.replace(/function\s*\(([^)]*)\)\s*{\s*return\s+([^;]+);\s*}/g, '($1) => $2'),
            },
            {
                name: 'templateLiteral',
                probability: 0.15,
                apply: (code) => code.replace(/"([^"]*)" \+ (\w+) \+ "([^"]*)"/g, '`$1${$2}$3`'),
            },
            {
                name: 'destructuring',
                probability: 0.15,
                apply: (code) => code.replace(/const (\w+) = (\w+)\.(\w+);/g, 'const { $3: $1 } = $2;'),
            },
            {
                name: 'optionalChaining',
                probability: 0.2,
                apply: (code) => code.replace(/(\w+) && \1\.(\w+)/g, '$1?.$2'),
            },
            {
                name: 'nullishCoalescing',
                probability: 0.15,
                apply: (code) => code.replace(/(\w+) !== null && \1 !== undefined \? \1 : ([^;]+)/g, '$1 ?? $2'),
            },
            {
                name: 'asyncAwait',
                probability: 0.1,
                apply: (code) => code.replace(/\.then\(([^)]+)\)/g, '; const result = await $1'),
            },
            {
                name: 'spreadOperator',
                probability: 0.15,
                apply: (code) => code.replace(/Object\.assign\({}, (\w+)\)/g, '{ ...$1 }'),
            },
        ];
    }

    private initializeLearnedPatterns(): void {
        const patterns: NeuralPattern[] = [
            { id: 'p1', pattern: 'for (let i = 0', replacement: 'for (const item of', successRate: 0.8, usageCount: 0 },
            { id: 'p2', pattern: '.push(...', replacement: '[...arr, ...', successRate: 0.7, usageCount: 0 },
            { id: 'p3', pattern: 'new Promise', replacement: 'async/await', successRate: 0.9, usageCount: 0 },
            { id: 'p4', pattern: 'Array.prototype.slice.call', replacement: 'Array.from', successRate: 0.95, usageCount: 0 },
            { id: 'p5', pattern: '.bind(this)', replacement: 'arrow function', successRate: 0.85, usageCount: 0 },
        ];

        for (const p of patterns) {
            this.learnedPatterns.set(p.id, p);
        }
    }

    // ========================================================================
    // GENETIC OPTIMIZATION
    // ========================================================================

    async optimize(
        code: string,
        goals: OptimizationGoal[] = [{ metric: 'performance', weight: 1 }],
        options: { populationSize?: number; generations?: number } = {}
    ): Promise<GeneticOptimization> {
        const populationSize = options.populationSize || 20;
        const maxGenerations = options.generations || 50;

        // Initialize population
        let population = this.initializePopulation(code, populationSize);
        const history: GenerationHistory[] = [];

        // Evolution loop
        for (let gen = 0; gen < maxGenerations; gen++) {
            // Evaluate fitness
            for (const genome of population) {
                genome.fitness = this.evaluateFitness(genome.code, goals);
            }

            // Sort by fitness
            population.sort((a, b) => b.fitness - a.fitness);

            // Record history
            history.push({
                generation: gen,
                bestFitness: population[0].fitness,
                avgFitness: population.reduce((s, g) => s + g.fitness, 0) / population.length,
                diversity: this.calculateDiversity(population),
            });

            // Check convergence
            if (population[0].fitness > 0.99) break;

            // Selection and reproduction
            population = this.evolvePopulation(population, gen);

            this.emit('generation:completed', { generation: gen, bestFitness: population[0].fitness });
        }

        // Final evaluation
        population.sort((a, b) => b.fitness - a.fitness);
        const best = population[0];

        const optimization: GeneticOptimization = {
            id: `opt_${Date.now()}`,
            originalCode: code,
            optimizedCode: best.code,
            fitness: best.fitness,
            generations: history.length,
            population,
            history,
            timestamp: new Date(),
        };

        this.optimizations.set(optimization.id, optimization);
        this.emit('optimization:completed', optimization);
        return optimization;
    }

    private initializePopulation(code: string, size: number): CodeGenome[] {
        const population: CodeGenome[] = [
            { id: 'genome_0', code, fitness: 0, mutations: [], generation: 0, parentIds: [] },
        ];

        // Create variations
        for (let i = 1; i < size; i++) {
            const mutated = this.mutate(code, Math.random() * 0.5);
            population.push({
                id: `genome_${i}`,
                code: mutated.code,
                fitness: 0,
                mutations: mutated.applied,
                generation: 0,
                parentIds: ['genome_0'],
            });
        }

        return population;
    }

    private mutate(code: string, probability: number): { code: string; applied: string[] } {
        let result = code;
        const applied: string[] = [];

        for (const mutation of this.mutations) {
            if (Math.random() < mutation.probability * probability) {
                const newCode = mutation.apply(result);
                if (newCode !== result) {
                    result = newCode;
                    applied.push(mutation.name);
                }
            }
        }

        return { code: result, applied };
    }

    private evaluateFitness(code: string, goals: OptimizationGoal[]): number {
        let totalScore = 0;
        let totalWeight = 0;

        for (const goal of goals) {
            let score = 0;

            switch (goal.metric) {
                case 'performance':
                    score = this.scorePerformance(code);
                    break;
                case 'readability':
                    score = this.scoreReadability(code);
                    break;
                case 'size':
                    score = this.scoreSize(code, goal.target);
                    break;
                case 'complexity':
                    score = this.scoreComplexity(code);
                    break;
            }

            totalScore += score * goal.weight;
            totalWeight += goal.weight;
        }

        return totalScore / totalWeight;
    }

    private scorePerformance(code: string): number {
        let score = 1;

        // Penalize inefficient patterns
        if (code.includes('.forEach') && code.includes('await')) score -= 0.2;
        if ((code.match(/for.*for/gs) || []).length > 0) score -= 0.15;
        if (code.includes('JSON.parse(JSON.stringify')) score -= 0.1;

        // Reward efficient patterns
        if (code.includes('const ')) score += 0.05;
        if (code.includes('=>')) score += 0.05;
        if (code.includes('?.')) score += 0.05;
        if (code.includes('??')) score += 0.05;

        return Math.max(0, Math.min(1, score));
    }

    private scoreReadability(code: string): number {
        const lines = code.split('\n');
        let score = 1;

        // Penalize long lines
        const longLines = lines.filter(l => l.length > 100).length;
        score -= longLines * 0.02;

        // Penalize deep nesting
        const maxIndent = Math.max(...lines.map(l => l.search(/\S/) / 2));
        if (maxIndent > 5) score -= (maxIndent - 5) * 0.05;

        // Reward consistent formatting
        const hasComments = (code.match(/\/\//g) || []).length > 0;
        if (hasComments) score += 0.1;

        return Math.max(0, Math.min(1, score));
    }

    private scoreSize(code: string, target?: number): number {
        const size = code.length;
        if (target) {
            return 1 - Math.abs(size - target) / target;
        }
        return 1 / (1 + size / 10000);
    }

    private scoreComplexity(code: string): number {
        let complexity = 1;

        // Count decision points
        const decisions = (code.match(/\b(if|else|switch|for|while|catch|\?|&&|\|\|)/g) || []).length;
        complexity += decisions;

        // Normalize to 0-1 (lower complexity = higher score)
        return 1 / (1 + complexity / 20);
    }

    private calculateDiversity(population: CodeGenome[]): number {
        if (population.length < 2) return 0;

        let totalDiff = 0;
        let comparisons = 0;

        for (let i = 0; i < Math.min(population.length, 10); i++) {
            for (let j = i + 1; j < Math.min(population.length, 10); j++) {
                totalDiff += this.codeDifference(population[i].code, population[j].code);
                comparisons++;
            }
        }

        return comparisons > 0 ? totalDiff / comparisons : 0;
    }

    private codeDifference(a: string, b: string): number {
        const aLines = new Set(a.split('\n'));
        const bLines = new Set(b.split('\n'));
        const total = aLines.size + bLines.size;

        let common = 0;
        for (const line of aLines) {
            if (bLines.has(line)) common++;
        }

        return 1 - (2 * common) / total;
    }

    private evolvePopulation(population: CodeGenome[], generation: number): CodeGenome[] {
        const newPopulation: CodeGenome[] = [];
        const eliteCount = Math.floor(population.length * 0.1);

        // Keep elite
        for (let i = 0; i < eliteCount; i++) {
            newPopulation.push({
                ...population[i],
                generation: generation + 1,
            });
        }

        // Breed new genomes
        while (newPopulation.length < population.length) {
            const parent1 = this.selectParent(population);
            const parent2 = this.selectParent(population);
            const child = this.crossover(parent1, parent2, generation + 1);

            // Mutate
            if (Math.random() < 0.3) {
                const mutated = this.mutate(child.code, 0.5);
                child.code = mutated.code;
                child.mutations.push(...mutated.applied);
            }

            newPopulation.push(child);
        }

        return newPopulation;
    }

    private selectParent(population: CodeGenome[]): CodeGenome {
        // Tournament selection
        const tournamentSize = 3;
        let best = population[Math.floor(Math.random() * population.length)];

        for (let i = 1; i < tournamentSize; i++) {
            const candidate = population[Math.floor(Math.random() * population.length)];
            if (candidate.fitness > best.fitness) {
                best = candidate;
            }
        }

        return best;
    }

    private crossover(parent1: CodeGenome, parent2: CodeGenome, generation: number): CodeGenome {
        const lines1 = parent1.code.split('\n');
        const lines2 = parent2.code.split('\n');

        // Single-point crossover
        const crossPoint = Math.floor(Math.random() * Math.min(lines1.length, lines2.length));
        const childLines = [
            ...lines1.slice(0, crossPoint),
            ...lines2.slice(crossPoint),
        ];

        return {
            id: `genome_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            code: childLines.join('\n'),
            fitness: 0,
            mutations: [],
            generation,
            parentIds: [parent1.id, parent2.id],
        };
    }

    // ========================================================================
    // NEURAL LEARNING
    // ========================================================================

    learnPattern(pattern: string, replacement: string, success: boolean): void {
        const id = `pattern_${Date.now()}`;
        const existing = Array.from(this.learnedPatterns.values())
            .find(p => p.pattern === pattern);

        if (existing) {
            existing.usageCount++;
            existing.successRate = (existing.successRate * (existing.usageCount - 1) + (success ? 1 : 0)) / existing.usageCount;
        } else {
            this.learnedPatterns.set(id, {
                id,
                pattern,
                replacement,
                successRate: success ? 1 : 0,
                usageCount: 1,
            });
        }

        this.emit('pattern:learned', { pattern, success });
    }

    getLearnedPatterns(): NeuralPattern[] {
        return Array.from(this.learnedPatterns.values())
            .sort((a, b) => b.successRate - a.successRate);
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getOptimization(id: string): GeneticOptimization | undefined {
        return this.optimizations.get(id);
    }

    getAllOptimizations(): GeneticOptimization[] {
        return Array.from(this.optimizations.values());
    }

    getStats(): {
        totalOptimizations: number;
        avgFitnessImprovement: number;
        totalPatterns: number;
    } {
        const opts = Array.from(this.optimizations.values());
        const avgImprovement = opts.length > 0
            ? opts.reduce((s, o) => s + o.fitness, 0) / opts.length
            : 0;

        return {
            totalOptimizations: opts.length,
            avgFitnessImprovement: avgImprovement,
            totalPatterns: this.learnedPatterns.size,
        };
    }
}

export const bioInspiredOptimizer = BioInspiredOptimizer.getInstance();
