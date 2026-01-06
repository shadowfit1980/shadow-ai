/**
 * API Gateway - Unified API access
 */
import { EventEmitter } from 'events';

export interface APIEndpoint { id: string; path: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE'; rateLimit: number; auth: boolean; }
export interface APIRequest { id: string; endpoint: string; method: string; timestamp: number; latency: number; status: number; }

export class APIGatewayEngine extends EventEmitter {
    private static instance: APIGatewayEngine;
    private endpoints: Map<string, APIEndpoint> = new Map();
    private requests: APIRequest[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): APIGatewayEngine { if (!APIGatewayEngine.instance) APIGatewayEngine.instance = new APIGatewayEngine(); return APIGatewayEngine.instance; }

    private initDefaults(): void {
        const defaults: Omit<APIEndpoint, 'id'>[] = [
            { path: '/v1/chat/completions', method: 'POST', rateLimit: 100, auth: true },
            { path: '/v1/images/generations', method: 'POST', rateLimit: 50, auth: true },
            { path: '/v1/audio/speech', method: 'POST', rateLimit: 50, auth: true }
        ];
        defaults.forEach((e, i) => this.endpoints.set(`ep_${i}`, { id: `ep_${i}`, ...e }));
    }

    async route(path: string, method: string): Promise<APIRequest> { const req: APIRequest = { id: `req_${Date.now()}`, endpoint: path, method, timestamp: Date.now(), latency: Math.random() * 100, status: 200 }; this.requests.push(req); this.emit('request', req); return req; }
    getEndpoints(): APIEndpoint[] { return Array.from(this.endpoints.values()); }
    getStats(): { total: number; avgLatency: number } { return { total: this.requests.length, avgLatency: this.requests.reduce((s, r) => s + r.latency, 0) / (this.requests.length || 1) }; }
}
export function getAPIGatewayEngine(): APIGatewayEngine { return APIGatewayEngine.getInstance(); }
