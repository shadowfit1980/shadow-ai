/**
 * Animation Library - Reusable animations
 */
import { EventEmitter } from 'events';

export interface Animation { id: string; name: string; keyframes: Record<string, unknown>[]; duration: number; easing: string; iterations: number | 'infinite'; }
export interface AnimationPreset { name: string; animation: Animation; category: 'entrance' | 'exit' | 'emphasis' | 'motion'; }

export class AnimationLibraryEngine extends EventEmitter {
    private static instance: AnimationLibraryEngine;
    private animations: Map<string, Animation> = new Map();
    private presets: AnimationPreset[] = [];
    private constructor() { super(); this.initPresets(); }
    static getInstance(): AnimationLibraryEngine { if (!AnimationLibraryEngine.instance) AnimationLibraryEngine.instance = new AnimationLibraryEngine(); return AnimationLibraryEngine.instance; }

    private initPresets(): void {
        const presets: AnimationPreset[] = [
            { name: 'fadeIn', animation: { id: 'a1', name: 'fadeIn', keyframes: [{ opacity: 0 }, { opacity: 1 }], duration: 300, easing: 'ease-out', iterations: 1 }, category: 'entrance' },
            { name: 'slideUp', animation: { id: 'a2', name: 'slideUp', keyframes: [{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], duration: 400, easing: 'ease-out', iterations: 1 }, category: 'entrance' },
            { name: 'scaleIn', animation: { id: 'a3', name: 'scaleIn', keyframes: [{ transform: 'scale(0.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], duration: 300, easing: 'ease-out', iterations: 1 }, category: 'entrance' },
            { name: 'pulse', animation: { id: 'a4', name: 'pulse', keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], duration: 600, easing: 'ease-in-out', iterations: 'infinite' }, category: 'emphasis' }
        ];
        presets.forEach(p => { this.presets.push(p); this.animations.set(p.name, p.animation); });
    }

    get(name: string): Animation | null { return this.animations.get(name) || null; }
    getByCategory(category: AnimationPreset['category']): AnimationPreset[] { return this.presets.filter(p => p.category === category); }
    create(animation: Animation): void { this.animations.set(animation.name, animation); }
    toCSS(name: string): string { const a = this.animations.get(name); if (!a) return ''; return `@keyframes ${name} { ${a.keyframes.map((k, i) => `${i * 100 / (a.keyframes.length - 1)}% { ${Object.entries(k).map(([p, v]) => `${p}: ${v}`).join('; ')} }`).join(' ')} }`; }
    getAll(): Animation[] { return Array.from(this.animations.values()); }
}
export function getAnimationLibraryEngine(): AnimationLibraryEngine { return AnimationLibraryEngine.getInstance(); }
