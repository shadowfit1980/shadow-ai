/**
 * Chakra Code Alignment
 * 
 * Aligns code "chakras" (energy centers) to achieve balance,
 * harmony, and optimal flow throughout the codebase.
 */

import { EventEmitter } from 'events';

export interface ChakraAnalysis {
    id: string;
    code: string;
    chakras: Chakra[];
    alignment: AlignmentScore;
    blockages: Blockage[];
    recommendations: ChakraRecommendation[];
    overallEnergy: number;
    createdAt: Date;
}

export interface Chakra {
    id: string;
    name: string;
    position: number;
    color: string;
    represents: string;
    energy: number;
    balanced: boolean;
}

export interface AlignmentScore {
    overall: number;
    flow: number;
    balance: number;
    grounding: number;
}

export interface Blockage {
    chakra: string;
    cause: string;
    severity: number;
    solution: string;
}

export interface ChakraRecommendation {
    priority: number;
    action: string;
    expectedImprovement: number;
}

export class ChakraCodeAlignment extends EventEmitter {
    private static instance: ChakraCodeAlignment;
    private analyses: Map<string, ChakraAnalysis> = new Map();

    private readonly codeChakras = [
        { name: 'Root', color: '#FF0000', represents: 'Error Handling & Stability' },
        { name: 'Sacral', color: '#FF7F00', represents: 'Data Flow & Creativity' },
        { name: 'Solar Plexus', color: '#FFFF00', represents: 'Logic & Power' },
        { name: 'Heart', color: '#00FF00', represents: 'Integration & Compassion' },
        { name: 'Throat', color: '#0000FF', represents: 'Communication & APIs' },
        { name: 'Third Eye', color: '#4B0082', represents: 'Insight & Intelligence' },
        { name: 'Crown', color: '#9400D3', represents: 'Architecture & Purpose' },
    ];

    private constructor() {
        super();
    }

    static getInstance(): ChakraCodeAlignment {
        if (!ChakraCodeAlignment.instance) {
            ChakraCodeAlignment.instance = new ChakraCodeAlignment();
        }
        return ChakraCodeAlignment.instance;
    }

    analyze(code: string): ChakraAnalysis {
        const chakras = this.assessChakras(code);
        const alignment = this.calculateAlignment(chakras);
        const blockages = this.findBlockages(chakras, code);
        const recommendations = this.generateRecommendations(chakras, blockages);

        const analysis: ChakraAnalysis = {
            id: `chakra_${Date.now()}`,
            code,
            chakras,
            alignment,
            blockages,
            recommendations,
            overallEnergy: this.calculateEnergy(chakras),
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private assessChakras(code: string): Chakra[] {
        return this.codeChakras.map((template, index) => {
            const energy = this.measureChakraEnergy(index, code);
            return {
                id: `chakra_${index}`,
                name: template.name,
                position: index,
                color: template.color,
                represents: template.represents,
                energy,
                balanced: energy > 0.4 && energy < 0.9,
            };
        });
    }

    private measureChakraEnergy(chakraIndex: number, code: string): number {
        let energy = 0.5;

        switch (chakraIndex) {
            case 0: // Root - Error Handling
                if (code.includes('try') && code.includes('catch')) energy += 0.3;
                if (code.includes('finally')) energy += 0.1;
                if (!code.includes('throw')) energy -= 0.1;
                break;

            case 1: // Sacral - Data Flow
                if (code.includes('map') || code.includes('filter')) energy += 0.2;
                if (code.includes('reduce')) energy += 0.15;
                if (code.includes('pipe') || code.includes('compose')) energy += 0.2;
                break;

            case 2: // Solar Plexus - Logic
                const logic = (code.match(/if|else|switch|case/g) || []).length;
                energy += Math.min(0.3, logic * 0.05);
                if (code.includes('return')) energy += 0.1;
                break;

            case 3: // Heart - Integration
                if (code.includes('import') && code.includes('export')) energy += 0.3;
                if (code.includes('interface')) energy += 0.15;
                break;

            case 4: // Throat - Communication
                if (code.includes('api') || code.includes('API')) energy += 0.2;
                if (code.includes('fetch') || code.includes('request')) energy += 0.2;
                if (code.includes('response')) energy += 0.1;
                break;

            case 5: // Third Eye - Intelligence
                if (code.includes('analyze') || code.includes('predict')) energy += 0.3;
                if (code.includes('learn') || code.includes('train')) energy += 0.2;
                break;

            case 6: // Crown - Architecture
                if (code.includes('class') && code.includes('extends')) energy += 0.2;
                if (code.includes('abstract')) energy += 0.15;
                if (code.includes('pattern') || code.includes('architecture')) energy += 0.2;
                break;
        }

        return Math.max(0, Math.min(1, energy));
    }

    private calculateAlignment(chakras: Chakra[]): AlignmentScore {
        const energyVariance = this.calculateVariance(chakras.map(c => c.energy));
        const avgEnergy = chakras.reduce((s, c) => s + c.energy, 0) / chakras.length;

        return {
            overall: avgEnergy,
            flow: 1 - energyVariance,
            balance: chakras.filter(c => c.balanced).length / chakras.length,
            grounding: chakras[0].energy, // Root chakra
        };
    }

    private calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;
        const mean = values.reduce((s, v) => s + v, 0) / values.length;
        const squaredDiffs = values.map(v => (v - mean) ** 2);
        return squaredDiffs.reduce((s, v) => s + v, 0) / values.length;
    }

    private findBlockages(chakras: Chakra[], code: string): Blockage[] {
        const blockages: Blockage[] = [];

        for (const chakra of chakras) {
            if (chakra.energy < 0.3) {
                blockages.push({
                    chakra: chakra.name,
                    cause: this.identifyBlockageCause(chakra, code),
                    severity: 1 - chakra.energy,
                    solution: this.getSolution(chakra),
                });
            } else if (chakra.energy > 0.9) {
                blockages.push({
                    chakra: chakra.name,
                    cause: 'Excessive energy - potential over-engineering',
                    severity: chakra.energy - 0.9,
                    solution: 'Simplify and streamline',
                });
            }
        }

        return blockages;
    }

    private identifyBlockageCause(chakra: Chakra, code: string): string {
        switch (chakra.name) {
            case 'Root':
                return 'Insufficient error handling creates instability';
            case 'Sacral':
                return 'Limited data transformation patterns';
            case 'Solar Plexus':
                return 'Weak logical structure';
            case 'Heart':
                return 'Poor integration between components';
            case 'Throat':
                return 'Limited communication interfaces';
            case 'Third Eye':
                return 'Lacks intelligent processing';
            case 'Crown':
                return 'Unclear architectural vision';
            default:
                return 'Energy imbalance detected';
        }
    }

    private getSolution(chakra: Chakra): string {
        switch (chakra.name) {
            case 'Root':
                return 'Add comprehensive try-catch blocks and error boundaries';
            case 'Sacral':
                return 'Use functional transformations (map, filter, reduce)';
            case 'Solar Plexus':
                return 'Strengthen conditional logic and control flow';
            case 'Heart':
                return 'Define clear interfaces and improve module integration';
            case 'Throat':
                return 'Create clear API contracts and improve communication';
            case 'Third Eye':
                return 'Add intelligent analysis and prediction capabilities';
            case 'Crown':
                return 'Define clear architecture patterns and abstractions';
            default:
                return 'Rebalance energy through refactoring';
        }
    }

    private generateRecommendations(chakras: Chakra[], blockages: Blockage[]): ChakraRecommendation[] {
        const recommendations: ChakraRecommendation[] = [];

        for (const blockage of blockages.slice(0, 3)) {
            recommendations.push({
                priority: blockage.severity,
                action: blockage.solution,
                expectedImprovement: blockage.severity * 0.5,
            });
        }

        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    private calculateEnergy(chakras: Chakra[]): number {
        return chakras.reduce((s, c) => s + c.energy, 0) / chakras.length;
    }

    getAnalysis(id: string): ChakraAnalysis | undefined {
        return this.analyses.get(id);
    }

    getStats(): { total: number; avgEnergy: number; mostBlockedChakra: string } {
        const analyses = Array.from(this.analyses.values());
        const blockageCounts: Record<string, number> = {};

        for (const a of analyses) {
            for (const b of a.blockages) {
                blockageCounts[b.chakra] = (blockageCounts[b.chakra] || 0) + 1;
            }
        }

        const mostBlocked = Object.entries(blockageCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

        return {
            total: analyses.length,
            avgEnergy: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.overallEnergy, 0) / analyses.length
                : 0,
            mostBlockedChakra: mostBlocked,
        };
    }
}

export const chakraCodeAlignment = ChakraCodeAlignment.getInstance();
