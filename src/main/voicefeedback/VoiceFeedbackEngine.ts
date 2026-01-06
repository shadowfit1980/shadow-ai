/**
 * Voice Feedback - Audio responses
 */
import { EventEmitter } from 'events';

export interface FeedbackSound { id: string; name: string; type: 'beep' | 'chime' | 'speech' | 'tone'; data?: string; }

export class VoiceFeedbackEngine extends EventEmitter {
    private static instance: VoiceFeedbackEngine;
    private sounds: Map<string, FeedbackSound> = new Map();
    private enabled = true;
    private volume = 0.5;
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): VoiceFeedbackEngine { if (!VoiceFeedbackEngine.instance) VoiceFeedbackEngine.instance = new VoiceFeedbackEngine(); return VoiceFeedbackEngine.instance; }

    private initDefaults(): void {
        const defaults: FeedbackSound[] = [
            { id: 'start', name: 'Start Listening', type: 'beep' },
            { id: 'stop', name: 'Stop Listening', type: 'beep' },
            { id: 'success', name: 'Success', type: 'chime' },
            { id: 'error', name: 'Error', type: 'tone' }
        ];
        defaults.forEach(s => this.sounds.set(s.id, s));
    }

    setEnabled(enabled: boolean): void { this.enabled = enabled; }
    setVolume(vol: number): void { this.volume = Math.max(0, Math.min(1, vol)); }
    play(soundId: string): boolean { if (!this.enabled) return false; const s = this.sounds.get(soundId); if (!s) return false; this.emit('play', { sound: s, volume: this.volume }); return true; }
    speak(text: string): boolean { if (!this.enabled) return false; this.emit('speak', { text, volume: this.volume }); return true; }
    add(id: string, name: string, type: FeedbackSound['type'], data?: string): FeedbackSound { const sound: FeedbackSound = { id, name, type, data }; this.sounds.set(id, sound); return sound; }
}
export function getVoiceFeedbackEngine(): VoiceFeedbackEngine { return VoiceFeedbackEngine.getInstance(); }
