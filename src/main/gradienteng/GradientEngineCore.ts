/**
 * Gradient Engine - Dynamic gradient generation
 */
import { EventEmitter } from 'events';

export interface GradientStop { color: string; position: number; }
export interface Gradient { id: string; name: string; type: 'linear' | 'radial' | 'conic'; angle?: number; stops: GradientStop[]; css: string; }

export class GradientEngineCore extends EventEmitter {
    private static instance: GradientEngineCore;
    private gradients: Map<string, Gradient> = new Map();
    private constructor() { super(); this.initPresets(); }
    static getInstance(): GradientEngineCore { if (!GradientEngineCore.instance) GradientEngineCore.instance = new GradientEngineCore(); return GradientEngineCore.instance; }

    private initPresets(): void {
        const presets = [
            { name: 'sunset', stops: [{ color: '#f97316', position: 0 }, { color: '#ec4899', position: 50 }, { color: '#8b5cf6', position: 100 }] },
            { name: 'ocean', stops: [{ color: '#06b6d4', position: 0 }, { color: '#3b82f6', position: 100 }] },
            { name: 'aurora', stops: [{ color: '#22d3ee', position: 0 }, { color: '#a855f7', position: 50 }, { color: '#ec4899', position: 100 }] },
            { name: 'midnight', stops: [{ color: '#1e1b4b', position: 0 }, { color: '#312e81', position: 50 }, { color: '#4c1d95', position: 100 }] }
        ];
        presets.forEach(p => this.create('linear', p.name, p.stops, 135));
    }

    create(type: Gradient['type'], name: string, stops: GradientStop[], angle = 90): Gradient {
        const stopsStr = stops.map(s => `${s.color} ${s.position}%`).join(', ');
        const css = type === 'linear' ? `linear-gradient(${angle}deg, ${stopsStr})` : type === 'radial' ? `radial-gradient(circle, ${stopsStr})` : `conic-gradient(from ${angle}deg, ${stopsStr})`;
        const gradient: Gradient = { id: `grad_${Date.now()}`, name, type, angle, stops, css };
        this.gradients.set(gradient.id, gradient); this.emit('created', gradient); return gradient;
    }

    get(gradientId: string): Gradient | null { return this.gradients.get(gradientId) || null; }
    getByName(name: string): Gradient | null { return Array.from(this.gradients.values()).find(g => g.name === name) || null; }
    randomize(baseColors?: string[]): Gradient { const colors = baseColors || ['#3b82f6', '#8b5cf6', '#ec4899']; const stops = colors.map((c, i) => ({ color: c, position: (i / (colors.length - 1)) * 100 })); return this.create('linear', `random_${Date.now()}`, stops, Math.floor(Math.random() * 360)); }
    getAll(): Gradient[] { return Array.from(this.gradients.values()); }
}
export function getGradientEngineCore(): GradientEngineCore { return GradientEngineCore.getInstance(); }
