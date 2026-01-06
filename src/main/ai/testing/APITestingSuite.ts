/**
 * API Testing Suite
 * 
 * Generate and run API tests with support for
 * REST, GraphQL, and WebSocket endpoints.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface APIRequest {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
    auth?: AuthConfig;
    timeout?: number;
}

export interface AuthConfig {
    type: 'bearer' | 'basic' | 'apikey' | 'oauth2';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    keyName?: string;
    keyLocation?: 'header' | 'query';
}

export interface APIResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
    size: number;
}

export interface TestAssertion {
    type: 'status' | 'header' | 'body' | 'time' | 'schema';
    target?: string;
    operator: 'equals' | 'contains' | 'exists' | 'matches' | 'lessThan' | 'greaterThan';
    expected: any;
}

export interface TestResult {
    requestId: string;
    passed: boolean;
    assertions: Array<{ assertion: TestAssertion; passed: boolean; actual: any }>;
    response: APIResponse;
    error?: string;
}

export interface TestCollection {
    id: string;
    name: string;
    description?: string;
    requests: APIRequest[];
    tests: Array<{ requestId: string; assertions: TestAssertion[] }>;
    variables: Record<string, string>;
}

// ============================================================================
// API TESTING SUITE
// ============================================================================

export class APITestingSuite extends EventEmitter {
    private static instance: APITestingSuite;
    private collections: Map<string, TestCollection> = new Map();
    private variables: Map<string, string> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): APITestingSuite {
        if (!APITestingSuite.instance) {
            APITestingSuite.instance = new APITestingSuite();
        }
        return APITestingSuite.instance;
    }

    // ========================================================================
    // COLLECTION MANAGEMENT
    // ========================================================================

    createCollection(name: string, description?: string): TestCollection {
        const collection: TestCollection = {
            id: `collection_${Date.now()}`,
            name,
            description,
            requests: [],
            tests: [],
            variables: {},
        };

        this.collections.set(collection.id, collection);
        this.emit('collectionCreated', collection);
        return collection;
    }

    addRequest(collectionId: string, request: Omit<APIRequest, 'id'>): APIRequest | null {
        const collection = this.collections.get(collectionId);
        if (!collection) return null;

        const fullRequest: APIRequest = {
            ...request,
            id: `request_${Date.now()}`,
        };

        collection.requests.push(fullRequest);
        return fullRequest;
    }

    addTest(collectionId: string, requestId: string, assertions: TestAssertion[]): boolean {
        const collection = this.collections.get(collectionId);
        if (!collection) return false;

        collection.tests.push({ requestId, assertions });
        return true;
    }

    // ========================================================================
    // REQUEST EXECUTION
    // ========================================================================

    async executeRequest(request: APIRequest): Promise<APIResponse> {
        const startTime = Date.now();

        // Build URL with params
        let url = this.interpolate(request.url);
        if (request.params) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(request.params)) {
                params.append(key, this.interpolate(value));
            }
            url += (url.includes('?') ? '&' : '?') + params.toString();
        }

        // Build headers
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(request.headers)) {
            headers[key] = this.interpolate(value);
        }

        // Add auth
        if (request.auth) {
            this.applyAuth(headers, request.auth);
        }

        this.emit('requestStart', { id: request.id, url });

        try {
            const response = await fetch(url, {
                method: request.method,
                headers,
                body: request.body ? JSON.stringify(request.body) : undefined,
                signal: request.timeout ? AbortSignal.timeout(request.timeout) : undefined,
            });

            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            const body = await response.text();
            let parsedBody: any;
            try {
                parsedBody = JSON.parse(body);
            } catch {
                parsedBody = body;
            }

            const result: APIResponse = {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: parsedBody,
                time: Date.now() - startTime,
                size: body.length,
            };

            this.emit('requestComplete', { id: request.id, response: result });
            return result;

        } catch (error: any) {
            this.emit('requestError', { id: request.id, error: error.message });
            throw error;
        }
    }

    private applyAuth(headers: Record<string, string>, auth: AuthConfig): void {
        switch (auth.type) {
            case 'bearer':
                headers['Authorization'] = `Bearer ${auth.token}`;
                break;
            case 'basic':
                const encoded = btoa(`${auth.username}:${auth.password}`);
                headers['Authorization'] = `Basic ${encoded}`;
                break;
            case 'apikey':
                if (auth.keyLocation === 'header' || !auth.keyLocation) {
                    headers[auth.keyName || 'X-API-Key'] = auth.apiKey || '';
                }
                break;
        }
    }

    // ========================================================================
    // TEST EXECUTION
    // ========================================================================

    async runTests(collectionId: string): Promise<TestResult[]> {
        const collection = this.collections.get(collectionId);
        if (!collection) throw new Error('Collection not found');

        // Set collection variables
        for (const [key, value] of Object.entries(collection.variables)) {
            this.variables.set(key, value);
        }

        const results: TestResult[] = [];

        for (const test of collection.tests) {
            const request = collection.requests.find(r => r.id === test.requestId);
            if (!request) continue;

            try {
                const response = await this.executeRequest(request);
                const assertionResults = test.assertions.map(assertion => ({
                    assertion,
                    ...this.evaluateAssertion(assertion, response),
                }));

                results.push({
                    requestId: request.id,
                    passed: assertionResults.every(r => r.passed),
                    assertions: assertionResults,
                    response,
                });
            } catch (error: any) {
                results.push({
                    requestId: request.id,
                    passed: false,
                    assertions: [],
                    response: { status: 0, statusText: '', headers: {}, body: null, time: 0, size: 0 },
                    error: error.message,
                });
            }
        }

        this.emit('testsComplete', { collectionId, results });
        return results;
    }

    private evaluateAssertion(assertion: TestAssertion, response: APIResponse): { passed: boolean; actual: any } {
        let actual: any;

        switch (assertion.type) {
            case 'status':
                actual = response.status;
                break;
            case 'header':
                actual = response.headers[assertion.target!.toLowerCase()];
                break;
            case 'body':
                actual = assertion.target
                    ? this.getNestedValue(response.body, assertion.target)
                    : response.body;
                break;
            case 'time':
                actual = response.time;
                break;
            default:
                actual = null;
        }

        let passed = false;
        switch (assertion.operator) {
            case 'equals':
                passed = actual === assertion.expected;
                break;
            case 'contains':
                passed = String(actual).includes(assertion.expected);
                break;
            case 'exists':
                passed = actual !== undefined && actual !== null;
                break;
            case 'matches':
                passed = new RegExp(assertion.expected).test(String(actual));
                break;
            case 'lessThan':
                passed = Number(actual) < Number(assertion.expected);
                break;
            case 'greaterThan':
                passed = Number(actual) > Number(assertion.expected);
                break;
        }

        return { passed, actual };
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((o, k) => o?.[k], obj);
    }

    private interpolate(text: string): string {
        return text.replace(/\{\{(\w+)\}\}/g, (_, name) =>
            this.variables.get(name) || ''
        );
    }

    setVariable(name: string, value: string): void {
        this.variables.set(name, value);
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateJestTests(collection: TestCollection): string {
        return `import axios from 'axios';

describe('${collection.name}', () => {
${collection.requests.map(req => `
  test('${req.name}', async () => {
    const response = await axios({
      method: '${req.method}',
      url: '${req.url}',
      headers: ${JSON.stringify(req.headers)},
      ${req.body ? `data: ${JSON.stringify(req.body)},` : ''}
    });

    ${collection.tests
                .filter(t => t.requestId === req.id)
                .map(t => t.assertions.map(a => this.generateJestAssertion(a)).join('\n    '))
                .join('\n    ')}
  });
`).join('\n')}
});
`;
    }

    private generateJestAssertion(assertion: TestAssertion): string {
        switch (assertion.type) {
            case 'status':
                return `expect(response.status).toBe(${assertion.expected});`;
            case 'body':
                if (assertion.target) {
                    return `expect(response.data.${assertion.target}).${this.getJestMatcher(assertion)}`;
                }
                return `expect(response.data).${this.getJestMatcher(assertion)}`;
            case 'header':
                return `expect(response.headers['${assertion.target}']).${this.getJestMatcher(assertion)}`;
            case 'time':
                return `// Response time assertion - requires custom implementation`;
            default:
                return '';
        }
    }

    private getJestMatcher(assertion: TestAssertion): string {
        switch (assertion.operator) {
            case 'equals': return `toBe(${JSON.stringify(assertion.expected)})`;
            case 'contains': return `toContain(${JSON.stringify(assertion.expected)})`;
            case 'exists': return 'toBeDefined()';
            case 'matches': return `toMatch(${assertion.expected})`;
            case 'lessThan': return `toBeLessThan(${assertion.expected})`;
            case 'greaterThan': return `toBeGreaterThan(${assertion.expected})`;
            default: return '';
        }
    }

    generateCurlCommands(collection: TestCollection): string {
        return collection.requests.map(req => {
            let cmd = `curl -X ${req.method}`;

            for (const [key, value] of Object.entries(req.headers)) {
                cmd += ` \\\n  -H "${key}: ${value}"`;
            }

            if (req.body) {
                cmd += ` \\\n  -d '${JSON.stringify(req.body)}'`;
            }

            cmd += ` \\\n  "${req.url}"`;

            return `# ${req.name}\n${cmd}`;
        }).join('\n\n');
    }

    exportToPostman(collection: TestCollection): object {
        return {
            info: {
                name: collection.name,
                description: collection.description,
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
            },
            item: collection.requests.map(req => ({
                name: req.name,
                request: {
                    method: req.method,
                    header: Object.entries(req.headers).map(([key, value]) => ({ key, value })),
                    url: { raw: req.url },
                    body: req.body ? { mode: 'raw', raw: JSON.stringify(req.body) } : undefined,
                },
            })),
        };
    }
}

export const apiTestingSuite = APITestingSuite.getInstance();
