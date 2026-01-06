/**
 * API Documentation Generator
 * Auto-generate API docs from code
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: string;
    description?: string;
    parameters: APIParameter[];
    requestBody?: APISchema;
    responses: APIResponse[];
    file: string;
    line: number;
}

export interface APIParameter {
    name: string;
    in: 'path' | 'query' | 'header';
    type: string;
    required: boolean;
    description?: string;
}

export interface APISchema {
    type: string;
    properties?: Record<string, { type: string; description?: string }>;
    example?: any;
}

export interface APIResponse {
    status: number;
    description: string;
    schema?: APISchema;
}

export interface APIDocumentation {
    title: string;
    version: string;
    description?: string;
    basePath?: string;
    endpoints: APIEndpoint[];
    schemas: Record<string, APISchema>;
}

/**
 * APIDocGenerator
 * Generate documentation from Express/Fastify/Koa routes
 */
export class APIDocGenerator extends EventEmitter {
    private static instance: APIDocGenerator;
    private docs: Map<string, APIDocumentation> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): APIDocGenerator {
        if (!APIDocGenerator.instance) {
            APIDocGenerator.instance = new APIDocGenerator();
        }
        return APIDocGenerator.instance;
    }

    /**
     * Generate docs from project
     */
    async generateFromProject(projectPath: string, title = 'API Documentation'): Promise<APIDocumentation> {
        this.emit('generationStarted', { projectPath });

        const endpoints: APIEndpoint[] = [];
        const schemas: Record<string, APISchema> = {};

        const files = await this.findRouteFiles(projectPath);

        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const fileEndpoints = this.parseRoutes(file, content);
            endpoints.push(...fileEndpoints);
        }

        const doc: APIDocumentation = {
            title,
            version: '1.0.0',
            endpoints,
            schemas,
        };

        this.docs.set(projectPath, doc);
        this.emit('generationCompleted', doc);

        return doc;
    }

    /**
     * Find route files
     */
    private async findRouteFiles(dir: string): Promise<string[]> {
        const files: string[] = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

                if (entry.isDirectory()) {
                    files.push(...await this.findRouteFiles(fullPath));
                } else if (/\.(ts|js)$/.test(entry.name)) {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    if (/app\.(get|post|put|delete|patch)|router\.(get|post|put|delete|patch)|@(Get|Post|Put|Delete|Patch)/.test(content)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch {
            // Skip inaccessible directories
        }

        return files;
    }

    /**
     * Parse routes from file
     */
    private parseRoutes(file: string, content: string): APIEndpoint[] {
        const endpoints: APIEndpoint[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Express routes
            const expressMatch = line.match(/\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/i);
            if (expressMatch) {
                const method = expressMatch[1].toUpperCase() as APIEndpoint['method'];
                const routePath = expressMatch[2];

                // Look for JSDoc comments above
                const docComment = this.extractDocComment(lines, i);
                const parameters = this.extractParameters(routePath, lines, i);

                endpoints.push({
                    method,
                    path: routePath,
                    handler: this.extractHandler(line),
                    description: docComment?.description,
                    parameters,
                    responses: this.inferResponses(lines, i),
                    file,
                    line: i + 1,
                });
            }

            // Decorator routes (NestJS style)
            const decoratorMatch = line.match(/@(Get|Post|Put|Delete|Patch)\s*\(\s*['"`]?([^'"`)]*)['"`]?\)/i);
            if (decoratorMatch) {
                const method = decoratorMatch[1].toUpperCase() as APIEndpoint['method'];
                const routePath = decoratorMatch[2] || '/';

                // Find the method below
                const methodLine = lines[i + 1];
                const methodMatch = methodLine?.match(/(?:async\s+)?(\w+)\s*\(/);

                endpoints.push({
                    method,
                    path: routePath,
                    handler: methodMatch ? methodMatch[1] : 'handler',
                    description: this.extractDocComment(lines, i)?.description,
                    parameters: this.extractParameters(routePath, lines, i),
                    responses: this.inferResponses(lines, i),
                    file,
                    line: i + 1,
                });
            }
        }

        return endpoints;
    }

    /**
     * Extract JSDoc comment
     */
    private extractDocComment(lines: string[], index: number): { description?: string; params: string[] } | null {
        let description = '';
        const params: string[] = [];

        // Look backwards for JSDoc
        for (let i = index - 1; i >= 0 && i >= index - 10; i--) {
            const line = lines[i].trim();

            if (line === '*/') continue;
            if (line.startsWith('*')) {
                const content = line.replace(/^\*\s*/, '').trim();
                if (content.startsWith('@param')) {
                    params.push(content);
                } else if (content.startsWith('@')) {
                    continue;
                } else if (content) {
                    description = content + ' ' + description;
                }
            }
            if (line.startsWith('/**')) break;
            if (!line.startsWith('*') && !line.startsWith('/**') && line !== '') break;
        }

        return description.trim() ? { description: description.trim(), params } : null;
    }

    /**
     * Extract parameters from route
     */
    private extractParameters(routePath: string, lines: string[], index: number): APIParameter[] {
        const params: APIParameter[] = [];

        // Path parameters
        const pathParams = routePath.match(/:(\w+)/g);
        if (pathParams) {
            for (const p of pathParams) {
                params.push({
                    name: p.slice(1),
                    in: 'path',
                    type: 'string',
                    required: true,
                });
            }
        }

        // Query parameters from context (look for req.query usage)
        for (let i = index; i < Math.min(index + 20, lines.length); i++) {
            const queryMatch = lines[i].match(/req\.query\.(\w+)|req\.query\[['"`](\w+)['"`]\]/g);
            if (queryMatch) {
                for (const m of queryMatch) {
                    const name = m.match(/[\w]+$/)?.[0];
                    if (name && !params.find(p => p.name === name)) {
                        params.push({
                            name,
                            in: 'query',
                            type: 'string',
                            required: false,
                        });
                    }
                }
            }
        }

        return params;
    }

    /**
     * Extract handler name
     */
    private extractHandler(line: string): string {
        const match = line.match(/,\s*(\w+)\s*\)/) || line.match(/,\s*(\w+)\s*$/);
        return match ? match[1] : 'handler';
    }

    /**
     * Infer responses
     */
    private inferResponses(lines: string[], index: number): APIResponse[] {
        const responses: APIResponse[] = [];

        // Look for res.status() or res.json() calls
        for (let i = index; i < Math.min(index + 30, lines.length); i++) {
            const statusMatch = lines[i].match(/res\.status\s*\(\s*(\d+)\s*\)/);
            if (statusMatch) {
                const status = parseInt(statusMatch[1]);
                if (!responses.find(r => r.status === status)) {
                    responses.push({
                        status,
                        description: this.getStatusDescription(status),
                    });
                }
            }
        }

        // Default responses
        if (responses.length === 0) {
            responses.push({ status: 200, description: 'Success' });
        }

        return responses;
    }

    /**
     * Get status description
     */
    private getStatusDescription(status: number): string {
        const descriptions: Record<number, string> = {
            200: 'Success',
            201: 'Created',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error',
        };
        return descriptions[status] || `Status ${status}`;
    }

    /**
     * Generate Markdown docs
     */
    generateMarkdown(doc: APIDocumentation): string {
        const lines = [
            `# ${doc.title}`,
            '',
            `Version: ${doc.version}`,
            '',
            doc.description || '',
            '',
            '## Endpoints',
            '',
        ];

        // Group by path
        const grouped = new Map<string, APIEndpoint[]>();
        for (const ep of doc.endpoints) {
            const key = ep.path.split('/')[1] || 'root';
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(ep);
        }

        for (const [group, endpoints] of grouped) {
            lines.push(`### ${group}`);
            lines.push('');

            for (const ep of endpoints) {
                lines.push(`#### \`${ep.method} ${ep.path}\``);
                if (ep.description) lines.push(`${ep.description}`);
                lines.push('');

                if (ep.parameters.length > 0) {
                    lines.push('**Parameters:**');
                    for (const p of ep.parameters) {
                        lines.push(`- \`${p.name}\` (${p.in}, ${p.type}${p.required ? ', required' : ''})`);
                    }
                    lines.push('');
                }

                lines.push('**Responses:**');
                for (const r of ep.responses) {
                    lines.push(`- \`${r.status}\`: ${r.description}`);
                }
                lines.push('');
            }
        }

        return lines.join('\n');
    }

    /**
     * Generate OpenAPI spec
     */
    generateOpenAPI(doc: APIDocumentation): object {
        const paths: Record<string, any> = {};

        for (const ep of doc.endpoints) {
            if (!paths[ep.path]) paths[ep.path] = {};

            paths[ep.path][ep.method.toLowerCase()] = {
                summary: ep.description || ep.handler,
                parameters: ep.parameters.map(p => ({
                    name: p.name,
                    in: p.in,
                    required: p.required,
                    schema: { type: p.type },
                })),
                responses: Object.fromEntries(
                    ep.responses.map(r => [r.status.toString(), { description: r.description }])
                ),
            };
        }

        return {
            openapi: '3.0.0',
            info: {
                title: doc.title,
                version: doc.version,
                description: doc.description,
            },
            paths,
        };
    }

    /**
     * Get documentation
     */
    getDocumentation(projectPath: string): APIDocumentation | null {
        return this.docs.get(projectPath) || null;
    }
}

// Singleton getter
export function getAPIDocGenerator(): APIDocGenerator {
    return APIDocGenerator.getInstance();
}
