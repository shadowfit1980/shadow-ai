/**
 * API Client
 * Universal HTTP client for external APIs
 */

import { EventEmitter } from 'events';

export interface APIRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

export interface APIResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    duration: number;
}

export interface SavedEndpoint {
    id: string;
    name: string;
    request: APIRequest;
    createdAt: number;
}

/**
 * APIClient
 * Universal HTTP client
 */
export class APIClient extends EventEmitter {
    private static instance: APIClient;
    private endpoints: Map<string, SavedEndpoint> = new Map();
    private history: { request: APIRequest; response: APIResponse }[] = [];
    private defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

    private constructor() {
        super();
    }

    static getInstance(): APIClient {
        if (!APIClient.instance) {
            APIClient.instance = new APIClient();
        }
        return APIClient.instance;
    }

    /**
     * Make HTTP request
     */
    async request(req: APIRequest): Promise<APIResponse> {
        const startTime = Date.now();
        this.emit('requestStarted', req);

        try {
            const response = await fetch(req.url, {
                method: req.method,
                headers: { ...this.defaultHeaders, ...req.headers },
                body: req.body ? JSON.stringify(req.body) : undefined,
                signal: req.timeout ? AbortSignal.timeout(req.timeout) : undefined,
            });

            const data = await response.json().catch(() => response.text());

            const apiResponse: APIResponse = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data,
                duration: Date.now() - startTime,
            };

            this.history.push({ request: req, response: apiResponse });
            this.emit('requestCompleted', apiResponse);

            return apiResponse;
        } catch (error: any) {
            const errResponse: APIResponse = {
                status: 0,
                statusText: error.message,
                headers: {},
                data: null,
                duration: Date.now() - startTime,
            };

            this.emit('requestFailed', errResponse);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(url: string, headers?: Record<string, string>): Promise<APIResponse> {
        return this.request({ method: 'GET', url, headers });
    }

    /**
     * POST request
     */
    async post(url: string, body: any, headers?: Record<string, string>): Promise<APIResponse> {
        return this.request({ method: 'POST', url, body, headers });
    }

    /**
     * PUT request
     */
    async put(url: string, body: any, headers?: Record<string, string>): Promise<APIResponse> {
        return this.request({ method: 'PUT', url, body, headers });
    }

    /**
     * DELETE request
     */
    async delete(url: string, headers?: Record<string, string>): Promise<APIResponse> {
        return this.request({ method: 'DELETE', url, headers });
    }

    /**
     * Save endpoint
     */
    saveEndpoint(name: string, request: APIRequest): SavedEndpoint {
        const endpoint: SavedEndpoint = {
            id: `endpoint_${Date.now()}`,
            name,
            request,
            createdAt: Date.now(),
        };
        this.endpoints.set(endpoint.id, endpoint);
        return endpoint;
    }

    /**
     * Get saved endpoints
     */
    getEndpoints(): SavedEndpoint[] {
        return Array.from(this.endpoints.values());
    }

    /**
     * Delete endpoint
     */
    deleteEndpoint(id: string): boolean {
        return this.endpoints.delete(id);
    }

    /**
     * Get request history
     */
    getHistory(limit = 50): { request: APIRequest; response: APIResponse }[] {
        return this.history.slice(-limit).reverse();
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.history = [];
    }

    /**
     * Set default headers
     */
    setDefaultHeaders(headers: Record<string, string>): void {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }
}

// Singleton getter
export function getAPIClient(): APIClient {
    return APIClient.getInstance();
}
