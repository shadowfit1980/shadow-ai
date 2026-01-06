/**
 * Framework Tools
 * 
 * AI-powered tools for generating framework-specific code.
 * Inspired by Lovable, Bolt.new, and Firebase Studio.
 */

import { BaseTool, defineParameter } from '../BaseTool';
import { ToolExecutionContext, ToolExecutionResult } from '../types';
import { ModelManager } from '../../ModelManager';

// ============================================================================
// REACT COMPONENT GENERATOR
// ============================================================================

export class ReactComponentGeneratorTool extends BaseTool {
    private modelManager = ModelManager.getInstance();

    constructor() {
        super({
            name: 'generate_react_component',
            description: 'Generate a React component with TypeScript and optional styling',
            category: 'code',
            parameters: [
                defineParameter('name', 'string', 'Component name (PascalCase)'),
                defineParameter('description', 'string', 'What the component should do'),
                defineParameter('props', 'array', 'List of props with types', false),
                defineParameter('styling', 'string', 'Styling approach', false, {
                    default: 'tailwind',
                    enum: ['tailwind', 'css-modules', 'styled-components', 'none'],
                }),
                defineParameter('hooks', 'array', 'React hooks to include', false),
            ],
            returns: {
                type: 'object',
                description: 'Generated component code and tests',
            },
            tags: ['react', 'component', 'generate', 'frontend'],
        });
    }

    async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const { name, description, props = [], styling = 'tailwind', hooks = [] } = params;

            const prompt = `Generate a React TypeScript component.

Component: ${name}
Description: ${description}
Props: ${JSON.stringify(props)}
Styling: ${styling}
Hooks: ${hooks.join(', ') || 'none'}

Generate clean, production-ready code. Respond in JSON:
\`\`\`json
{
    "component": "full component code",
    "types": "TypeScript interface for props",
    "test": "Jest/React Testing Library test",
    "story": "Storybook story (optional)"
}
\`\`\``;

            const response = await this.modelManager.chat([
                { role: 'system', content: 'You are a React expert. Generate clean, modern React components.', timestamp: new Date() },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            const parsed = this.parseJSON(response);

            return this.createSuccessResult({
                name,
                files: {
                    [`${name}.tsx`]: parsed.component,
                    [`${name}.types.ts`]: parsed.types,
                    [`${name}.test.tsx`]: parsed.test,
                    [`${name}.stories.tsx`]: parsed.story,
                },
            }, Date.now() - startTime);

        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseJSON(text: string): any {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        return JSON.parse(match ? match[1] : text);
    }
}

// ============================================================================
// API ROUTE GENERATOR
// ============================================================================

export class ApiRouteGeneratorTool extends BaseTool {
    private modelManager = ModelManager.getInstance();

    constructor() {
        super({
            name: 'generate_api_route',
            description: 'Generate REST API routes for Next.js, Express, or FastAPI',
            category: 'code',
            parameters: [
                defineParameter('framework', 'string', 'Target framework', true, {
                    enum: ['nextjs', 'express', 'fastapi'],
                }),
                defineParameter('resource', 'string', 'Resource name (e.g., users, posts)'),
                defineParameter('operations', 'array', 'CRUD operations to include', false, {
                    default: ['create', 'read', 'update', 'delete', 'list'],
                }),
                defineParameter('authentication', 'boolean', 'Include auth middleware', false, {
                    default: true,
                }),
                defineParameter('validation', 'boolean', 'Include request validation', false, {
                    default: true,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Generated API route files',
            },
            tags: ['api', 'route', 'backend', 'generate'],
        });
    }

    async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const { framework, resource, operations, authentication, validation } = params;

            const prompt = `Generate ${framework} API routes for ${resource}.

Framework: ${framework}
Resource: ${resource}
Operations: ${operations.join(', ')}
Authentication: ${authentication}
Validation: ${validation}

Generate complete, production-ready code. Respond in JSON:
\`\`\`json
{
    "route": "main route file code",
    "controller": "controller/handler code",
    "validation": "validation schema code",
    "types": "TypeScript types"
}
\`\`\``;

            const response = await this.modelManager.chat([
                { role: 'system', content: 'You are a backend API expert. Generate clean, secure API routes.', timestamp: new Date() },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            const parsed = this.parseJSON(response);

            const files: Record<string, string> = {};

            if (framework === 'nextjs') {
                files[`app/api/${resource}/route.ts`] = parsed.route;
                files[`lib/${resource}/types.ts`] = parsed.types;
                if (validation) files[`lib/${resource}/validation.ts`] = parsed.validation;
            } else if (framework === 'express') {
                files[`routes/${resource}.ts`] = parsed.route;
                files[`controllers/${resource}.ts`] = parsed.controller;
                if (validation) files[`validators/${resource}.ts`] = parsed.validation;
            } else if (framework === 'fastapi') {
                files[`routers/${resource}.py`] = parsed.route;
                files[`schemas/${resource}.py`] = parsed.types;
            }

            return this.createSuccessResult({
                framework,
                resource,
                files,
            }, Date.now() - startTime);

        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseJSON(text: string): any {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        return JSON.parse(match ? match[1] : text);
    }
}

// ============================================================================
// DATABASE SCHEMA GENERATOR
// ============================================================================

export class DatabaseSchemaGeneratorTool extends BaseTool {
    private modelManager = ModelManager.getInstance();

    constructor() {
        super({
            name: 'generate_database_schema',
            description: 'Generate database schema for Prisma, Drizzle, or raw SQL',
            category: 'database',
            parameters: [
                defineParameter('orm', 'string', 'ORM/format to use', true, {
                    enum: ['prisma', 'drizzle', 'sql', 'mongoose'],
                }),
                defineParameter('description', 'string', 'Describe the data models needed'),
                defineParameter('relationships', 'boolean', 'Include relationship definitions', false, {
                    default: true,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Generated schema code',
            },
            tags: ['database', 'schema', 'orm', 'prisma'],
        });
    }

    async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const { orm, description, relationships } = params;

            const prompt = `Generate a ${orm} database schema.

Description: ${description}
Include relationships: ${relationships}

Generate complete schema code. Respond in JSON:
\`\`\`json
{
    "schema": "full schema code",
    "migrations": "migration commands",
    "seedData": "example seed data"
}
\`\`\``;

            const response = await this.modelManager.chat([
                { role: 'system', content: 'You are a database expert. Generate optimized, normalized schemas.', timestamp: new Date() },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            const parsed = this.parseJSON(response);

            const files: Record<string, string> = {};

            if (orm === 'prisma') {
                files['prisma/schema.prisma'] = parsed.schema;
                files['prisma/seed.ts'] = parsed.seedData;
            } else if (orm === 'drizzle') {
                files['db/schema.ts'] = parsed.schema;
                files['db/seed.ts'] = parsed.seedData;
            } else if (orm === 'mongoose') {
                files['models/index.ts'] = parsed.schema;
            } else {
                files['migrations/001_initial.sql'] = parsed.schema;
            }

            return this.createSuccessResult({
                orm,
                files,
                migrations: parsed.migrations,
            }, Date.now() - startTime);

        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseJSON(text: string): any {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        return JSON.parse(match ? match[1] : text);
    }
}

// ============================================================================
// PAGE GENERATOR
// ============================================================================

export class PageGeneratorTool extends BaseTool {
    private modelManager = ModelManager.getInstance();

    constructor() {
        super({
            name: 'generate_page',
            description: 'Generate a complete page with layout, components, and data fetching',
            category: 'code',
            parameters: [
                defineParameter('framework', 'string', 'Target framework', true, {
                    enum: ['nextjs', 'react', 'vue', 'svelte'],
                }),
                defineParameter('name', 'string', 'Page name'),
                defineParameter('description', 'string', 'What the page should contain'),
                defineParameter('dataFetching', 'string', 'Data fetching approach', false, {
                    enum: ['server', 'client', 'static', 'none'],
                    default: 'server',
                }),
                defineParameter('layout', 'string', 'Page layout', false, {
                    enum: ['dashboard', 'landing', 'form', 'list', 'detail', 'custom'],
                    default: 'custom',
                }),
            ],
            returns: {
                type: 'object',
                description: 'Generated page code',
            },
            tags: ['page', 'generate', 'frontend', 'ui'],
        });
    }

    async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const { framework, name, description, dataFetching, layout } = params;

            const prompt = `Generate a ${framework} page.

Page: ${name}
Description: ${description}
Data Fetching: ${dataFetching}
Layout Type: ${layout}

Generate complete, styled page code. Respond in JSON:
\`\`\`json
{
    "page": "main page component",
    "components": ["sub-component code"],
    "styles": "CSS/Tailwind styles",
    "types": "TypeScript types",
    "api": "API route if needed"
}
\`\`\``;

            const response = await this.modelManager.chat([
                { role: 'system', content: 'You are a frontend expert. Generate beautiful, responsive pages.', timestamp: new Date() },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            const parsed = this.parseJSON(response);

            return this.createSuccessResult({
                framework,
                name,
                files: {
                    page: parsed.page,
                    components: parsed.components,
                    styles: parsed.styles,
                    types: parsed.types,
                    api: parsed.api,
                },
            }, Date.now() - startTime);

        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseJSON(text: string): any {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        return JSON.parse(match ? match[1] : text);
    }
}

// ============================================================================
// FULL-STACK FEATURE GENERATOR
// ============================================================================

export class FullStackFeatureGeneratorTool extends BaseTool {
    private modelManager = ModelManager.getInstance();

    constructor() {
        super({
            name: 'generate_fullstack_feature',
            description: 'Generate a complete full-stack feature including frontend, backend, and database',
            category: 'code',
            parameters: [
                defineParameter('feature', 'string', 'Feature name (e.g., user-authentication, comments)'),
                defineParameter('description', 'string', 'Detailed feature description'),
                defineParameter('stack', 'object', 'Technology stack', false, {
                    default: {
                        frontend: 'nextjs',
                        backend: 'nextjs-api',
                        database: 'prisma',
                    },
                }),
            ],
            returns: {
                type: 'object',
                description: 'Complete feature implementation',
            },
            tags: ['fullstack', 'feature', 'generate'],
        });
    }

    async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const { feature, description, stack } = params;

            const prompt = `Generate a complete full-stack feature.

Feature: ${feature}
Description: ${description}
Stack: ${JSON.stringify(stack)}

Generate ALL necessary code. Respond in JSON:
\`\`\`json
{
    "database": {
        "schema": "prisma/drizzle schema addition",
        "migration": "migration SQL"
    },
    "backend": {
        "routes": "API routes",
        "services": "business logic",
        "types": "shared types"
    },
    "frontend": {
        "pages": ["page components"],
        "components": ["UI components"],
        "hooks": ["custom hooks"],
        "api": "API client code"
    },
    "tests": {
        "unit": "unit tests",
        "integration": "integration tests"
    }
}
\`\`\``;

            const response = await this.modelManager.chat([
                { role: 'system', content: 'You are a full-stack expert. Generate complete, production-ready features.', timestamp: new Date() },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            const parsed = this.parseJSON(response);

            return this.createSuccessResult({
                feature,
                stack,
                implementation: parsed,
            }, Date.now() - startTime);

        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }

    private parseJSON(text: string): any {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        return JSON.parse(match ? match[1] : text);
    }
}

// Export all tools
export const frameworkTools = [
    new ReactComponentGeneratorTool(),
    new ApiRouteGeneratorTool(),
    new DatabaseSchemaGeneratorTool(),
    new PageGeneratorTool(),
    new FullStackFeatureGeneratorTool(),
];
