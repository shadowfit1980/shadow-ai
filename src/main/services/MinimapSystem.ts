/**
 * 🗺️ Minimap System
 * 
 * Auto-generated minimaps:
 * - Entity tracking
 * - Fog of war
 * - Zoom
 * - Icons
 */

import { EventEmitter } from 'events';

export interface MinimapConfig {
    width: number;
    height: number;
    worldWidth: number;
    worldHeight: number;
    fogOfWar: boolean;
}

export class MinimapSystem extends EventEmitter {
    private static instance: MinimapSystem;

    private constructor() { super(); }

    static getInstance(): MinimapSystem {
        if (!MinimapSystem.instance) {
            MinimapSystem.instance = new MinimapSystem();
        }
        return MinimapSystem.instance;
    }

    generateMinimapCode(): string {
        return `
class Minimap {
    constructor(config = {}) {
        this.width = config.width || 200;
        this.height = config.height || 200;
        this.worldWidth = config.worldWidth || 2000;
        this.worldHeight = config.worldHeight || 2000;
        
        this.x = config.x || 10;
        this.y = config.y || 10;
        
        this.fogOfWar = config.fogOfWar || false;
        this.explored = new Set();
        this.revealRadius = config.revealRadius || 100;
        
        this.entities = new Map();
        this.icons = new Map();
        this.terrain = null;
        
        this.zoom = 1;
        this.followPlayer = true;
        this.centerX = this.worldWidth / 2;
        this.centerY = this.worldHeight / 2;

        this.setupDefaultIcons();
    }

    setupDefaultIcons() {
        this.icons.set('player', { color: '#00ff00', shape: 'triangle', size: 8 });
        this.icons.set('enemy', { color: '#ff0000', shape: 'circle', size: 4 });
        this.icons.set('npc', { color: '#ffff00', shape: 'circle', size: 4 });
        this.icons.set('item', { color: '#00ffff', shape: 'square', size: 3 });
        this.icons.set('objective', { color: '#ff00ff', shape: 'diamond', size: 6 });
        this.icons.set('exit', { color: '#ffffff', shape: 'square', size: 5 });
    }

    setTerrain(imageData) {
        this.terrain = imageData;
    }

    registerEntity(id, type, x, y) {
        this.entities.set(id, { type, x, y });
    }

    updateEntity(id, x, y) {
        const entity = this.entities.get(id);
        if (entity) {
            entity.x = x;
            entity.y = y;
            
            // Reveal fog around player
            if (entity.type === 'player' && this.fogOfWar) {
                this.reveal(x, y);
            }
        }
    }

    removeEntity(id) {
        this.entities.delete(id);
    }

    reveal(worldX, worldY) {
        const gridSize = 20;
        const gx = Math.floor(worldX / gridSize);
        const gy = Math.floor(worldY / gridSize);
        const radius = Math.ceil(this.revealRadius / gridSize);
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    this.explored.add(\`\${gx + dx},\${gy + dy}\`);
                }
            }
        }
    }

    worldToMinimap(worldX, worldY) {
        const scaleX = this.width / this.worldWidth * this.zoom;
        const scaleY = this.height / this.worldHeight * this.zoom;
        
        const offsetX = (this.worldWidth / 2 - this.centerX) * scaleX;
        const offsetY = (this.worldHeight / 2 - this.centerY) * scaleY;
        
        return {
            x: worldX * scaleX + this.width / 2 - this.worldWidth / 2 * scaleX + offsetX,
            y: worldY * scaleY + this.height / 2 - this.worldHeight / 2 * scaleY + offsetY
        };
    }

    update(playerX, playerY) {
        if (this.followPlayer) {
            this.centerX = playerX;
            this.centerY = playerY;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Clip to minimap bounds
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.clip();

        // Draw terrain if available
        if (this.terrain) {
            const scale = this.width / this.worldWidth * this.zoom;
            const pos = this.worldToMinimap(0, 0);
            ctx.drawImage(this.terrain, pos.x, pos.y, 
                this.worldWidth * scale, this.worldHeight * scale);
        }

        // Draw fog of war
        if (this.fogOfWar) {
            this.renderFog(ctx);
        }

        // Draw entities
        for (const [id, entity] of this.entities) {
            const pos = this.worldToMinimap(entity.x, entity.y);
            
            // Skip if outside minimap
            if (pos.x < 0 || pos.x > this.width || pos.y < 0 || pos.y > this.height) continue;

            // Skip if in fog
            if (this.fogOfWar && !this.isRevealed(entity.x, entity.y)) continue;

            const icon = this.icons.get(entity.type) || this.icons.get('enemy');
            this.drawIcon(ctx, pos.x, pos.y, icon);
        }

        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width, this.height);

        ctx.restore();
    }

    isRevealed(worldX, worldY) {
        const gridSize = 20;
        const key = \`\${Math.floor(worldX / gridSize)},\${Math.floor(worldY / gridSize)}\`;
        return this.explored.has(key);
    }

    renderFog(ctx) {
        const gridSize = 20;
        const scale = this.width / this.worldWidth * this.zoom;
        const cellSize = gridSize * scale;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        
        for (let y = 0; y < this.worldHeight; y += gridSize) {
            for (let x = 0; x < this.worldWidth; x += gridSize) {
                if (!this.isRevealed(x, y)) {
                    const pos = this.worldToMinimap(x, y);
                    ctx.fillRect(pos.x, pos.y, cellSize + 1, cellSize + 1);
                }
            }
        }
    }

    drawIcon(ctx, x, y, icon) {
        ctx.fillStyle = icon.color;
        ctx.beginPath();

        switch (icon.shape) {
            case 'circle':
                ctx.arc(x, y, icon.size, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(x - icon.size, y - icon.size, icon.size * 2, icon.size * 2);
                break;
            case 'triangle':
                ctx.moveTo(x, y - icon.size);
                ctx.lineTo(x - icon.size, y + icon.size);
                ctx.lineTo(x + icon.size, y + icon.size);
                ctx.closePath();
                break;
            case 'diamond':
                ctx.moveTo(x, y - icon.size);
                ctx.lineTo(x + icon.size, y);
                ctx.lineTo(x, y + icon.size);
                ctx.lineTo(x - icon.size, y);
                ctx.closePath();
                break;
        }

        ctx.fill();
    }

    setZoom(zoom) {
        this.zoom = Math.max(0.5, Math.min(4, zoom));
    }

    click(mouseX, mouseY) {
        // Convert minimap click to world position
        const relX = mouseX - this.x;
        const relY = mouseY - this.y;
        
        if (relX >= 0 && relX < this.width && relY >= 0 && relY < this.height) {
            const scaleX = this.worldWidth / this.width / this.zoom;
            const scaleY = this.worldHeight / this.height / this.zoom;
            
            return {
                x: (relX - this.width / 2) * scaleX + this.centerX,
                y: (relY - this.height / 2) * scaleY + this.centerY
            };
        }
        return null;
    }
}`;
    }
}

export const minimapSystem = MinimapSystem.getInstance();
