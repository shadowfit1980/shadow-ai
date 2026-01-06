/**
 * Gesture Manager - Touch gestures
 */
import { EventEmitter } from 'events';

export interface Gesture { id: string; name: string; type: 'swipe' | 'pinch' | 'tap' | 'long-press'; action: string; }

export class GestureManager extends EventEmitter {
    private static instance: GestureManager;
    private gestures: Map<string, Gesture> = new Map();
    private enabled = true;
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): GestureManager { if (!GestureManager.instance) GestureManager.instance = new GestureManager(); return GestureManager.instance; }
    private initDefaults(): void { this.register({ id: 'swipe-left', name: 'Swipe Left', type: 'swipe', action: 'nav.back' }); this.register({ id: 'swipe-right', name: 'Swipe Right', type: 'swipe', action: 'nav.forward' }); this.register({ id: 'pinch-zoom', name: 'Pinch Zoom', type: 'pinch', action: 'view.zoom' }); }
    register(gesture: Gesture): void { this.gestures.set(gesture.id, gesture); }
    setEnabled(v: boolean): void { this.enabled = v; }
    isEnabled(): boolean { return this.enabled; }
    getAll(): Gesture[] { return Array.from(this.gestures.values()); }
}
export function getGestureManager(): GestureManager { return GestureManager.getInstance(); }
