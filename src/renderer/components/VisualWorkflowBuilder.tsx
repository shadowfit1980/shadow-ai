import { useState, useCallback } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Connection,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'input',
        data: { label: 'Start Trigger' },
        position: { x: 250, y: 25 },
        style: { background: '#1f2937', color: '#fff', border: '1px solid #06b6d4' }
    },
    {
        id: '2',
        data: { label: 'Analyze Code' },
        position: { x: 100, y: 125 },
        style: { background: '#1f2937', color: '#fff', border: '1px solid #06b6d4' }
    },
    {
        id: '3',
        type: 'output',
        data: { label: 'Generate Report' },
        position: { x: 250, y: 250 },
        style: { background: '#1f2937', color: '#fff', border: '1px solid #06b6d4' }
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#06b6d4' } },
    { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#06b6d4' } },
];

export default function VisualWorkflowBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isRunning, setIsRunning] = useState(false);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { stroke: '#06b6d4' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
        }, eds)),
        [setEdges]
    );

    const runWorkflow = () => {
        setIsRunning(true);
        setTimeout(() => setIsRunning(false), 3000);
    };

    const addNode = (type: string) => {
        const id = Math.random().toString();
        const newNode: Node = {
            id,
            data: { label: `${type} Node` },
            position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
            style: { background: '#1f2937', color: '#fff', border: '1px solid #06b6d4' }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <div className="h-full flex flex-col cyber-panel">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>⚡</span>
                        <span>Workflow Builder</span>
                    </h2>
                    <div className="h-6 w-px bg-gray-700" />
                    <div className="flex space-x-2">
                        <button onClick={() => addNode('Action')} className="cyber-button-secondary text-xs">
                            + Action
                        </button>
                        <button onClick={() => addNode('Condition')} className="cyber-button-secondary text-xs">
                            + Condition
                        </button>
                        <button onClick={() => addNode('Loop')} className="cyber-button-secondary text-xs">
                            + Loop
                        </button>
                        <button onClick={() => addNode('AI Task')} className="cyber-button-secondary text-xs text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
                            + AI Task
                        </button>
                    </div>
                </div>
                <button
                    onClick={runWorkflow}
                    disabled={isRunning}
                    className={`cyber-button text-sm ${isRunning ? 'animate-pulse' : ''}`}
                >
                    {isRunning ? 'Running...' : '▶ Run Workflow'}
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-gray-900 relative">
                <div style={{ height: '100%', width: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        className="bg-gray-900"
                    >
                        <Controls className="bg-gray-800 text-white border-gray-700" />
                        <MiniMap
                            nodeStrokeColor="#06b6d4"
                            nodeColor="#1f2937"
                            maskColor="rgba(0,0,0,0.6)"
                            className="bg-gray-800 border-gray-700"
                        />
                        <Background color="#374151" gap={16} />
                    </ReactFlow>
                </div>

                <div className="absolute bottom-4 left-4 p-3 bg-gray-800/90 rounded-lg border border-gray-700 backdrop-blur-sm z-10">
                    <p className="text-xs text-gray-400">
                        {nodes.length} nodes • {edges.length} connections
                    </p>
                </div>

                {isRunning && (
                    <div className="absolute top-4 right-4 p-3 bg-green-900/90 rounded-lg border border-green-500/50 backdrop-blur-sm z-10 animate-fade-in-down">
                        <p className="text-sm text-green-400 flex items-center space-x-2">
                            <span>⚡</span>
                            <span>Executing workflow steps...</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
