/**
 * 🎨 Visual Game Designer UI
 * 
 * React component for visual game creation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './VisualGameDesigner.css';

interface GameObject {
    id: string;
    type: 'player' | 'enemy' | 'platform' | 'item' | 'trigger';
    x: number;
    y: number;
    width: number;
    height: number;
    properties: Record<string, any>;
}

interface GameLevel {
    name: string;
    width: number;
    height: number;
    objects: GameObject[];
}

interface VisualGameDesignerProps {
    onExport?: (level: GameLevel) => void;
}

export const VisualGameDesigner: React.FC<VisualGameDesignerProps> = ({ onExport }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [level, setLevel] = useState<GameLevel>({
        name: 'Level 1',
        width: 1600,
        height: 900,
        objects: []
    });
    const [selectedTool, setSelectedTool] = useState<string>('select');
    const [selectedObject, setSelectedObject] = useState<GameObject | null>(null);
    const [gridSize, setGridSize] = useState(32);
    const [showGrid, setShowGrid] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const tools = [
        { id: 'select', icon: '🔍', name: 'Select' },
        { id: 'player', icon: '🧍', name: 'Player' },
        { id: 'enemy', icon: '👾', name: 'Enemy' },
        { id: 'platform', icon: '▬', name: 'Platform' },
        { id: 'item', icon: '⭐', name: 'Item' },
        { id: 'trigger', icon: '🔲', name: 'Trigger' },
        { id: 'delete', icon: '🗑️', name: 'Delete' }
    ];

    const objectColors: Record<string, string> = {
        player: '#00ff00',
        enemy: '#ff0000',
        platform: '#888888',
        item: '#ffff00',
        trigger: '#00ffff'
    };

    const snapToGrid = useCallback((value: number) => {
        return Math.round(value / gridSize) * gridSize;
    }, [gridSize]);

    const screenToWorld = useCallback((screenX: number, screenY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left - offset.x) / zoom,
            y: (screenY - rect.top - offset.y) / zoom
        };
    }, [offset, zoom]);

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        const world = screenToWorld(e.clientX, e.clientY);
        const x = snapToGrid(world.x);
        const y = snapToGrid(world.y);

        if (selectedTool === 'select') {
            // Find clicked object
            const clicked = level.objects.find(obj =>
                x >= obj.x && x < obj.x + obj.width &&
                y >= obj.y && y < obj.y + obj.height
            );
            setSelectedObject(clicked || null);
        } else if (selectedTool === 'delete') {
            setLevel(prev => ({
                ...prev,
                objects: prev.objects.filter(obj =>
                    !(x >= obj.x && x < obj.x + obj.width &&
                        y >= obj.y && y < obj.y + obj.height)
                )
            }));
        } else if (['player', 'enemy', 'platform', 'item', 'trigger'].includes(selectedTool)) {
            const newObject: GameObject = {
                id: `obj_${Date.now()}`,
                type: selectedTool as any,
                x,
                y,
                width: selectedTool === 'platform' ? gridSize * 4 : gridSize,
                height: gridSize,
                properties: {}
            };
            setLevel(prev => ({ ...prev, objects: [...prev.objects, newObject] }));
        }
    }, [selectedTool, level.objects, screenToWorld, snapToGrid]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(4, Math.max(0.25, prev * delta)));
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(zoom, zoom);

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, level.width, level.height);

        // Grid
        if (showGrid) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1 / zoom;
            for (let x = 0; x <= level.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, level.height);
                ctx.stroke();
            }
            for (let y = 0; y <= level.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(level.width, y);
                ctx.stroke();
            }
        }

        // Objects
        level.objects.forEach(obj => {
            ctx.fillStyle = objectColors[obj.type] || '#fff';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

            // Selection highlight
            if (selectedObject?.id === obj.id) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2 / zoom;
                ctx.strokeRect(obj.x - 2, obj.y - 2, obj.width + 4, obj.height + 4);
            }
        });

        ctx.restore();
    }, [level, offset, zoom, gridSize, showGrid, selectedObject]);

    useEffect(() => {
        draw();
    }, [draw]);

    const handleExport = () => {
        onExport?.(level);
        console.log('Exported level:', JSON.stringify(level, null, 2));
    };

    const generateCode = () => {
        let code = `// Generated Level: ${level.name}\n\n`;
        code += `const level = {\n`;
        code += `  width: ${level.width},\n`;
        code += `  height: ${level.height},\n`;
        code += `  objects: [\n`;

        level.objects.forEach(obj => {
            code += `    { type: '${obj.type}', x: ${obj.x}, y: ${obj.y}, width: ${obj.width}, height: ${obj.height} },\n`;
        });

        code += `  ]\n};\n`;
        return code;
    };

    return (
        <div className="visual-game-designer">
            <div className="toolbar">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
                        onClick={() => setSelectedTool(tool.id)}
                        title={tool.name}
                    >
                        {tool.icon}
                    </button>
                ))}
                <span className="separator" />
                <button onClick={() => setShowGrid(!showGrid)}>
                    {showGrid ? '🔲' : '⬜'}
                </button>
                <button onClick={() => setZoom(1)}>1:1</button>
                <button onClick={handleExport}>📤 Export</button>
            </div>

            <div className="canvas-container">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    onClick={handleCanvasClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                />
            </div>

            <div className="properties-panel">
                <h3>Level: {level.name}</h3>
                <div>Objects: {level.objects.length}</div>
                <div>Zoom: {Math.round(zoom * 100)}%</div>

                {selectedObject && (
                    <div className="object-props">
                        <h4>{selectedObject.type}</h4>
                        <label>
                            X: <input type="number" value={selectedObject.x}
                                onChange={e => {
                                    const newX = parseInt(e.target.value);
                                    setLevel(prev => ({
                                        ...prev,
                                        objects: prev.objects.map(o =>
                                            o.id === selectedObject.id ? { ...o, x: newX } : o
                                        )
                                    }));
                                }}
                            />
                        </label>
                        <label>
                            Y: <input type="number" value={selectedObject.y}
                                onChange={e => {
                                    const newY = parseInt(e.target.value);
                                    setLevel(prev => ({
                                        ...prev,
                                        objects: prev.objects.map(o =>
                                            o.id === selectedObject.id ? { ...o, y: newY } : o
                                        )
                                    }));
                                }}
                            />
                        </label>
                        <label>
                            Width: <input type="number" value={selectedObject.width}
                                onChange={e => {
                                    const newW = parseInt(e.target.value);
                                    setLevel(prev => ({
                                        ...prev,
                                        objects: prev.objects.map(o =>
                                            o.id === selectedObject.id ? { ...o, width: newW } : o
                                        )
                                    }));
                                }}
                            />
                        </label>
                    </div>
                )}

                <button onClick={() => console.log(generateCode())}>
                    📋 Copy Code
                </button>
            </div>
        </div>
    );
};

export default VisualGameDesigner;
