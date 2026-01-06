/**
 * Astral Code Navigator
 * 
 * Navigates the astral plane of code, finding hidden connections
 * and relationships that exist beyond the physical structure.
 */

import { EventEmitter } from 'events';

export interface AstralNavigation {
    id: string;
    startPoint: string;
    journey: AstralStep[];
    discoveries: AstralDiscovery[];
    enlightenment: number;
    createdAt: Date;
}

export interface AstralStep {
    location: string;
    plane: AstralPlane;
    duration: number;
    insights: string[];
}

export type AstralPlane =
    | 'physical'    // Actual code
    | 'ethereal'    // Patterns and structure
    | 'mental'      // Logic and algorithms
    | 'causal'      // Dependencies and effects
    | 'buddhic'     // Design intentions
    | 'atmic';      // Core purpose

export interface AstralDiscovery {
    type: 'connection' | 'pattern' | 'anomaly' | 'wisdom';
    description: string;
    significance: number;
    location: string;
}

export class AstralCodeNavigator extends EventEmitter {
    private static instance: AstralCodeNavigator;
    private navigations: Map<string, AstralNavigation> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): AstralCodeNavigator {
        if (!AstralCodeNavigator.instance) {
            AstralCodeNavigator.instance = new AstralCodeNavigator();
        }
        return AstralCodeNavigator.instance;
    }

    navigate(code: string, startPoint: string = 'beginning'): AstralNavigation {
        const journey = this.traversePlanes(code);
        const discoveries = this.makeDiscoveries(code, journey);
        const enlightenment = this.calculateEnlightenment(journey, discoveries);

        const navigation: AstralNavigation = {
            id: `astral_nav_${Date.now()}`,
            startPoint,
            journey,
            discoveries,
            enlightenment,
            createdAt: new Date(),
        };

        this.navigations.set(navigation.id, navigation);
        this.emit('navigation:complete', navigation);
        return navigation;
    }

    private traversePlanes(code: string): AstralStep[] {
        const steps: AstralStep[] = [];
        const planes: AstralPlane[] = ['physical', 'ethereal', 'mental', 'causal', 'buddhic', 'atmic'];

        for (const plane of planes) {
            steps.push({
                location: this.findLocationInPlane(code, plane),
                plane,
                duration: Math.random() * 10 + 1,
                insights: this.getInsightsForPlane(code, plane),
            });
        }

        return steps;
    }

    private findLocationInPlane(code: string, plane: AstralPlane): string {
        switch (plane) {
            case 'physical':
                return 'Source code structure';
            case 'ethereal':
                return code.includes('class') ? 'Class-based architecture' : 'Functional structure';
            case 'mental':
                return code.includes('if') ? 'Conditional logic center' : 'Pure function realm';
            case 'causal':
                return code.includes('import') ? 'Dependency network' : 'Self-contained module';
            case 'buddhic':
                return 'Design intention manifold';
            case 'atmic':
                return 'Core purpose nexus';
            default:
                return 'Unknown realm';
        }
    }

    private getInsightsForPlane(code: string, plane: AstralPlane): string[] {
        const insights: string[] = [];

        switch (plane) {
            case 'physical':
                insights.push(`Code spans ${code.split('\n').length} lines`);
                if (code.includes('export')) insights.push('Code exposes public API');
                break;
            case 'ethereal':
                if (code.includes('interface')) insights.push('Strong type contracts present');
                if (code.includes('class')) insights.push('OOP patterns manifest');
                break;
            case 'mental':
                const complexity = (code.match(/if|for|while|switch/g) || []).length;
                insights.push(`Cyclomatic complexity ~${complexity}`);
                break;
            case 'causal':
                const imports = (code.match(/import/g) || []).length;
                insights.push(`${imports} dependency connections`);
                break;
            case 'buddhic':
                insights.push('Design seeks maintainability and clarity');
                break;
            case 'atmic':
                insights.push('Ultimate purpose: solve problems elegantly');
                break;
        }

        return insights;
    }

    private makeDiscoveries(code: string, journey: AstralStep[]): AstralDiscovery[] {
        const discoveries: AstralDiscovery[] = [];

        // Hidden connection discovery
        if (code.includes('this.') && code.includes('super')) {
            discoveries.push({
                type: 'connection',
                description: 'Class inheritance chain detected',
                significance: 0.8,
                location: 'ethereal plane',
            });
        }

        // Pattern discovery
        if (code.includes('getInstance') || code.includes('_instance')) {
            discoveries.push({
                type: 'pattern',
                description: 'Singleton pattern manifests',
                significance: 0.7,
                location: 'mental plane',
            });
        }

        // Anomaly discovery
        if (code.includes('TODO') || code.includes('FIXME')) {
            discoveries.push({
                type: 'anomaly',
                description: 'Unresolved technical debt',
                significance: 0.6,
                location: 'physical plane',
            });
        }

        // Wisdom discovery
        if (code.includes('/**') && code.length > 500) {
            discoveries.push({
                type: 'wisdom',
                description: 'Well-documented code reveals experience',
                significance: 0.9,
                location: 'buddhic plane',
            });
        }

        return discoveries;
    }

    private calculateEnlightenment(journey: AstralStep[], discoveries: AstralDiscovery[]): number {
        const journeyFactor = journey.reduce((s, step) => s + step.insights.length * 0.1, 0);
        const discoveryFactor = discoveries.reduce((s, d) => s + d.significance * 0.15, 0);
        return Math.min(1, journeyFactor + discoveryFactor);
    }

    getNavigation(id: string): AstralNavigation | undefined {
        return this.navigations.get(id);
    }

    getStats(): { total: number; avgEnlightenment: number; discoveryTypes: Record<string, number> } {
        const navs = Array.from(this.navigations.values());
        const discoveryTypes: Record<string, number> = {};

        for (const nav of navs) {
            for (const d of nav.discoveries) {
                discoveryTypes[d.type] = (discoveryTypes[d.type] || 0) + 1;
            }
        }

        return {
            total: navs.length,
            avgEnlightenment: navs.length > 0
                ? navs.reduce((s, n) => s + n.enlightenment, 0) / navs.length
                : 0,
            discoveryTypes,
        };
    }
}

export const astralCodeNavigator = AstralCodeNavigator.getInstance();
