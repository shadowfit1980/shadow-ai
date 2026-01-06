/**
 * Sound Manager - Audio feedback
 */
import { EventEmitter } from 'events';

export interface Sound { id: string; name: string; path: string; volume: number; }

export class SoundManager extends EventEmitter {
    private static instance: SoundManager;
    private sounds: Map<string, Sound> = new Map();
    private enabled = true; private volume = 0.5;
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): SoundManager { if (!SoundManager.instance) SoundManager.instance = new SoundManager(); return SoundManager.instance; }
    private initDefaults(): void { this.register({ id: 'click', name: 'Click', path: 'click.wav', volume: 0.5 }); this.register({ id: 'success', name: 'Success', path: 'success.wav', volume: 0.5 }); this.register({ id: 'error', name: 'Error', path: 'error.wav', volume: 0.5 }); }
    register(sound: Sound): void { this.sounds.set(sound.id, sound); }
    play(id: string): void { if (!this.enabled) return; this.emit('play', id); }
    setEnabled(v: boolean): void { this.enabled = v; } setVolume(v: number): void { this.volume = Math.min(1, Math.max(0, v)); }
    getAll(): Sound[] { return Array.from(this.sounds.values()); }
}
export function getSoundManager(): SoundManager { return SoundManager.getInstance(); }
