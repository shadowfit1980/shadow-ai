/**
 * Motion Presets - Framer Motion presets
 */
import { EventEmitter } from 'events';

export interface MotionConfig { initial: Record<string, unknown>; animate: Record<string, unknown>; exit?: Record<string, unknown>; transition: { duration: number; ease: string | number[]; delay?: number }; }
export interface MotionPreset { name: string; config: MotionConfig; description: string; }

export class MotionPresetsEngine extends EventEmitter {
    private static instance: MotionPresetsEngine;
    private presets: Map<string, MotionPreset> = new Map();
    private constructor() { super(); this.initPresets(); }
    static getInstance(): MotionPresetsEngine { if (!MotionPresetsEngine.instance) MotionPresetsEngine.instance = new MotionPresetsEngine(); return MotionPresetsEngine.instance; }

    private initPresets(): void {
        const presets: MotionPreset[] = [
            { name: 'fadeInUp', config: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.3, ease: 'easeOut' } }, description: 'Fade in from below' },
            { name: 'scaleIn', config: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }, description: 'Scale in with fade' },
            { name: 'slideInRight', config: { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 }, transition: { duration: 0.3, ease: 'easeOut' } }, description: 'Slide in from right' },
            { name: 'stagger', config: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3, ease: 'easeOut', delay: 0.1 } }, description: 'Staggered children animation' },
            { name: 'spring', config: { initial: { scale: 0 }, animate: { scale: 1 }, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } }, description: 'Spring bounce effect' }
        ];
        presets.forEach(p => this.presets.set(p.name, p));
    }

    get(name: string): MotionPreset | null { return this.presets.get(name) || null; }
    getConfig(name: string): MotionConfig | null { return this.presets.get(name)?.config || null; }
    register(preset: MotionPreset): void { this.presets.set(preset.name, preset); }
    getAll(): MotionPreset[] { return Array.from(this.presets.values()); }
    toCode(name: string): string { const p = this.presets.get(name); if (!p) return ''; return `const ${name} = ${JSON.stringify(p.config, null, 2)};`; }
}
export function getMotionPresetsEngine(): MotionPresetsEngine { return MotionPresetsEngine.getInstance(); }
