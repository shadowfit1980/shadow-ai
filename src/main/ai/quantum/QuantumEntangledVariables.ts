/**
 * Quantum Entangled Variables
 * 
 * Create quantum-like relationships between variables across
 * different parts of code, enabling instant synchronized updates
 * and dependency tracking.
 */

import { EventEmitter } from 'events';

export interface EntangledPair {
    id: string;
    name: string;
    particles: QuantumParticle[];
    state: EntanglementState;
    strength: number;
    observations: Observation[];
    createdAt: Date;
}

export interface QuantumParticle {
    id: string;
    name: string;
    value: any;
    location: CodeLocation;
    spin: 'up' | 'down' | 'superposition';
    observed: boolean;
}

export interface CodeLocation {
    file: string;
    line: number;
    column?: number;
    scope: string;
}

export type EntanglementState = 'entangled' | 'collapsed' | 'decoherent' | 'stable';

export interface Observation {
    timestamp: Date;
    particleId: string;
    previousValue: any;
    newValue: any;
    triggered: string[];
}

export interface EntanglementEffect {
    type: 'propagation' | 'interference' | 'tunneling';
    source: string;
    targets: string[];
    magnitude: number;
}

export class QuantumEntangledVariables extends EventEmitter {
    private static instance: QuantumEntangledVariables;
    private pairs: Map<string, EntangledPair> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): QuantumEntangledVariables {
        if (!QuantumEntangledVariables.instance) {
            QuantumEntangledVariables.instance = new QuantumEntangledVariables();
        }
        return QuantumEntangledVariables.instance;
    }

    createEntanglement(
        name: string,
        particle1: { name: string; value: any; location: CodeLocation },
        particle2: { name: string; value: any; location: CodeLocation }
    ): EntangledPair {
        const pair: EntangledPair = {
            id: `entangle_${Date.now()}`,
            name,
            particles: [
                {
                    id: `p1_${Date.now()}`,
                    ...particle1,
                    spin: 'superposition',
                    observed: false,
                },
                {
                    id: `p2_${Date.now()}`,
                    ...particle2,
                    spin: 'superposition',
                    observed: false,
                },
            ],
            state: 'entangled',
            strength: 1,
            observations: [],
            createdAt: new Date(),
        };

        this.pairs.set(pair.id, pair);
        this.emit('entanglement:created', pair);
        return pair;
    }

    observe(pairId: string, particleId: string, newValue: any): EntanglementEffect | undefined {
        const pair = this.pairs.get(pairId);
        if (!pair) return undefined;

        const particle = pair.particles.find(p => p.id === particleId);
        if (!particle) return undefined;

        const previousValue = particle.value;
        particle.value = newValue;
        particle.spin = Math.random() > 0.5 ? 'up' : 'down';
        particle.observed = true;

        // Propagate to entangled particles
        const affectedParticles: string[] = [];
        for (const other of pair.particles) {
            if (other.id !== particleId && pair.state === 'entangled') {
                other.spin = particle.spin === 'up' ? 'down' : 'up';
                other.observed = true;
                affectedParticles.push(other.id);
            }
        }

        pair.observations.push({
            timestamp: new Date(),
            particleId,
            previousValue,
            newValue,
            triggered: affectedParticles,
        });

        const effect: EntanglementEffect = {
            type: 'propagation',
            source: particleId,
            targets: affectedParticles,
            magnitude: pair.strength,
        };

        this.emit('observation:made', { pair, effect });
        return effect;
    }

    collapse(pairId: string): void {
        const pair = this.pairs.get(pairId);
        if (pair) {
            pair.state = 'collapsed';
            for (const particle of pair.particles) {
                particle.spin = Math.random() > 0.5 ? 'up' : 'down';
            }
            this.emit('entanglement:collapsed', pair);
        }
    }

    getPair(id: string): EntangledPair | undefined {
        return this.pairs.get(id);
    }

    getAllPairs(): EntangledPair[] {
        return Array.from(this.pairs.values());
    }

    getStats(): { totalPairs: number; entangledCount: number; observations: number } {
        const pairs = Array.from(this.pairs.values());
        return {
            totalPairs: pairs.length,
            entangledCount: pairs.filter(p => p.state === 'entangled').length,
            observations: pairs.reduce((s, p) => s + p.observations.length, 0),
        };
    }
}

export const quantumEntangledVariables = QuantumEntangledVariables.getInstance();
