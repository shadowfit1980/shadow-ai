/**
 * 🎯 Spawn System
 * 
 * Entity spawning management:
 * - Spawn points
 * - Waves
 * - Timed spawns
 */

import { EventEmitter } from 'events';

export interface SpawnPoint {
    id: string;
    x: number;
    y: number;
    type: string;
    enabled: boolean;
}

export interface SpawnWave {
    entities: { type: string; count: number }[];
    delay: number;
    spawnInterval: number;
}

export class SpawnSystem extends EventEmitter {
    private static instance: SpawnSystem;

    private constructor() { super(); }

    static getInstance(): SpawnSystem {
        if (!SpawnSystem.instance) {
            SpawnSystem.instance = new SpawnSystem();
        }
        return SpawnSystem.instance;
    }

    generateSpawnCode(): string {
        return `
class SpawnSystem {
    constructor(game) {
        this.game = game;
        this.spawnPoints = new Map();
        this.waves = [];
        this.currentWave = 0;
        this.waveActive = false;
        this.spawnQueue = [];
        this.timers = [];
    }

    // Add spawn point
    addSpawnPoint(id, x, y, types = ['enemy']) {
        this.spawnPoints.set(id, {
            id, x, y,
            types: Array.isArray(types) ? types : [types],
            enabled: true,
            lastSpawn: 0
        });
    }

    // Remove spawn point
    removeSpawnPoint(id) {
        this.spawnPoints.delete(id);
    }

    // Enable/disable spawn point
    setSpawnPointEnabled(id, enabled) {
        const point = this.spawnPoints.get(id);
        if (point) point.enabled = enabled;
    }

    // Get random enabled spawn point for type
    getRandomSpawnPoint(type = null) {
        const valid = [];
        for (const point of this.spawnPoints.values()) {
            if (!point.enabled) continue;
            if (type && !point.types.includes(type)) continue;
            valid.push(point);
        }
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : null;
    }

    // Spawn entity at point
    spawnAt(pointId, entityType) {
        const point = this.spawnPoints.get(pointId);
        if (!point || !point.enabled) return null;

        const entity = this.game.spawn(entityType, point.x, point.y);
        point.lastSpawn = Date.now();
        
        this.onSpawn?.(entity, point);
        return entity;
    }

    // Spawn at random point
    spawnRandom(entityType) {
        const point = this.getRandomSpawnPoint(entityType);
        if (!point) return null;
        return this.spawnAt(point.id, entityType);
    }

    // Define wave
    addWave(config) {
        this.waves.push({
            entities: config.entities || [],
            delay: config.delay || 0,
            spawnInterval: config.spawnInterval || 500,
            onComplete: config.onComplete
        });
    }

    // Start wave system
    startWaves() {
        this.currentWave = 0;
        this.startWave(0);
    }

    // Start specific wave
    startWave(index) {
        if (index >= this.waves.length) {
            this.onAllWavesComplete?.();
            return;
        }

        const wave = this.waves[index];
        this.currentWave = index;
        this.waveActive = true;

        // Build spawn queue
        this.spawnQueue = [];
        for (const group of wave.entities) {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push(group.type);
            }
        }

        // Shuffle for variety
        this.shuffle(this.spawnQueue);

        this.onWaveStart?.(index, wave);

        // Start after delay
        setTimeout(() => this.processWaveQueue(wave), wave.delay);
    }

    processWaveQueue(wave) {
        if (this.spawnQueue.length === 0) {
            this.waveActive = false;
            wave.onComplete?.();
            this.onWaveComplete?.(this.currentWave);
            return;
        }

        const type = this.spawnQueue.shift();
        this.spawnRandom(type);

        setTimeout(() => this.processWaveQueue(wave), wave.spawnInterval);
    }

    // Next wave
    nextWave() {
        this.startWave(this.currentWave + 1);
    }

    // Timed spawning
    startTimedSpawn(entityType, interval, maxCount = Infinity) {
        let count = 0;
        const timer = setInterval(() => {
            if (count >= maxCount) {
                clearInterval(timer);
                return;
            }
            this.spawnRandom(entityType);
            count++;
        }, interval);
        
        this.timers.push(timer);
        return timer;
    }

    // Stop all timed spawns
    stopAllTimedSpawns() {
        this.timers.forEach(t => clearInterval(t));
        this.timers = [];
    }

    // Utility
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Callbacks
    onSpawn = null;
    onWaveStart = null;
    onWaveComplete = null;
    onAllWavesComplete = null;
}`;
    }
}

export const spawnSystem = SpawnSystem.getInstance();
