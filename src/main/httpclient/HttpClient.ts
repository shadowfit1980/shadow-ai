/**
 * HTTP Client - REST client
 */
import { EventEmitter } from 'events';

export interface HttpRequest { id: string; name: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; url: string; headers: Record<string, string>; body?: string; }
export interface HttpResponse { status: number; headers: Record<string, string>; body: string; time: number; }

export class HttpClient extends EventEmitter {
    private static instance: HttpClient;
    private savedRequests: Map<string, HttpRequest> = new Map();
    private history: { request: HttpRequest; response: HttpResponse }[] = [];
    private constructor() { super(); }
    static getInstance(): HttpClient { if (!HttpClient.instance) HttpClient.instance = new HttpClient(); return HttpClient.instance; }

    saveRequest(name: string, method: HttpRequest['method'], url: string, headers: Record<string, string> = {}, body?: string): HttpRequest {
        const req: HttpRequest = { id: `http_${Date.now()}`, name, method, url, headers, body };
        this.savedRequests.set(req.id, req); return req;
    }

    async execute(id: string): Promise<HttpResponse> {
        const req = this.savedRequests.get(id); if (!req) return { status: 404, headers: {}, body: 'Not found', time: 0 };
        const start = Date.now();
        const response: HttpResponse = { status: 200, headers: { 'content-type': 'application/json' }, body: '{"success": true}', time: Date.now() - start + 100 };
        this.history.push({ request: req, response }); this.emit('executed', { req, response }); return response;
    }

    getHistory(): typeof this.history { return [...this.history]; }
    getSaved(): HttpRequest[] { return Array.from(this.savedRequests.values()); }
}
export function getHttpClient(): HttpClient { return HttpClient.getInstance(); }
