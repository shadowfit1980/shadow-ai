/**
 * Symbiotic Code Partners
 * 
 * Creates symbiotic relationships between code components,
 * where each part benefits and enhances the other.
 */

import { EventEmitter } from 'events';

export interface SymbioticRelationship {
    id: string;
    partners: Partner[];
    type: SymbiosisType;
    health: number;
    benefits: Benefit[];
    interactions: SymbioticInteraction[];
    createdAt: Date;
}

export interface Partner {
    id: string;
    name: string;
    code: string;
    role: 'host' | 'symbiont' | 'mutualist';
    contribution: string;
    dependsOn: string[];
}

export type SymbiosisType = 'mutualism' | 'commensalism' | 'parasitism' | 'amensalism';

export interface Benefit {
    partnerId: string;
    description: string;
    value: number;
}

export interface SymbioticInteraction {
    from: string;
    to: string;
    type: 'provide' | 'consume' | 'share' | 'protect';
    resource: string;
}

export class SymbioticCodePartners extends EventEmitter {
    private static instance: SymbioticCodePartners;
    private relationships: Map<string, SymbioticRelationship> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): SymbioticCodePartners {
        if (!SymbioticCodePartners.instance) {
            SymbioticCodePartners.instance = new SymbioticCodePartners();
        }
        return SymbioticCodePartners.instance;
    }

    analyzeRelationship(code1: string, code2: string, name1: string, name2: string): SymbioticRelationship {
        const partners = this.createPartners(code1, code2, name1, name2);
        const type = this.determineSymbiosisType(partners);
        const benefits = this.analyzeBenefits(partners, type);
        const interactions = this.findInteractions(partners);

        const relationship: SymbioticRelationship = {
            id: `symbiosis_${Date.now()}`,
            partners,
            type,
            health: this.calculateHealth(benefits),
            benefits,
            interactions,
            createdAt: new Date(),
        };

        this.relationships.set(relationship.id, relationship);
        this.emit('relationship:created', relationship);
        return relationship;
    }

    private createPartners(code1: string, code2: string, name1: string, name2: string): Partner[] {
        const deps1 = this.findDependencies(code1, name2);
        const deps2 = this.findDependencies(code2, name1);

        const role1: Partner['role'] = deps1.length > deps2.length ? 'host' : 'mutualist';
        const role2: Partner['role'] = deps2.length > deps1.length ? 'host' : 'mutualist';

        return [
            {
                id: `partner_1_${Date.now()}`,
                name: name1,
                code: code1,
                role: role1,
                contribution: this.analyzeContribution(code1),
                dependsOn: deps1,
            },
            {
                id: `partner_2_${Date.now()}`,
                name: name2,
                code: code2,
                role: role2,
                contribution: this.analyzeContribution(code2),
                dependsOn: deps2,
            },
        ];
    }

    private findDependencies(code: string, otherName: string): string[] {
        const deps: string[] = [];
        if (code.includes(otherName)) deps.push(otherName);
        return deps;
    }

    private analyzeContribution(code: string): string {
        if (code.includes('export')) return 'Provides public interface';
        if (code.includes('class')) return 'Provides class structure';
        if (code.includes('function')) return 'Provides functionality';
        return 'Provides data';
    }

    private determineSymbiosisType(partners: Partner[]): SymbiosisType {
        const mutualDeps = partners.every(p => p.dependsOn.length > 0);
        const oneSidedDeps = partners.some(p => p.dependsOn.length === 0);

        if (mutualDeps) return 'mutualism';
        if (oneSidedDeps) {
            const dependent = partners.find(p => p.dependsOn.length > 0);
            if (dependent && dependent.code.length > partners.find(p => p.dependsOn.length === 0)!.code.length) {
                return 'parasitism';
            }
            return 'commensalism';
        }
        return 'mutualism';
    }

    private analyzeBenefits(partners: Partner[], type: SymbiosisType): Benefit[] {
        const benefits: Benefit[] = [];

        for (const partner of partners) {
            let value = 0.5;
            let description = '';

            switch (type) {
                case 'mutualism':
                    value = 0.8;
                    description = `${partner.name} gains from collaboration`;
                    break;
                case 'commensalism':
                    value = partner.dependsOn.length > 0 ? 0.7 : 0.1;
                    description = partner.dependsOn.length > 0
                        ? `${partner.name} benefits from the relationship`
                        : `${partner.name} is unaffected`;
                    break;
                case 'parasitism':
                    value = partner.role === 'symbiont' ? 0.9 : -0.3;
                    description = partner.role === 'symbiont'
                        ? `${partner.name} extracts value`
                        : `${partner.name} is drained by the relationship`;
                    break;
                default:
                    value = 0.5;
                    description = `${partner.name} has neutral relationship`;
            }

            benefits.push({ partnerId: partner.id, description, value });
        }

        return benefits;
    }

    private findInteractions(partners: Partner[]): SymbioticInteraction[] {
        const interactions: SymbioticInteraction[] = [];

        for (const p1 of partners) {
            for (const p2 of partners) {
                if (p1.id === p2.id) continue;

                if (p1.dependsOn.includes(p2.name)) {
                    interactions.push({
                        from: p2.id,
                        to: p1.id,
                        type: 'provide',
                        resource: 'functionality',
                    });
                }

                if (p1.code.includes('export') && p2.code.includes('import')) {
                    interactions.push({
                        from: p1.id,
                        to: p2.id,
                        type: 'share',
                        resource: 'interface',
                    });
                }
            }
        }

        return interactions;
    }

    private calculateHealth(benefits: Benefit[]): number {
        if (benefits.length === 0) return 0.5;
        const avgValue = benefits.reduce((s, b) => s + b.value, 0) / benefits.length;
        return Math.max(0, Math.min(1, avgValue));
    }

    getRelationship(id: string): SymbioticRelationship | undefined {
        return this.relationships.get(id);
    }

    getStats(): { total: number; avgHealth: number; typeDistribution: Record<string, number> } {
        const rels = Array.from(this.relationships.values());
        const typeDistribution: Record<string, number> = {};

        for (const r of rels) {
            typeDistribution[r.type] = (typeDistribution[r.type] || 0) + 1;
        }

        return {
            total: rels.length,
            avgHealth: rels.length > 0 ? rels.reduce((s, r) => s + r.health, 0) / rels.length : 0,
            typeDistribution,
        };
    }
}

export const symbioticCodePartners = SymbioticCodePartners.getInstance();
