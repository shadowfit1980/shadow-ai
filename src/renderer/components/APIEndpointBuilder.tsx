import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Endpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    requestBody?: string;
    responseExample?: string;
    params?: { name: string; type: string; required: boolean }[];
}

interface APIProject {
    name: string;
    baseUrl: string;
    version: string;
    endpoints: Endpoint[];
}

export default function APIEndpointBuilder() {
    const [project, setProject] = useState<APIProject>({
        name: 'My API',
        baseUrl: '/api/v1',
        version: '1.0.0',
        endpoints: [
            {
                id: '1',
                method: 'GET',
                path: '/users',
                description: 'Get all users',
                responseExample: '[\n  { "id": 1, "name": "John Doe", "email": "john@example.com" }\n]',
                params: []
            },
            {
                id: '2',
                method: 'POST',
                path: '/users',
                description: 'Create a new user',
                requestBody: '{\n  "name": "string",\n  "email": "string"\n}',
                responseExample: '{ "id": 1, "name": "John Doe" }',
                params: []
            }
        ]
    });
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [codeFormat, setCodeFormat] = useState<'express' | 'fastapi' | 'nestjs' | 'openapi'>('express');

    const methodColors: Record<Endpoint['method'], string> = {
        GET: 'bg-green-500/20 text-green-400 border-green-500/30',
        POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        PUT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        PATCH: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        DELETE: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const addEndpoint = (endpoint: Omit<Endpoint, 'id'>) => {
        const newEndpoint: Endpoint = {
            ...endpoint,
            id: Math.random().toString(36).substr(2, 9)
        };
        setProject(prev => ({
            ...prev,
            endpoints: [...prev.endpoints, newEndpoint]
        }));
        setShowAddModal(false);
    };

    const deleteEndpoint = (id: string) => {
        setProject(prev => ({
            ...prev,
            endpoints: prev.endpoints.filter(e => e.id !== id)
        }));
        if (selectedEndpoint?.id === id) {
            setSelectedEndpoint(null);
        }
    };

    const generateCode = useCallback(() => {
        let code = '';

        switch (codeFormat) {
            case 'express':
                code = generateExpressCode(project);
                break;
            case 'fastapi':
                code = generateFastAPICode(project);
                break;
            case 'nestjs':
                code = generateNestJSCode(project);
                break;
            case 'openapi':
                code = generateOpenAPISpec(project);
                break;
        }

        setGeneratedCode(code);
    }, [project, codeFormat]);

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>🔌</span>
                        <span>API Endpoint Builder</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">{project.name} v{project.version}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={codeFormat}
                        onChange={e => setCodeFormat(e.target.value as any)}
                        className="cyber-input text-sm"
                    >
                        <option value="express">Express.js</option>
                        <option value="fastapi">FastAPI</option>
                        <option value="nestjs">NestJS</option>
                        <option value="openapi">OpenAPI Spec</option>
                    </select>
                    <button onClick={generateCode} className="cyber-button text-sm">
                        ⚡ Generate
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Endpoints List */}
                <div className="w-1/3 border-r border-gray-700 overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-300">
                            Endpoints ({project.endpoints.length})
                        </h3>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-xs px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                        >
                            + Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {project.endpoints.map(endpoint => (
                            <motion.div
                                key={endpoint.id}
                                layoutId={endpoint.id}
                                onClick={() => setSelectedEndpoint(endpoint)}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedEndpoint?.id === endpoint.id
                                        ? 'bg-gray-800 border border-neon-cyan/50'
                                        : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${methodColors[endpoint.method]}`}>
                                        {endpoint.method}
                                    </span>
                                    <span className="text-sm text-gray-300 font-mono">{endpoint.path}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 truncate">{endpoint.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Details / Generated Code */}
                <div className="flex-1 overflow-y-auto p-4">
                    {generatedCode ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-300">Generated Code</h3>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedCode);
                                    }}
                                    className="text-xs text-neon-cyan hover:underline"
                                >
                                    📋 Copy
                                </button>
                            </div>
                            <pre className="p-4 bg-gray-900 rounded-lg overflow-x-auto text-sm text-gray-300 font-mono">
                                {generatedCode}
                            </pre>
                            <button
                                onClick={() => setGeneratedCode('')}
                                className="mt-4 text-xs text-gray-500 hover:text-gray-400"
                            >
                                ← Back to endpoints
                            </button>
                        </div>
                    ) : selectedEndpoint ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${methodColors[selectedEndpoint.method]}`}>
                                        {selectedEndpoint.method}
                                    </span>
                                    <span className="text-lg font-mono text-white">{selectedEndpoint.path}</span>
                                </div>
                                <button
                                    onClick={() => deleteEndpoint(selectedEndpoint.id)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    🗑️ Delete
                                </button>
                            </div>

                            <p className="text-gray-400 mb-4">{selectedEndpoint.description}</p>

                            {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Parameters</h4>
                                    <div className="space-y-2">
                                        {selectedEndpoint.params.map(param => (
                                            <div key={param.name} className="flex items-center space-x-2 text-sm">
                                                <span className="text-neon-cyan font-mono">{param.name}</span>
                                                <span className="text-gray-500">:</span>
                                                <span className="text-gray-400">{param.type}</span>
                                                {param.required && <span className="text-red-400 text-xs">*required</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEndpoint.requestBody && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Request Body</h4>
                                    <pre className="p-3 bg-gray-900 rounded text-sm text-blue-300 font-mono">
                                        {selectedEndpoint.requestBody}
                                    </pre>
                                </div>
                            )}

                            {selectedEndpoint.responseExample && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Response Example</h4>
                                    <pre className="p-3 bg-gray-900 rounded text-sm text-green-300 font-mono">
                                        {selectedEndpoint.responseExample}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <div className="text-4xl mb-4">🔌</div>
                            <p>Select an endpoint or add a new one</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Endpoint Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddEndpointModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={addEndpoint}
                        methodColors={methodColors}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Add Endpoint Modal Component
function AddEndpointModal({
    onClose,
    onAdd,
    methodColors
}: {
    onClose: () => void;
    onAdd: (endpoint: Omit<Endpoint, 'id'>) => void;
    methodColors: Record<string, string>;
}) {
    const [method, setMethod] = useState<Endpoint['method']>('GET');
    const [path, setPath] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!path) return;
        onAdd({ method, path, description, params: [] });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="cyber-panel p-6 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-neon-cyan mb-4">Add Endpoint</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Method</label>
                        <div className="flex space-x-2">
                            {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMethod(m)}
                                    className={`px-3 py-1 rounded text-xs font-bold border transition-all ${method === m ? methodColors[m] : 'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Path</label>
                        <input
                            type="text"
                            value={path}
                            onChange={e => setPath(e.target.value)}
                            placeholder="/users/:id"
                            className="cyber-input w-full font-mono"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Get user by ID"
                            className="cyber-input w-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="cyber-button-secondary">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="cyber-button" disabled={!path}>
                        Add Endpoint
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Code generators
function generateExpressCode(project: APIProject): string {
    let code = `const express = require('express');\nconst router = express.Router();\n\n`;

    project.endpoints.forEach(endpoint => {
        const methodLower = endpoint.method.toLowerCase();
        code += `// ${endpoint.description}\n`;
        code += `router.${methodLower}('${endpoint.path}', async (req, res) => {\n`;
        code += `    try {\n`;
        code += `        // TODO: Implement ${endpoint.description}\n`;
        if (endpoint.responseExample) {
            code += `        res.json(${endpoint.responseExample.replace(/\n/g, '')});\n`;
        } else {
            code += `        res.json({ success: true });\n`;
        }
        code += `    } catch (error) {\n`;
        code += `        res.status(500).json({ error: error.message });\n`;
        code += `    }\n`;
        code += `});\n\n`;
    });

    code += `module.exports = router;`;
    return code;
}

function generateFastAPICode(project: APIProject): string {
    let code = `from fastapi import APIRouter, HTTPException\nfrom pydantic import BaseModel\n\nrouter = APIRouter()\n\n`;

    project.endpoints.forEach(endpoint => {
        const methodLower = endpoint.method.toLowerCase();
        const pathPythonic = endpoint.path.replace(/:(\w+)/g, '{$1}');
        code += `# ${endpoint.description}\n`;
        code += `@router.${methodLower}("${pathPythonic}")\n`;
        code += `async def ${endpoint.path.replace(/[/:]/g, '_').replace(/-/g, '_').slice(1)}():\n`;
        code += `    # TODO: Implement ${endpoint.description}\n`;
        code += `    return {"success": True}\n\n`;
    });

    return code;
}

function generateNestJSCode(project: APIProject): string {
    let code = `import { Controller, Get, Post, Put, Patch, Delete, Param, Body } from '@nestjs/common';\n\n`;
    code += `@Controller('${project.baseUrl}')\n`;
    code += `export class ApiController {\n\n`;

    project.endpoints.forEach(endpoint => {
        const decorator = endpoint.method.charAt(0) + endpoint.method.slice(1).toLowerCase();
        code += `    // ${endpoint.description}\n`;
        code += `    @${decorator}('${endpoint.path.replace(project.baseUrl, '')}')\n`;
        code += `    async ${endpoint.method.toLowerCase()}${endpoint.path.replace(/[/:]/g, '').replace(/-/g, '')}() {\n`;
        code += `        // TODO: Implement ${endpoint.description}\n`;
        code += `        return { success: true };\n`;
        code += `    }\n\n`;
    });

    code += `}`;
    return code;
}

function generateOpenAPISpec(project: APIProject): string {
    const spec: any = {
        openapi: '3.0.0',
        info: {
            title: project.name,
            version: project.version
        },
        paths: {}
    };

    project.endpoints.forEach(endpoint => {
        const pathKey = endpoint.path.replace(/:(\w+)/g, '{$1}');
        if (!spec.paths[pathKey]) {
            spec.paths[pathKey] = {};
        }

        spec.paths[pathKey][endpoint.method.toLowerCase()] = {
            summary: endpoint.description,
            responses: {
                '200': {
                    description: 'Successful response'
                }
            }
        };
    });

    return JSON.stringify(spec, null, 2);
}
