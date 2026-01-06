/**
 * NaturalLanguageArchitect - Architecture from Natural Language
 * 
 * Describe architecture in natural language, get implementation scaffolds.
 * Generates diagrams, service scaffolds, API contracts, and deployment configs.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface ArchitectureRequest {
    description: string;
    constraints?: {
        language?: string;
        framework?: string;
        deployment?: 'kubernetes' | 'docker' | 'serverless' | 'traditional';
        database?: 'postgresql' | 'mongodb' | 'mysql' | 'dynamodb';
    };
}

export interface ServiceDefinition {
    name: string;
    type: 'api' | 'worker' | 'frontend' | 'database' | 'cache' | 'queue';
    description: string;
    endpoints?: APIEndpoint[];
    dependencies: string[];
    technology: string;
}

export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    requestBody?: string;
    responseBody?: string;
}

export interface DatabaseSchema {
    tables: TableDefinition[];
    relationships: Relationship[];
}

export interface TableDefinition {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        primaryKey?: boolean;
        unique?: boolean;
        references?: { table: string; column: string };
    }>;
}

export interface Relationship {
    from: { table: string; column: string };
    to: { table: string; column: string };
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface ArchitectureResult {
    id: string;
    description: string;
    services: ServiceDefinition[];
    database?: DatabaseSchema;
    diagram: string; // Mermaid format
    scaffolds: GeneratedFile[];
    deploymentConfig?: string;
    apiContracts?: string;
    documentation: string;
    createdAt: Date;
}

export interface GeneratedFile {
    path: string;
    content: string;
    language: string;
}

// ============================================================================
// ARCHITECTURE PATTERNS
// ============================================================================

const ARCHITECTURE_PATTERNS = {
    microservices: {
        keywords: ['microservices', 'micro services', 'distributed', 'separate services'],
        template: 'microservices'
    },
    monolith: {
        keywords: ['monolith', 'single app', 'all-in-one'],
        template: 'monolith'
    },
    serverless: {
        keywords: ['serverless', 'lambda', 'functions', 'faas'],
        template: 'serverless'
    },
    eventDriven: {
        keywords: ['event', 'message', 'queue', 'async', 'pubsub', 'kafka'],
        template: 'event-driven'
    }
};

// ============================================================================
// NATURAL LANGUAGE ARCHITECT
// ============================================================================

export class NaturalLanguageArchitect extends EventEmitter {
    private static instance: NaturalLanguageArchitect;

    private generatedArchitectures: Map<string, ArchitectureResult> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): NaturalLanguageArchitect {
        if (!NaturalLanguageArchitect.instance) {
            NaturalLanguageArchitect.instance = new NaturalLanguageArchitect();
        }
        return NaturalLanguageArchitect.instance;
    }

    // ========================================================================
    // ARCHITECTURE GENERATION
    // ========================================================================

    /**
     * Generate architecture from natural language description
     */
    async generate(request: ArchitectureRequest): Promise<ArchitectureResult> {
        console.log(`🏗️ [NLArchitect] Generating architecture from: "${request.description.substring(0, 50)}..."`);

        // Parse the description
        const parsed = this.parseDescription(request.description);

        // Detect architecture pattern
        const pattern = this.detectPattern(request.description);

        // Generate services
        const services = this.generateServices(parsed, pattern, request.constraints);

        // Generate database schema
        const database = this.generateDatabase(parsed);

        // Generate diagram
        const diagram = this.generateDiagram(services, database);

        // Generate scaffolds
        const scaffolds = this.generateScaffolds(services, request.constraints);

        // Generate deployment config
        const deploymentConfig = this.generateDeploymentConfig(services, request.constraints);

        // Generate API contracts
        const apiContracts = this.generateApiContracts(services);

        // Generate documentation
        const documentation = this.generateDocumentation(services, database, request.description);

        const result: ArchitectureResult = {
            id: this.generateId(),
            description: request.description,
            services,
            database,
            diagram,
            scaffolds,
            deploymentConfig,
            apiContracts,
            documentation,
            createdAt: new Date()
        };

        this.generatedArchitectures.set(result.id, result);
        this.emit('architecture:generated', result);

        console.log(`✅ [NLArchitect] Generated ${services.length} services, ${scaffolds.length} files`);
        return result;
    }

    // ========================================================================
    // PARSING
    // ========================================================================

    private parseDescription(description: string): {
        entities: string[];
        actions: string[];
        relationships: Array<{ from: string; to: string; via: string }>;
    } {
        const lower = description.toLowerCase();

        // Extract entities (nouns that look like services/models)
        const entityPatterns = [
            /(?:user|customer|admin|client)s?/gi,
            /(?:order|product|item|cart|payment)s?/gi,
            /(?:service|api|endpoint|database)s?/gi,
            /(?:message|notification|email)s?/gi,
            /(?:auth|authentication|login)/gi,
        ];

        const entities = new Set<string>();
        for (const pattern of entityPatterns) {
            const matches: string[] = description.match(pattern) || [];
            matches.forEach(m => entities.add(m.toLowerCase()));
        }

        // Extract actions (verbs)
        const actionPatterns = [
            /(?:create|read|update|delete|manage|handle)/gi,
            /(?:send|receive|process|validate|verify)/gi,
            /(?:communicate|connect|integrate)/gi,
        ];

        const actions = new Set<string>();
        for (const pattern of actionPatterns) {
            const matches: string[] = description.match(pattern) || [];
            matches.forEach(m => actions.add(m.toLowerCase()));
        }

        // Extract relationships
        const relationships: Array<{ from: string; to: string; via: string }> = [];
        const relPatterns = [
            /(\w+)\s+(?:talks? to|connects? to|sends? to|communicates? with)\s+(\w+)/gi,
            /(\w+)\s+(?:has|contains?|manages?)\s+(?:many\s+)?(\w+)/gi,
        ];

        for (const pattern of relPatterns) {
            let match;
            while ((match = pattern.exec(description)) !== null) {
                relationships.push({
                    from: match[1].toLowerCase(),
                    to: match[2].toLowerCase(),
                    via: 'relates'
                });
            }
        }

        return {
            entities: Array.from(entities),
            actions: Array.from(actions),
            relationships
        };
    }

    private detectPattern(description: string): string {
        const lower = description.toLowerCase();

        for (const [name, config] of Object.entries(ARCHITECTURE_PATTERNS)) {
            if (config.keywords.some(kw => lower.includes(kw))) {
                return name;
            }
        }

        // Default based on complexity
        const entityCount = (description.match(/service|api|component/gi) || []).length;
        return entityCount > 3 ? 'microservices' : 'monolith';
    }

    // ========================================================================
    // SERVICE GENERATION
    // ========================================================================

    private generateServices(
        parsed: ReturnType<typeof this.parseDescription>,
        pattern: string,
        constraints?: ArchitectureRequest['constraints']
    ): ServiceDefinition[] {
        const services: ServiceDefinition[] = [];
        const tech = constraints?.language || 'typescript';
        const framework = constraints?.framework || 'express';

        // Create services based on entities
        for (const entity of parsed.entities) {
            if (['service', 'api', 'database'].includes(entity)) continue;

            const serviceName = `${entity}-service`;
            const endpoints: APIEndpoint[] = [
                { method: 'GET', path: `/${entity}s`, description: `List all ${entity}s`, responseBody: `${entity}[]` },
                { method: 'GET', path: `/${entity}s/:id`, description: `Get ${entity} by ID`, responseBody: entity },
                { method: 'POST', path: `/${entity}s`, description: `Create ${entity}`, requestBody: entity, responseBody: entity },
                { method: 'PUT', path: `/${entity}s/:id`, description: `Update ${entity}`, requestBody: entity, responseBody: entity },
                { method: 'DELETE', path: `/${entity}s/:id`, description: `Delete ${entity}`, responseBody: 'void' },
            ];

            services.push({
                name: serviceName,
                type: 'api',
                description: `Handles ${entity} operations`,
                endpoints,
                dependencies: [],
                technology: `${tech}/${framework}`
            });
        }

        // Add common infrastructure services
        if (pattern === 'microservices') {
            services.push({
                name: 'api-gateway',
                type: 'api',
                description: 'API Gateway for routing and auth',
                dependencies: services.map(s => s.name),
                technology: `${tech}/express`
            });
        }

        // Add database service
        if (constraints?.database || parsed.entities.length > 0) {
            services.push({
                name: 'database',
                type: 'database',
                description: 'Primary data store',
                dependencies: [],
                technology: constraints?.database || 'postgresql'
            });
        }

        return services;
    }

    // ========================================================================
    // DATABASE GENERATION
    // ========================================================================

    private generateDatabase(parsed: ReturnType<typeof this.parseDescription>): DatabaseSchema {
        const tables: TableDefinition[] = [];
        const relationships: Relationship[] = [];

        for (const entity of parsed.entities) {
            if (['service', 'api', 'database'].includes(entity)) continue;

            tables.push({
                name: entity,
                columns: [
                    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
                    { name: 'created_at', type: 'timestamp', nullable: false },
                    { name: 'updated_at', type: 'timestamp', nullable: false },
                    { name: 'name', type: 'varchar(255)', nullable: true },
                    { name: 'status', type: 'varchar(50)', nullable: true },
                ]
            });
        }

        // Add relationships based on parsed relationships
        for (const rel of parsed.relationships) {
            if (tables.some(t => t.name === rel.from) && tables.some(t => t.name === rel.to)) {
                relationships.push({
                    from: { table: rel.from, column: 'id' },
                    to: { table: rel.to, column: `${rel.from}_id` },
                    type: 'one-to-many'
                });

                // Add foreign key column
                const targetTable = tables.find(t => t.name === rel.to);
                if (targetTable) {
                    targetTable.columns.push({
                        name: `${rel.from}_id`,
                        type: 'uuid',
                        nullable: true,
                        references: { table: rel.from, column: 'id' }
                    });
                }
            }
        }

        return { tables, relationships };
    }

    // ========================================================================
    // DIAGRAM GENERATION
    // ========================================================================

    private generateDiagram(services: ServiceDefinition[], database: DatabaseSchema): string {
        let mermaid = 'graph TB\n';
        mermaid += '    subgraph Services\n';

        for (const service of services) {
            const icon = service.type === 'database' ? '[(Database)]' :
                service.type === 'api' ? '[API]' : '[Service]';
            mermaid += `        ${service.name.replace(/-/g, '_')}${icon}\n`;
        }
        mermaid += '    end\n\n';

        // Add connections
        for (const service of services) {
            for (const dep of service.dependencies) {
                mermaid += `    ${service.name.replace(/-/g, '_')} --> ${dep.replace(/-/g, '_')}\n`;
            }
        }

        // Add database tables
        if (database.tables.length > 0) {
            mermaid += '\n    subgraph Database\n';
            for (const table of database.tables) {
                mermaid += `        ${table.name}[${table.name}]\n`;
            }
            mermaid += '    end\n';

            // Connect services to database
            for (const service of services.filter(s => s.type === 'api')) {
                mermaid += `    ${service.name.replace(/-/g, '_')} --> database\n`;
            }
        }

        return mermaid;
    }

    // ========================================================================
    // SCAFFOLD GENERATION
    // ========================================================================

    private generateScaffolds(
        services: ServiceDefinition[],
        constraints?: ArchitectureRequest['constraints']
    ): GeneratedFile[] {
        const files: GeneratedFile[] = [];
        const lang = constraints?.language || 'typescript';

        for (const service of services.filter(s => s.type === 'api')) {
            const servicePath = `services/${service.name}`;

            // Main entry file
            files.push({
                path: `${servicePath}/src/index.ts`,
                language: lang,
                content: this.generateServiceEntry(service)
            });

            // Router
            files.push({
                path: `${servicePath}/src/routes.ts`,
                language: lang,
                content: this.generateRoutes(service)
            });

            // Package.json
            files.push({
                path: `${servicePath}/package.json`,
                language: 'json',
                content: this.generatePackageJson(service)
            });

            // Dockerfile
            files.push({
                path: `${servicePath}/Dockerfile`,
                language: 'dockerfile',
                content: this.generateDockerfile(service)
            });
        }

        return files;
    }

    private generateServiceEntry(service: ServiceDefinition): string {
        return `/**
 * ${service.name}
 * ${service.description}
 */

import express from 'express';
import cors from 'cors';
import { router } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', router);

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: '${service.name}' });
});

app.listen(PORT, () => {
    console.log(\`${service.name} running on port \${PORT}\`);
});

export default app;
`;
    }

    private generateRoutes(service: ServiceDefinition): string {
        let routes = `import { Router } from 'express';

export const router = Router();

`;

        for (const endpoint of service.endpoints || []) {
            const method = endpoint.method.toLowerCase();
            routes += `// ${endpoint.description}
router.${method}('${endpoint.path}', async (req, res) => {
    try {
        // TODO: Implement ${endpoint.description}
        res.json({ message: 'Not implemented' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

`;
        }

        return routes;
    }

    private generatePackageJson(service: ServiceDefinition): string {
        return JSON.stringify({
            name: service.name,
            version: '1.0.0',
            description: service.description,
            main: 'dist/index.js',
            scripts: {
                start: 'node dist/index.js',
                dev: 'ts-node src/index.ts',
                build: 'tsc',
                test: 'jest'
            },
            dependencies: {
                express: '^4.18.2',
                cors: '^2.8.5'
            },
            devDependencies: {
                '@types/express': '^4.17.17',
                '@types/cors': '^2.8.13',
                typescript: '^5.0.0',
                'ts-node': '^10.9.1'
            }
        }, null, 2);
    }

    private generateDockerfile(service: ServiceDefinition): string {
        return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/index.js"]
`;
    }

    // ========================================================================
    // DEPLOYMENT CONFIG
    // ========================================================================

    private generateDeploymentConfig(
        services: ServiceDefinition[],
        constraints?: ArchitectureRequest['constraints']
    ): string {
        if (constraints?.deployment === 'kubernetes') {
            return this.generateK8sConfig(services);
        }
        return this.generateDockerCompose(services);
    }

    private generateDockerCompose(services: ServiceDefinition[]): string {
        let compose = `version: '3.8'\n\nservices:\n`;

        for (const service of services) {
            if (service.type === 'database') {
                compose += `  ${service.name}:
    image: postgres:15
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

`;
            } else if (service.type === 'api') {
                compose += `  ${service.name}:
    build: ./services/${service.name}
    ports:
      - "\${${service.name.toUpperCase().replace(/-/g, '_')}_PORT:-3000}:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@database:5432/app
    depends_on:
      - database

`;
            }
        }

        compose += `volumes:
  db_data:
`;

        return compose;
    }

    private generateK8sConfig(services: ServiceDefinition[]): string {
        let config = '# Kubernetes Deployment Configuration\n---\n';

        for (const service of services.filter(s => s.type === 'api')) {
            config += `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${service.name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${service.name}
  template:
    metadata:
      labels:
        app: ${service.name}
    spec:
      containers:
      - name: ${service.name}
        image: ${service.name}:latest
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: ${service.name}
spec:
  selector:
    app: ${service.name}
  ports:
  - port: 80
    targetPort: 3000
---
`;
        }

        return config;
    }

    // ========================================================================
    // API CONTRACTS
    // ========================================================================

    private generateApiContracts(services: ServiceDefinition[]): string {
        let openapi = `openapi: 3.0.0
info:
  title: Generated API
  version: 1.0.0
paths:
`;

        for (const service of services.filter(s => s.type === 'api')) {
            for (const endpoint of service.endpoints || []) {
                const path = endpoint.path.replace(/:(\w+)/g, '{$1}');
                openapi += `  ${path}:
    ${endpoint.method.toLowerCase()}:
      summary: ${endpoint.description}
      responses:
        '200':
          description: Success
`;
            }
        }

        return openapi;
    }

    // ========================================================================
    // DOCUMENTATION
    // ========================================================================

    private generateDocumentation(
        services: ServiceDefinition[],
        database: DatabaseSchema,
        description: string
    ): string {
        let doc = `# Architecture Documentation

## Overview

${description}

## Services

`;

        for (const service of services) {
            doc += `### ${service.name}

- **Type:** ${service.type}
- **Technology:** ${service.technology}
- **Description:** ${service.description}

`;
            if (service.endpoints?.length) {
                doc += '| Method | Path | Description |\n|--------|------|-------------|\n';
                for (const ep of service.endpoints) {
                    doc += `| ${ep.method} | ${ep.path} | ${ep.description} |\n`;
                }
                doc += '\n';
            }
        }

        if (database.tables.length > 0) {
            doc += `## Database Schema

`;
            for (const table of database.tables) {
                doc += `### ${table.name}

| Column | Type | Nullable |\n|--------|------|----------|\n`;
                for (const col of table.columns) {
                    doc += `| ${col.name} | ${col.type} | ${col.nullable} |\n`;
                }
                doc += '\n';
            }
        }

        return doc;
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    getArchitecture(id: string): ArchitectureResult | undefined {
        return this.generatedArchitectures.get(id);
    }

    getHistory(): ArchitectureResult[] {
        return Array.from(this.generatedArchitectures.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    private generateId(): string {
        return `arch-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    }

    clear(): void {
        this.generatedArchitectures.clear();
    }
}

// Export singleton
export const naturalLanguageArchitect = NaturalLanguageArchitect.getInstance();
