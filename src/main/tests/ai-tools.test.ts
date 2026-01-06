/**
 * Unit Tests for AI Tools Modules
 * 
 * Tests for new AI tool implementations:
 * - DataVisualizationGenerator
 * - APITestingSuite
 * - EnvironmentManager
 * - DatabaseMigrationTool
 * - DependencyGraphVisualizer
 * - GraphQLCodegen
 * - OpenAPIGenerator
 * - MongoDBAtlasManager
 * - WebSocketManager
 * - CodeInterpreter
 * - PromptLibrary
 * - ContextWindowManager
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// DATA VISUALIZATION TESTS
// ============================================================================

describe('DataVisualizationGenerator', () => {
    const { dataVisualizationGenerator } = require('../ai/visualization/DataVisualizationGenerator');

    const sampleConfig = {
        type: 'bar' as const,
        title: 'Sales Chart',
        data: {
            labels: ['Jan', 'Feb', 'Mar'],
            datasets: [{ label: 'Sales', data: [100, 200, 150] }]
        }
    };

    it('should generate Chart.js code', () => {
        const code = dataVisualizationGenerator.generateChartJS(sampleConfig);
        expect(code).toContain('Chart');
        expect(code).toContain('bar');
    });

    it('should generate Recharts React component', () => {
        const code = dataVisualizationGenerator.generateRecharts(sampleConfig);
        expect(code).toContain('ResponsiveContainer');
        expect(code).toContain('BarChart');
    });

    it('should generate ApexCharts component', () => {
        const code = dataVisualizationGenerator.generateApexCharts(sampleConfig);
        expect(code).toContain('react-apexcharts');
        expect(code).toContain('options');
    });

    it('should generate from raw data', () => {
        const rawData = [
            { month: 'Jan', sales: 100 },
            { month: 'Feb', sales: 200 }
        ];
        const code = dataVisualizationGenerator.generateFromData(rawData, {
            xField: 'month',
            yField: 'sales',
            type: 'bar' as const
        });
        expect(code).toContain('data');
    });
});

// ============================================================================
// API TESTING TESTS
// ============================================================================

describe('APITestingSuite', () => {
    const { APITestingSuite } = require('../ai/testing/APITestingSuite');
    let suite: InstanceType<typeof APITestingSuite>;

    beforeEach(() => {
        suite = APITestingSuite.getInstance();
    });

    it('should create a collection', () => {
        const collection = suite.createCollection('Test API', 'Testing purposes');
        expect(collection.id).toMatch(/^collection_/);
        expect(collection.name).toBe('Test API');
    });

    it('should add request to collection', () => {
        const collection = suite.createCollection('Test');
        const request = suite.addRequest(collection.id, {
            name: 'Get Users',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: { 'Content-Type': 'application/json' }
        });
        expect(request).not.toBeNull();
        expect(request!.method).toBe('GET');
    });

    it('should generate Jest tests', () => {
        const collection = {
            id: 'test',
            name: 'API Tests',
            requests: [
                { id: 'r1', name: 'Get User', method: 'GET', url: '/user', headers: {} }
            ],
            tests: [],
            variables: {}
        };
        const code = suite.generateJestTests(collection);
        expect(code).toContain('describe');
        expect(code).toContain('axios');
    });

    it('should generate curl commands', () => {
        const collection = {
            id: 'test',
            name: 'API Tests',
            requests: [
                { id: 'r1', name: 'Get User', method: 'GET', url: 'https://api.example.com/user', headers: {} }
            ],
            tests: [],
            variables: {}
        };
        const curl = suite.generateCurlCommands(collection);
        expect(curl).toContain('curl');
        expect(curl).toContain('-X GET');
    });
});

// ============================================================================
// ENVIRONMENT MANAGER TESTS
// ============================================================================

describe('EnvironmentManager', () => {
    const { environmentManager } = require('../ai/env/EnvironmentManager');

    it('should create environment', () => {
        const env = environmentManager.createEnvironment('production');
        expect(env.name).toBe('production');
        expect(env.variables).toEqual([]);
    });

    it('should parse .env file', () => {
        const content = `
# Database
DATABASE_URL=postgres://localhost/db
API_KEY=secret123
`;
        const vars = environmentManager.parseEnvFile(content);
        expect(vars.length).toBe(2);
        expect(vars[0].key).toBe('DATABASE_URL');
        expect(vars[0].description).toBe('Database');
    });

    it('should generate TypeScript env config', () => {
        environmentManager.defineSchema([
            { key: 'DATABASE_URL', type: 'url', required: true, secret: false, description: 'DB URL' }
        ]);
        const code = environmentManager.generateTypescriptEnvConfig();
        expect(code).toContain('z.object');
        expect(code).toContain('DATABASE_URL');
    });
});

// ============================================================================
// DATABASE MIGRATION TESTS
// ============================================================================

describe('DatabaseMigrationTool', () => {
    const { databaseMigrationTool } = require('../ai/database/DatabaseMigrationTool');

    const sampleTable = {
        name: 'users',
        columns: [
            { name: 'id', type: 'uuid' as const, primaryKey: true },
            { name: 'email', type: 'string' as const, unique: true, required: true },
            { name: 'name', type: 'string' as const }
        ],
        timestamps: true
    };

    it('should generate Prisma schema', () => {
        const schema = databaseMigrationTool.generatePrismaSchema([sampleTable]);
        expect(schema).toContain('model Users');
        expect(schema).toContain('@id');
        expect(schema).toContain('@unique');
    });

    it('should generate Drizzle schema', () => {
        const schema = databaseMigrationTool.generateDrizzleSchema([sampleTable]);
        expect(schema).toContain('pgTable');
        expect(schema).toContain('users');
    });

    it('should generate TypeORM entity', () => {
        const entity = databaseMigrationTool.generateTypeORMEntity(sampleTable);
        expect(entity).toContain('@Entity');
        expect(entity).toContain('Column');
    });

    it('should generate SQL', () => {
        const sql = databaseMigrationTool.generateSQL([sampleTable], 'postgresql');
        expect(sql).toContain('CREATE TABLE');
        expect(sql).toContain('"users"');
    });
});

// ============================================================================
// GRAPHQL CODEGEN TESTS
// ============================================================================

describe('GraphQLCodegen', () => {
    const { graphqlCodegen } = require('../ai/graphql/GraphQLCodegen');

    const sampleSchema = {
        types: [
            {
                name: 'User',
                kind: 'type' as const,
                fields: [
                    { name: 'id', type: 'ID' },
                    { name: 'name', type: 'String' },
                    { name: 'email', type: 'String' }
                ]
            }
        ],
        queries: [
            { name: 'users', type: 'User', list: true }
        ],
        mutations: [
            { name: 'createUser', type: 'User', args: [{ name: 'name', type: 'String', nullable: false }] }
        ]
    };

    it('should generate SDL', () => {
        const sdl = graphqlCodegen.generateSDL(sampleSchema);
        expect(sdl).toContain('type User');
        expect(sdl).toContain('type Query');
        expect(sdl).toContain('type Mutation');
    });

    it('should generate Apollo resolvers', () => {
        const code = graphqlCodegen.generateApolloResolvers(sampleSchema);
        expect(code).toContain('Resolvers');
        expect(code).toContain('Query:');
        expect(code).toContain('Mutation:');
    });

    it('should generate React hooks', () => {
        const code = graphqlCodegen.generateReactHooks(sampleSchema);
        expect(code).toContain('useQuery');
        expect(code).toContain('useMutation');
        expect(code).toContain('gql`');
    });
});

// ============================================================================
// OPENAPI GENERATOR TESTS
// ============================================================================

describe('OpenAPIGenerator', () => {
    const { openAPIGenerator } = require('../ai/openapi/OpenAPIGenerator');

    const sampleConfig = {
        title: 'My API',
        version: '1.0.0',
        endpoints: [
            { method: 'GET' as const, path: '/users', operationId: 'getUsers', response: { type: 'User[]' } }
        ],
        models: [
            { name: 'User', fields: [{ name: 'id', type: 'string', required: true }] }
        ]
    };

    it('should generate OpenAPI spec', () => {
        const spec = openAPIGenerator.generateSpec(sampleConfig);
        expect(spec.openapi).toBe('3.0.0');
        expect(spec.paths['/users']).toBeDefined();
        expect(spec.components?.schemas?.User).toBeDefined();
    });

    it('should generate TypeScript client', () => {
        const spec = openAPIGenerator.generateSpec(sampleConfig);
        const code = openAPIGenerator.generateTypeScriptClient(spec);
        expect(code).toContain('AxiosInstance');
        expect(code).toContain('getUsers');
    });

    it('should generate Zod validators', () => {
        const spec = openAPIGenerator.generateSpec(sampleConfig);
        const code = openAPIGenerator.generateZodValidators(spec);
        expect(code).toContain('z.object');
        expect(code).toContain('UserSchema');
    });
});

// ============================================================================
// MONGODB ATLAS MANAGER TESTS
// ============================================================================

describe('MongoDBAtlasManager', () => {
    const { mongoDBAtlasManager } = require('../ai/mongodb/MongoDBAtlasManager');

    const sampleSchema = {
        name: 'User',
        fields: [
            { name: 'name', type: 'String' as const, required: true },
            { name: 'email', type: 'String' as const, unique: true },
            { name: 'age', type: 'Number' as const }
        ],
        options: { timestamps: true }
    };

    it('should generate Mongoose schema', () => {
        const code = mongoDBAtlasManager.generateMongooseSchema(sampleSchema);
        expect(code).toContain('mongoose');
        expect(code).toContain('Schema');
        expect(code).toContain('IUser');
    });

    it('should generate connection code', () => {
        const code = mongoDBAtlasManager.generateConnectionCode({ useEnv: true });
        expect(code).toContain('MONGODB_URI');
        expect(code).toContain('connectToDatabase');
    });

    it('should generate CRUD service', () => {
        const code = mongoDBAtlasManager.generateCRUDService(sampleSchema);
        expect(code).toContain('UserService');
        expect(code).toContain('create');
        expect(code).toContain('findById');
        expect(code).toContain('update');
        expect(code).toContain('delete');
    });
});

// ============================================================================
// WEBSOCKET MANAGER TESTS
// ============================================================================

describe('WebSocketManager', () => {
    const { webSocketManager } = require('../ai/websocket/WebSocketManager');

    const sampleConfig = {
        events: [
            { name: 'message', direction: 'bidirectional' as const, payload: { text: 'string' } },
            { name: 'typing', direction: 'client-to-server' as const }
        ],
        auth: { type: 'jwt' as const }
    };

    it('should generate Socket.IO server', () => {
        const code = webSocketManager.generateSocketIOServer(sampleConfig);
        expect(code).toContain('Server');
        expect(code).toContain('socket.io');
        expect(code).toContain('jwt.verify');
    });

    it('should generate Socket.IO client', () => {
        const code = webSocketManager.generateSocketIOClient(sampleConfig);
        expect(code).toContain('socket.io-client');
        expect(code).toContain('connect');
        expect(code).toContain('disconnect');
    });

    it('should generate React hook', () => {
        const code = webSocketManager.generateReactHook(sampleConfig);
        expect(code).toContain('useWebSocket');
        expect(code).toContain('useState');
        expect(code).toContain('useEffect');
    });
});

// ============================================================================
// CODE INTERPRETER TESTS
// ============================================================================

describe('CodeInterpreter', () => {
    const { codeInterpreter } = require('../ai/sandbox/CodeInterpreter');

    it('should create session', () => {
        const session = codeInterpreter.createSession('javascript');
        expect(session.id).toMatch(/^sandbox_/);
        expect(session.language).toBe('javascript');
        expect(session.status).toBe('active');
    });

    it('should get session', () => {
        const session = codeInterpreter.createSession('python');
        const retrieved = codeInterpreter.getSession(session.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.language).toBe('python');
    });

    it('should terminate session', () => {
        const session = codeInterpreter.createSession('typescript');
        const result = codeInterpreter.terminateSession(session.id);
        expect(result).toBe(true);
    });
});

// ============================================================================
// PROMPT LIBRARY TESTS
// ============================================================================

describe('PromptLibrary', () => {
    const { promptLibrary } = require('../ai/prompts/PromptLibrary');

    it('should list templates', () => {
        const templates = promptLibrary.listTemplates();
        expect(templates.length).toBeGreaterThan(0);
    });

    it('should get template by id', () => {
        const templates = promptLibrary.listTemplates();
        const template = promptLibrary.getTemplate(templates[0].id);
        expect(template).toBeDefined();
    });

    it('should render template', () => {
        const template = promptLibrary.createTemplate({
            name: 'Test Template',
            description: 'Test',
            category: 'code',
            template: 'Hello {{name}}!',
            variables: [{ name: 'name', description: 'Name', type: 'string', required: true }],
            examples: [],
            tags: ['test'],
            createdBy: 'test'
        });

        const rendered = promptLibrary.render(template.id, { name: 'World' });
        expect(rendered.text).toBe('Hello World!');
    });

    it('should manage favorites', () => {
        const templates = promptLibrary.listTemplates();
        promptLibrary.addFavorite(templates[0].id);
        const favorites = promptLibrary.getFavorites();
        expect(favorites.length).toBeGreaterThan(0);
        promptLibrary.removeFavorite(templates[0].id);
    });
});

// ============================================================================
// CONTEXT WINDOW MANAGER TESTS
// ============================================================================

describe('ContextWindowManager', () => {
    const { contextWindowManager } = require('../ai/context/ContextWindowManager');

    it('should create window', () => {
        const window = contextWindowManager.createWindow(100000);
        expect(window.id).toMatch(/^ctx_/);
        expect(window.maxTokens).toBe(100000);
    });

    it('should add item to window', () => {
        const window = contextWindowManager.createWindow();
        const item = contextWindowManager.addItem(window.id, {
            type: 'message',
            content: 'Hello world',
            tokens: 3,
            metadata: {},
            pinned: false
        });
        expect(item).not.toBeNull();
        expect(item!.content).toBe('Hello world');
    });

    it('should build context', () => {
        const window = contextWindowManager.createWindow();
        contextWindowManager.addItem(window.id, {
            type: 'message',
            content: 'First message',
            tokens: 10,
            metadata: {},
            pinned: false
        });
        const context = contextWindowManager.buildContext(window.id);
        expect(context).toContain('First message');
    });

    it('should get stats', () => {
        const window = contextWindowManager.createWindow();
        contextWindowManager.addItem(window.id, {
            type: 'message',
            content: 'Test',
            tokens: 5,
            metadata: {},
            pinned: false
        });
        const stats = contextWindowManager.getStats(window.id);
        expect(stats).not.toBeNull();
        expect(stats!.totalItems).toBe(1);
        expect(stats!.totalTokens).toBe(5);
    });
});
