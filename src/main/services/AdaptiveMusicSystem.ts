/**
 * 🎵 Adaptive Music System
 * 
 * Dynamic music based on gameplay:
 * - Intensity tracking
 * - Layer mixing
 * - Smooth transitions
 */

import { EventEmitter } from 'events';

export type IntensityLevel = 'ambient' | 'exploration' | 'tension' | 'combat' | 'boss';

export interface MusicLayer {
    id: string;
    name: string;
    minIntensity: number;
    maxIntensity: number;
    volume: number;
}

export class AdaptiveMusicSystem extends EventEmitter {
    private static instance: AdaptiveMusicSystem;

    private constructor() { super(); }

    static getInstance(): AdaptiveMusicSystem {
        if (!AdaptiveMusicSystem.instance) {
            AdaptiveMusicSystem.instance = new AdaptiveMusicSystem();
        }
        return AdaptiveMusicSystem.instance;
    }

    generateAdaptiveMusicCode(): string {
        return `
class AdaptiveMusicSystem {
    constructor(ctx) {
        this.ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        
        this.intensity = 0;
        this.targetIntensity = 0;
        this.smoothing = 0.05;
        
        this.layers = new Map();
        this.currentTrack = null;
        
        this.intensityEvents = {
            enemySpotted: 0.3,
            combat: 0.6,
            bossEncounter: 1.0,
            playerHurt: 0.2,
            victory: -0.5,
            safe: -0.3
        };
    }

    // Add music layer
    addLayer(id, config) {
        const layer = {
            id,
            buffer: null,
            source: null,
            gain: this.ctx.createGain(),
            minIntensity: config.minIntensity || 0,
            maxIntensity: config.maxIntensity || 1,
            volume: config.volume || 1,
            loop: config.loop !== false
        };
        
        layer.gain.connect(this.masterGain);
        this.layers.set(id, layer);
        
        return layer;
    }

    // Load audio file for layer
    async loadLayerAudio(layerId, url) {
        const layer = this.layers.get(layerId);
        if (!layer) return;

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        layer.buffer = await this.ctx.decodeAudioData(arrayBuffer);
    }

    // Start all layers
    start() {
        for (const layer of this.layers.values()) {
            if (!layer.buffer) continue;
            
            layer.source = this.ctx.createBufferSource();
            layer.source.buffer = layer.buffer;
            layer.source.loop = layer.loop;
            layer.source.connect(layer.gain);
            layer.source.start(0);
            
            // Initial volume based on intensity
            this.updateLayerVolume(layer);
        }
    }

    // Stop all layers
    stop() {
        for (const layer of this.layers.values()) {
            if (layer.source) {
                layer.source.stop();
                layer.source = null;
            }
        }
    }

    // Add intensity (from game events)
    addIntensity(amount) {
        this.targetIntensity = Math.min(1, Math.max(0, this.targetIntensity + amount));
    }

    // Set intensity directly
    setIntensity(value) {
        this.targetIntensity = Math.min(1, Math.max(0, value));
    }

    // Trigger game event
    triggerEvent(eventType) {
        const delta = this.intensityEvents[eventType] || 0;
        this.addIntensity(delta);
    }

    // Update (call each frame)
    update(dt) {
        // Smooth intensity
        this.intensity += (this.targetIntensity - this.intensity) * this.smoothing;
        
        // Natural decay
        this.targetIntensity *= 0.995;
        
        // Update layer volumes
        for (const layer of this.layers.values()) {
            this.updateLayerVolume(layer);
        }
    }

    updateLayerVolume(layer) {
        if (!layer.source) return;

        let volume = 0;
        
        if (this.intensity >= layer.minIntensity && this.intensity <= layer.maxIntensity) {
            // Full volume within range
            volume = layer.volume;
        } else if (this.intensity < layer.minIntensity) {
            // Fade in as approaching min
            const dist = layer.minIntensity - this.intensity;
            volume = Math.max(0, layer.volume * (1 - dist * 5));
        } else {
            // Fade out as exceeding max
            const dist = this.intensity - layer.maxIntensity;
            volume = Math.max(0, layer.volume * (1 - dist * 5));
        }

        // Smooth volume transition
        const currentTime = this.ctx.currentTime;
        layer.gain.gain.linearRampToValueAtTime(volume, currentTime + 0.1);
    }

    // Get current intensity level as string
    getIntensityLevel() {
        if (this.intensity < 0.2) return 'ambient';
        if (this.intensity < 0.4) return 'exploration';
        if (this.intensity < 0.6) return 'tension';
        if (this.intensity < 0.85) return 'combat';
        return 'boss';
    }

    // Preset: Standard 3-layer setup
    setupStandardLayers() {
        this.addLayer('ambient', { minIntensity: 0, maxIntensity: 0.5, volume: 0.4 });
        this.addLayer('action', { minIntensity: 0.3, maxIntensity: 0.8, volume: 0.6 });
        this.addLayer('intense', { minIntensity: 0.6, maxIntensity: 1.0, volume: 0.8 });
    }

    // Master volume
    setMasterVolume(value) {
        this.masterGain.gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.1);
    }

    // Resume context (needed after user interaction)
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}`;
    }

    getIntensityLevels(): IntensityLevel[] {
        return ['ambient', 'exploration', 'tension', 'combat', 'boss'];
    }
}

export const adaptiveMusicSystem = AdaptiveMusicSystem.getInstance();
