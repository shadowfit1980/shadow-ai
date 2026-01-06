/**
 * 💾 Save Game Manager
 * 
 * Complete save/load system for games:
 * - Multiple save slots
 * - Auto-save
 * - Cloud sync ready
 * - Save versioning
 * - Data migration
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface SaveMetadata {
    slot: number;
    name: string;
    timestamp: number;
    playtime: number;
    version: string;
    thumbnail?: string;
    chapter?: string;
    location?: string;
}

export interface SaveData {
    metadata: SaveMetadata;
    player: PlayerSaveData;
    world: WorldSaveData;
    quests: QuestSaveData;
    inventory: InventorySaveData;
    settings: SettingsSaveData;
    custom: Record<string, any>;
}

export interface PlayerSaveData {
    id: string;
    name: string;
    level: number;
    xp: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    position: { x: number; y: number; z?: number };
    stats: Record<string, number>;
    skills: string[];
    equipment: Record<string, string>;
}

export interface WorldSaveData {
    currentMap: string;
    discoveredAreas: string[];
    unlockedDoors: string[];
    destroyedObjects: string[];
    npcStates: Record<string, any>;
    flags: Record<string, any>;
}

export interface QuestSaveData {
    active: string[];
    completed: string[];
    failed: string[];
    objectives: Record<string, Record<string, number>>;
}

export interface InventorySaveData {
    items: { id: string; quantity: number; slot?: number }[];
    gold: number;
    capacity: number;
}

export interface SettingsSaveData {
    difficulty: string;
    language: string;
    controls: Record<string, string>;
}

export class SaveGameManager extends EventEmitter {
    private static instance: SaveGameManager;
    private savePath: string;
    private maxSlots: number = 10;
    private autoSaveInterval: number = 300000; // 5 minutes
    private currentVersion: string = '1.0.0';
    private autoSaveTimer?: NodeJS.Timeout;

    private constructor() {
        super();
        this.savePath = path.join(process.env.HOME || '', '.game-saves');
    }

    static getInstance(): SaveGameManager {
        if (!SaveGameManager.instance) {
            SaveGameManager.instance = new SaveGameManager();
        }
        return SaveGameManager.instance;
    }

    // ========================================================================
    // SAVE OPERATIONS
    // ========================================================================

    async save(slot: number, data: Omit<SaveData, 'metadata'>, name?: string): Promise<boolean> {
        if (slot < 0 || slot >= this.maxSlots) {
            this.emit('saveError', { slot, error: 'Invalid slot number' });
            return false;
        }

        const saveData: SaveData = {
            metadata: {
                slot,
                name: name || `Save ${slot + 1}`,
                timestamp: Date.now(),
                playtime: data.custom?.playtime || 0,
                version: this.currentVersion,
                chapter: data.custom?.chapter,
                location: data.world?.currentMap
            },
            ...data
        };

        try {
            const filePath = this.getSlotPath(slot);
            await this.ensureSaveDirectory();

            // Create backup of existing save
            if (fs.existsSync(filePath)) {
                const backupPath = filePath + '.backup';
                fs.copyFileSync(filePath, backupPath);
            }

            // Write save file
            fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));

            this.emit('gameSaved', { slot, metadata: saveData.metadata });
            return true;
        } catch (error: any) {
            this.emit('saveError', { slot, error: error.message });
            return false;
        }
    }

    async load(slot: number): Promise<SaveData | null> {
        const filePath = this.getSlotPath(slot);

        try {
            if (!fs.existsSync(filePath)) {
                this.emit('loadError', { slot, error: 'Save file not found' });
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            let saveData: SaveData = JSON.parse(content);

            // Check version and migrate if needed
            if (saveData.metadata.version !== this.currentVersion) {
                saveData = this.migrateData(saveData);
            }

            this.emit('gameLoaded', { slot, metadata: saveData.metadata });
            return saveData;
        } catch (error: any) {
            this.emit('loadError', { slot, error: error.message });

            // Try backup
            const backupPath = filePath + '.backup';
            if (fs.existsSync(backupPath)) {
                try {
                    const content = fs.readFileSync(backupPath, 'utf-8');
                    return JSON.parse(content);
                } catch {
                    return null;
                }
            }

            return null;
        }
    }

    async delete(slot: number): Promise<boolean> {
        const filePath = this.getSlotPath(slot);

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);

                const backupPath = filePath + '.backup';
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }
            }

            this.emit('saveDeleted', { slot });
            return true;
        } catch (error: any) {
            this.emit('deleteError', { slot, error: error.message });
            return false;
        }
    }

    // ========================================================================
    // SLOT MANAGEMENT
    // ========================================================================

    async getAllSlots(): Promise<(SaveMetadata | null)[]> {
        const slots: (SaveMetadata | null)[] = [];

        for (let i = 0; i < this.maxSlots; i++) {
            const metadata = await this.getSlotMetadata(i);
            slots.push(metadata);
        }

        return slots;
    }

    async getSlotMetadata(slot: number): Promise<SaveMetadata | null> {
        const filePath = this.getSlotPath(slot);

        try {
            if (!fs.existsSync(filePath)) return null;

            const content = fs.readFileSync(filePath, 'utf-8');
            const saveData: SaveData = JSON.parse(content);
            return saveData.metadata;
        } catch {
            return null;
        }
    }

    getEmptySlot(): number {
        for (let i = 0; i < this.maxSlots; i++) {
            if (!fs.existsSync(this.getSlotPath(i))) {
                return i;
            }
        }
        return -1; // All slots full
    }

    // ========================================================================
    // AUTO-SAVE
    // ========================================================================

    startAutoSave(getGameState: () => Omit<SaveData, 'metadata'>): void {
        this.stopAutoSave();

        this.autoSaveTimer = setInterval(async () => {
            const state = getGameState();
            await this.save(0, state, 'Auto-Save'); // Slot 0 is auto-save
            this.emit('autoSaved', { timestamp: Date.now() });
        }, this.autoSaveInterval);
    }

    stopAutoSave(): void {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }
    }

    setAutoSaveInterval(minutes: number): void {
        this.autoSaveInterval = minutes * 60000;
    }

    // ========================================================================
    // DATA MIGRATION
    // ========================================================================

    private migrateData(saveData: SaveData): SaveData {
        const fromVersion = saveData.metadata.version;

        // Add migration logic for each version upgrade
        const migrations: Record<string, (data: SaveData) => SaveData> = {
            '0.9.0->1.0.0': (data) => {
                // Example migration
                if (!data.player.stats.luck) {
                    data.player.stats.luck = 10;
                }
                return data;
            }
        };

        // Apply relevant migrations
        let currentData = saveData;
        Object.entries(migrations).forEach(([key, migrate]) => {
            const [from] = key.split('->');
            if (from === fromVersion) {
                currentData = migrate(currentData);
            }
        });

        currentData.metadata.version = this.currentVersion;
        return currentData;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private getSlotPath(slot: number): string {
        return path.join(this.savePath, `save_${slot}.json`);
    }

    private async ensureSaveDirectory(): Promise<void> {
        if (!fs.existsSync(this.savePath)) {
            fs.mkdirSync(this.savePath, { recursive: true });
        }
    }

    setSavePath(newPath: string): void {
        this.savePath = newPath;
    }

    setMaxSlots(max: number): void {
        this.maxSlots = max;
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateSaveSystemCode(): string {
        return `
// Save Game System
class SaveManager {
    constructor(gameName) {
        this.storageKey = \`\${gameName}_saves\`;
        this.maxSlots = 10;
        this.version = '1.0.0';
    }

    // Save to localStorage (web) or file (desktop)
    save(slot, gameState, name = 'Save Game') {
        const saveData = {
            metadata: {
                slot,
                name,
                timestamp: Date.now(),
                version: this.version,
                location: gameState.currentLevel
            },
            player: this.serializePlayer(gameState.player),
            world: this.serializeWorld(gameState.world),
            inventory: this.serializeInventory(gameState.inventory),
            quests: this.serializeQuests(gameState.quests)
        };

        const saves = this.getAllSaves();
        saves[slot] = saveData;
        localStorage.setItem(this.storageKey, JSON.stringify(saves));
        
        console.log(\`Game saved to slot \${slot}\`);
        return true;
    }

    load(slot) {
        const saves = this.getAllSaves();
        const saveData = saves[slot];
        
        if (!saveData) {
            console.error(\`No save found in slot \${slot}\`);
            return null;
        }

        // Version check and migrate if needed
        if (saveData.metadata.version !== this.version) {
            this.migrate(saveData);
        }

        return saveData;
    }

    delete(slot) {
        const saves = this.getAllSaves();
        delete saves[slot];
        localStorage.setItem(this.storageKey, JSON.stringify(saves));
    }

    getAllSaves() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    getSaveList() {
        const saves = this.getAllSaves();
        return Object.entries(saves).map(([slot, data]) => ({
            slot: parseInt(slot),
            ...data.metadata
        }));
    }

    serializePlayer(player) {
        return {
            name: player.name,
            level: player.level,
            xp: player.xp,
            health: player.health,
            position: { x: player.x, y: player.y },
            stats: { ...player.stats },
            equipment: { ...player.equipment }
        };
    }

    serializeWorld(world) {
        return {
            map: world.currentMap,
            discovered: [...world.discoveredAreas],
            flags: { ...world.flags },
            npcStates: world.npcs.reduce((acc, npc) => {
                acc[npc.id] = npc.serialize();
                return acc;
            }, {})
        };
    }

    serializeInventory(inventory) {
        return {
            items: inventory.items.map(i => ({ id: i.id, quantity: i.quantity })),
            gold: inventory.gold
        };
    }

    serializeQuests(quests) {
        return {
            active: quests.active.map(q => q.id),
            completed: [...quests.completed],
            objectives: quests.active.reduce((acc, q) => {
                acc[q.id] = q.objectives.reduce((obj, o) => {
                    obj[o.id] = o.current;
                    return obj;
                }, {});
                return acc;
            }, {})
        };
    }

    // Auto-save
    startAutoSave(getState, intervalMinutes = 5) {
        setInterval(() => {
            this.save(0, getState(), 'Auto-Save');
        }, intervalMinutes * 60000);
    }
}

// Usage
const saves = new SaveManager('my-game');
saves.save(1, gameState, 'Before Boss Fight');
const loaded = saves.load(1);
if (loaded) game.loadState(loaded);`;
    }
}

export const saveGameManager = SaveGameManager.getInstance();
