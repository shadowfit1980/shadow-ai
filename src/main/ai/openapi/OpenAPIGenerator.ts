/**
 * OpenAPI Generator
 * 
 * Generate OpenAPI/Swagger specs and API clients
 * from code or configuration.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface OpenAPISpec {
    openapi: '3.0.0' | '3.1.0';
    info: {
        title: string;
        version: string;
        description?: string;
        contact?: { name?: string; email?: string; url?: string };
        license?: { name: string; url?: string };
    };
    servers?: Array<{ url: string; description?: string }>;
    paths: Record<string, PathItem>;
    components?: {
        schemas?: Record<string, SchemaObject>;
        securitySchemes?: Record<string, SecurityScheme>;
    };
    security?: Array<Record<string, string[]>>;
    tags?: Array<{ name: string; description?: string }>;
}

export interface PathItem {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    patch?: Operation;
    delete?: Operation;
    parameters?: Parameter[];
}

export interface Operation {
    operationId: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: Parameter[];
    requestBody?: RequestBody;
    responses: Record<string, Response>;
    security?: Array<Record<string, string[]>>;
}

export interface Parameter {
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    required?: boolean;
    schema: SchemaObject;
    description?: string;
}

export interface RequestBody {
    required?: boolean;
    content: Record<string, { schema: SchemaObject }>;
}

export interface Response {
    description: string;
    content?: Record<string, { schema: SchemaObject }>;
}

export interface SchemaObject {
    type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
    format?: string;
    properties?: Record<string, SchemaObject>;
    items?: SchemaObject;
    required?: string[];
    enum?: string[];
    $ref?: string;
    nullable?: boolean;
    description?: string;
}

export interface SecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    scheme?: string;
    bearerFormat?: string;
    in?: string;
    name?: string;
    flows?: any;
}

export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    operationId: string;
    summary?: string;
    tags?: string[];
    params?: Array<{ name: string; in: 'path' | 'query'; type: string; required?: boolean }>;
    body?: { type: string; required?: boolean };
    response: { type: string; statusCode?: number };
}

// ============================================================================
// OPENAPI GENERATOR
// ============================================================================

export class OpenAPIGenerator extends EventEmitter {
    private static instance: OpenAPIGenerator;

    private constructor() {
        super();
    }

    static getInstance(): OpenAPIGenerator {
        if (!OpenAPIGenerator.instance) {
            OpenAPIGenerator.instance = new OpenAPIGenerator();
        }
        return OpenAPIGenerator.instance;
    }

    // ========================================================================
    // SPEC GENERATION
    // ========================================================================

    generateSpec(config: {
        title: string;
        version: string;
        description?: string;
        servers?: string[];
        endpoints: APIEndpoint[];
        models: Array<{ name: string; fields: Array<{ name: string; type: string; required?: boolean }> }>;
    }): OpenAPISpec {
        const spec: OpenAPISpec = {
            openapi: '3.0.0',
            info: {
                title: config.title,
                version: config.version,
                description: config.description,
            },
            servers: config.servers?.map(url => ({ url })),
            paths: {},
            components: {
                schemas: {},
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            tags: [],
        };

        // Generate schemas from models
        for (const model of config.models) {
            spec.components!.schemas![model.name] = {
                type: 'object',
                properties: Object.fromEntries(
                    model.fields.map(f => [f.name, this.typeToSchema(f.type)])
                ),
                required: model.fields.filter(f => f.required).map(f => f.name),
            };
        }

        // Generate paths from endpoints
        const tags = new Set<string>();
        for (const endpoint of config.endpoints) {
            const path = endpoint.path;
            if (!spec.paths[path]) spec.paths[path] = {};

            endpoint.tags?.forEach(t => tags.add(t));

            const operation: Operation = {
                operationId: endpoint.operationId,
                summary: endpoint.summary,
                tags: endpoint.tags,
                parameters: endpoint.params?.map(p => ({
                    name: p.name,
                    in: p.in,
                    required: p.required,
                    schema: this.typeToSchema(p.type),
                })),
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: this.typeToSchema(endpoint.response.type),
                            },
                        },
                    },
                    '400': { description: 'Bad request' },
                    '401': { description: 'Unauthorized' },
                    '404': { description: 'Not found' },
                    '500': { description: 'Internal server error' },
                },
            };

            if (endpoint.body) {
                operation.requestBody = {
                    required: endpoint.body.required,
                    content: {
                        'application/json': {
                            schema: this.typeToSchema(endpoint.body.type),
                        },
                    },
                };
            }

            (spec.paths[path] as any)[endpoint.method.toLowerCase()] = operation;
        }

        spec.tags = Array.from(tags).map(name => ({ name }));

        return spec;
    }

    private typeToSchema(type: string): SchemaObject {
        // Handle arrays
        if (type.endsWith('[]')) {
            return {
                type: 'array',
                items: this.typeToSchema(type.slice(0, -2)),
            };
        }

        // Handle primitives
        const primitives: Record<string, SchemaObject> = {
            'string': { type: 'string' },
            'number': { type: 'number' },
            'integer': { type: 'integer' },
            'boolean': { type: 'boolean' },
            'date': { type: 'string', format: 'date' },
            'datetime': { type: 'string', format: 'date-time' },
            'email': { type: 'string', format: 'email' },
            'uuid': { type: 'string', format: 'uuid' },
            'uri': { type: 'string', format: 'uri' },
        };

        if (primitives[type.toLowerCase()]) {
            return primitives[type.toLowerCase()];
        }

        // Reference to schema
        return { $ref: `#/components/schemas/${type}` };
    }

    // ========================================================================
    // CLIENT GENERATION
    // ========================================================================

    generateTypeScriptClient(spec: OpenAPISpec): string {
        let code = `// Auto-generated API client
import axios, { AxiosInstance, AxiosResponse } from 'axios';

`;

        // Generate types from schemas
        for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
            code += this.schemaToInterface(name, schema) + '\n\n';
        }

        // Generate API client class
        code += `export class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string, token?: string) {
    this.client = axios.create({
      baseURL,
      headers: token ? { Authorization: \`Bearer \${token}\` } : {},
    });
  }

`;

        // Generate methods for each operation
        for (const [path, pathItem] of Object.entries(spec.paths)) {
            for (const [method, operation] of Object.entries(pathItem)) {
                if (method === 'parameters') continue;
                const op = operation as Operation;
                code += this.generateClientMethod(path, method, op) + '\n';
            }
        }

        code += `}\n`;

        return code;
    }

    private schemaToInterface(name: string, schema: SchemaObject): string {
        if (schema.$ref) return '';

        let code = `export interface ${name} {\n`;

        for (const [propName, propSchema] of Object.entries(schema.properties || {})) {
            const optional = !schema.required?.includes(propName) ? '?' : '';
            code += `  ${propName}${optional}: ${this.schemaToType(propSchema)};\n`;
        }

        code += '}';
        return code;
    }

    private schemaToType(schema: SchemaObject): string {
        if (schema.$ref) {
            return schema.$ref.split('/').pop() || 'unknown';
        }

        switch (schema.type) {
            case 'string': return 'string';
            case 'number':
            case 'integer': return 'number';
            case 'boolean': return 'boolean';
            case 'array': return `${this.schemaToType(schema.items!)}[]`;
            case 'object': return 'Record<string, unknown>';
            default: return 'unknown';
        }
    }

    private generateClientMethod(path: string, method: string, operation: Operation): string {
        const pathParams = operation.parameters?.filter(p => p.in === 'path') || [];
        const queryParams = operation.parameters?.filter(p => p.in === 'query') || [];
        const hasBody = !!operation.requestBody;

        const params: string[] = pathParams.map(p => `${p.name}: ${this.schemaToType(p.schema)}`);
        if (queryParams.length > 0) {
            params.push(`params?: { ${queryParams.map(p => `${p.name}?: ${this.schemaToType(p.schema)}`).join('; ')} }`);
        }
        if (hasBody) {
            const bodySchema = Object.values((operation.requestBody as RequestBody).content)[0]?.schema;
            params.push(`data: ${bodySchema ? this.schemaToType(bodySchema) : 'unknown'}`);
        }

        const responseType = Object.values(operation.responses['200']?.content || {})[0]?.schema;
        const returnType = responseType ? this.schemaToType(responseType) : 'void';

        let urlExpr = `\`${path.replace(/{(\w+)}/g, '${$1}')}\``;

        return `  async ${operation.operationId}(${params.join(', ')}): Promise<${returnType}> {
    const response = await this.client.${method}(${urlExpr}${hasBody ? ', data' : ''}${queryParams.length ? ', { params }' : ''});
    return response.data;
  }`;
    }

    // ========================================================================
    // VALIDATION
    // ========================================================================

    generateZodValidators(spec: OpenAPISpec): string {
        let code = `import { z } from 'zod';\n\n`;

        for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
            code += `export const ${name}Schema = ${this.schemaToZod(schema)};\n`;
            code += `export type ${name} = z.infer<typeof ${name}Schema>;\n\n`;
        }

        return code;
    }

    private schemaToZod(schema: SchemaObject): string {
        if (schema.$ref) {
            const refName = schema.$ref.split('/').pop();
            return `${refName}Schema`;
        }

        switch (schema.type) {
            case 'string':
                if (schema.format === 'email') return 'z.string().email()';
                if (schema.format === 'uuid') return 'z.string().uuid()';
                if (schema.format === 'date-time') return 'z.string().datetime()';
                if (schema.enum) return `z.enum([${schema.enum.map(e => `'${e}'`).join(', ')}])`;
                return 'z.string()';
            case 'number':
            case 'integer':
                return 'z.number()';
            case 'boolean':
                return 'z.boolean()';
            case 'array':
                return `z.array(${this.schemaToZod(schema.items!)})`;
            case 'object':
                const props = Object.entries(schema.properties || {})
                    .map(([name, prop]) => {
                        const zodType = this.schemaToZod(prop as SchemaObject);
                        const optional = !schema.required?.includes(name);
                        return `  ${name}: ${zodType}${optional ? '.optional()' : ''}`;
                    })
                    .join(',\n');
                return `z.object({\n${props}\n})`;
            default:
                return 'z.unknown()';
        }
    }

    // ========================================================================
    // EXPRESS ROUTES
    // ========================================================================

    generateExpressRoutes(spec: OpenAPISpec): string {
        let code = `import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

`;

        for (const [path, pathItem] of Object.entries(spec.paths)) {
            const expressPath = path.replace(/{(\w+)}/g, ':$1');

            for (const [method, operation] of Object.entries(pathItem)) {
                if (method === 'parameters') continue;
                const op = operation as Operation;

                code += `/**
 * ${op.summary || op.operationId}
 */
router.${method}('${expressPath}', async (req: Request, res: Response) => {
  try {
    // TODO: Implement ${op.operationId}
    res.json({ message: 'Not implemented' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

`;
            }
        }

        code += `export default router;\n`;
        return code;
    }

    // ========================================================================
    // EXPORT
    // ========================================================================

    toJSON(spec: OpenAPISpec): string {
        return JSON.stringify(spec, null, 2);
    }

    toYAML(spec: OpenAPISpec): string {
        // Simple YAML serialization
        const yaml = (obj: any, indent = 0): string => {
            const spaces = '  '.repeat(indent);

            if (Array.isArray(obj)) {
                return obj.map(item => `${spaces}- ${typeof item === 'object' ? '\n' + yaml(item, indent + 1) : item}`).join('\n');
            }

            if (typeof obj === 'object' && obj !== null) {
                return Object.entries(obj)
                    .filter(([_, v]) => v !== undefined)
                    .map(([key, value]) => {
                        if (typeof value === 'object') {
                            return `${spaces}${key}:\n${yaml(value, indent + 1)}`;
                        }
                        return `${spaces}${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
                    })
                    .join('\n');
            }

            return String(obj);
        };

        return yaml(spec);
    }
}

export const openAPIGenerator = OpenAPIGenerator.getInstance();
