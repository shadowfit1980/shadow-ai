/**
 * 🗺️ Territory System
 * 
 * AI influence maps:
 * - Territory control
 * - Influence spreading
 * - Strategic zones
 */

import { EventEmitter } from 'events';

export interface TerritoryCell {
    x: number;
    y: number;
    owner: string | null;
    influence: number;
    type: 'open' | 'blocked' | 'resource';
}

export interface Territory {
    id: string;
    owner: string;
    cells: { x: number; y: number }[];
    influence: number;
}

export class TerritorySystem extends EventEmitter {
    private static instance: TerritorySystem;

    private constructor() { super(); }

    static getInstance(): TerritorySystem {
        if (!TerritorySystem.instance) {
            TerritorySystem.instance = new TerritorySystem();
        }
        return TerritorySystem.instance;
    }

    generateTerritoryCode(): string {
        return `
class TerritorySystem {
    constructor(width, height, cellSize = 32) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        
        // Influence map per faction
        this.factions = new Map();
        this.grid = this.createGrid();
    }

    createGrid() {
        const grid = [];
        for (let y = 0; y < this.rows; y++) {
            grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                grid[y][x] = {
                    x, y,
                    blocked: false,
                    influences: new Map() // faction -> influence value
                };
            }
        }
        return grid;
    }

    addFaction(id, color) {
        this.factions.set(id, { id, color, units: [], influence: 0 });
    }

    // Add influence source (unit, building, etc.)
    addInfluenceSource(factionId, x, y, strength, radius) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);

        // Spread influence in radius
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const cx = cellX + dx;
                const cy = cellY + dy;

                if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) continue;

                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > radius) continue;

                const influence = strength * (1 - dist / radius);
                const cell = this.grid[cy][cx];

                const current = cell.influences.get(factionId) || 0;
                cell.influences.set(factionId, current + influence);
            }
        }
    }

    // Calculate territory ownership
    calculateTerritories() {
        const territories = new Map();

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                if (cell.blocked) continue;

                let maxInfluence = 0;
                let owner = null;

                for (const [faction, influence] of cell.influences) {
                    if (influence > maxInfluence) {
                        maxInfluence = influence;
                        owner = faction;
                    }
                }

                if (owner && maxInfluence > 0.1) {
                    if (!territories.has(owner)) {
                        territories.set(owner, { cells: [], totalInfluence: 0 });
                    }
                    territories.get(owner).cells.push({ x, y, influence: maxInfluence });
                    territories.get(owner).totalInfluence += maxInfluence;
                }
            }
        }

        return territories;
    }

    // Get influence at position
    getInfluenceAt(x, y, factionId = null) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);

        if (cellX < 0 || cellX >= this.cols || cellY < 0 || cellY >= this.rows) {
            return factionId ? 0 : new Map();
        }

        const cell = this.grid[cellY][cellX];
        return factionId ? (cell.influences.get(factionId) || 0) : new Map(cell.influences);
    }

    // Get dominant faction at position
    getDominantFaction(x, y) {
        const influences = this.getInfluenceAt(x, y);
        let max = 0, dominant = null;
        
        for (const [faction, influence] of influences) {
            if (influence > max) {
                max = influence;
                dominant = faction;
            }
        }

        return { faction: dominant, influence: max };
    }

    // Decay all influences
    decay(factor = 0.95) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                for (const [faction, influence] of cell.influences) {
                    cell.influences.set(faction, influence * factor);
                    if (influence < 0.01) cell.influences.delete(faction);
                }
            }
        }
    }

    // Render influence map
    render(ctx, factionId = null) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.grid[y][x];
                
                if (factionId) {
                    const influence = cell.influences.get(factionId) || 0;
                    if (influence > 0.05) {
                        const faction = this.factions.get(factionId);
                        ctx.fillStyle = this.colorWithAlpha(faction?.color || '#ff0000', influence * 0.5);
                        ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    }
                } else {
                    // Show all factions with blending
                    const dom = this.getDominantCell(cell);
                    if (dom.faction) {
                        const faction = this.factions.get(dom.faction);
                        ctx.fillStyle = this.colorWithAlpha(faction?.color || '#888', Math.min(dom.influence * 0.5, 0.7));
                        ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    }
                }
            }
        }
    }

    getDominantCell(cell) {
        let max = 0, dominant = null;
        for (const [faction, influence] of cell.influences) {
            if (influence > max) { max = influence; dominant = faction; }
        }
        return { faction: dominant, influence: max };
    }

    colorWithAlpha(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
    }
}`;
    }
}

export const territorySystem = TerritorySystem.getInstance();
