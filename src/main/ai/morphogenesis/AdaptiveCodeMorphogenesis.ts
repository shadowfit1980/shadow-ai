/**
 * Adaptive Code Morphogenesis
 * 
 * A system that allows code to evolve and adapt like living organisms,
 * responding to environment changes and optimizing itself over time.
 */

import { EventEmitter } from 'events';

export interface MorphicCode {
    id: string;
    originalCode: string;
    currentCode: string;
    genome: CodeGenome;
    phenotype: CodePhenotype;
    fitness: FitnessMetrics;
    lineage: Evolution[];
    environment: Environment;
    status: MorphicStatus;
    createdAt: Date;
}

export type MorphicStatus = 'nascent' | 'adapting' | 'stable' | 'thriving' | 'dormant';

export interface CodeGenome {
    patterns: GeneticPattern[];
    traits: Trait[];
    mutations: Mutation[];
    generation: number;
}

export interface GeneticPattern {
    id: string;
    name: string;
    sequence: string;
    dominant: boolean;
    expression: number;
}

export interface Trait {
    name: string;
    value: number;
    category: 'performance' | 'readability' | 'safety' | 'flexibility';
    inherited: boolean;
}

export interface Mutation {
    id: string;
    type: MutationType;
    location: number;
    before: string;
    after: string;
    beneficial: boolean;
    timestamp: Date;
}

export type MutationType = 'substitution' | 'insertion' | 'deletion' | 'inversion' | 'duplication';

export interface CodePhenotype {
    behavior: string[];
    characteristics: string[];
    adaptations: string[];
    vulnerabilities: string[];
}

export interface FitnessMetrics {
    overall: number;
    performance: number;
    reliability: number;
    maintainability: number;
    adaptability: number;
    survivability: number;
}

export interface Evolution {
    generation: number;
    timestamp: Date;
    changes: string[];
    fitnessChange: number;
    trigger: string;
}

export interface Environment {
    id: string;
    name: string;
    pressures: EnvironmentalPressure[];
    resources: Resource[];
    competitors: string[];
}

export interface EnvironmentalPressure {
    type: 'performance' | 'security' | 'compatibility' | 'scale';
    intensity: number;
    direction: string;
}

export interface Resource {
    type: 'memory' | 'cpu' | 'network' | 'storage';
    available: number;
    consumed: number;
}

export interface AdaptationResult {
    success: boolean;
    newCode: string;
    mutations: Mutation[];
    fitnessGain: number;
    explanation: string;
}

export class AdaptiveCodeMorphogenesis extends EventEmitter {
    private static instance: AdaptiveCodeMorphogenesis;
    private organisms: Map<string, MorphicCode> = new Map();
    private environments: Map<string, Environment> = new Map();

    private constructor() {
        super();
        this.initializeDefaultEnvironment();
    }

    static getInstance(): AdaptiveCodeMorphogenesis {
        if (!AdaptiveCodeMorphogenesis.instance) {
            AdaptiveCodeMorphogenesis.instance = new AdaptiveCodeMorphogenesis();
        }
        return AdaptiveCodeMorphogenesis.instance;
    }

    private initializeDefaultEnvironment(): void {
        this.environments.set('default', {
            id: 'env_default',
            name: 'Standard Development',
            pressures: [
                { type: 'performance', intensity: 0.5, direction: 'optimize' },
                { type: 'security', intensity: 0.7, direction: 'harden' },
            ],
            resources: [
                { type: 'memory', available: 1000, consumed: 0 },
                { type: 'cpu', available: 100, consumed: 0 },
            ],
            competitors: [],
        });

        this.environments.set('high-performance', {
            id: 'env_perf',
            name: 'High Performance',
            pressures: [
                { type: 'performance', intensity: 0.9, direction: 'maximize-speed' },
                { type: 'scale', intensity: 0.8, direction: 'horizontal' },
            ],
            resources: [
                { type: 'memory', available: 500, consumed: 0 },
                { type: 'cpu', available: 200, consumed: 0 },
            ],
            competitors: [],
        });
    }

    // ========================================================================
    // ORGANISM CREATION
    // ========================================================================

    createOrganism(code: string, envId: string = 'default'): MorphicCode {
        const environment = this.environments.get(envId) || this.environments.get('default')!;

        const genome = this.analyzeGenome(code);
        const phenotype = this.expressPhenotype(code, genome);
        const fitness = this.calculateFitness(code, environment);

        const organism: MorphicCode = {
            id: `morph_${Date.now()}`,
            originalCode: code,
            currentCode: code,
            genome,
            phenotype,
            fitness,
            lineage: [{
                generation: 1,
                timestamp: new Date(),
                changes: ['Initial creation'],
                fitnessChange: 0,
                trigger: 'Genesis',
            }],
            environment,
            status: 'nascent',
            createdAt: new Date(),
        };

        this.organisms.set(organism.id, organism);
        this.emit('organism:created', organism);
        return organism;
    }

    private analyzeGenome(code: string): CodeGenome {
        const patterns: GeneticPattern[] = [];
        const traits: Trait[] = [];

        // Detect patterns in code
        if (code.includes('class') && code.includes('extends')) {
            patterns.push({
                id: 'pattern_inheritance',
                name: 'Inheritance',
                sequence: 'class...extends',
                dominant: true,
                expression: 0.8,
            });
        }

        if (code.includes('async') && code.includes('await')) {
            patterns.push({
                id: 'pattern_async',
                name: 'Asynchronous',
                sequence: 'async...await',
                dominant: true,
                expression: 0.9,
            });
        }

        if (code.includes('try') && code.includes('catch')) {
            patterns.push({
                id: 'pattern_errorhandling',
                name: 'Error Handling',
                sequence: 'try...catch',
                dominant: false,
                expression: 0.7,
            });
        }

        // Calculate traits
        const lines = code.split('\n').length;
        const avgLineLength = code.length / lines;

        traits.push({
            name: 'Size',
            value: Math.min(1, lines / 500),
            category: 'flexibility',
            inherited: false,
        });

        traits.push({
            name: 'Density',
            value: Math.min(1, avgLineLength / 100),
            category: 'readability',
            inherited: false,
        });

        traits.push({
            name: 'Robustness',
            value: code.includes('try') ? 0.8 : 0.3,
            category: 'safety',
            inherited: false,
        });

        return {
            patterns,
            traits,
            mutations: [],
            generation: 1,
        };
    }

    private expressPhenotype(code: string, genome: CodeGenome): CodePhenotype {
        const behavior: string[] = [];
        const characteristics: string[] = [];
        const adaptations: string[] = [];
        const vulnerabilities: string[] = [];

        // Express behaviors based on patterns
        for (const pattern of genome.patterns) {
            if (pattern.name === 'Asynchronous') {
                behavior.push('Non-blocking I/O');
                characteristics.push('Concurrent execution');
            }
            if (pattern.name === 'Inheritance') {
                behavior.push('Polymorphic');
                characteristics.push('Hierarchical structure');
            }
        }

        // Express based on traits
        for (const trait of genome.traits) {
            if (trait.category === 'safety' && trait.value > 0.7) {
                adaptations.push('Error-resistant');
            }
            if (trait.category === 'readability' && trait.value < 0.5) {
                vulnerabilities.push('Low readability');
            }
        }

        return { behavior, characteristics, adaptations, vulnerabilities };
    }

    private calculateFitness(code: string, environment: Environment): FitnessMetrics {
        let performance = 0.5;
        let reliability = 0.5;
        let maintainability = 0.5;

        // Performance heuristics
        if (!code.includes('forEach') && code.includes('for')) {
            performance += 0.1;
        }
        if (code.includes('cache') || code.includes('memo')) {
            performance += 0.15;
        }

        // Reliability heuristics
        if (code.includes('try') && code.includes('catch')) {
            reliability += 0.2;
        }
        if (code.includes('===') && !code.includes('==')) {
            reliability += 0.1;
        }

        // Maintainability heuristics
        const commentRatio = (code.match(/\/\//g) || []).length / code.split('\n').length;
        if (commentRatio > 0.1) {
            maintainability += 0.15;
        }
        if (code.includes('interface') || code.includes('type ')) {
            maintainability += 0.15;
        }

        // Apply environmental pressures
        for (const pressure of environment.pressures) {
            if (pressure.type === 'performance') {
                performance = performance * (1 + pressure.intensity * 0.1);
            }
        }

        const adaptability = 0.5 + (code.includes('config') || code.includes('options') ? 0.2 : 0);
        const survivability = reliability * 0.5 + adaptability * 0.5;
        const overall = (performance + reliability + maintainability + adaptability + survivability) / 5;

        return {
            overall: Math.min(1, overall),
            performance: Math.min(1, performance),
            reliability: Math.min(1, reliability),
            maintainability: Math.min(1, maintainability),
            adaptability: Math.min(1, adaptability),
            survivability: Math.min(1, survivability),
        };
    }

    // ========================================================================
    // ADAPTATION
    // ========================================================================

    async adapt(organismId: string, pressure?: EnvironmentalPressure): Promise<AdaptationResult> {
        const organism = this.organisms.get(organismId);
        if (!organism) {
            return { success: false, newCode: '', mutations: [], fitnessGain: 0, explanation: 'Organism not found' };
        }

        this.emit('adaptation:started', organism);
        organism.status = 'adapting';

        const actualPressure = pressure || organism.environment.pressures[0];
        const mutations = this.generateMutations(organism, actualPressure);

        // Apply mutations
        let newCode = organism.currentCode;
        for (const mutation of mutations) {
            newCode = this.applyMutation(newCode, mutation);
            organism.genome.mutations.push(mutation);
        }

        // Calculate new fitness
        const newFitness = this.calculateFitness(newCode, organism.environment);
        const fitnessGain = newFitness.overall - organism.fitness.overall;

        // Record evolution
        organism.lineage.push({
            generation: organism.genome.generation + 1,
            timestamp: new Date(),
            changes: mutations.map(m => `${m.type} at line ${m.location}`),
            fitnessChange: fitnessGain,
            trigger: actualPressure.type,
        });

        organism.genome.generation++;
        organism.currentCode = newCode;
        organism.fitness = newFitness;
        organism.phenotype = this.expressPhenotype(newCode, organism.genome);
        organism.status = fitnessGain > 0 ? 'thriving' : 'stable';

        const explanation = fitnessGain > 0
            ? `Successful adaptation! Fitness improved by ${(fitnessGain * 100).toFixed(1)}%`
            : `Neutral adaptation. Code modified but fitness unchanged.`;

        this.emit('adaptation:completed', { organism, mutations, fitnessGain });

        return {
            success: true,
            newCode,
            mutations,
            fitnessGain,
            explanation,
        };
    }

    private generateMutations(organism: MorphicCode, pressure: EnvironmentalPressure): Mutation[] {
        const mutations: Mutation[] = [];
        const code = organism.currentCode;
        const lines = code.split('\n');

        switch (pressure.type) {
            case 'performance':
                // Add caching mutation
                if (!code.includes('cache') && code.includes('function')) {
                    mutations.push({
                        id: `mut_${Date.now()}_cache`,
                        type: 'insertion',
                        location: 1,
                        before: '',
                        after: '// Performance optimization: Consider memoization\n',
                        beneficial: true,
                        timestamp: new Date(),
                    });
                }
                break;

            case 'security':
                // Add security mutation
                if (!code.includes('validate') && code.includes('input')) {
                    mutations.push({
                        id: `mut_${Date.now()}_validate`,
                        type: 'insertion',
                        location: 1,
                        before: '',
                        after: '// Security: Add input validation\n',
                        beneficial: true,
                        timestamp: new Date(),
                    });
                }
                break;

            case 'compatibility':
                // Add compatibility mutation
                mutations.push({
                    id: `mut_${Date.now()}_compat`,
                    type: 'substitution',
                    location: 0,
                    before: '// Original',
                    after: '// Compatible version',
                    beneficial: true,
                    timestamp: new Date(),
                });
                break;
        }

        return mutations;
    }

    private applyMutation(code: string, mutation: Mutation): string {
        const lines = code.split('\n');

        switch (mutation.type) {
            case 'insertion':
                lines.splice(mutation.location, 0, mutation.after);
                break;
            case 'deletion':
                lines.splice(mutation.location, 1);
                break;
            case 'substitution':
                if (lines[mutation.location]) {
                    lines[mutation.location] = lines[mutation.location].replace(mutation.before, mutation.after);
                }
                break;
        }

        return lines.join('\n');
    }

    // ========================================================================
    // ENVIRONMENT
    // ========================================================================

    changeEnvironment(organismId: string, envId: string): void {
        const organism = this.organisms.get(organismId);
        const environment = this.environments.get(envId);

        if (organism && environment) {
            organism.environment = environment;
            organism.fitness = this.calculateFitness(organism.currentCode, environment);
            this.emit('environment:changed', { organism, environment });
        }
    }

    addPressure(envId: string, pressure: EnvironmentalPressure): void {
        const environment = this.environments.get(envId);
        if (environment) {
            environment.pressures.push(pressure);
            this.emit('pressure:added', { environment, pressure });
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getOrganism(id: string): MorphicCode | undefined {
        return this.organisms.get(id);
    }

    getAllOrganisms(): MorphicCode[] {
        return Array.from(this.organisms.values());
    }

    getEnvironments(): Environment[] {
        return Array.from(this.environments.values());
    }

    getStats(): {
        totalOrganisms: number;
        avgFitness: number;
        totalMutations: number;
        thrivingCount: number;
    } {
        const organisms = Array.from(this.organisms.values());

        return {
            totalOrganisms: organisms.length,
            avgFitness: organisms.length > 0
                ? organisms.reduce((s, o) => s + o.fitness.overall, 0) / organisms.length
                : 0,
            totalMutations: organisms.reduce((s, o) => s + o.genome.mutations.length, 0),
            thrivingCount: organisms.filter(o => o.status === 'thriving').length,
        };
    }
}

export const adaptiveCodeMorphogenesis = AdaptiveCodeMorphogenesis.getInstance();
