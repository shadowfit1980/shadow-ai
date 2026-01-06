/**
 * API Documentation Generator
 * Automatically generate comprehensive API documentation
 * Grok Recommendation: Smart Documentation Generation
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
    path: string;
    summary: string;
    description: string;
    tags: string[];
    parameters: ApiParameter[];
    requestBody?: RequestBody;
    responses: ApiResponse[];
    security?: string[];
    deprecated?: boolean;
    examples: ApiExample[];
}

interface ApiParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    description: string;
    required: boolean;
    type: string;
    format?: string;
    enum?: string[];
    default?: unknown;
    example?: unknown;
}

interface RequestBody {
    description: string;
    required: boolean;
    contentType: string;
    schema: SchemaDefinition;
    examples: Record<string, unknown>;
}

interface ApiResponse {
    statusCode: number;
    description: string;
    contentType?: string;
    schema?: SchemaDefinition;
    headers?: Record<string, { description: string; type: string }>;
    example?: unknown;
}

interface SchemaDefinition {
    type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
    properties?: Record<string, SchemaProperty>;
    items?: SchemaDefinition;
    required?: string[];
    $ref?: string;
    description?: string;
}

interface SchemaProperty {
    type: string;
    description?: string;
    format?: string;
    enum?: string[];
    default?: unknown;
    example?: unknown;
    nullable?: boolean;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
}

interface ApiExample {
    name: string;
    description: string;
    request?: { headers?: Record<string, string>; body?: unknown };
    response: { statusCode: number; body: unknown };
}

interface ApiDocumentation {
    id: string;
    title: string;
    version: string;
    description: string;
    baseUrl: string;
    servers: { url: string; description: string }[];
    tags: { name: string; description: string }[];
    endpoints: ApiEndpoint[];
    schemas: Record<string, SchemaDefinition>;
    securitySchemes: Record<string, SecurityScheme>;
    contact?: { name: string; email: string; url: string };
    license?: { name: string; url: string };
}

interface SecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    description: string;
    name?: string;
    in?: 'header' | 'query' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
}

interface ParsedCode {
    endpoints: Partial<ApiEndpoint>[];
    schemas: Record<string, SchemaDefinition>;
}

export class APIDocumentationGenerator extends EventEmitter {
    private static instance: APIDocumentationGenerator;
    private documentation: Map<string, ApiDocumentation> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): APIDocumentationGenerator {
        if (!APIDocumentationGenerator.instance) {
            APIDocumentationGenerator.instance = new APIDocumentationGenerator();
        }
        return APIDocumentationGenerator.instance;
    }

    createDocumentation(config: {
        title: string;
        version: string;
        description: string;
        baseUrl: string;
    }): ApiDocumentation {
        const doc: ApiDocumentation = {
            id: crypto.randomUUID(),
            title: config.title,
            version: config.version,
            description: config.description,
            baseUrl: config.baseUrl,
            servers: [{ url: config.baseUrl, description: 'Primary server' }],
            tags: [],
            endpoints: [],
            schemas: {},
            securitySchemes: {}
        };

        this.documentation.set(doc.id, doc);
        this.emit('documentationCreated', doc);
        return doc;
    }

    parseCode(code: string, framework: 'express' | 'fastify' | 'koa' | 'nestjs' | 'hono' = 'express'): ParsedCode {
        const endpoints: Partial<ApiEndpoint>[] = [];
        const schemas: Record<string, SchemaDefinition> = {};

        // Express/Fastify route patterns
        const routePatterns = [
            // app.get('/path', handler)
            /(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            // @Get('/path'), @Post('/path'), etc (NestJS)
            /@(Get|Post|Put|Patch|Delete|Options|Head)\s*\(\s*['"`]?([^'"`\)]*)/gi,
            // fastify.route({ method: 'GET', url: '/path' })
            /method:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`][\s\S]*?url:\s*['"`]([^'"`]+)/gi
        ];

        for (const pattern of routePatterns) {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                const method = match[1].toUpperCase() as ApiEndpoint['method'];
                const path = match[2] || '/';

                // Extract parameters from path
                const pathParams: ApiParameter[] = [];
                const paramMatches = path.match(/:(\w+)/g);
                if (paramMatches) {
                    for (const param of paramMatches) {
                        pathParams.push({
                            name: param.slice(1),
                            in: 'path',
                            description: `Path parameter: ${param.slice(1)}`,
                            required: true,
                            type: 'string'
                        });
                    }
                }

                endpoints.push({
                    method,
                    path: path.replace(/:(\w+)/g, '{$1}'),
                    summary: `${method} ${path}`,
                    description: '',
                    tags: this.inferTags(path),
                    parameters: pathParams,
                    responses: this.inferResponses(method)
                });
            }
        }

        // Find TypeScript interfaces/types for schemas
        const interfacePattern = /interface\s+(\w+)\s*\{([^}]+)\}/g;
        let interfaceMatch;
        while ((interfaceMatch = interfacePattern.exec(code)) !== null) {
            const name = interfaceMatch[1];
            const body = interfaceMatch[2];
            schemas[name] = this.parseInterface(body);
        }

        // Find types
        const typePattern = /type\s+(\w+)\s*=\s*\{([^}]+)\}/g;
        let typeMatch;
        while ((typeMatch = typePattern.exec(code)) !== null) {
            const name = typeMatch[1];
            const body = typeMatch[2];
            schemas[name] = this.parseInterface(body);
        }

        return { endpoints, schemas };
    }

    private inferTags(path: string): string[] {
        const parts = path.split('/').filter(Boolean);
        if (parts.length > 0 && !parts[0].startsWith(':') && !parts[0].startsWith('{')) {
            return [parts[0].charAt(0).toUpperCase() + parts[0].slice(1)];
        }
        return [];
    }

    private inferResponses(method: string): ApiResponse[] {
        const responses: ApiResponse[] = [
            { statusCode: 200, description: 'Successful response', contentType: 'application/json' }
        ];

        if (method === 'POST') {
            responses[0].statusCode = 201;
            responses[0].description = 'Resource created';
        }

        responses.push({ statusCode: 400, description: 'Bad request' });
        responses.push({ statusCode: 401, description: 'Unauthorized' });
        responses.push({ statusCode: 404, description: 'Not found' });
        responses.push({ statusCode: 500, description: 'Internal server error' });

        return responses;
    }

    private parseInterface(body: string): SchemaDefinition {
        const properties: Record<string, SchemaProperty> = {};
        const required: string[] = [];

        const lines = body.split('\n').filter(l => l.trim());
        for (const line of lines) {
            const match = line.match(/(\w+)(\?)?:\s*(.+?)(?:;|$)/);
            if (match) {
                const name = match[1];
                const optional = !!match[2];
                const typeStr = match[3].trim();

                if (!optional) {
                    required.push(name);
                }

                properties[name] = {
                    type: this.mapType(typeStr),
                    nullable: typeStr.includes('null')
                };
            }
        }

        return {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined
        };
    }

    private mapType(tsType: string): string {
        const type = tsType.toLowerCase().trim();
        if (type === 'string') return 'string';
        if (type === 'number' || type === 'float' || type === 'double') return 'number';
        if (type === 'boolean' || type === 'bool') return 'boolean';
        if (type === 'integer' || type === 'int') return 'integer';
        if (type.includes('[]') || type.startsWith('array')) return 'array';
        if (type === 'date') return 'string';
        return 'object';
    }

    addEndpoint(docId: string, endpoint: Omit<ApiEndpoint, 'id'>): ApiEndpoint | null {
        const doc = this.documentation.get(docId);
        if (!doc) return null;

        const fullEndpoint: ApiEndpoint = {
            id: crypto.randomUUID(),
            ...endpoint,
            examples: endpoint.examples || []
        };

        doc.endpoints.push(fullEndpoint);
        this.emit('endpointAdded', { docId, endpoint: fullEndpoint });
        return fullEndpoint;
    }

    addSchema(docId: string, name: string, schema: SchemaDefinition): boolean {
        const doc = this.documentation.get(docId);
        if (!doc) return false;

        doc.schemas[name] = schema;
        this.emit('schemaAdded', { docId, name, schema });
        return true;
    }

    generateOpenAPI(docId: string): object {
        const doc = this.documentation.get(docId);
        if (!doc) return {};

        const paths: Record<string, Record<string, unknown>> = {};

        for (const endpoint of doc.endpoints) {
            if (!paths[endpoint.path]) {
                paths[endpoint.path] = {};
            }

            paths[endpoint.path][endpoint.method.toLowerCase()] = {
                summary: endpoint.summary,
                description: endpoint.description,
                tags: endpoint.tags,
                operationId: `${endpoint.method.toLowerCase()}${endpoint.path.replace(/[/{}\-]/g, '_')}`,
                parameters: endpoint.parameters.map(p => ({
                    name: p.name,
                    in: p.in,
                    description: p.description,
                    required: p.required,
                    schema: { type: p.type, format: p.format, enum: p.enum }
                })),
                requestBody: endpoint.requestBody ? {
                    description: endpoint.requestBody.description,
                    required: endpoint.requestBody.required,
                    content: {
                        [endpoint.requestBody.contentType]: {
                            schema: endpoint.requestBody.schema
                        }
                    }
                } : undefined,
                responses: Object.fromEntries(
                    endpoint.responses.map(r => [
                        r.statusCode.toString(),
                        {
                            description: r.description,
                            content: r.contentType ? {
                                [r.contentType]: { schema: r.schema || {} }
                            } : undefined
                        }
                    ])
                ),
                deprecated: endpoint.deprecated,
                security: endpoint.security?.map(s => ({ [s]: [] }))
            };
        }

        return {
            openapi: '3.0.3',
            info: {
                title: doc.title,
                version: doc.version,
                description: doc.description,
                contact: doc.contact,
                license: doc.license
            },
            servers: doc.servers,
            tags: doc.tags,
            paths,
            components: {
                schemas: doc.schemas,
                securitySchemes: doc.securitySchemes
            }
        };
    }

    generateMarkdown(docId: string): string {
        const doc = this.documentation.get(docId);
        if (!doc) return '';

        const lines: string[] = [
            `# ${doc.title}`,
            '',
            doc.description,
            '',
            `**Version:** ${doc.version}`,
            `**Base URL:** ${doc.baseUrl}`,
            '',
            '## Endpoints',
            ''
        ];

        // Group by tags
        const byTag = new Map<string, ApiEndpoint[]>();
        for (const endpoint of doc.endpoints) {
            const tag = endpoint.tags[0] || 'Other';
            if (!byTag.has(tag)) byTag.set(tag, []);
            byTag.get(tag)!.push(endpoint);
        }

        for (const [tag, endpoints] of byTag) {
            lines.push(`### ${tag}`, '');

            for (const endpoint of endpoints) {
                lines.push(`#### ${endpoint.method} ${endpoint.path}`);
                lines.push('');
                lines.push(endpoint.summary);
                lines.push('');

                if (endpoint.description) {
                    lines.push(endpoint.description);
                    lines.push('');
                }

                if (endpoint.parameters.length > 0) {
                    lines.push('**Parameters:**');
                    lines.push('');
                    lines.push('| Name | In | Type | Required | Description |');
                    lines.push('|------|----|----|----------|-------------|');
                    for (const param of endpoint.parameters) {
                        lines.push(`| ${param.name} | ${param.in} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |`);
                    }
                    lines.push('');
                }

                if (endpoint.requestBody) {
                    lines.push('**Request Body:**');
                    lines.push('');
                    lines.push('```json');
                    lines.push(JSON.stringify(endpoint.requestBody.examples, null, 2));
                    lines.push('```');
                    lines.push('');
                }

                lines.push('**Responses:**');
                lines.push('');
                for (const response of endpoint.responses) {
                    lines.push(`- **${response.statusCode}**: ${response.description}`);
                }
                lines.push('');
            }
        }

        // Schemas
        if (Object.keys(doc.schemas).length > 0) {
            lines.push('## Schemas', '');
            for (const [name, schema] of Object.entries(doc.schemas)) {
                lines.push(`### ${name}`, '');
                if (schema.properties) {
                    lines.push('| Property | Type | Required | Description |');
                    lines.push('|----------|------|----------|-------------|');
                    for (const [propName, prop] of Object.entries(schema.properties)) {
                        const required = schema.required?.includes(propName) ? 'Yes' : 'No';
                        lines.push(`| ${propName} | ${prop.type} | ${required} | ${prop.description || '-'} |`);
                    }
                }
                lines.push('');
            }
        }

        return lines.join('\n');
    }

    generateHTML(docId: string): string {
        const markdown = this.generateMarkdown(docId);
        const doc = this.documentation.get(docId);
        if (!doc) return '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title} - API Documentation</title>
    <style>
        :root { --primary: #3b82f6; --bg: #0f172a; --text: #e2e8f0; --code-bg: #1e293b; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); max-width: 1200px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
        h1, h2, h3, h4 { color: #fff; }
        h1 { border-bottom: 2px solid var(--primary); padding-bottom: 20px; }
        h2 { margin-top: 40px; }
        h3 { color: var(--primary); }
        code { background: var(--code-bg); padding: 2px 6px; border-radius: 4px; font-size: 14px; }
        pre { background: var(--code-bg); padding: 20px; border-radius: 8px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #334155; }
        th { background: var(--code-bg); }
        .method { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .method-get { background: #22c55e; color: #000; }
        .method-post { background: #3b82f6; color: #fff; }
        .method-put { background: #f59e0b; color: #000; }
        .method-delete { background: #ef4444; color: #fff; }
    </style>
</head>
<body>
    <h1>${doc.title}</h1>
    <p><strong>Version:</strong> ${doc.version}</p>
    <p><strong>Base URL:</strong> <code>${doc.baseUrl}</code></p>
    <p>${doc.description}</p>
    
    ${doc.endpoints.map(e => `
        <h3><span class="method method-${e.method.toLowerCase()}">${e.method}</span> <code>${e.path}</code></h3>
        <p>${e.summary}</p>
    `).join('')}
</body>
</html>`;
    }

    getDocumentation(id: string): ApiDocumentation | undefined {
        return this.documentation.get(id);
    }

    getAllDocumentation(): ApiDocumentation[] {
        return Array.from(this.documentation.values());
    }

    deleteDocumentation(id: string): boolean {
        return this.documentation.delete(id);
    }
}

export const apiDocumentationGenerator = APIDocumentationGenerator.getInstance();
