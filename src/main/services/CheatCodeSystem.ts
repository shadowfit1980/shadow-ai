/**
 * 🎮 Cheat Code System
 * 
 * Debug cheats for development:
 * - Konami codes
 * - God mode, noclip
 * - Skip level, infinite resources
 */

import { EventEmitter } from 'events';

export interface CheatCode {
    id: string;
    name: string;
    sequence: string[];
    action: string;
    description: string;
    enabled: boolean;
}

export class CheatCodeSystem extends EventEmitter {
    private static instance: CheatCodeSystem;
    private cheats: Map<string, CheatCode> = new Map();
    private inputBuffer: string[] = [];
    private bufferTimeout: number = 1000;
    private lastInputTime: number = 0;

    private constructor() {
        super();
        this.initializeDefaultCheats();
    }

    static getInstance(): CheatCodeSystem {
        if (!CheatCodeSystem.instance) {
            CheatCodeSystem.instance = new CheatCodeSystem();
        }
        return CheatCodeSystem.instance;
    }

    private initializeDefaultCheats(): void {
        this.cheats.set('godMode', {
            id: 'godMode', name: 'God Mode',
            sequence: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'],
            action: 'toggleGodMode', description: 'Invincibility', enabled: false
        });

        this.cheats.set('noclip', {
            id: 'noclip', name: 'No Clip',
            sequence: ['n', 'o', 'c', 'l', 'i', 'p'],
            action: 'toggleNoclip', description: 'Walk through walls', enabled: false
        });

        this.cheats.set('infiniteLives', {
            id: 'infiniteLives', name: 'Infinite Lives',
            sequence: ['l', 'i', 'v', 'e', 's'],
            action: 'setInfiniteLives', description: 'Unlimited lives', enabled: false
        });

        this.cheats.set('skipLevel', {
            id: 'skipLevel', name: 'Skip Level',
            sequence: ['s', 'k', 'i', 'p'],
            action: 'skipToNextLevel', description: 'Skip to next level', enabled: false
        });

        this.cheats.set('allWeapons', {
            id: 'allWeapons', name: 'All Weapons',
            sequence: ['g', 'u', 'n', 's'],
            action: 'unlockAllWeapons', description: 'Unlock all weapons', enabled: false
        });

        this.cheats.set('maxMoney', {
            id: 'maxMoney', name: 'Max Money',
            sequence: ['m', 'o', 'n', 'e', 'y'],
            action: 'setMaxMoney', description: 'Maximum currency', enabled: false
        });

        this.cheats.set('speedBoost', {
            id: 'speedBoost', name: 'Speed Boost',
            sequence: ['f', 'a', 's', 't'],
            action: 'toggleSpeedBoost', description: '2x movement speed', enabled: false
        });

        this.cheats.set('debugMode', {
            id: 'debugMode', name: 'Debug Mode',
            sequence: ['d', 'e', 'b', 'u', 'g'],
            action: 'toggleDebugMode', description: 'Show debug info', enabled: false
        });
    }

    getCheats(): CheatCode[] {
        return Array.from(this.cheats.values());
    }

    getCheat(id: string): CheatCode | undefined {
        return this.cheats.get(id);
    }

    addCheat(cheat: CheatCode): void {
        this.cheats.set(cheat.id, cheat);
    }

    generateCheatSystemCode(): string {
        return `
class CheatCodeSystem {
    constructor(game) {
        this.game = game;
        this.cheats = new Map();
        this.inputBuffer = [];
        this.bufferTimeout = 1000;
        this.lastInputTime = 0;
        this.activeEffects = new Set();
        
        this.setupDefaultCheats();
        this.setupInput();
    }

    setupDefaultCheats() {
        // Konami code
        this.addCheat('konami', 
            ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'],
            () => this.toggleEffect('godMode', () => {
                this.game.player.invincible = !this.game.player.invincible;
            })
        );

        // Noclip
        this.addCheat('noclip',
            ['KeyN', 'KeyO', 'KeyC', 'KeyL', 'KeyI', 'KeyP'],
            () => this.toggleEffect('noclip', () => {
                this.game.player.noclip = !this.game.player.noclip;
            })
        );

        // Skip level
        this.addCheat('skip',
            ['KeyS', 'KeyK', 'KeyI', 'KeyP'],
            () => this.game.nextLevel?.()
        );

        // Max money
        this.addCheat('money',
            ['KeyM', 'KeyO', 'KeyN', 'KeyE', 'KeyY'],
            () => this.game.player.money = 999999
        );

        // Speed boost
        this.addCheat('speed',
            ['KeyF', 'KeyA', 'KeyS', 'KeyT'],
            () => this.toggleEffect('speed', () => {
                this.game.player.speedMultiplier = this.game.player.speedMultiplier === 1 ? 2 : 1;
            })
        );

        // Debug mode
        this.addCheat('debug',
            ['KeyD', 'KeyE', 'KeyB', 'KeyU', 'KeyG'],
            () => this.toggleEffect('debug', () => {
                this.game.debugMode = !this.game.debugMode;
            })
        );
    }

    addCheat(id, sequence, callback) {
        this.cheats.set(id, { sequence, callback, enabled: true });
    }

    setupInput() {
        document.addEventListener('keydown', (e) => this.handleInput(e.code));
    }

    handleInput(key) {
        const now = Date.now();
        
        // Clear buffer if too much time passed
        if (now - this.lastInputTime > this.bufferTimeout) {
            this.inputBuffer = [];
        }
        
        this.lastInputTime = now;
        this.inputBuffer.push(key);

        // Check against all cheats
        for (const [id, cheat] of this.cheats) {
            if (!cheat.enabled) continue;
            
            const seq = cheat.sequence;
            const bufferEnd = this.inputBuffer.slice(-seq.length);
            
            if (bufferEnd.length === seq.length && 
                bufferEnd.every((k, i) => k === seq[i])) {
                console.log('Cheat activated:', id);
                cheat.callback();
                this.inputBuffer = [];
                this.onCheatActivated?.(id);
            }
        }

        // Limit buffer size
        if (this.inputBuffer.length > 20) {
            this.inputBuffer = this.inputBuffer.slice(-10);
        }
    }

    toggleEffect(name, toggleFn) {
        if (this.activeEffects.has(name)) {
            this.activeEffects.delete(name);
            console.log('Effect disabled:', name);
        } else {
            this.activeEffects.add(name);
            console.log('Effect enabled:', name);
        }
        toggleFn();
    }

    isActive(effectName) {
        return this.activeEffects.has(effectName);
    }

    enable(cheatId) {
        const cheat = this.cheats.get(cheatId);
        if (cheat) cheat.enabled = true;
    }

    disable(cheatId) {
        const cheat = this.cheats.get(cheatId);
        if (cheat) cheat.enabled = false;
    }

    disableAll() {
        for (const cheat of this.cheats.values()) {
            cheat.enabled = false;
        }
        this.activeEffects.clear();
    }
}`;
    }
}

export const cheatCodeSystem = CheatCodeSystem.getInstance();
