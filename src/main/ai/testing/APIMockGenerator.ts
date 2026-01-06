/**
 * API Mock Generator
 * 
 * Automatically generates mock APIs and sample data for testing
 * based on OpenAPI specs or existing code patterns.
 */

import { EventEmitter } from 'events';

export interface MockAPI {
    id: string;
    name: string;
    baseUrl: string;
    endpoints: MockEndpoint[];
    config: MockConfig;
    createdAt: Date;
}

export interface MockEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    requestSchema?: JsonSchema;
    responseSchema?: JsonSchema;
    responses: MockResponse[];
    latencyMs: number;
}

export interface MockResponse {
    statusCode: number;
    body: any;
    headers: Record<string, string>;
    probability: number; // 0-1, for random response selection
}

export interface MockConfig {
    defaultLatency: number;
    errorRate: number; // 0-1
    dynamicData: boolean;
    corsEnabled: boolean;
    logging: boolean;
}

export interface JsonSchema {
    type: string;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    required?: string[];
    example?: any;
}

export interface GeneratedData {
    type: string;
    count: number;
    data: any[];
}

// Data generators for common types
const DATA_GENERATORS: Record<string, () => any> = {
    id: () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }),
    name: () => {
        const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'Chris', 'Emma', 'Alex', 'Lisa'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    },
    email: () => `user${Math.floor(Math.random() * 10000)}@example.com`,
    phone: () => `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
    date: () => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    boolean: () => Math.random() > 0.5,
    number: () => Math.floor(Math.random() * 1000),
    price: () => Number((Math.random() * 999 + 1).toFixed(2)),
    url: () => `https://example.com/${Math.random().toString(36).substr(2, 8)}`,
    avatar: () => `https://i.pravatar.cc/150?u=${Math.random()}`,
    paragraph: () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    address: () => ({
        street: `${Math.floor(Math.random() * 9999)} Main St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston'][Math.floor(Math.random() * 4)],
        state: ['NY', 'CA', 'IL', 'TX'][Math.floor(Math.random() * 4)],
        zip: String(Math.floor(Math.random() * 90000) + 10000),
    }),
    company: () => {
        const prefixes = ['Tech', 'Global', 'Smart', 'Pro', 'Next'];
        const suffixes = ['Corp', 'Inc', 'Labs', 'Systems', 'Solutions'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    },
};

export class APIMockGenerator extends EventEmitter {
    private static instance: APIMockGenerator;
    private mocks: Map<string, MockAPI> = new Map();
    private runningServers: Map<string, { port: number }> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): APIMockGenerator {
        if (!APIMockGenerator.instance) {
            APIMockGenerator.instance = new APIMockGenerator();
        }
        return APIMockGenerator.instance;
    }

    // ========================================================================
    // MOCK CREATION
    // ========================================================================

    createMock(name: string, config?: Partial<MockConfig>): MockAPI {
        const mock: MockAPI = {
            id: `mock_${Date.now()}`,
            name,
            baseUrl: '/api/mock',
            endpoints: [],
            config: {
                defaultLatency: 100,
                errorRate: 0,
                dynamicData: true,
                corsEnabled: true,
                logging: true,
                ...config,
            },
            createdAt: new Date(),
        };

        this.mocks.set(mock.id, mock);
        this.emit('mock:created', mock);
        return mock;
    }

    addEndpoint(mockId: string, endpoint: Omit<MockEndpoint, 'id'>): MockEndpoint | undefined {
        const mock = this.mocks.get(mockId);
        if (!mock) return undefined;

        const newEndpoint: MockEndpoint = {
            ...endpoint,
            id: `endpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        mock.endpoints.push(newEndpoint);
        this.emit('endpoint:added', { mockId, endpoint: newEndpoint });
        return newEndpoint;
    }

    // ========================================================================
    // FROM OPENAPI SPEC
    // ========================================================================

    fromOpenAPISpec(spec: any): MockAPI {
        const mock = this.createMock(spec.info?.title || 'API Mock');

        if (spec.paths) {
            for (const [path, methods] of Object.entries(spec.paths)) {
                for (const [method, details] of Object.entries(methods as any)) {
                    if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
                        const detail = details as any;

                        this.addEndpoint(mock.id, {
                            method: method.toUpperCase() as MockEndpoint['method'],
                            path,
                            description: detail.summary || detail.description || '',
                            requestSchema: detail.requestBody?.content?.['application/json']?.schema,
                            responseSchema: detail.responses?.['200']?.content?.['application/json']?.schema,
                            responses: this.generateResponses(detail.responses),
                            latencyMs: mock.config.defaultLatency,
                        });
                    }
                }
            }
        }

        return mock;
    }

    private generateResponses(responses: any): MockResponse[] {
        const mockResponses: MockResponse[] = [];

        if (responses?.['200']) {
            mockResponses.push({
                statusCode: 200,
                body: this.generateFromSchema(responses['200']?.content?.['application/json']?.schema),
                headers: { 'Content-Type': 'application/json' },
                probability: 0.9,
            });
        }

        if (responses?.['400']) {
            mockResponses.push({
                statusCode: 400,
                body: { error: 'Bad Request', message: 'Invalid input' },
                headers: { 'Content-Type': 'application/json' },
                probability: 0.05,
            });
        }

        if (responses?.['500']) {
            mockResponses.push({
                statusCode: 500,
                body: { error: 'Internal Server Error' },
                headers: { 'Content-Type': 'application/json' },
                probability: 0.05,
            });
        }

        // Ensure at least one response
        if (mockResponses.length === 0) {
            mockResponses.push({
                statusCode: 200,
                body: { success: true },
                headers: { 'Content-Type': 'application/json' },
                probability: 1,
            });
        }

        return mockResponses;
    }

    // ========================================================================
    // DATA GENERATION
    // ========================================================================

    generateFromSchema(schema: JsonSchema | undefined): any {
        if (!schema) return {};

        switch (schema.type) {
            case 'object':
                const obj: any = {};
                if (schema.properties) {
                    for (const [key, propSchema] of Object.entries(schema.properties)) {
                        obj[key] = this.generateFromSchema(propSchema);
                    }
                }
                return obj;

            case 'array':
                const count = Math.floor(Math.random() * 5) + 1;
                return Array.from({ length: count }, () =>
                    this.generateFromSchema(schema.items)
                );

            case 'string':
                if (schema.example) return schema.example;
                return this.inferStringValue(Object.keys(schema)[0] || 'text');

            case 'number':
            case 'integer':
                if (schema.example) return schema.example;
                return DATA_GENERATORS.number();

            case 'boolean':
                return DATA_GENERATORS.boolean();

            default:
                return schema.example || null;
        }
    }

    private inferStringValue(fieldName: string): any {
        const lowerName = fieldName.toLowerCase();

        if (lowerName.includes('id')) return DATA_GENERATORS.id();
        if (lowerName.includes('uuid')) return DATA_GENERATORS.uuid();
        if (lowerName.includes('name')) return DATA_GENERATORS.name();
        if (lowerName.includes('email')) return DATA_GENERATORS.email();
        if (lowerName.includes('phone')) return DATA_GENERATORS.phone();
        if (lowerName.includes('date') || lowerName.includes('time')) return DATA_GENERATORS.date();
        if (lowerName.includes('url') || lowerName.includes('link')) return DATA_GENERATORS.url();
        if (lowerName.includes('avatar') || lowerName.includes('image')) return DATA_GENERATORS.avatar();
        if (lowerName.includes('price') || lowerName.includes('amount')) return DATA_GENERATORS.price();
        if (lowerName.includes('description') || lowerName.includes('bio')) return DATA_GENERATORS.paragraph();
        if (lowerName.includes('company')) return DATA_GENERATORS.company();

        return `sample_${lowerName}`;
    }

    generateData(type: string, count: number = 10): GeneratedData {
        const generator = DATA_GENERATORS[type] || (() => `${type}_${Math.random()}`);

        return {
            type,
            count,
            data: Array.from({ length: count }, generator),
        };
    }

    // ========================================================================
    // CRUD TEMPLATES
    // ========================================================================

    generateCRUDEndpoints(mockId: string, resourceName: string, schema?: JsonSchema): MockEndpoint[] {
        const endpoints: MockEndpoint[] = [];
        const pluralName = `${resourceName}s`;
        const sampleData = schema ? this.generateFromSchema(schema) : { id: '1', name: 'Sample' };

        // GET all
        endpoints.push(this.addEndpoint(mockId, {
            method: 'GET',
            path: `/${pluralName}`,
            description: `List all ${pluralName}`,
            responseSchema: { type: 'array', items: schema || { type: 'object' } },
            responses: [{
                statusCode: 200,
                body: Array.from({ length: 5 }, () => ({ ...sampleData, id: DATA_GENERATORS.id() })),
                headers: { 'Content-Type': 'application/json' },
                probability: 1,
            }],
            latencyMs: 100,
        })!);

        // GET one
        endpoints.push(this.addEndpoint(mockId, {
            method: 'GET',
            path: `/${pluralName}/:id`,
            description: `Get a ${resourceName} by ID`,
            responseSchema: schema,
            responses: [{
                statusCode: 200,
                body: sampleData,
                headers: { 'Content-Type': 'application/json' },
                probability: 0.9,
            }, {
                statusCode: 404,
                body: { error: 'Not Found' },
                headers: { 'Content-Type': 'application/json' },
                probability: 0.1,
            }],
            latencyMs: 50,
        })!);

        // POST
        endpoints.push(this.addEndpoint(mockId, {
            method: 'POST',
            path: `/${pluralName}`,
            description: `Create a new ${resourceName}`,
            requestSchema: schema,
            responseSchema: schema,
            responses: [{
                statusCode: 201,
                body: { ...sampleData, id: DATA_GENERATORS.id() },
                headers: { 'Content-Type': 'application/json' },
                probability: 1,
            }],
            latencyMs: 150,
        })!);

        // PUT
        endpoints.push(this.addEndpoint(mockId, {
            method: 'PUT',
            path: `/${pluralName}/:id`,
            description: `Update a ${resourceName}`,
            requestSchema: schema,
            responseSchema: schema,
            responses: [{
                statusCode: 200,
                body: sampleData,
                headers: { 'Content-Type': 'application/json' },
                probability: 1,
            }],
            latencyMs: 100,
        })!);

        // DELETE
        endpoints.push(this.addEndpoint(mockId, {
            method: 'DELETE',
            path: `/${pluralName}/:id`,
            description: `Delete a ${resourceName}`,
            responses: [{
                statusCode: 204,
                body: null,
                headers: {},
                probability: 1,
            }],
            latencyMs: 50,
        })!);

        return endpoints;
    }

    // ========================================================================
    // HANDLER GENERATION
    // ========================================================================

    generateHandler(endpoint: MockEndpoint): string {
        return `
app.${endpoint.method.toLowerCase()}('${endpoint.path}', async (req, res) => {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, ${endpoint.latencyMs}));
    
    // Select response based on probability
    const responses = ${JSON.stringify(endpoint.responses, null, 2)};
    const random = Math.random();
    let cumulative = 0;
    
    for (const response of responses) {
        cumulative += response.probability;
        if (random <= cumulative) {
            return res.status(response.statusCode)
                .set(response.headers)
                .json(response.body);
        }
    }
    
    res.status(200).json(responses[0].body);
});`;
    }

    exportAsExpressApp(mockId: string): string {
        const mock = this.mocks.get(mockId);
        if (!mock) return '';

        let code = `
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
${mock.config.corsEnabled ? 'app.use(cors());' : ''}
${mock.config.logging ? `app.use((req, res, next) => { console.log(\`\${req.method} \${req.path}\`); next(); });` : ''}

`;

        for (const endpoint of mock.endpoints) {
            code += this.generateHandler(endpoint);
            code += '\n\n';
        }

        code += `
app.listen(3001, () => {
    console.log('Mock API running on http://localhost:3001');
});
`;

        return code;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getMock(id: string): MockAPI | undefined {
        return this.mocks.get(id);
    }

    getAllMocks(): MockAPI[] {
        return Array.from(this.mocks.values());
    }

    getAvailableGenerators(): string[] {
        return Object.keys(DATA_GENERATORS);
    }
}

export const apiMockGenerator = APIMockGenerator.getInstance();
