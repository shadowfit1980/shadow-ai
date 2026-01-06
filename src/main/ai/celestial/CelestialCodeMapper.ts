/**
 * Celestial Code Mapper
 * 
 * Maps code structure to celestial bodies - classes as planets,
 * functions as moons, creating a cosmic visualization of architecture.
 */

import { EventEmitter } from 'events';

export interface CelestialMap {
    id: string;
    code: string;
    universe: Universe;
    galaxies: Galaxy[];
    connections: CosmicConnection[];
    cosmicScale: CosmicScale;
    createdAt: Date;
}

export interface Universe {
    name: string;
    age: number;
    entropy: number;
    expansion: number;
}

export interface Galaxy {
    id: string;
    name: string;
    type: 'elliptical' | 'spiral' | 'irregular';
    stars: Star[];
    mass: number;
}

export interface Star {
    id: string;
    name: string;
    type: 'class' | 'interface' | 'module';
    luminosity: number;
    planets: Planet[];
}

export interface Planet {
    id: string;
    name: string;
    type: 'function' | 'method' | 'property';
    size: number;
    moons: Moon[];
}

export interface Moon {
    id: string;
    name: string;
    type: 'parameter' | 'variable' | 'constant';
}

export interface CosmicConnection {
    from: string;
    to: string;
    type: 'gravity' | 'light' | 'dark-matter';
    strength: number;
}

export interface CosmicScale {
    totalMass: number;
    galaxyCount: number;
    starCount: number;
    planetCount: number;
    complexity: number;
}

export class CelestialCodeMapper extends EventEmitter {
    private static instance: CelestialCodeMapper;
    private maps: Map<string, CelestialMap> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): CelestialCodeMapper {
        if (!CelestialCodeMapper.instance) {
            CelestialCodeMapper.instance = new CelestialCodeMapper();
        }
        return CelestialCodeMapper.instance;
    }

    mapCode(code: string, universeName: string = 'CodeVerse'): CelestialMap {
        const universe = this.createUniverse(universeName, code);
        const galaxies = this.extractGalaxies(code);
        const connections = this.mapConnections(galaxies);
        const cosmicScale = this.calculateScale(galaxies);

        const map: CelestialMap = {
            id: `celestial_${Date.now()}`,
            code,
            universe,
            galaxies,
            connections,
            cosmicScale,
            createdAt: new Date(),
        };

        this.maps.set(map.id, map);
        this.emit('map:created', map);
        return map;
    }

    private createUniverse(name: string, code: string): Universe {
        const lines = code.split('\n').length;
        return {
            name,
            age: Math.log(lines + 1),
            entropy: this.calculateEntropy(code),
            expansion: code.includes('export') ? 0.8 : 0.3,
        };
    }

    private calculateEntropy(code: string): number {
        const chars = new Map<string, number>();
        for (const char of code) {
            chars.set(char, (chars.get(char) || 0) + 1);
        }

        let entropy = 0;
        const total = code.length;
        for (const count of chars.values()) {
            const p = count / total;
            entropy -= p * Math.log2(p);
        }

        return entropy / 8; // Normalize to 0-1
    }

    private extractGalaxies(code: string): Galaxy[] {
        const galaxies: Galaxy[] = [];

        // Each file section is a galaxy
        const sections = code.split(/(?=(?:export\s+)?(?:class|interface|type)\s+\w+)/);

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (section.trim().length < 10) continue;

            const stars = this.extractStars(section);
            const galaxyType = stars.length > 3 ? 'spiral' : stars.length > 1 ? 'elliptical' : 'irregular';

            galaxies.push({
                id: `galaxy_${i}`,
                name: `Section ${i + 1}`,
                type: galaxyType,
                stars,
                mass: section.length / 100,
            });
        }

        return galaxies.length > 0 ? galaxies : [{
            id: 'galaxy_default',
            name: 'Main Galaxy',
            type: 'spiral',
            stars: this.extractStars(code),
            mass: code.length / 100,
        }];
    }

    private extractStars(code: string): Star[] {
        const stars: Star[] = [];

        // Extract classes as stars
        const classMatches = code.matchAll(/(?:export\s+)?class\s+(\w+)/g);
        for (const match of classMatches) {
            stars.push({
                id: `star_class_${match[1]}`,
                name: match[1],
                type: 'class',
                luminosity: 1.0,
                planets: this.extractPlanets(code, match[1]),
            });
        }

        // Extract interfaces as dimmer stars
        const interfaceMatches = code.matchAll(/(?:export\s+)?interface\s+(\w+)/g);
        for (const match of interfaceMatches) {
            stars.push({
                id: `star_interface_${match[1]}`,
                name: match[1],
                type: 'interface',
                luminosity: 0.6,
                planets: [],
            });
        }

        return stars;
    }

    private extractPlanets(code: string, className: string): Planet[] {
        const planets: Planet[] = [];

        // Extract methods as planets
        const methodMatches = code.matchAll(/(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{/g);
        for (const match of Array.from(methodMatches).slice(0, 10)) {
            const methodName = match[1];
            if (['if', 'for', 'while', 'switch', 'function'].includes(methodName)) continue;

            planets.push({
                id: `planet_${className}_${methodName}`,
                name: methodName,
                type: 'method',
                size: 0.5,
                moons: this.extractMoons(match[0]),
            });
        }

        return planets;
    }

    private extractMoons(methodSignature: string): Moon[] {
        const moons: Moon[] = [];
        const paramMatch = methodSignature.match(/\(([^)]*)\)/);

        if (paramMatch && paramMatch[1]) {
            const params = paramMatch[1].split(',').map(p => p.trim());
            for (const param of params) {
                const paramName = param.split(':')[0].trim();
                if (paramName) {
                    moons.push({
                        id: `moon_${paramName}`,
                        name: paramName,
                        type: 'parameter',
                    });
                }
            }
        }

        return moons;
    }

    private mapConnections(galaxies: Galaxy[]): CosmicConnection[] {
        const connections: CosmicConnection[] = [];

        // Connect galaxies through gravity
        for (let i = 0; i < galaxies.length; i++) {
            for (let j = i + 1; j < galaxies.length; j++) {
                if (galaxies[i].stars.length > 0 && galaxies[j].stars.length > 0) {
                    connections.push({
                        from: galaxies[i].id,
                        to: galaxies[j].id,
                        type: 'gravity',
                        strength: 0.5,
                    });
                }
            }
        }

        return connections;
    }

    private calculateScale(galaxies: Galaxy[]): CosmicScale {
        let starCount = 0;
        let planetCount = 0;
        let totalMass = 0;

        for (const galaxy of galaxies) {
            totalMass += galaxy.mass;
            starCount += galaxy.stars.length;
            for (const star of galaxy.stars) {
                planetCount += star.planets.length;
            }
        }

        return {
            totalMass,
            galaxyCount: galaxies.length,
            starCount,
            planetCount,
            complexity: Math.log(starCount + planetCount + 1),
        };
    }

    getMap(id: string): CelestialMap | undefined {
        return this.maps.get(id);
    }

    getStats(): { total: number; avgComplexity: number; totalStars: number } {
        const maps = Array.from(this.maps.values());
        const totalStars = maps.reduce((s, m) =>
            s + m.galaxies.reduce((gs, g) => gs + g.stars.length, 0), 0);

        return {
            total: maps.length,
            avgComplexity: maps.length > 0
                ? maps.reduce((s, m) => s + m.cosmicScale.complexity, 0) / maps.length
                : 0,
            totalStars,
        };
    }
}

export const celestialCodeMapper = CelestialCodeMapper.getInstance();
