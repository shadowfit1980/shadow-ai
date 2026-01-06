/**
 * Code Evolution Simulator
 * Darwinian simulations on codebases to evolve optimal solutions
 * Grok Recommendation: Code Evolution Simulator
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface CodeGenome {
    id: string;
    code: string;
    fitness: number;
    generation: number;
    mutations: string[];
    parentIds: string[];
    metadata: Record<string, unknown>;
}

interface FitnessMetrics {
    performance: number;
    correctness: number;
    readability: number;
    maintainability: number;
    security: number;
    efficiency: number;
}

interface MutationOperator {
    name: string;
    probability: number;
    apply: (code: string) => string;
}

interface EvolutionConfig {
    populationSize: number;
    generations: number;
    mutationRate: number;
    crossoverRate: number;
    elitismRate: number;
    tournamentSize: number;
    fitnessWeights: Partial<FitnessMetrics>;
}

interface EvolutionResult {
    bestGenome: CodeGenome;
    finalPopulation: CodeGenome[];
    generationStats: GenerationStats[];
    totalTime: number;
    improvements: { metric: string; before: number; after: number }[];
}

interface GenerationStats {
    generation: number;
    bestFitness: number;
    averageFitness: number;
    worstFitness: number;
    diversityIndex: number;
}

export class CodeEvolutionSimulator extends EventEmitter {
    private static instance: CodeEvolutionSimulator;
    private mutationOperators: MutationOperator[] = [];
    private population: CodeGenome[] = [];
    private generationHistory: GenerationStats[] = [];
    private isRunning: boolean = false;

    private constructor() {
        super();
        this.initializeMutationOperators();
    }

    static getInstance(): CodeEvolutionSimulator {
        if (!CodeEvolutionSimulator.instance) {
            CodeEvolutionSimulator.instance = new CodeEvolutionSimulator();
        }
        return CodeEvolutionSimulator.instance;
    }

    private initializeMutationOperators(): void {
        this.mutationOperators = [
            { name: 'inlineVariable', probability: 0.15, apply: (code) => code.replace(/const\s+(\w+)\s*=\s*([^;]+);[\s\S]*?\1(?!\w)/g, '$2') },
            { name: 'letToConst', probability: 0.1, apply: (code) => code.replace(/\blet\s+(\w+)\s*=/g, 'const $1 =') },
            { name: 'arrowFunction', probability: 0.15, apply: (code) => code.replace(/function\s*\(([^)]*)\)\s*\{([^}]+)\}/g, '($1) => {$2}') },
            { name: 'templateLiteral', probability: 0.1, apply: (code) => code.replace(/"([^"]*?)"\s*\+\s*(\w+)\s*\+\s*"([^"]*?)"/g, '`$1${$2}$3`') },
            { name: 'optionalChaining', probability: 0.1, apply: (code) => code.replace(/(\w+)\s*&&\s*\1\.(\w+)/g, '$1?.$2') },
            { name: 'nullishCoalescing', probability: 0.1, apply: (code) => code.replace(/(\w+)\s*\|\|\s*([^;]+)/g, '$1 ?? $2') }
        ];
    }

    private createGenome(code: string, generation: number = 0): CodeGenome {
        return { id: crypto.randomUUID(), code, fitness: 0, generation, mutations: [], parentIds: [], metadata: {} };
    }

    private evaluateFitness(genome: CodeGenome, originalCode: string, weights: Partial<FitnessMetrics> = {}): number {
        const metrics = this.calculateMetrics(genome.code, originalCode);
        const finalWeights: FitnessMetrics = { performance: weights.performance ?? 20, correctness: weights.correctness ?? 30, readability: weights.readability ?? 15, maintainability: weights.maintainability ?? 15, security: weights.security ?? 10, efficiency: weights.efficiency ?? 10 };
        const totalWeight = Object.values(finalWeights).reduce((a, b) => a + b, 0);
        let fitness = 0;
        for (const [key, weight] of Object.entries(finalWeights)) { fitness += (metrics[key as keyof FitnessMetrics] * weight) / totalWeight; }
        return Math.round(fitness * 100) / 100;
    }

    private calculateMetrics(code: string, originalCode: string): FitnessMetrics {
        const lineCount = code.split('\n').length;
        const originalLineCount = originalCode.split('\n').length;
        const sizeRatio = lineCount / originalLineCount;
        const performance = Math.min(100, 100 * (1 / sizeRatio));
        const hasBalancedBraces = (code.match(/\{/g) || []).length === (code.match(/\}/g) || []).length;
        const hasBalancedParens = (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length;
        const correctness = (hasBalancedBraces ? 50 : 0) + (hasBalancedParens ? 50 : 0);
        const avgLineLength = code.length / lineCount;
        const readability = avgLineLength < 80 ? 80 + (80 - avgLineLength) * 0.25 : Math.max(0, 100 - (avgLineLength - 80));
        const functionCount = (code.match(/function|=>/g) || []).length;
        const maintainability = functionCount > 0 ? Math.min(100, 50 + 10 * functionCount) : 50;
        const hasDangerousPatterns = /eval|innerHTML|document\.write|exec/i.test(code);
        const security = hasDangerousPatterns ? 30 : 100;
        const hasOptimizedLoops = /\.forEach|\.map|\.filter|\.reduce/.test(code);
        const efficiency = hasOptimizedLoops ? 85 : 70;
        return { performance: Math.round(performance), correctness, readability: Math.round(readability), maintainability, security, efficiency };
    }

    private mutate(genome: CodeGenome): CodeGenome {
        let mutatedCode = genome.code;
        const appliedMutations: string[] = [];
        for (const operator of this.mutationOperators) {
            if (Math.random() < operator.probability) {
                const beforeCode = mutatedCode;
                mutatedCode = operator.apply(mutatedCode);
                if (mutatedCode !== beforeCode) appliedMutations.push(operator.name);
            }
        }
        return { ...this.createGenome(mutatedCode, genome.generation + 1), mutations: appliedMutations, parentIds: [genome.id] };
    }

    private crossover(parent1: CodeGenome, parent2: CodeGenome): CodeGenome {
        const lines1 = parent1.code.split('\n');
        const lines2 = parent2.code.split('\n');
        const crossoverPoint = Math.floor(Math.random() * Math.min(lines1.length, lines2.length));
        const childLines = [...lines1.slice(0, crossoverPoint), ...lines2.slice(crossoverPoint)];
        return { ...this.createGenome(childLines.join('\n'), Math.max(parent1.generation, parent2.generation) + 1), mutations: ['crossover'], parentIds: [parent1.id, parent2.id] };
    }

    private selectParent(population: CodeGenome[], tournamentSize: number): CodeGenome {
        const tournament: CodeGenome[] = [];
        for (let i = 0; i < tournamentSize; i++) tournament.push(population[Math.floor(Math.random() * population.length)]);
        tournament.sort((a, b) => b.fitness - a.fitness);
        return tournament[0];
    }

    async evolve(originalCode: string, config: Partial<EvolutionConfig> = {}): Promise<EvolutionResult> {
        const startTime = Date.now();
        const finalConfig: EvolutionConfig = { populationSize: config.populationSize ?? 50, generations: config.generations ?? 100, mutationRate: config.mutationRate ?? 0.3, crossoverRate: config.crossoverRate ?? 0.7, elitismRate: config.elitismRate ?? 0.1, tournamentSize: config.tournamentSize ?? 5, fitnessWeights: config.fitnessWeights ?? {} };
        this.isRunning = true;
        this.population = [];
        this.generationHistory = [];
        const baseGenome = this.createGenome(originalCode);
        baseGenome.fitness = this.evaluateFitness(baseGenome, originalCode, finalConfig.fitnessWeights);
        this.population.push(baseGenome);
        for (let i = 1; i < finalConfig.populationSize; i++) {
            const mutated = this.mutate(baseGenome);
            mutated.fitness = this.evaluateFitness(mutated, originalCode, finalConfig.fitnessWeights);
            this.population.push(mutated);
        }
        for (let gen = 0; gen < finalConfig.generations && this.isRunning; gen++) {
            const newPopulation: CodeGenome[] = [];
            this.population.sort((a, b) => b.fitness - a.fitness);
            const eliteCount = Math.floor(finalConfig.populationSize * finalConfig.elitismRate);
            for (let i = 0; i < eliteCount; i++) newPopulation.push({ ...this.population[i], generation: gen + 1 });
            while (newPopulation.length < finalConfig.populationSize) {
                const parent1 = this.selectParent(this.population, finalConfig.tournamentSize);
                if (Math.random() < finalConfig.crossoverRate) {
                    const parent2 = this.selectParent(this.population, finalConfig.tournamentSize);
                    let child = this.crossover(parent1, parent2);
                    if (Math.random() < finalConfig.mutationRate) child = this.mutate(child);
                    child.fitness = this.evaluateFitness(child, originalCode, finalConfig.fitnessWeights);
                    newPopulation.push(child);
                } else {
                    let child = this.mutate(parent1);
                    child.fitness = this.evaluateFitness(child, originalCode, finalConfig.fitnessWeights);
                    newPopulation.push(child);
                }
            }
            this.population = newPopulation;
            const fitnesses = this.population.map(g => g.fitness);
            const stats: GenerationStats = { generation: gen + 1, bestFitness: Math.max(...fitnesses), averageFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length, worstFitness: Math.min(...fitnesses), diversityIndex: 0.5 };
            this.generationHistory.push(stats);
            this.emit('generationComplete', stats);
        }
        this.isRunning = false;
        this.population.sort((a, b) => b.fitness - a.fitness);
        const bestGenome = this.population[0];
        const initialMetrics = this.calculateMetrics(originalCode, originalCode);
        const finalMetrics = this.calculateMetrics(bestGenome.code, originalCode);
        const improvements = Object.keys(initialMetrics).map(key => ({ metric: key, before: initialMetrics[key as keyof FitnessMetrics], after: finalMetrics[key as keyof FitnessMetrics] }));
        const result: EvolutionResult = { bestGenome, finalPopulation: this.population, generationStats: this.generationHistory, totalTime: Date.now() - startTime, improvements };
        this.emit('evolutionComplete', result);
        return result;
    }

    stop(): void { this.isRunning = false; this.emit('evolutionStopped'); }
    getPopulation(): CodeGenome[] { return [...this.population]; }
    getHistory(): GenerationStats[] { return [...this.generationHistory]; }
    addMutationOperator(operator: MutationOperator): void { this.mutationOperators.push(operator); }
    getMutationOperators(): string[] { return this.mutationOperators.map(op => op.name); }
}

export const codeEvolutionSimulator = CodeEvolutionSimulator.getInstance();
