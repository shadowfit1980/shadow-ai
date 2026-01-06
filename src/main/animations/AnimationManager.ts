/**
 * Animation Manager - UI animations
 */
import { EventEmitter } from 'events';

export interface Animation { id: string; name: string; duration: number; easing: string; }

export class AnimationManager extends EventEmitter {
    private static instance: AnimationManager;
    private animations: Map<string, Animation> = new Map();
    private enabled = true;
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): AnimationManager { if (!AnimationManager.instance) AnimationManager.instance = new AnimationManager(); return AnimationManager.instance; }
    private initDefaults(): void { this.register({ id: 'fade', name: 'Fade', duration: 200, easing: 'ease' }); this.register({ id: 'slide', name: 'Slide', duration: 300, easing: 'ease-out' }); this.register({ id: 'scale', name: 'Scale', duration: 150, easing: 'ease-in-out' }); }
    register(anim: Animation): void { this.animations.set(anim.id, anim); }
    get(id: string): Animation | null { return this.animations.get(id) || null; }
    setEnabled(v: boolean): void { this.enabled = v; this.emit('changed', 'enabled', v); }
    isEnabled(): boolean { return this.enabled; }
    getAll(): Animation[] { return Array.from(this.animations.values()); }
}
export function getAnimationManager(): AnimationManager { return AnimationManager.getInstance(); }
