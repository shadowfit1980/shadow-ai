/**
 * Enhanced Workflow Canvas
 * 
 * Advanced canvas with mini-map, zoom/pan, connection drawing, and execution visualization
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WorkflowNode {
    id: string;
    type: string;
    title: string;
    position: { x: number; y: number };
    status?: 'idle' | 'running' | 'completed' | 'failed';
}

interface WorkflowConnection {
    id: string;
    from: string;
    to: string;
    label?: string;
}

interface Props {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    onNodesChange: (nodes: WorkflowNode[]) => void;
    onConnectionsChange: (connections: WorkflowConnection[]) => void;
    onNodeClick?: (node: WorkflowNode) => void;
    selectedNodeId?: string;
    executing?: boolean;
    currentNodeId?: string;
}

const EnhancedWorkflowCanvas: React.FC<Props> = ({
    nodes,
    connections,
    onNodesChange,
    onConnectionsChange,
    onNodeClick,
    selectedNodeId,
    executing,
    currentNodeId,
}) => {
    // Zoom and pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Connection drawing state
    const [isDrawingConnection, setIsDrawingConnection] = useState(false);
    const [connectionStart, setConnectionStart] = useState<string | null>(null);
    const [connectionEnd, setConnectionEnd] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Handle zoom with mouse wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(2, Math.max(0.25, prev * delta)));
    }, []);

    // Handle pan with middle mouse or ctrl+drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
        if (isDrawingConnection) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                setConnectionEnd({
                    x: (e.clientX - rect.left - pan.x) / zoom,
                    y: (e.clientY - rect.top - pan.y) / zoom,
                });
            }
        }
    }, [isPanning, panStart, isDrawingConnection, pan, zoom]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Start drawing connection from a node's output port
    const handleConnectionStart = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDrawingConnection(true);
        setConnectionStart(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setConnectionEnd({ x: node.position.x + 75, y: node.position.y + 30 });
        }
    };

    // Complete connection to a node's input port
    const handleConnectionEnd = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDrawingConnection && connectionStart && connectionStart !== nodeId) {
            const newConnection: WorkflowConnection = {
                id: `conn_${Date.now()}`,
                from: connectionStart,
                to: nodeId,
            };
            onConnectionsChange([...connections, newConnection]);
        }
        setIsDrawingConnection(false);
        setConnectionStart(null);
    };

    // Delete a connection
    const handleDeleteConnection = (connId: string) => {
        onConnectionsChange(connections.filter(c => c.id !== connId));
    };

    // Get node position for SVG line
    const getNodeCenter = (nodeId: string): { x: number; y: number } => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        return { x: node.position.x + 75, y: node.position.y + 30 };
    };

    // Get node color based on type
    const getNodeColor = (type: string): string => {
        const colors: Record<string, string> = {
            trigger: '#f59e0b',
            action: '#3b82f6',
            condition: '#8b5cf6',
            agent: '#22c55e',
            output: '#ef4444',
        };
        return colors[type] || '#8b949e';
    };

    // Get status color for execution visualization
    const getStatusColor = (status?: string): string => {
        switch (status) {
            case 'running': return '#3b82f6';
            case 'completed': return '#22c55e';
            case 'failed': return '#ef4444';
            default: return 'transparent';
        }
    };

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(2, prev * 1.2));
    const handleZoomOut = () => setZoom(prev => Math.max(0.25, prev / 1.2));
    const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    return (
        <div style={styles.container}>
            {/* Main Canvas */}
            <div
                ref={canvasRef}
                style={styles.canvas}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        ...styles.canvasContent,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                    }}
                >
                    {/* SVG for connections */}
                    <svg ref={svgRef} style={styles.svg}>
                        {/* Existing connections */}
                        {connections.map(conn => {
                            const from = getNodeCenter(conn.from);
                            const to = getNodeCenter(conn.to);
                            const midX = (from.x + to.x) / 2;

                            return (
                                <g key={conn.id} onClick={() => handleDeleteConnection(conn.id)}>
                                    <path
                                        d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                                        fill="none"
                                        stroke="#58a6ff"
                                        strokeWidth="2"
                                        style={{ cursor: 'pointer' }}
                                    />
                                    {/* Arrow head */}
                                    <polygon
                                        points={`${to.x - 8},${to.y - 4} ${to.x},${to.y} ${to.x - 8},${to.y + 4}`}
                                        fill="#58a6ff"
                                    />
                                    {conn.label && (
                                        <text x={midX} y={(from.y + to.y) / 2 - 5} fill="#8b949e" fontSize="10" textAnchor="middle">
                                            {conn.label}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Drawing connection preview */}
                        {isDrawingConnection && connectionStart && (
                            <path
                                d={`M ${getNodeCenter(connectionStart).x} ${getNodeCenter(connectionStart).y} L ${connectionEnd.x} ${connectionEnd.y}`}
                                fill="none"
                                stroke="#58a6ff"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                        )}
                    </svg>

                    {/* Nodes */}
                    {nodes.map(node => (
                        <motion.div
                            key={node.id}
                            style={{
                                ...styles.node,
                                left: node.position.x,
                                top: node.position.y,
                                borderColor: getNodeColor(node.type),
                                boxShadow: selectedNodeId === node.id
                                    ? `0 0 0 2px ${getNodeColor(node.type)}, 0 0 20px ${getStatusColor(node.status)}`
                                    : node.status === 'running'
                                        ? `0 0 20px ${getStatusColor(node.status)}`
                                        : 'none',
                            }}
                            onClick={() => onNodeClick?.(node)}
                            drag
                            dragMomentum={false}
                            onDragEnd={(_, info) => {
                                onNodesChange(nodes.map(n =>
                                    n.id === node.id
                                        ? { ...n, position: { x: n.position.x + info.offset.x / zoom, y: n.position.y + info.offset.y / zoom } }
                                        : n
                                ));
                            }}
                        >
                            {/* Input port */}
                            <div
                                style={styles.inputPort}
                                onMouseUp={(e) => handleConnectionEnd(node.id, e)}
                            />

                            {/* Node content */}
                            <div style={{ ...styles.nodeHeader, backgroundColor: getNodeColor(node.type) }}>
                                {node.status === 'running' && <span style={styles.spinner}>⟳</span>}
                                {node.status === 'completed' && <span>✓</span>}
                                {node.status === 'failed' && <span>✗</span>}
                                <span>{node.title}</span>
                            </div>

                            {/* Output port */}
                            <div
                                style={styles.outputPort}
                                onMouseDown={(e) => handleConnectionStart(node.id, e)}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Zoom Controls */}
            <div style={styles.zoomControls}>
                <button onClick={handleZoomIn} style={styles.zoomBtn}>+</button>
                <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomOut} style={styles.zoomBtn}>-</button>
                <button onClick={handleResetZoom} style={styles.resetBtn}>Reset</button>
            </div>

            {/* Mini-map */}
            <div style={styles.minimap}>
                <div style={styles.minimapContent}>
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            style={{
                                ...styles.minimapNode,
                                left: node.position.x / 10,
                                top: node.position.y / 10,
                                backgroundColor: getNodeColor(node.type),
                            }}
                        />
                    ))}
                    {/* Viewport indicator */}
                    <div
                        style={{
                            ...styles.minimapViewport,
                            left: -pan.x / 10 / zoom,
                            top: -pan.y / 10 / zoom,
                            width: 80 / zoom,
                            height: 60 / zoom,
                        }}
                    />
                </div>
            </div>

            {/* Execution indicator */}
            {executing && (
                <div style={styles.executionBar}>
                    <span style={styles.executionDot} />
                    Executing workflow...
                    {currentNodeId && <span> (Node: {nodes.find(n => n.id === currentNodeId)?.title})</span>}
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' },
    canvas: {
        width: '100%',
        height: '100%',
        backgroundColor: '#0d1117',
        backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        cursor: 'grab',
        overflow: 'hidden',
    },
    canvasContent: { position: 'relative', width: '100%', height: '100%' },
    svg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' },
    node: {
        position: 'absolute',
        width: '150px',
        backgroundColor: '#161b22',
        borderRadius: '8px',
        border: '2px solid',
        cursor: 'pointer',
        overflow: 'visible',
    },
    nodeHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: '6px 6px 0 0',
    },
    inputPort: {
        position: 'absolute',
        left: -6,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 12,
        height: 12,
        backgroundColor: '#58a6ff',
        borderRadius: '50%',
        border: '2px solid #0d1117',
        cursor: 'crosshair',
    },
    outputPort: {
        position: 'absolute',
        right: -6,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 12,
        height: 12,
        backgroundColor: '#58a6ff',
        borderRadius: '50%',
        border: '2px solid #0d1117',
        cursor: 'crosshair',
    },
    zoomControls: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#161b22',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #30363d',
    },
    zoomBtn: {
        width: 28,
        height: 28,
        backgroundColor: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '4px',
        color: '#e6edf3',
        cursor: 'pointer',
        fontSize: '16px',
    },
    zoomLabel: { color: '#8b949e', fontSize: '12px', minWidth: '40px', textAlign: 'center' },
    resetBtn: {
        padding: '4px 8px',
        backgroundColor: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '4px',
        color: '#8b949e',
        cursor: 'pointer',
        fontSize: '11px',
    },
    minimap: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 120,
        height: 90,
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px',
        overflow: 'hidden',
    },
    minimapContent: { position: 'relative', width: '100%', height: '100%' },
    minimapNode: {
        position: 'absolute',
        width: 6,
        height: 4,
        borderRadius: 2,
    },
    minimapViewport: {
        position: 'absolute',
        border: '1px solid #58a6ff',
        backgroundColor: 'rgba(88, 166, 255, 0.1)',
        borderRadius: 2,
    },
    executionBar: {
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#1f6feb',
        padding: '8px 16px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '12px',
    },
    executionDot: {
        width: 8,
        height: 8,
        backgroundColor: '#fff',
        borderRadius: '50%',
        animation: 'pulse 1s infinite',
    },
    spinner: { animation: 'spin 1s linear infinite' },
};

export default EnhancedWorkflowCanvas;
