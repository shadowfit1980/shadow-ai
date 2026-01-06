/**
 * Holistic Project Ecosystem
 * 
 * Views the entire project as a living ecosystem with interdependent
 * species (components), environments (contexts), and evolution.
 */

import { EventEmitter } from 'events';

export interface ProjectEcosystem {
    id: string;
    name: string;
    species: Species[];
    environments: Environment[];
    foodWeb: FoodWebConnection[];
    biodiversity: BiodiversityMetrics;
    ecologicalHealth: number;
    createdAt: Date;
}

export interface Species {
    id: string;
    name: string;
    type: 'producer' | 'consumer' | 'decomposer';
    niche: string;
    population: number;
    fitness: number;
    dependencies: string[];
}

export interface Environment {
    id: string;
    name: string;
    capacity: number;
    resources: Resource[];
    conditions: string[];
}

export interface Resource {
    name: string;
    available: number;
    regeneration: number;
}

export interface FoodWebConnection {
    predator: string;
    prey: string;
    strength: number;
    type: 'dependency' | 'import' | 'extends' | 'implements';
}

export interface BiodiversityMetrics {
    speciesCount: number;
    richnessIndex: number;
    evenness: number;
    dominance: number;
}

export class HolisticProjectEcosystem extends EventEmitter {
    private static instance: HolisticProjectEcosystem;
    private ecosystems: Map<string, ProjectEcosystem> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): HolisticProjectEcosystem {
        if (!HolisticProjectEcosystem.instance) {
            HolisticProjectEcosystem.instance = new HolisticProjectEcosystem();
        }
        return HolisticProjectEcosystem.instance;
    }

    analyze(projectName: string, files: { name: string; code: string }[]): ProjectEcosystem {
        const species = this.identifySpecies(files);
        const environments = this.identifyEnvironments(files);
        const foodWeb = this.buildFoodWeb(species, files);
        const biodiversity = this.calculateBiodiversity(species);

        const ecosystem: ProjectEcosystem = {
            id: `eco_${Date.now()}`,
            name: projectName,
            species,
            environments,
            foodWeb,
            biodiversity,
            ecologicalHealth: this.calculateHealth(species, foodWeb),
            createdAt: new Date(),
        };

        this.ecosystems.set(ecosystem.id, ecosystem);
        this.emit('ecosystem:analyzed', ecosystem);
        return ecosystem;
    }

    private identifySpecies(files: { name: string; code: string }[]): Species[] {
        const species: Species[] = [];

        for (const file of files) {
            let type: Species['type'] = 'consumer';
            let niche = 'general';

            if (file.name.includes('util') || file.name.includes('helper')) {
                type = 'producer';
                niche = 'utility provider';
            } else if (file.name.includes('test')) {
                type = 'decomposer';
                niche = 'quality maintenance';
            } else if (file.code.includes('export default')) {
                type = 'producer';
                niche = 'primary export';
            }

            const dependencies = this.extractDependencies(file.code);

            species.push({
                id: `species_${file.name}`,
                name: file.name,
                type,
                niche,
                population: file.code.split('\n').length,
                fitness: this.calculateFitness(file.code),
                dependencies,
            });
        }

        return species;
    }

    private extractDependencies(code: string): string[] {
        const deps: string[] = [];
        const importMatches = code.matchAll(/import.*from\s+['"]([^'"]+)['"]/g);
        for (const match of importMatches) {
            deps.push(match[1]);
        }
        return deps.slice(0, 10);
    }

    private calculateFitness(code: string): number {
        let fitness = 0.5;
        if (code.includes('interface') || code.includes('type ')) fitness += 0.1;
        if (code.includes('//') || code.includes('/*')) fitness += 0.1;
        if (code.includes('try') && code.includes('catch')) fitness += 0.1;
        if (code.includes('async')) fitness += 0.1;
        return Math.min(1, fitness);
    }

    private identifyEnvironments(files: { name: string; code: string }[]): Environment[] {
        const envGroups = new Map<string, { name: string; code: string }[]>();

        for (const file of files) {
            const dir = file.name.split('/')[0] || 'root';
            if (!envGroups.has(dir)) envGroups.set(dir, []);
            envGroups.get(dir)!.push(file);
        }

        const environments: Environment[] = [];
        for (const [dir, dirFiles] of envGroups) {
            environments.push({
                id: `env_${dir}`,
                name: dir,
                capacity: dirFiles.length * 10,
                resources: [
                    { name: 'code', available: dirFiles.reduce((s, f) => s + f.code.length, 0), regeneration: 100 },
                ],
                conditions: dirFiles.length > 5 ? ['crowded'] : ['spacious'],
            });
        }

        return environments;
    }

    private buildFoodWeb(species: Species[], files: { name: string; code: string }[]): FoodWebConnection[] {
        const connections: FoodWebConnection[] = [];

        for (const s of species) {
            for (const dep of s.dependencies) {
                const prey = species.find(sp => sp.name.includes(dep) || dep.includes(sp.name));
                if (prey) {
                    connections.push({
                        predator: s.id,
                        prey: prey.id,
                        strength: 0.5,
                        type: 'import',
                    });
                }
            }
        }

        return connections;
    }

    private calculateBiodiversity(species: Species[]): BiodiversityMetrics {
        const speciesCount = species.length;
        const totalPopulation = species.reduce((s, sp) => s + sp.population, 0);

        // Simpson's diversity index approximation
        const dominance = species.length > 0
            ? species.reduce((s, sp) => s + Math.pow(sp.population / totalPopulation, 2), 0)
            : 0;

        return {
            speciesCount,
            richnessIndex: Math.log(speciesCount + 1),
            evenness: 1 - dominance,
            dominance,
        };
    }

    private calculateHealth(species: Species[], foodWeb: FoodWebConnection[]): number {
        if (species.length === 0) return 0;

        const avgFitness = species.reduce((s, sp) => s + sp.fitness, 0) / species.length;
        const connectivity = foodWeb.length / Math.max(1, species.length);

        return (avgFitness + Math.min(1, connectivity)) / 2;
    }

    getEcosystem(id: string): ProjectEcosystem | undefined {
        return this.ecosystems.get(id);
    }

    getStats(): { total: number; avgHealth: number; avgBiodiversity: number } {
        const ecosystems = Array.from(this.ecosystems.values());
        return {
            total: ecosystems.length,
            avgHealth: ecosystems.length > 0
                ? ecosystems.reduce((s, e) => s + e.ecologicalHealth, 0) / ecosystems.length
                : 0,
            avgBiodiversity: ecosystems.length > 0
                ? ecosystems.reduce((s, e) => s + e.biodiversity.richnessIndex, 0) / ecosystems.length
                : 0,
        };
    }
}

export const holisticProjectEcosystem = HolisticProjectEcosystem.getInstance();
