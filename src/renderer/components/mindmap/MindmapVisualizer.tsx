/**
 * Mindmap Visualizer Component
 * React component for viewing and editing code mindmaps
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MindmapVisualizer.css';

interface MindmapNode {
    id: string;
    label: string;
    type: string;
    position: { x: number; y: number };
    color: string;
    children: string[];
    collapsed: boolean;
}

interface Mindmap {
    id: string;
    name: string;
    rootNode: string;
    nodes: MindmapNode[];
    theme: { name: string; backgroundColor: string };
}

interface MindmapVisualizerProps {
    mindmapId?: string;
}

export const MindmapVisualizer: React.FC<MindmapVisualizerProps> = ({ mindmapId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mindmap, setMindmap] = useState<Mindmap | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [themes, setThemes] = useState<{ name: string }[]>([]);
    const [layouts] = useState(['radial', 'tree', 'hierarchical', 'galaxy']);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMindmapName, setNewMindmapName] = useState('');

    useEffect(() => {
        loadThemes();
        if (mindmapId) {
            loadMindmap(mindmapId);
        }
    }, [mindmapId]);

    useEffect(() => {
        if (mindmap && canvasRef.current) {
            renderMindmap();
        }
    }, [mindmap, zoom, pan]);

    const loadThemes = async () => {
        try {
            const themesData = await window.shadowAPI?.invoke('mindmap:get-themes');
            if (themesData) setThemes(themesData);
        } catch (error) {
            console.error('Failed to load themes:', error);
        }
    };

    const loadMindmap = async (id: string) => {
        try {
            const data = await window.shadowAPI?.invoke('mindmap:get', id);
            if (data) {
                const nodesArray = Array.isArray(data.nodes)
                    ? data.nodes
                    : Array.from((data.nodes as Map<string, MindmapNode>).values());
                setMindmap({ ...data, nodes: nodesArray });
            }
        } catch (error) {
            console.error('Failed to load mindmap:', error);
        }
    };

    const createMindmap = async () => {
        if (!newMindmapName.trim()) return;

        try {
            const created = await window.shadowAPI?.invoke('mindmap:create', newMindmapName, '', 'Modern');
            if (created) {
                loadMindmap(created.id);
                setShowCreateModal(false);
                setNewMindmapName('');
            }
        } catch (error) {
            console.error('Failed to create mindmap:', error);
        }
    };

    const applyLayout = async (layout: string) => {
        if (!mindmap) return;
        try {
            await window.shadowAPI?.invoke('mindmap:apply-layout', mindmap.id, layout);
            loadMindmap(mindmap.id);
        } catch (error) {
            console.error('Failed to apply layout:', error);
        }
    };

    const setTheme = async (themeName: string) => {
        if (!mindmap) return;
        try {
            await window.shadowAPI?.invoke('mindmap:set-theme', mindmap.id, themeName);
            loadMindmap(mindmap.id);
        } catch (error) {
            console.error('Failed to set theme:', error);
        }
    };

    const exportMindmap = async (format: string) => {
        if (!mindmap) return;
        try {
            const exported = await window.shadowAPI?.invoke('mindmap:export', mindmap.id, { type: format });
            console.log(`Exported as ${format}:`, exported);
            // Could trigger download here
        } catch (error) {
            console.error('Failed to export:', error);
        }
    };

    const renderMindmap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !mindmap) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Clear and fill background
        ctx.fillStyle = mindmap.theme.backgroundColor;
        ctx.fillRect(0, 0, rect.width, rect.height);

        const centerX = rect.width / 2 + pan.x;
        const centerY = rect.height / 2 + pan.y;

        // Draw connections first
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2 * zoom;

        for (const node of mindmap.nodes) {
            for (const childId of node.children) {
                const child = mindmap.nodes.find(n => n.id === childId);
                if (child) {
                    const x1 = centerX + node.position.x * zoom;
                    const y1 = centerY + node.position.y * zoom;
                    const x2 = centerX + child.position.x * zoom;
                    const y2 = centerY + child.position.y * zoom;

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);

                    // Bezier curve for nice connections
                    const cpX = (x1 + x2) / 2;
                    const cpY1 = y1;
                    const cpY2 = y2;
                    ctx.bezierCurveTo(cpX, cpY1, cpX, cpY2, x2, y2);

                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        for (const node of mindmap.nodes) {
            const x = centerX + node.position.x * zoom;
            const y = centerY + node.position.y * zoom;
            const radius = (node.id === mindmap.rootNode ? 40 : 30) * zoom;

            // Glow effect for selected node
            if (selectedNode === node.id) {
                ctx.shadowColor = node.color;
                ctx.shadowBlur = 20;
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur = 0;

            // Node label
            ctx.fillStyle = '#ffffff';
            ctx.font = `${12 * zoom}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const label = node.label.length > 15 ? node.label.slice(0, 12) + '...' : node.label;
            ctx.fillText(label, x, y);
        }
    }, [mindmap, zoom, pan, selectedNode]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.min(Math.max(z * delta, 0.2), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!mindmap || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const centerX = rect.width / 2 + pan.x;
        const centerY = rect.height / 2 + pan.y;

        for (const node of mindmap.nodes) {
            const x = centerX + node.position.x * zoom;
            const y = centerY + node.position.y * zoom;
            const radius = (node.id === mindmap.rootNode ? 40 : 30) * zoom;

            const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
            if (distance <= radius) {
                setSelectedNode(node.id);
                return;
            }
        }
        setSelectedNode(null);
    };

    return (
        <div className="mindmap-visualizer">
            <div className="mindmap-toolbar">
                <button onClick={() => setShowCreateModal(true)}>
                    ✨ New Mindmap
                </button>

                <div className="toolbar-group">
                    <span>Layout:</span>
                    <select onChange={e => applyLayout(e.target.value)}>
                        {layouts.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>

                <div className="toolbar-group">
                    <span>Theme:</span>
                    <select onChange={e => setTheme(e.target.value)}>
                        {themes.map(t => (
                            <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="toolbar-group">
                    <span>Zoom:</span>
                    <button onClick={() => setZoom(z => Math.min(z * 1.2, 5))}>+</button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.max(z * 0.8, 0.2))}>-</button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
                </div>

                <div className="toolbar-group">
                    <span>Export:</span>
                    <button onClick={() => exportMindmap('markdown')}>MD</button>
                    <button onClick={() => exportMindmap('mermaid')}>Mermaid</button>
                    <button onClick={() => exportMindmap('json')}>JSON</button>
                </div>
            </div>

            <div className="mindmap-canvas-container">
                <canvas
                    ref={canvasRef}
                    className="mindmap-canvas"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleClick}
                />

                {!mindmap && (
                    <div className="empty-state">
                        <h3>No Mindmap Selected</h3>
                        <p>Create a new mindmap or generate from code</p>
                        <button onClick={() => setShowCreateModal(true)}>
                            Create Mindmap
                        </button>
                    </div>
                )}
            </div>

            {selectedNode && mindmap && (
                <div className="node-details">
                    <h4>Node Details</h4>
                    {(() => {
                        const node = mindmap.nodes.find(n => n.id === selectedNode);
                        if (!node) return null;
                        return (
                            <>
                                <p><strong>Label:</strong> {node.label}</p>
                                <p><strong>Type:</strong> {node.type}</p>
                                <p><strong>Children:</strong> {node.children.length}</p>
                            </>
                        );
                    })()}
                </div>
            )}

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Create New Mindmap</h3>
                        <input
                            type="text"
                            placeholder="Mindmap name..."
                            value={newMindmapName}
                            onChange={e => setNewMindmapName(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="primary" onClick={createMindmap}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MindmapVisualizer;
