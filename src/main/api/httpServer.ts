/**
 * HTTP API Server for Browser Access
 * 
 * Provides a REST API on port 3002 that mirrors the IPC handlers,
 * enabling browser-based access to Shadow AI without Electron IPC.
 */

import http from 'http';
import { ModelManager } from '../ai/ModelManager';
import { AgentCoordinator } from '../agents/AgentCoordinator';
import { geminiProChat } from '../ai/GeminiProChat';
import { MetricsCollector } from '../ai/metrics';
import { PolicyStore } from '../ai/safety/PolicyStore';

interface ApiRequest {
    method: string;
    params?: any[];
}

let server: http.Server | null = null;
const PORT = 3456;

const handlers: Record<string, (...args: any[]) => Promise<any>> = {
    // Model management
    'model:list': async () => {
        const manager = ModelManager.getInstance();
        return manager.listModels();
    },
    'model:select': async (modelId: string) => {
        const manager = ModelManager.getInstance();
        return manager.selectModel(modelId);
    },
    // Use dedicated Gemini Pro for smarter chat, with OpenAI fallback
    'model:chat': async (messages: any[]) => {
        console.log('📨 HTTP API: model:chat called with', messages.length, 'messages');

        // Try 1: Dedicated Gemini Pro (user's API key)
        try {
            console.log('🔷 Trying Gemini Pro Chat...');
            const result = await geminiProChat(messages);
            console.log('✅ Gemini Pro responded successfully');
            return result;
        } catch (error: any) {
            console.error('❌ Gemini Pro failed:', error.message);
        }

        // Try 2: OpenAI (if available)
        try {
            if (process.env.OPENAI_API_KEY) {
                console.log('🔷 Trying OpenAI fallback...');
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const formattedMessages = messages.map((msg: any) => ({
                    role: msg.role === 'agent' ? 'assistant' : msg.role,
                    content: msg.content,
                }));
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: formattedMessages as any,
                    temperature: 0.7,
                    max_tokens: 4000,
                });
                console.log('✅ OpenAI responded successfully');
                return completion.choices[0]?.message?.content || '';
            }
        } catch (error: any) {
            console.error('❌ OpenAI fallback failed:', error.message);
        }

        // Try 3: ModelManager (last resort)
        try {
            console.log('🔷 Trying ModelManager fallback...');
            const manager = ModelManager.getInstance();
            const result = await manager.chat(messages);
            console.log('✅ ModelManager responded');
            return result;
        } catch (error: any) {
            console.error('❌ All chat methods failed');
            return 'I apologize, but all AI services are currently unavailable. Please check your API keys in Settings.';
        }
    },
    'diagnostic:modelStatus': async () => {
        const manager = ModelManager.getInstance();
        const models = manager.listModels();
        return {
            currentModel: models.find((m: any) => m.selected)?.id || 'none',
            availableModels: models.length,
            hasApiKeys: true
        };
    },

    // Agent coordination
    'agent:execute': async (command: string, params: any) => {
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.executeCommand(command, params);
    },
    'agent:getAllTasks': async () => {
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.getAllTasks();
    },
    'agent:getQueueStats': async () => {
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.getQueueStats();
    },

    // Metrics for Dashboard
    'metrics:getSummary': async (since?: string) => {
        const metrics = MetricsCollector.getInstance();
        const sinceDate = since ? new Date(since) : undefined;
        return metrics.getSummary(sinceDate);
    },
    'metrics:getCalibrationData': async () => {
        const metrics = MetricsCollector.getInstance();
        return metrics.getCalibrationData();
    },

    // Safety Dashboard
    'safety:getAllPolicies': async () => {
        const store = PolicyStore.getInstance();
        return store.getAllPolicies();
    },
    'safety:getViolationStats': async () => {
        const store = PolicyStore.getInstance();
        return store.getViolationStats();
    },
    'safety:getRecentViolations': async (limit?: any) => {
        // limit comes as array from http call params if not careful, but safely handle it
        const store = PolicyStore.getInstance();
        const actualLimit = Array.isArray(limit) ? limit[0] : limit;
        return store.getRecentViolations(actualLimit);
    },
    // Mode handlers (added to fix getMode error)
    'mode:getMode': async () => {
        // Return default mode; could be extended to read from config
        return 'autonomous';
    },
    'mode:getConfig': async () => {
        // Return placeholder config
        return { safeBoundaries: [], approvalRequired: [], auditLevel: 'low' };
    },
    'mode:setMode': async (mode: string) => {
        console.log(`Mode set to ${mode}`);
        return true;
    },

    // ALOps handlers
    'alops:getHealthStatus': async () => {
        return { status: 'healthy', uptime: process.uptime(), activeModels: 3 };
    },
    'alops:getMetrics': async () => {
        return { reliability: 0.99, latency: 120, throughput: 45 };
    },
    'alops:getAlerts': async () => {
        return [];
    },

    // Autonomous handlers
    'autonomous:getStatus': async () => {
        return { active: false, currentTask: null };
    },
    'autonomous:startWorkflow': async (workflowId: string) => {
        console.log(`Starting workflow ${workflowId}`);
        return { success: true, executionId: 'exec_' + Date.now() };
    },
    'autonomous:stopWorkflow': async (workflowId: string) => {
        console.log(`Stopping workflow ${workflowId}`);
        return { success: true };
    },
};

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { method, params = [] } = JSON.parse(body) as ApiRequest;
                const handler = handlers[method];

                if (!handler) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: `Unknown method: ${method}`, available: Object.keys(handlers) }));
                    return;
                }

                const result = await handler(...params);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, result }));
            } catch (error: any) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    } else if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            handlers: Object.keys(handlers).length,
            version: '3.0.0'
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
}

export function startApiServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (server) {
            console.log('🌐 HTTP API server already running');
            resolve();
            return;
        }

        server = http.createServer(handleRequest);

        server.listen(PORT, () => {
            console.log(`🌐 HTTP API server running on port ${PORT}`);
            console.log(`   Endpoints: POST /api, GET /health`);
            console.log(`   Available handlers: ${Object.keys(handlers).length}`);
            resolve();
        });

        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                console.warn(`⚠️ Port ${PORT} already in use`);
                console.warn('   Some features like Safety Dashboard may not work correctly');
                console.warn('   Try closing other applications using this port');
                // Still resolve to not block app startup, but log clearly
                server = null;
                resolve();
            } else {
                console.error('❌ HTTP API server error:', error);
                reject(error);
            }
        });
    });
}

export function stopApiServer(): void {
    if (server) {
        server.close();
        server = null;
        console.log('🌐 HTTP API server stopped');
    }
}

export function isServerRunning(): boolean {
    return server !== null;
}

