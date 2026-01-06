/**
 * 🗺️ Level Editor Generator
 * 
 * Generates level editors for games:
 * - Tile placement
 * - Entity spawning
 * - Event triggers
 * - JSON export
 */

import { EventEmitter } from 'events';

export interface LevelEditorConfig {
    tileSize: number;
    width: number;
    height: number;
    layers: string[];
    entityTypes: EntityTypeConfig[];
    tileTypes: TileTypeConfig[];
}

export interface EntityTypeConfig {
    id: string;
    name: string;
    icon: string;
    color: string;
    properties: { name: string; type: string; default: any }[];
}

export interface TileTypeConfig {
    id: number;
    name: string;
    color: string;
    solid: boolean;
}

export class LevelEditorGenerator extends EventEmitter {
    private static instance: LevelEditorGenerator;

    private constructor() { super(); }

    static getInstance(): LevelEditorGenerator {
        if (!LevelEditorGenerator.instance) {
            LevelEditorGenerator.instance = new LevelEditorGenerator();
        }
        return LevelEditorGenerator.instance;
    }

    generateEditorCode(config: LevelEditorConfig): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Level Editor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: #1a1a2e; 
            color: #fff;
            display: flex;
            height: 100vh;
        }
        #sidebar {
            width: 250px;
            background: #16213e;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        #canvas-container {
            flex: 1;
            overflow: auto;
            padding: 20px;
        }
        canvas {
            background: #0f3460;
            cursor: crosshair;
        }
        .panel {
            background: #0f3460;
            padding: 10px;
            border-radius: 5px;
        }
        .panel h3 {
            margin-bottom: 10px;
            font-size: 14px;
            color: #e94560;
        }
        .tile-btn, .entity-btn {
            display: inline-block;
            width: 40px;
            height: 40px;
            margin: 2px;
            border: 2px solid transparent;
            cursor: pointer;
            border-radius: 4px;
        }
        .tile-btn.active, .entity-btn.active {
            border-color: #e94560;
        }
        button {
            background: #e94560;
            color: #fff;
            border: none;
            padding: 10px 15px;
            cursor: pointer;
            border-radius: 5px;
            width: 100%;
            margin-top: 5px;
        }
        button:hover { background: #c73e54; }
        select, input {
            width: 100%;
            padding: 8px;
            background: #1a1a2e;
            border: 1px solid #0f3460;
            color: #fff;
            border-radius: 4px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div id="sidebar">
        <div class="panel">
            <h3>Tiles</h3>
            <div id="tiles"></div>
        </div>
        <div class="panel">
            <h3>Entities</h3>
            <div id="entities"></div>
        </div>
        <div class="panel">
            <h3>Layer</h3>
            <select id="layer">
                ${config.layers.map((l, i) => `<option value="${i}">${l}</option>`).join('')}
            </select>
        </div>
        <div class="panel">
            <h3>Tools</h3>
            <button onclick="editor.clear()">Clear Layer</button>
            <button onclick="editor.undo()">Undo</button>
            <button onclick="editor.redo()">Redo</button>
        </div>
        <div class="panel">
            <h3>File</h3>
            <button onclick="editor.save()">Save JSON</button>
            <button onclick="editor.load()">Load JSON</button>
            <input type="file" id="fileInput" style="display:none">
        </div>
    </div>
    <div id="canvas-container">
        <canvas id="canvas"></canvas>
    </div>

    <script>
const TILE_SIZE = ${config.tileSize};
const WIDTH = ${config.width};
const HEIGHT = ${config.height};
const TILES_X = Math.floor(WIDTH / TILE_SIZE);
const TILES_Y = Math.floor(HEIGHT / TILE_SIZE);

const tileTypes = ${JSON.stringify(config.tileTypes)};
const entityTypes = ${JSON.stringify(config.entityTypes)};

class LevelEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = WIDTH;
        this.canvas.height = HEIGHT;
        
        this.layers = [
            Array(TILES_Y).fill(null).map(() => Array(TILES_X).fill(0)),
            Array(TILES_Y).fill(null).map(() => Array(TILES_X).fill(0)),
            Array(TILES_Y).fill(null).map(() => Array(TILES_X).fill(0))
        ];
        this.entities = [];
        
        this.currentTile = 1;
        this.currentEntity = null;
        this.currentLayer = 0;
        this.mode = 'tile';
        
        this.history = [];
        this.historyIndex = -1;
        
        this.setupUI();
        this.setupEvents();
        this.render();
        this.saveState();
    }

    setupUI() {
        const tilesDiv = document.getElementById('tiles');
        tileTypes.forEach(tile => {
            const btn = document.createElement('div');
            btn.className = 'tile-btn' + (tile.id === this.currentTile ? ' active' : '');
            btn.style.background = tile.color;
            btn.title = tile.name;
            btn.onclick = () => this.selectTile(tile.id);
            tilesDiv.appendChild(btn);
        });

        const entitiesDiv = document.getElementById('entities');
        entityTypes.forEach(entity => {
            const btn = document.createElement('div');
            btn.className = 'entity-btn';
            btn.style.background = entity.color;
            btn.textContent = entity.icon;
            btn.title = entity.name;
            btn.onclick = () => this.selectEntity(entity.id);
            entitiesDiv.appendChild(btn);
        });

        document.getElementById('layer').onchange = (e) => {
            this.currentLayer = parseInt(e.target.value);
            this.render();
        };
    }

    setupEvents() {
        let isDrawing = false;

        this.canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            this.handleClick(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDrawing && this.mode === 'tile') {
                this.handleClick(e);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (isDrawing) {
                isDrawing = false;
                this.saveState();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') this.undo();
            if (e.ctrlKey && e.key === 'y') this.redo();
        });
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        if (x < 0 || x >= TILES_X || y < 0 || y >= TILES_Y) return;

        if (this.mode === 'tile') {
            this.layers[this.currentLayer][y][x] = this.currentTile;
        } else if (this.mode === 'entity') {
            this.entities.push({
                type: this.currentEntity,
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                properties: {}
            });
        }

        this.render();
    }

    selectTile(id) {
        this.currentTile = id;
        this.mode = 'tile';
        document.querySelectorAll('.tile-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === id);
        });
        document.querySelectorAll('.entity-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    selectEntity(id) {
        this.currentEntity = id;
        this.mode = 'entity';
        document.querySelectorAll('.tile-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    render() {
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Draw all layers
        for (let l = 0; l < this.layers.length; l++) {
            const alpha = l === this.currentLayer ? 1 : 0.5;
            this.ctx.globalAlpha = alpha;

            for (let y = 0; y < TILES_Y; y++) {
                for (let x = 0; x < TILES_X; x++) {
                    const tileId = this.layers[l][y][x];
                    if (tileId > 0) {
                        const tile = tileTypes.find(t => t.id === tileId);
                        if (tile) {
                            this.ctx.fillStyle = tile.color;
                            this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
        }

        this.ctx.globalAlpha = 1;

        // Draw entities
        this.entities.forEach(entity => {
            const type = entityTypes.find(e => e.id === entity.type);
            if (type) {
                this.ctx.fillStyle = type.color;
                this.ctx.beginPath();
                this.ctx.arc(entity.x, entity.y, TILE_SIZE / 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(type.icon, entity.x, entity.y + 4);
            }
        });

        // Draw grid
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        for (let x = 0; x <= TILES_X; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * TILE_SIZE, 0);
            this.ctx.lineTo(x * TILE_SIZE, HEIGHT);
            this.ctx.stroke();
        }
        for (let y = 0; y <= TILES_Y; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * TILE_SIZE);
            this.ctx.lineTo(WIDTH, y * TILE_SIZE);
            this.ctx.stroke();
        }
    }

    saveState() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push({
            layers: JSON.parse(JSON.stringify(this.layers)),
            entities: JSON.parse(JSON.stringify(this.entities))
        });
        this.historyIndex++;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.layers = JSON.parse(JSON.stringify(state.layers));
            this.entities = JSON.parse(JSON.stringify(state.entities));
            this.render();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.layers = JSON.parse(JSON.stringify(state.layers));
            this.entities = JSON.parse(JSON.stringify(state.entities));
            this.render();
        }
    }

    clear() {
        this.layers[this.currentLayer] = Array(TILES_Y).fill(null).map(() => Array(TILES_X).fill(0));
        this.render();
        this.saveState();
    }

    save() {
        const data = {
            tileSize: TILE_SIZE,
            width: WIDTH,
            height: HEIGHT,
            layers: this.layers,
            entities: this.entities
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'level.json';
        a.click();
    }

    load() {
        const input = document.getElementById('fileInput');
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = JSON.parse(event.target.result);
                this.layers = data.layers;
                this.entities = data.entities || [];
                this.render();
                this.saveState();
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

const editor = new LevelEditor();
    </script>
</body>
</html>
`;
    }

    getDefaultConfig(): LevelEditorConfig {
        return {
            tileSize: 32,
            width: 800,
            height: 600,
            layers: ['Background', 'Main', 'Foreground'],
            tileTypes: [
                { id: 0, name: 'Empty', color: 'transparent', solid: false },
                { id: 1, name: 'Ground', color: '#4a5568', solid: true },
                { id: 2, name: 'Grass', color: '#48bb78', solid: true },
                { id: 3, name: 'Stone', color: '#718096', solid: true },
                { id: 4, name: 'Water', color: '#4299e1', solid: false },
                { id: 5, name: 'Lava', color: '#f56565', solid: false }
            ],
            entityTypes: [
                { id: 'player', name: 'Player Spawn', icon: '👤', color: '#48bb78', properties: [] },
                { id: 'enemy', name: 'Enemy', icon: '👾', color: '#f56565', properties: [{ name: 'type', type: 'string', default: 'basic' }] },
                { id: 'coin', name: 'Coin', icon: '🪙', color: '#ecc94b', properties: [{ name: 'value', type: 'number', default: 10 }] },
                { id: 'chest', name: 'Chest', icon: '📦', color: '#9f7aea', properties: [] },
                { id: 'door', name: 'Door', icon: '🚪', color: '#ed8936', properties: [{ name: 'target', type: 'string', default: '' }] }
            ]
        };
    }
}

export const levelEditorGenerator = LevelEditorGenerator.getInstance();
