/**
 * Bioluminescent Code Visualizer
 * 
 * Makes code "glow" based on activity, complexity, and importance,
 * creating a living visualization of the codebase.
 */

import { EventEmitter } from 'events';

export interface BioluminescentView {
    id: string;
    code: string;
    glowMap: GlowPoint[];
    hotspots: Hotspot[];
    pulses: Pulse[];
    ambientGlow: number;
    createdAt: Date;
}

export interface GlowPoint {
    line: number;
    intensity: number;
    color: string;
    reason: string;
}

export interface Hotspot {
    id: string;
    location: { start: number; end: number };
    temperature: number;
    type: 'complexity' | 'activity' | 'importance' | 'risk';
    description: string;
}

export interface Pulse {
    origin: number;
    radius: number;
    frequency: number;
    decay: number;
}

export class BioluminescentCodeVisualizer extends EventEmitter {
    private static instance: BioluminescentCodeVisualizer;
    private views: Map<string, BioluminescentView> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): BioluminescentCodeVisualizer {
        if (!BioluminescentCodeVisualizer.instance) {
            BioluminescentCodeVisualizer.instance = new BioluminescentCodeVisualizer();
        }
        return BioluminescentCodeVisualizer.instance;
    }

    illuminate(code: string): BioluminescentView {
        const glowMap = this.calculateGlowMap(code);
        const hotspots = this.findHotspots(code);
        const pulses = this.generatePulses(hotspots);

        const view: BioluminescentView = {
            id: `bio_${Date.now()}`,
            code,
            glowMap,
            hotspots,
            pulses,
            ambientGlow: this.calculateAmbientGlow(code),
            createdAt: new Date(),
        };

        this.views.set(view.id, view);
        this.emit('view:created', view);
        return view;
    }

    private calculateGlowMap(code: string): GlowPoint[] {
        const lines = code.split('\n');
        const glowMap: GlowPoint[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let intensity = 0.1;
            let color = '#1a1a2e';
            let reason = 'ambient';

            // Increase glow for important constructs
            if (line.includes('function') || line.includes('class')) {
                intensity = 0.8;
                color = '#00ff88';
                reason = 'definition';
            } else if (line.includes('export')) {
                intensity = 0.7;
                color = '#00d4ff';
                reason = 'public interface';
            } else if (line.includes('if') || line.includes('switch')) {
                intensity = 0.5;
                color = '#ffaa00';
                reason = 'decision point';
            } else if (line.includes('try') || line.includes('catch')) {
                intensity = 0.6;
                color = '#ff6b6b';
                reason = 'error handling';
            } else if (line.includes('async') || line.includes('await')) {
                intensity = 0.6;
                color = '#c56cf0';
                reason = 'async operation';
            } else if (line.includes('//')) {
                intensity = 0.3;
                color = '#696969';
                reason = 'documentation';
            }

            if (intensity > 0.1) {
                glowMap.push({ line: i, intensity, color, reason });
            }
        }

        return glowMap;
    }

    private findHotspots(code: string): Hotspot[] {
        const hotspots: Hotspot[] = [];
        const lines = code.split('\n');

        // Find complexity hotspots
        let nestingLevel = 0;
        let maxNesting = 0;
        let maxNestingLine = 0;

        for (let i = 0; i < lines.length; i++) {
            nestingLevel += (lines[i].match(/{/g) || []).length;
            nestingLevel -= (lines[i].match(/}/g) || []).length;
            if (nestingLevel > maxNesting) {
                maxNesting = nestingLevel;
                maxNestingLine = i;
            }
        }

        if (maxNesting > 3) {
            hotspots.push({
                id: `hotspot_complex_${Date.now()}`,
                location: { start: maxNestingLine, end: maxNestingLine + 10 },
                temperature: Math.min(1, maxNesting / 5),
                type: 'complexity',
                description: `High nesting depth: ${maxNesting} levels`,
            });
        }

        // Find long lines as risk hotspots
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 120) {
                hotspots.push({
                    id: `hotspot_risk_${i}`,
                    location: { start: i, end: i },
                    temperature: Math.min(1, lines[i].length / 200),
                    type: 'risk',
                    description: `Long line: ${lines[i].length} characters`,
                });
                break;
            }
        }

        // Find important hotspots (exports)
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('export default') || lines[i].includes('export class')) {
                hotspots.push({
                    id: `hotspot_important_${i}`,
                    location: { start: i, end: i + 20 },
                    temperature: 0.8,
                    type: 'importance',
                    description: 'Main export point',
                });
                break;
            }
        }

        return hotspots;
    }

    private generatePulses(hotspots: Hotspot[]): Pulse[] {
        return hotspots.map(h => ({
            origin: h.location.start,
            radius: (h.location.end - h.location.start) * 2,
            frequency: h.temperature,
            decay: 0.1,
        }));
    }

    private calculateAmbientGlow(code: string): number {
        const hasTypes = code.includes(':') && (code.includes('string') || code.includes('number'));
        const hasComments = code.includes('//') || code.includes('/*');
        const hasTests = code.includes('test') || code.includes('describe');

        let glow = 0.2;
        if (hasTypes) glow += 0.2;
        if (hasComments) glow += 0.2;
        if (hasTests) glow += 0.2;

        return Math.min(0.8, glow);
    }

    getView(id: string): BioluminescentView | undefined {
        return this.views.get(id);
    }

    getStats(): { total: number; avgAmbient: number; hotspotCount: number } {
        const views = Array.from(this.views.values());
        return {
            total: views.length,
            avgAmbient: views.length > 0
                ? views.reduce((s, v) => s + v.ambientGlow, 0) / views.length
                : 0,
            hotspotCount: views.reduce((s, v) => s + v.hotspots.length, 0),
        };
    }
}

export const bioluminescentCodeVisualizer = BioluminescentCodeVisualizer.getInstance();
