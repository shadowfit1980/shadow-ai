/**
 * Time Crystal Snapshot
 * 
 * Creates crystallized moments in code evolution that can be
 * revisited, compared, and even merged across time.
 */

import { EventEmitter } from 'events';

export interface TimeCrystal {
    id: string;
    name: string;
    code: string;
    crystallizedAt: Date;
    metadata: CrystalMetadata;
    facets: CrystalFacet[];
    connections: TimeConnection[];
}

export interface CrystalMetadata {
    reason: string;
    author?: string;
    tags: string[];
    importance: number;
    hash: string;
}

export interface CrystalFacet {
    id: string;
    aspect: 'structure' | 'logic' | 'style' | 'dependencies' | 'tests';
    summary: string;
    metrics: Record<string, number>;
}

export interface TimeConnection {
    targetId: string;
    relationship: 'evolved-from' | 'influenced-by' | 'merged-with' | 'branched-to';
    changes: string[];
}

export interface CrystalDiff {
    crystal1Id: string;
    crystal2Id: string;
    additions: string[];
    removals: string[];
    modifications: string[];
    similarity: number;
}

export class TimeCrystalSnapshot extends EventEmitter {
    private static instance: TimeCrystalSnapshot;
    private crystals: Map<string, TimeCrystal> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): TimeCrystalSnapshot {
        if (!TimeCrystalSnapshot.instance) {
            TimeCrystalSnapshot.instance = new TimeCrystalSnapshot();
        }
        return TimeCrystalSnapshot.instance;
    }

    crystallize(code: string, name: string, reason: string, tags: string[] = []): TimeCrystal {
        const facets = this.analyzeFacets(code);
        const hash = this.generateHash(code);

        const crystal: TimeCrystal = {
            id: `crystal_${Date.now()}`,
            name,
            code,
            crystallizedAt: new Date(),
            metadata: {
                reason,
                tags,
                importance: this.calculateImportance(reason, tags),
                hash,
            },
            facets,
            connections: [],
        };

        // Find connections to previous crystals
        this.findConnections(crystal);

        this.crystals.set(crystal.id, crystal);
        this.emit('crystal:created', crystal);
        return crystal;
    }

    private generateHash(code: string): string {
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            const char = code.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    private calculateImportance(reason: string, tags: string[]): number {
        let importance = 0.5;
        if (reason.toLowerCase().includes('major') || reason.toLowerCase().includes('important')) {
            importance += 0.3;
        }
        if (tags.includes('milestone') || tags.includes('release')) {
            importance += 0.2;
        }
        return Math.min(1, importance);
    }

    private analyzeFacets(code: string): CrystalFacet[] {
        const facets: CrystalFacet[] = [];
        const lines = code.split('\n');

        // Structure facet
        facets.push({
            id: 'facet_structure',
            aspect: 'structure',
            summary: `${lines.length} lines, ${(code.match(/class/g) || []).length} classes, ${(code.match(/function/g) || []).length} functions`,
            metrics: {
                lines: lines.length,
                classes: (code.match(/class/g) || []).length,
                functions: (code.match(/function/g) || []).length,
            },
        });

        // Logic facet
        facets.push({
            id: 'facet_logic',
            aspect: 'logic',
            summary: `Complexity indicators: ${(code.match(/if|else|for|while/g) || []).length} control structures`,
            metrics: {
                controlStructures: (code.match(/if|else|for|while/g) || []).length,
                nestingDepth: this.estimateNesting(code),
            },
        });

        // Style facet
        const avgLineLength = code.length / lines.length;
        facets.push({
            id: 'facet_style',
            aspect: 'style',
            summary: `Avg line: ${avgLineLength.toFixed(0)} chars, ${(code.match(/\/\//g) || []).length} comments`,
            metrics: {
                avgLineLength: Math.round(avgLineLength),
                comments: (code.match(/\/\//g) || []).length,
            },
        });

        return facets;
    }

    private estimateNesting(code: string): number {
        let maxDepth = 0;
        let currentDepth = 0;
        for (const char of code) {
            if (char === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (char === '}') {
                currentDepth--;
            }
        }
        return maxDepth;
    }

    private findConnections(newCrystal: TimeCrystal): void {
        for (const existing of this.crystals.values()) {
            const similarity = this.calculateSimilarity(newCrystal.code, existing.code);
            if (similarity > 0.5 && similarity < 1) {
                newCrystal.connections.push({
                    targetId: existing.id,
                    relationship: 'evolved-from',
                    changes: [`${Math.round((1 - similarity) * 100)}% different`],
                });
            }
        }
    }

    private calculateSimilarity(code1: string, code2: string): number {
        const set1 = new Set(code1.split(/\s+/));
        const set2 = new Set(code2.split(/\s+/));
        let common = 0;
        for (const word of set1) {
            if (set2.has(word)) common++;
        }
        return common / Math.max(set1.size, set2.size);
    }

    compare(crystalId1: string, crystalId2: string): CrystalDiff | undefined {
        const c1 = this.crystals.get(crystalId1);
        const c2 = this.crystals.get(crystalId2);
        if (!c1 || !c2) return undefined;

        const lines1 = new Set(c1.code.split('\n'));
        const lines2 = new Set(c2.code.split('\n'));

        const additions = Array.from(lines2).filter(l => !lines1.has(l)).slice(0, 10);
        const removals = Array.from(lines1).filter(l => !lines2.has(l)).slice(0, 10);

        return {
            crystal1Id: crystalId1,
            crystal2Id: crystalId2,
            additions,
            removals,
            modifications: [],
            similarity: this.calculateSimilarity(c1.code, c2.code),
        };
    }

    getCrystal(id: string): TimeCrystal | undefined {
        return this.crystals.get(id);
    }

    getAllCrystals(): TimeCrystal[] {
        return Array.from(this.crystals.values());
    }

    getTimeline(): { crystals: TimeCrystal[]; connections: TimeConnection[] } {
        const crystals = Array.from(this.crystals.values())
            .sort((a, b) => a.crystallizedAt.getTime() - b.crystallizedAt.getTime());
        const connections = crystals.flatMap(c => c.connections);
        return { crystals, connections };
    }

    getStats(): { totalCrystals: number; avgImportance: number; tagCounts: Record<string, number> } {
        const crystals = Array.from(this.crystals.values());
        const tagCounts: Record<string, number> = {};

        for (const c of crystals) {
            for (const tag of c.metadata.tags) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }

        return {
            totalCrystals: crystals.length,
            avgImportance: crystals.length > 0
                ? crystals.reduce((s, c) => s + c.metadata.importance, 0) / crystals.length
                : 0,
            tagCounts,
        };
    }
}

export const timeCrystalSnapshot = TimeCrystalSnapshot.getInstance();
