/**
 * Local API Server - OpenAI-compatible API
 */
import { EventEmitter } from 'events';

export interface APIServerConfig { port: number; host: string; cors: boolean; apiKey?: string; rateLimit: number; }
export interface APIRequest { id: string; method: string; path: string; body?: Record<string, unknown>; timestamp: number; responseTime?: number; status?: number; }

export class LocalAPIServerEngine extends EventEmitter {
    private static instance: LocalAPIServerEngine;
    private config: APIServerConfig = { port: 1234, host: '127.0.0.1', cors: true, rateLimit: 100 };
    private running = false;
    private requests: APIRequest[] = [];
    private constructor() { super(); }
    static getInstance(): LocalAPIServerEngine { if (!LocalAPIServerEngine.instance) LocalAPIServerEngine.instance = new LocalAPIServerEngine(); return LocalAPIServerEngine.instance; }

    async start(): Promise<boolean> { if (this.running) return true; this.running = true; this.emit('started', { host: this.config.host, port: this.config.port }); return true; }
    async stop(): Promise<boolean> { if (!this.running) return true; this.running = false; this.emit('stopped'); return true; }

    logRequest(method: string, path: string, body?: Record<string, unknown>): APIRequest { const req: APIRequest = { id: `req_${Date.now()}`, method, path, body, timestamp: Date.now() }; this.requests.push(req); if (this.requests.length > 1000) this.requests.shift(); return req; }
    completeRequest(requestId: string, status: number, responseTime: number): void { const req = this.requests.find(r => r.id === requestId); if (req) { req.status = status; req.responseTime = responseTime; } }

    getEndpoints(): { path: string; methods: string[] }[] { return [{ path: '/v1/chat/completions', methods: ['POST'] }, { path: '/v1/completions', methods: ['POST'] }, { path: '/v1/embeddings', methods: ['POST'] }, { path: '/v1/models', methods: ['GET'] }]; }
    isRunning(): boolean { return this.running; }
    setConfig(cfg: Partial<APIServerConfig>): void { Object.assign(this.config, cfg); }
    getStats(): { totalRequests: number; avgResponseTime: number } { const completed = this.requests.filter(r => r.responseTime); return { totalRequests: this.requests.length, avgResponseTime: completed.reduce((s, r) => s + (r.responseTime || 0), 0) / (completed.length || 1) }; }
}
export function getLocalAPIServerEngine(): LocalAPIServerEngine { return LocalAPIServerEngine.getInstance(); }
