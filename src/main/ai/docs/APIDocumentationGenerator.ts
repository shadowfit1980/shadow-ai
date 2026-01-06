/**
 * API Documentation Generator
 * 
 * Generate OpenAPI/Swagger specifications, API documentation
 * sites, and interactive API explorers.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type DocFormat = 'openapi-3.0' | 'openapi-3.1' | 'swagger-2.0';
export type DocTool = 'swagger-ui' | 'redoc' | 'stoplight' | 'readme';

export interface APIEndpoint {
    path: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    summary: string;
    description?: string;
    tags?: string[];
    parameters?: Array<{
        name: string;
        in: 'path' | 'query' | 'header' | 'cookie';
        required?: boolean;
        schema: any;
        description?: string;
    }>;
    requestBody?: {
        required?: boolean;
        content: Record<string, { schema: any }>;
    };
    responses: Record<string, {
        description: string;
        content?: Record<string, { schema: any }>;
    }>;
    security?: Array<Record<string, string[]>>;
}

// ============================================================================
// API DOCUMENTATION GENERATOR
// ============================================================================

export class APIDocumentationGenerator extends EventEmitter {
    private static instance: APIDocumentationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): APIDocumentationGenerator {
        if (!APIDocumentationGenerator.instance) {
            APIDocumentationGenerator.instance = new APIDocumentationGenerator();
        }
        return APIDocumentationGenerator.instance;
    }

    // ========================================================================
    // OPENAPI SPECIFICATION
    // ========================================================================

    generateOpenAPISpec(config: {
        title: string;
        version: string;
        description?: string;
        servers?: Array<{ url: string; description?: string }>;
        endpoints: APIEndpoint[];
    }): string {
        const spec = {
            openapi: '3.0.0',
            info: {
                title: config.title,
                version: config.version,
                description: config.description || '',
                contact: {
                    name: 'API Support',
                    email: 'support@example.com',
                },
                license: {
                    name: 'MIT',
                },
            },
            servers: config.servers || [
                { url: 'http://localhost:3000', description: 'Development' },
                { url: 'https://api.example.com', description: 'Production' },
            ],
            tags: this.extractTags(config.endpoints),
            paths: this.generatePaths(config.endpoints),
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                    ApiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'X-API-Key',
                    },
                },
                schemas: this.generateSchemas(config.endpoints),
            },
        };

        return JSON.stringify(spec, null, 2);
    }

    private extractTags(endpoints: APIEndpoint[]): Array<{ name: string; description: string }> {
        const tags = new Set<string>();
        endpoints.forEach(e => e.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).map(tag => ({
            name: tag,
            description: `${tag} related operations`,
        }));
    }

    private generatePaths(endpoints: APIEndpoint[]): Record<string, any> {
        const paths: Record<string, any> = {};

        endpoints.forEach(endpoint => {
            if (!paths[endpoint.path]) {
                paths[endpoint.path] = {};
            }

            paths[endpoint.path][endpoint.method] = {
                summary: endpoint.summary,
                description: endpoint.description,
                tags: endpoint.tags,
                parameters: endpoint.parameters,
                requestBody: endpoint.requestBody,
                responses: endpoint.responses,
                security: endpoint.security,
            };
        });

        return paths;
    }

    private generateSchemas(endpoints: APIEndpoint[]): Record<string, any> {
        // Extract and deduplicate schemas from endpoints
        return {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'email', 'name'],
            },
            Error: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    code: { type: 'string' },
                },
                required: ['message'],
            },
        };
    }

    // ========================================================================
    // SWAGGER UI INTEGRATION
    // ========================================================================

    generateSwaggerUI(): string {
        return `import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const app = express();

// Load OpenAPI spec
const swaggerDocument = YAML.load('./openapi.yaml');

// Swagger UI options
const options = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation',
    customfavIcon: '/favicon.ico',
};

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

// Alternative: Redoc
import { redoc } from 'redoc-express';

app.get('/docs', redoc({
    title: 'API Docs',
    specUrl: '/openapi.json',
    redocOptions: {
        theme: {
            colors: {
                primary: {
                    main: '#667eea',
                },
            },
        },
    },
}));

export default app;
`;
    }

    // ========================================================================
    // POSTMAN COLLECTION
    // ========================================================================

    generatePostmanCollection(config: {
        name: string;
        baseUrl: string;
        endpoints: APIEndpoint[];
    }): string {
        const collection = {
            info: {
                name: config.name,
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
            },
            item: config.endpoints.map(endpoint => ({
                name: endpoint.summary,
                request: {
                    method: endpoint.method.toUpperCase(),
                    header: [
                        { key: 'Content-Type', value: 'application/json' },
                        { key: 'Authorization', value: 'Bearer {{token}}' },
                    ],
                    url: {
                        raw: `${config.baseUrl}${endpoint.path}`,
                        host: [config.baseUrl],
                        path: endpoint.path.split('/').filter(Boolean),
                    },
                    body: endpoint.requestBody ? {
                        mode: 'raw',
                        raw: JSON.stringify({}, null, 2),
                    } : undefined,
                },
                response: [],
            })),
            variable: [
                { key: 'baseUrl', value: config.baseUrl },
                { key: 'token', value: '' },
            ],
        };

        return JSON.stringify(collection, null, 2);
    }

    // ========================================================================
    // API CLIENT SDK GENERATOR
    // ========================================================================

    generateTypeScriptSDK(config: { serviceName: string; endpoints: APIEndpoint[] }): string {
        return `/**
 * ${config.serviceName} API Client
 * Auto-generated API client
 */

export interface APIClientConfig {
    baseURL: string;
    apiKey?: string;
    timeout?: number;
}

export class ${config.serviceName}APIClient {
    private baseURL: string;
    private apiKey?: string;
    private timeout: number;

    constructor(config: APIClientConfig) {
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.timeout = config.timeout || 30000;
    }

    private async request<T>(
        method: string,
        path: string,
        data?: any,
        params?: Record<string, any>
    ): Promise<T> {
        const url = new URL(path, this.baseURL);
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.apiKey) {
            headers['Authorization'] = \`Bearer \${this.apiKey}\`;
        }

        const response = await fetch(url.toString(), {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
            signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
            throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
        }

        return response.json();
    }

${config.endpoints.map(endpoint => {
            const methodName = this.generateMethodName(endpoint);
            const params = endpoint.parameters?.filter(p => p.in === 'query') || [];
            const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];

            return `    async ${methodName}(${this.generateSDKParams(endpoint)}): Promise<any> {
        ${pathParams.length > 0 ? `const path = \`${endpoint.path.replace(/{(\w+)}/g, '${$1}')}\`;` : `const path = '${endpoint.path}';`}
        return this.request('${endpoint.method.toUpperCase()}', path${endpoint.requestBody ? ', data' : ''}${params.length > 0 ? ', params' : ''});
    }`;
        }).join('\n\n')}
}

// Usage:
// const client = new ${config.serviceName}APIClient({
//     baseURL: 'https://api.example.com',
//     apiKey: 'your-api-key',
// });
`;
    }

    private generateMethodName(endpoint: APIEndpoint): string {
        const parts = endpoint.path.split('/').filter(Boolean);
        const lastPart = parts[parts.length - 1];
        const resource = lastPart.replace(/{.*}/, '');

        const methodMap: Record<string, string> = {
            get: endpoint.path.includes('{') ? 'get' : 'list',
            post: 'create',
            put: 'update',
            patch: 'update',
            delete: 'delete',
        };

        return `${methodMap[endpoint.method]}${this.capitalize(resource)}`;
    }

    private generateSDKParams(endpoint: APIEndpoint): string {
        const params: string[] = [];

        // Path parameters
        const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
        pathParams.forEach(p => params.push(`${p.name}: string`));

        // Request body
        if (endpoint.requestBody) {
            params.push('data: any');
        }

        // Query parameters
        const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
        if (queryParams.length > 0) {
            params.push('params?: Record<string, any>');
        }

        return params.join(', ');
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ========================================================================
    // MARKDOWN DOCUMENTATION
    // ========================================================================

    generateMarkdownDocs(config: { title: string; endpoints: APIEndpoint[] }): string {
        return `# ${config.title}

## Authentication

All API requests require authentication using a Bearer token:

\`\`\`
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

## Endpoints

${config.endpoints.map(endpoint => `
### ${endpoint.method.toUpperCase()} ${endpoint.path}

${endpoint.description || endpoint.summary}

**Parameters:**

${endpoint.parameters?.length ? endpoint.parameters.map(p =>
            `- \`${p.name}\` (${p.in}) - ${p.description || ''} ${p.required ? '**Required**' : ''}`
        ).join('\n') : 'None'}

**Request Body:**

${endpoint.requestBody ? '\`\`\`json\n' + JSON.stringify({}, null, 2) + '\n\`\`\`' : 'None'}

**Response:**

\`\`\`json
${JSON.stringify(Object.values(endpoint.responses)[0], null, 2)}
\`\`\`
`).join('\n---\n')}
`;
    }
}

export const apiDocumentationGenerator = APIDocumentationGenerator.getInstance();
