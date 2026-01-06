/**
 * 🔊 Sound Effect Synthesizer
 * 
 * Procedural sound effects:
 * - Laser, explosion, coin
 * - Jump, hit, powerup
 * - Web Audio synthesis
 */

import { EventEmitter } from 'events';

export type SoundEffectType = 'laser' | 'explosion' | 'coin' | 'jump' | 'hit' | 'powerup' | 'death' | 'select' | 'confirm' | 'cancel';

export interface SoundEffectConfig {
    type: SoundEffectType;
    pitch?: number;
    duration?: number;
    volume?: number;
}

export class SoundEffectSynth extends EventEmitter {
    private static instance: SoundEffectSynth;

    private constructor() { super(); }

    static getInstance(): SoundEffectSynth {
        if (!SoundEffectSynth.instance) {
            SoundEffectSynth.instance = new SoundEffectSynth();
        }
        return SoundEffectSynth.instance;
    }

    generateSoundCode(type: SoundEffectType): string {
        switch (type) {
            case 'laser':
                return this.getLaserCode();
            case 'explosion':
                return this.getExplosionCode();
            case 'coin':
                return this.getCoinCode();
            case 'jump':
                return this.getJumpCode();
            case 'hit':
                return this.getHitCode();
            case 'powerup':
                return this.getPowerupCode();
            case 'death':
                return this.getDeathCode();
            case 'select':
                return this.getSelectCode();
            case 'confirm':
                return this.getConfirmCode();
            case 'cancel':
                return this.getCancelCode();
            default:
                return '';
        }
    }

    private getLaserCode(): string {
        return `
function playLaser(ctx, dest) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
}`;
    }

    private getExplosionCode(): string {
        return `
function playExplosion(ctx, dest) {
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1000, ctx.currentTime);
    lowpass.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(dest);
    noise.start(ctx.currentTime);
}`;
    }

    private getCoinCode(): string {
        return `
function playCoin(ctx, dest) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'square';
    osc2.type = 'square';
    
    osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.1);
    osc1.stop(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.3);
}`;
    }

    private getJumpCode(): string {
        return `
function playJump(ctx, dest) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
}`;
    }

    private getHitCode(): string {
        return `
function playHit(ctx, dest) {
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 2000;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    
    noise.connect(highpass);
    highpass.connect(gain);
    gain.connect(dest);
    noise.start(ctx.currentTime);
}`;
    }

    private getPowerupCode(): string {
        return `
function playPowerup(ctx, dest) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    gain.connect(dest);
    
    const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.15);
    });
}`;
    }

    private getDeathCode(): string {
        return `
function playDeath(ctx, dest) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
}`;
    }

    private getSelectCode(): string {
        return `
function playSelect(ctx, dest) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 440;
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
}`;
    }

    private getConfirmCode(): string {
        return `
function playConfirm(ctx, dest) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 523.25; // C5
    osc2.frequency.value = 659.25; // E5
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.2);
}`;
    }

    private getCancelCode(): string {
        return `
function playCancel(ctx, dest) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.setValueAtTime(200, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
}`;
    }

    generateSoundManagerCode(): string {
        return `
class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 1.0;
        this.muted = false;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(vol) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
    }

    mute() {
        this.muted = true;
        this.masterGain.gain.value = 0;
    }

    unmute() {
        this.muted = false;
        this.masterGain.gain.value = 1.0;
    }

    // Add all sound effect functions here
    ${this.getLaserCode()}
    ${this.getExplosionCode()}
    ${this.getCoinCode()}
    ${this.getJumpCode()}
    ${this.getHitCode()}
    ${this.getPowerupCode()}
}`;
    }

    getAllEffects(): SoundEffectType[] {
        return ['laser', 'explosion', 'coin', 'jump', 'hit', 'powerup', 'death', 'select', 'confirm', 'cancel'];
    }
}

export const soundEffectSynth = SoundEffectSynth.getInstance();
