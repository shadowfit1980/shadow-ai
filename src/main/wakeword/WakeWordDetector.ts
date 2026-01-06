/**
 * Wake Word - Activation detection
 */
import { EventEmitter } from 'events';

export interface WakeWordEvent { timestamp: number; word: string; confidence: number; }

export class WakeWordDetector extends EventEmitter {
    private static instance: WakeWordDetector;
    private wakeWords: string[] = ['hey shadow', 'ok shadow', 'shadow'];
    private enabled = true;
    private sensitivity = 0.7;
    private detections: WakeWordEvent[] = [];
    private constructor() { super(); }
    static getInstance(): WakeWordDetector { if (!WakeWordDetector.instance) WakeWordDetector.instance = new WakeWordDetector(); return WakeWordDetector.instance; }

    setEnabled(enabled: boolean): void { this.enabled = enabled; }
    isEnabled(): boolean { return this.enabled; }
    setSensitivity(sens: number): void { this.sensitivity = Math.max(0.1, Math.min(1.0, sens)); }
    setWakeWords(words: string[]): void { this.wakeWords = words.map(w => w.toLowerCase()); }
    getWakeWords(): string[] { return [...this.wakeWords]; }

    detect(transcript: string): WakeWordEvent | null {
        if (!this.enabled) return null;
        const t = transcript.toLowerCase();
        const matched = this.wakeWords.find(w => t.includes(w));
        if (matched) { const event: WakeWordEvent = { timestamp: Date.now(), word: matched, confidence: 0.9 }; this.detections.push(event); this.emit('detected', event); return event; }
        return null;
    }

    getHistory(): WakeWordEvent[] { return [...this.detections]; }
}
export function getWakeWordDetector(): WakeWordDetector { return WakeWordDetector.getInstance(); }
