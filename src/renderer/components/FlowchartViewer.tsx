import { useEffect, useState } from 'react';
import { useAppStore } from '../store';

// Simple flowchart generator without external dependencies
const generateFlowchartFromCode = (code: string): { nodes: any[], connections: any[] } => {
    if (!code || code.trim().length === 0) {
        return {
            nodes: [
                { id: 'start', label: 'No Code', x: 250, y: 50 },
                { id: 'end', label: 'Write code first', x: 250, y: 150 }
            ],
            connections: [{ from: 'start', to: 'end' }]
        };
    }

    const nodes: any[] = [];
    const connections: any[] = [];
    let yPos = 50;

    // Add start node
    nodes.push({ id: 'start', label: 'Start', x: 250, y: yPos, type: 'start' });
    yPos += 100;

    // Detect functions
    const functionMatches = Array.from(code.matchAll(/function\s+(\w+)\s*\(/g));
    const arrowFunctionMatches = Array.from(code.matchAll(/const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>/g));
    const allFunctions = [
        ...functionMatches.map(m => m[1]),
        ...arrowFunctionMatches.map(m => m[1])
    ];

    // Detect conditionals
    const ifStatements = (code.match(/if\s*\(/g) || []).length;
    const loops = (code.match(/(for|while)\s*\(/g) || []).length;

    let lastNodeId = 'start';

    if (allFunctions.length > 0) {
        allFunctions.forEach((funcName, i) => {
            const nodeId = `func_${i}`;
            nodes.push({
                id: nodeId,
                label: `${funcName}()`,
                x: 250,
                y: yPos,
                type: 'function'
            });
            connections.push({ from: lastNodeId, to: nodeId });
            lastNodeId = nodeId;
            yPos += 100;
        });
    }

    if (ifStatements > 0) {
        const nodeId = 'conditions';
        nodes.push({
            id: nodeId,
            label: `${ifStatements} Decision${ifStatements > 1 ? 's' : ''}`,
            x: 250,
            y: yPos,
            type: 'decision'
        });
        connections.push({ from: lastNodeId, to: nodeId });
        lastNodeId = nodeId;
        yPos += 100;
    }

    if (loops > 0) {
        const nodeId = 'loops';
        nodes.push({
            id: nodeId,
            label: `${loops} Loop${loops > 1 ? 's' : ''}`,
            x: 250,
            y: yPos,
            type: 'loop'
        });
        connections.push({ from: lastNodeId, to: nodeId });
        lastNodeId = nodeId;
        yPos += 100;
    }

    // Add end node
    nodes.push({ id: 'end', label: 'End', x: 250, y: yPos, type: 'end' });
    connections.push({ from: lastNodeId, to: 'end' });

    return { nodes, connections };
};

export default function FlowchartViewer() {
    const { codeContent } = useAppStore();
    const [flowchart, setFlowchart] = useState<{ nodes: any[], connections: any[] }>({ nodes: [], connections: [] });

    useEffect(() => {
        if (codeContent) {
            const generated = generateFlowchartFromCode(codeContent);
            setFlowchart(generated);
        }
    }, [codeContent]);

    const getNodeColor = (type: string) => {
        switch (type) {
            case 'start': return '#10b981';
            case 'end': return '#ef4444';
            case 'function': return '#3b82f6';
            case 'decision': return '#f59e0b';
            case 'loop': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getNodeShape = (type: string) => {
        switch (type) {
            case 'start':
            case 'end':
                return 'rounded-full';
            case 'decision':
                return 'transform rotate-45';
            default:
                return 'rounded-lg';
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Toolbar */}
            <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-neon-cyan font-semibold">Code Flowchart</span>
                    <span className="text-xs text-gray-500">Auto-generated from Code tab</span>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => {
                            const generated = generateFlowchartFromCode(codeContent);
                            setFlowchart(generated);
                        }}
                        className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Flowchart Display */}
            <div className="flex-1 overflow-auto p-8 bg-gray-900">
                <svg className="w-full" height={Math.max(400, flowchart.nodes.length * 100 + 100)}>
                    {/* Render connections */}
                    {flowchart.connections.map((conn, i) => {
                        const fromNode = flowchart.nodes.find(n => n.id === conn.from);
                        const toNode = flowchart.nodes.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) return null;

                        return (
                            <line
                                key={i}
                                x1={fromNode.x}
                                y1={fromNode.y + 30}
                                x2={toNode.x}
                                y2={toNode.y - 10}
                                stroke="#06ffa5"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}

                    {/* Arrow marker definition */}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="10"
                            refX="5"
                            refY="5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 5, 0 10" fill="#06ffa5" />
                        </marker>
                    </defs>

                    {/* Render nodes */}
                    {flowchart.nodes.map((node) => (
                        <g key={node.id}>
                            <rect
                                x={node.x - 80}
                                y={node.y - 25}
                                width="160"
                                height="50"
                                fill={getNodeColor(node.type)}
                                rx={node.type === 'start' || node.type === 'end' ? 25 : 8}
                                opacity="0.9"
                            />
                            <text
                                x={node.x}
                                y={node.y + 5}
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                fontWeight="bold"
                            >
                                {node.label}
                            </text>
                        </g>
                    ))}
                </svg>

                {flowchart.nodes.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <div className="text-6xl mb-4">📊</div>
                        <p>No code detected</p>
                        <p className="text-xs mt-2">Write some code in the Code tab to see the flowchart</p>
                    </div>
                )}
            </div>
        </div>
    );
}
