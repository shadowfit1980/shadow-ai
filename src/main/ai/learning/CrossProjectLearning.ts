/**
 * Cross-Project Transfer Learning
 * 
 * Implements ChatGPT's suggestion for:
 * - Extract reusable patterns from codebases
 * - Share learnings across projects
 * - Building a pattern library over time
 * - Pattern similarity matching
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Pattern {
    id: string;
    name: string;
    type: PatternType;
    description: string;
    language: string;
    template: string;
    parameters: PatternParameter[];
    examples: PatternExample[];
    tags: string[];
    sourceProject?: string;
    usageCount: number;
    successRate: number;
    createdAt: Date;
    updatedAt: Date;
}

export type PatternType =
    | 'architectural'   // Design patterns (MVC, MVVM, etc.)
    | 'component'       // Reusable UI components
    | 'algorithm'       // Common algorithms
    | 'api'            // API design patterns
    | 'testing'        // Testing patterns
    | 'error-handling' // Error handling patterns
    | 'performance'    // Performance optimizations
    | 'security';      // Security patterns

export interface PatternParameter {
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue?: any;
}

export interface PatternExample {
    context: string;
    code: string;
    explanation: string;
}

export interface PatternMatch {
    pattern: Pattern;
    similarity: number;
    applicability: number;
    suggestedAdaptation?: string;
}

export interface ProjectLearning {
    projectId: string;
    projectName: string;
    patterns: string[]; // Pattern IDs
    conventions: Convention[];
    dependencies: string[];
    architecture: string;
    extractedAt: Date;
}

export interface Convention {
    type: 'naming' | 'structure' | 'formatting' | 'documentation';
    rule: string;
    examples: string[];
}

/**
 * CrossProjectLearning manages pattern extraction and sharing
 */
export class CrossProjectLearning extends EventEmitter {
    private static instance: CrossProjectLearning;
    private patterns: Map<string, Pattern> = new Map();
    private projectLearnings: Map<string, ProjectLearning> = new Map();
    private persistPath: string;

    private constructor() {
        super();
        this.persistPath = path.join(process.cwd(), '.shadow-patterns');
        this.initializeDefaultPatterns();
    }

    static getInstance(): CrossProjectLearning {
        if (!CrossProjectLearning.instance) {
            CrossProjectLearning.instance = new CrossProjectLearning();
        }
        return CrossProjectLearning.instance;
    }

    /**
     * Initialize with common patterns
     */
    private initializeDefaultPatterns(): void {
        const defaultPatterns: Partial<Pattern>[] = [
            {
                name: 'Singleton',
                type: 'architectural',
                description: 'Ensure a class has only one instance with global access',
                language: 'typescript',
                template: `export class {{ClassName}} {
    private static instance: {{ClassName}};
    private constructor() {}
    
    static getInstance(): {{ClassName}} {
        if (!{{ClassName}}.instance) {
            {{ClassName}}.instance = new {{ClassName}}();
        }
        return {{ClassName}}.instance;
    }
}`,
                parameters: [
                    { name: 'ClassName', type: 'string', description: 'Name of the singleton class', required: true }
                ],
                tags: ['design-pattern', 'creational', 'singleton'],
            },
            {
                name: 'React Hook',
                type: 'component',
                description: 'Custom React hook with state and cleanup',
                language: 'typescript',
                template: `export function use{{HookName}}({{params}}) {
    const [{{state}}, set{{State}}] = useState({{initialValue}});
    
    useEffect(() => {
        // Setup
        {{setupCode}}
        
        return () => {
            // Cleanup
            {{cleanupCode}}
        };
    }, [{{dependencies}}]);
    
    return { {{returnValue}} };
}`,
                parameters: [
                    { name: 'HookName', type: 'string', description: 'Name of the hook', required: true },
                    { name: 'state', type: 'string', description: 'State variable name', required: true },
                ],
                tags: ['react', 'hooks', 'custom-hook'],
            },
            {
                name: 'API Route Handler',
                type: 'api',
                description: 'RESTful API route with error handling',
                language: 'typescript',
                template: `export async function {{methodName}}(req: Request): Promise<Response> {
    try {
        const {{params}} = await parseRequest(req);
        
        // Validate
        if (!{{validationCondition}}) {
            return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
        }
        
        // Execute
        const result = await {{serviceCall}};
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        console.error('{{methodName}} failed:', error);
        return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
    }
}`,
                parameters: [
                    { name: 'methodName', type: 'string', description: 'Handler function name', required: true },
                ],
                tags: ['api', 'rest', 'handler'],
            },
            {
                name: 'Error Boundary',
                type: 'error-handling',
                description: 'React error boundary component',
                language: 'typescript',
                template: `export class {{ComponentName}}ErrorBoundary extends React.Component<Props, State> {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        {{onError}}
    }
    
    render() {
        if (this.state.hasError) {
            return {{fallbackUI}};
        }
        return this.props.children;
    }
}`,
                parameters: [
                    { name: 'ComponentName', type: 'string', description: 'Component name prefix', required: true },
                ],
                tags: ['react', 'error-handling', 'boundary'],
            },
            {
                name: 'Unit Test Suite',
                type: 'testing',
                description: 'Unit test structure with setup/teardown',
                language: 'typescript',
                template: `describe('{{TestSubject}}', () => {
    let {{subject}}: {{SubjectType}};
    
    beforeEach(() => {
        {{setup}}
    });
    
    afterEach(() => {
        {{teardown}}
    });
    
    describe('{{methodName}}', () => {
        it('should {{expectedBehavior}}', async () => {
            // Arrange
            {{arrange}}
            
            // Act
            const result = await {{subject}}.{{methodName}}({{args}});
            
            // Assert
            expect(result).{{assertion}};
        });
    });
});`,
                parameters: [
                    { name: 'TestSubject', type: 'string', description: 'Name of the test subject', required: true },
                ],
                tags: ['testing', 'unit-test', 'jest'],
            },
            // ========== NEW PATTERNS ==========
            {
                name: 'Factory Pattern',
                type: 'architectural',
                description: 'Create objects without specifying the exact class',
                language: 'typescript',
                template: `export interface {{ProductInterface}} {
    {{productMethods}}
}

export class {{ConcreteProduct}} implements {{ProductInterface}} {
    {{productImplementation}}
}

export class {{FactoryName}} {
    static create(type: string): {{ProductInterface}} {
        switch (type) {
            case '{{type1}}':
                return new {{ConcreteProduct}}();
            default:
                throw new Error(\`Unknown type: \${type}\`);
        }
    }
}`,
                parameters: [
                    { name: 'FactoryName', type: 'string', description: 'Name of the factory class', required: true },
                    { name: 'ProductInterface', type: 'string', description: 'Product interface name', required: true },
                ],
                tags: ['design-pattern', 'creational', 'factory'],
            },
            {
                name: 'Observer Pattern',
                type: 'architectural',
                description: 'Define a subscription mechanism to notify objects about events',
                language: 'typescript',
                template: `type {{EventName}}Listener = (data: {{EventData}}) => void;

export class {{SubjectName}} {
    private listeners: Map<string, Set<{{EventName}}Listener>> = new Map();

    on(event: string, listener: {{EventName}}Listener): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    off(event: string, listener: {{EventName}}Listener): void {
        this.listeners.get(event)?.delete(listener);
    }

    emit(event: string, data: {{EventData}}): void {
        this.listeners.get(event)?.forEach(listener => listener(data));
    }
}`,
                parameters: [
                    { name: 'SubjectName', type: 'string', description: 'Name of the subject class', required: true },
                    { name: 'EventName', type: 'string', description: 'Event type name', required: true },
                ],
                tags: ['design-pattern', 'behavioral', 'observer', 'event-emitter'],
            },
            {
                name: 'Repository Pattern',
                type: 'architectural',
                description: 'Abstract data access layer for database operations',
                language: 'typescript',
                template: `export interface {{EntityName}} {
    id: string;
    {{entityFields}}
}

export interface {{RepositoryName}} {
    findById(id: string): Promise<{{EntityName}} | null>;
    findAll(): Promise<{{EntityName}}[]>;
    create(entity: Omit<{{EntityName}}, 'id'>): Promise<{{EntityName}}>;
    update(id: string, entity: Partial<{{EntityName}}>): Promise<{{EntityName}}>;
    delete(id: string): Promise<boolean>;
}

export class {{ConcreteRepository}} implements {{RepositoryName}} {
    private db: {{DatabaseType}};

    constructor(db: {{DatabaseType}}) {
        this.db = db;
    }

    async findById(id: string): Promise<{{EntityName}} | null> {
        return this.db.{{tableName}}.findUnique({ where: { id } });
    }

    async findAll(): Promise<{{EntityName}}[]> {
        return this.db.{{tableName}}.findMany();
    }

    async create(entity: Omit<{{EntityName}}, 'id'>): Promise<{{EntityName}}> {
        return this.db.{{tableName}}.create({ data: entity });
    }

    async update(id: string, entity: Partial<{{EntityName}}>): Promise<{{EntityName}}> {
        return this.db.{{tableName}}.update({ where: { id }, data: entity });
    }

    async delete(id: string): Promise<boolean> {
        await this.db.{{tableName}}.delete({ where: { id } });
        return true;
    }
}`,
                parameters: [
                    { name: 'EntityName', type: 'string', description: 'Name of the entity', required: true },
                    { name: 'RepositoryName', type: 'string', description: 'Name of the repository interface', required: true },
                ],
                tags: ['design-pattern', 'repository', 'data-access', 'prisma'],
            },
            {
                name: 'Auth Middleware',
                type: 'security',
                description: 'Authentication middleware for API routes',
                language: 'typescript',
                template: `export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export async function {{middlewareName}}(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const decoded = {{verifyToken}}(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}`,
                parameters: [
                    { name: 'middlewareName', type: 'string', description: 'Name of the middleware function', required: true },
                ],
                tags: ['security', 'authentication', 'middleware', 'express'],
            },
            {
                name: 'Retry with Backoff',
                type: 'performance',
                description: 'Retry failed operations with exponential backoff',
                language: 'typescript',
                template: `export interface RetryOptions {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
}

export async function {{functionName}}<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const { 
        maxRetries = 3, 
        baseDelay = 1000, 
        maxDelay = 30000,
        backoffFactor = 2 
    } = options;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt === maxRetries) break;

            const delay = Math.min(
                baseDelay * Math.pow(backoffFactor, attempt),
                maxDelay
            );
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}`,
                parameters: [
                    { name: 'functionName', type: 'string', description: 'Name of the retry function', required: true },
                ],
                tags: ['performance', 'retry', 'resilience', 'backoff'],
            },
            {
                name: 'Debounce Hook',
                type: 'component',
                description: 'React hook for debouncing values',
                language: 'typescript',
                template: `export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Usage example:
// const debouncedSearch = useDebounce(searchQuery, 300);
// useEffect(() => { search(debouncedSearch); }, [debouncedSearch]);`,
                parameters: [],
                tags: ['react', 'hooks', 'debounce', 'performance'],
            },
            {
                name: 'Zustand Store',
                type: 'component',
                description: 'Zustand state management store',
                language: 'typescript',
                template: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface {{StoreName}}State {
    {{stateFields}}
    // Actions
    {{actionSignatures}}
}

export const use{{StoreName}} = create<{{StoreName}}State>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                {{initialState}}

                // Actions
                {{actionImplementations}}
            }),
            { name: '{{storeName}}-storage' }
        )
    )
);`,
                parameters: [
                    { name: 'StoreName', type: 'string', description: 'Name of the store (PascalCase)', required: true },
                ],
                tags: ['react', 'zustand', 'state-management', 'store'],
            },
            {
                name: 'Express Router',
                type: 'api',
                description: 'Express router with CRUD routes',
                language: 'typescript',
                template: `import { Router, Request, Response } from 'express';

const router = Router();

// GET all
router.get('/', async (req: Request, res: Response) => {
    try {
        const items = await {{service}}.findAll();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// GET by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const item = await {{service}}.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// POST create
router.post('/', async (req: Request, res: Response) => {
    try {
        const item = await {{service}}.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create item' });
    }
});

// PUT update
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const item = await {{service}}.update(req.params.id, req.body);
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update item' });
    }
});

// DELETE
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await {{service}}.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

export default router;`,
                parameters: [
                    { name: 'service', type: 'string', description: 'Name of the service to use', required: true },
                ],
                tags: ['api', 'express', 'router', 'crud'],
            },
            {
                name: 'Zod Validation Schema',
                type: 'api',
                description: 'Zod schema for request validation',
                language: 'typescript',
                template: `import { z } from 'zod';

export const {{schemaName}}Schema = z.object({
    {{fields}}
});

export const {{schemaName}}UpdateSchema = {{schemaName}}Schema.partial();

export type {{TypeName}} = z.infer<typeof {{schemaName}}Schema>;
export type {{TypeName}}Update = z.infer<typeof {{schemaName}}UpdateSchema>;

// Validation helper
export function validate{{TypeName}}(data: unknown): {{TypeName}} {
    return {{schemaName}}Schema.parse(data);
}`,
                parameters: [
                    { name: 'schemaName', type: 'string', description: 'Name of the schema (camelCase)', required: true },
                    { name: 'TypeName', type: 'string', description: 'Name of the type (PascalCase)', required: true },
                ],
                tags: ['validation', 'zod', 'schema', 'typescript'],
            },
            {
                name: 'SQL Query Builder',
                type: 'algorithm',
                description: 'Type-safe SQL query builder',
                language: 'typescript',
                template: `export class {{BuilderName}} {
    private table: string;
    private selectFields: string[] = ['*'];
    private whereConditions: string[] = [];
    private orderByField?: string;
    private limitValue?: number;
    private offsetValue?: number;

    constructor(table: string) {
        this.table = table;
    }

    select(...fields: string[]): this {
        this.selectFields = fields;
        return this;
    }

    where(condition: string): this {
        this.whereConditions.push(condition);
        return this;
    }

    orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this.orderByField = \`\${field} \${direction}\`;
        return this;
    }

    limit(value: number): this {
        this.limitValue = value;
        return this;
    }

    offset(value: number): this {
        this.offsetValue = value;
        return this;
    }

    build(): string {
        let query = \`SELECT \${this.selectFields.join(', ')} FROM \${this.table}\`;
        
        if (this.whereConditions.length > 0) {
            query += \` WHERE \${this.whereConditions.join(' AND ')}\`;
        }
        if (this.orderByField) {
            query += \` ORDER BY \${this.orderByField}\`;
        }
        if (this.limitValue !== undefined) {
            query += \` LIMIT \${this.limitValue}\`;
        }
        if (this.offsetValue !== undefined) {
            query += \` OFFSET \${this.offsetValue}\`;
        }
        
        return query;
    }
}`,
                parameters: [
                    { name: 'BuilderName', type: 'string', description: 'Name of the builder class', required: true },
                ],
                tags: ['sql', 'query-builder', 'database', 'algorithm'],
            },
            // ========== MORE PATTERNS ==========
            {
                name: 'Lazy Loading Hook',
                type: 'performance',
                description: 'React hook for lazy loading data with suspense support',
                language: 'typescript',
                template: `export function useLazyLoad<T>(
    fetcher: () => Promise<T>,
    deps: any[] = []
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            setData(result);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }, deps);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}`,
                parameters: [],
                tags: ['react', 'hooks', 'lazy-loading', 'performance'],
            },
            {
                name: 'WebSocket Handler',
                type: 'api',
                description: 'WebSocket connection with auto-reconnect and message handling',
                language: 'typescript',
                template: `export class {{ClassName}} {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnects = 5;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect(): void {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('{{ClassName}} connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.listeners.get(message.type)?.forEach(cb => cb(message.data));
        };

        this.ws.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnects) {
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
            }
        };
    }

    on(type: string, callback: (data: any) => void): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(callback);
    }

    send(type: string, data: any): void {
        this.ws?.send(JSON.stringify({ type, data }));
    }

    close(): void {
        this.ws?.close();
    }
}`,
                parameters: [
                    { name: 'ClassName', type: 'string', description: 'Name of the WebSocket handler class', required: true },
                ],
                tags: ['websocket', 'realtime', 'api', 'networking'],
            },
            {
                name: 'Rate Limiter',
                type: 'performance',
                description: 'Token bucket rate limiter for API requests',
                language: 'typescript',
                template: `export class {{ClassName}} {
    private tokens: number;
    private maxTokens: number;
    private refillRate: number; // tokens per second
    private lastRefill: number;

    constructor(maxTokens: number, refillRate: number) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }

    private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
        this.lastRefill = now;
    }

    async acquire(tokens: number = 1): Promise<boolean> {
        this.refill();
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }
        return false;
    }

    async waitForToken(tokens: number = 1): Promise<void> {
        while (!(await this.acquire(tokens))) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    getAvailable(): number {
        this.refill();
        return this.tokens;
    }
}`,
                parameters: [
                    { name: 'ClassName', type: 'string', description: 'Name of the rate limiter class', required: true },
                ],
                tags: ['rate-limiting', 'performance', 'api', 'throttling'],
            },
            {
                name: 'Logger Wrapper',
                type: 'component',
                description: 'Structured logging utility with levels and context',
                language: 'typescript',
                template: `type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class {{LoggerName}} {
    private context: string;
    private minLevel: LogLevel;
    private levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

    constructor(context: string, minLevel: LogLevel = 'info') {
        this.context = context;
        this.minLevel = minLevel;
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (this.levels[level] < this.levels[this.minLevel]) return;

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            context: this.context,
            message,
            ...(data && { data }),
        };

        const color = { debug: '36', info: '32', warn: '33', error: '31' }[level];
        console.log(\`\\x1b[\${color}m[\${level.toUpperCase()}]\\x1b[0m [\${this.context}] \${message}\`, data ?? '');
    }

    debug(message: string, data?: any): void { this.log('debug', message, data); }
    info(message: string, data?: any): void { this.log('info', message, data); }
    warn(message: string, data?: any): void { this.log('warn', message, data); }
    error(message: string, data?: any): void { this.log('error', message, data); }

    child(subContext: string): {{LoggerName}} {
        return new {{LoggerName}}(\`\${this.context}:\${subContext}\`, this.minLevel);
    }
}`,
                parameters: [
                    { name: 'LoggerName', type: 'string', description: 'Name of the logger class', required: true },
                ],
                tags: ['logging', 'debugging', 'utility', 'observability'],
            },
            {
                name: 'State Machine',
                type: 'algorithm',
                description: 'Type-safe finite state machine with transitions',
                language: 'typescript',
                template: `type {{StateName}}State = {{states}};
type {{StateName}}Event = {{events}};

interface Transition<S, E> {
    from: S | S[];
    event: E;
    to: S;
    action?: () => void;
}

export class {{MachineName}}<S, E> {
    private state: S;
    private transitions: Transition<S, E>[];
    private listeners: Set<(state: S) => void> = new Set();

    constructor(initialState: S, transitions: Transition<S, E>[]) {
        this.state = initialState;
        this.transitions = transitions;
    }

    getState(): S {
        return this.state;
    }

    send(event: E): boolean {
        const transition = this.transitions.find(t => {
            const fromMatch = Array.isArray(t.from) 
                ? t.from.includes(this.state) 
                : t.from === this.state;
            return fromMatch && t.event === event;
        });

        if (transition) {
            this.state = transition.to;
            transition.action?.();
            this.listeners.forEach(cb => cb(this.state));
            return true;
        }
        return false;
    }

    subscribe(callback: (state: S) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
}`,
                parameters: [
                    { name: 'MachineName', type: 'string', description: 'Name of the state machine class', required: true },
                    { name: 'StateName', type: 'string', description: 'Name for state/event types', required: true },
                ],
                tags: ['state-machine', 'algorithm', 'fsm', 'workflow'],
            },
        ];

        for (const p of defaultPatterns) {
            const pattern: Pattern = {
                id: `pattern-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                name: p.name!,
                type: p.type!,
                description: p.description!,
                language: p.language!,
                template: p.template!,
                parameters: p.parameters || [],
                examples: [],
                tags: p.tags || [],
                usageCount: 0,
                successRate: 1.0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.patterns.set(pattern.id, pattern);
        }

        console.log(`📚 [CrossProjectLearning] Initialized with ${this.patterns.size} default patterns`);
    }

    /**
     * Extract patterns from a project
     */
    async extractPatternsFromProject(params: {
        projectPath: string;
        projectName: string;
    }): Promise<ProjectLearning> {
        console.log(`🔍 [CrossProjectLearning] Extracting patterns from: ${params.projectName}`);
        this.emit('extraction:started', params);

        const projectId = `proj-${Date.now()}`;
        const extractedPatterns: string[] = [];
        const conventions: Convention[] = [];

        try {
            // Analyze project structure
            const files = await this.scanProjectFiles(params.projectPath);

            // Detect architecture
            const architecture = this.detectArchitecture(files);

            // Extract naming conventions
            conventions.push(...this.extractNamingConventions(files));

            // Detect dependencies
            const dependencies = await this.extractDependencies(params.projectPath);

            const learning: ProjectLearning = {
                projectId,
                projectName: params.projectName,
                patterns: extractedPatterns,
                conventions,
                dependencies,
                architecture,
                extractedAt: new Date(),
            };

            this.projectLearnings.set(projectId, learning);
            this.emit('extraction:completed', learning);

            console.log(`✅ [CrossProjectLearning] Extracted ${conventions.length} conventions from ${params.projectName}`);
            return learning;

        } catch (error: any) {
            console.error(`❌ [CrossProjectLearning] Extraction failed:`, error.message);
            this.emit('extraction:failed', error);
            throw error;
        }
    }

    /**
     * Scan project files
     */
    private async scanProjectFiles(projectPath: string): Promise<string[]> {
        const files: string[] = [];

        try {
            const entries = await fs.readdir(projectPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

                const fullPath = path.join(projectPath, entry.name);

                if (entry.isDirectory()) {
                    const subFiles = await this.scanProjectFiles(fullPath);
                    files.push(...subFiles);
                } else if (this.isCodeFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        } catch {
            // Ignore read errors
        }

        return files;
    }

    /**
     * Check if file is a code file
     */
    private isCodeFile(filename: string): boolean {
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
        return codeExtensions.some(ext => filename.endsWith(ext));
    }

    /**
     * Detect project architecture
     */
    private detectArchitecture(files: string[]): string {
        const pathParts = files.map(f => f.split(path.sep)).flat();

        // Check for common patterns
        if (pathParts.includes('components') && pathParts.includes('pages')) {
            return 'Next.js / React';
        }
        if (pathParts.includes('src') && pathParts.includes('main') && pathParts.includes('renderer')) {
            return 'Electron';
        }
        if (pathParts.includes('controllers') && pathParts.includes('models') && pathParts.includes('views')) {
            return 'MVC';
        }
        if (pathParts.includes('domain') && pathParts.includes('infrastructure')) {
            return 'Clean Architecture';
        }

        return 'Unknown';
    }

    /**
     * Extract naming conventions
     */
    private extractNamingConventions(files: string[]): Convention[] {
        const conventions: Convention[] = [];

        // Check file naming
        const filenames = files.map(f => path.basename(f));
        const camelCaseFiles = filenames.filter(f => /^[a-z][a-zA-Z0-9]*\.[a-z]+$/.test(f));
        const pascalCaseFiles = filenames.filter(f => /^[A-Z][a-zA-Z0-9]*\.[a-z]+$/.test(f));
        const kebabCaseFiles = filenames.filter(f => /^[a-z][a-z0-9-]*\.[a-z]+$/.test(f));

        if (pascalCaseFiles.length > camelCaseFiles.length && pascalCaseFiles.length > kebabCaseFiles.length) {
            conventions.push({
                type: 'naming',
                rule: 'PascalCase for file names',
                examples: pascalCaseFiles.slice(0, 3),
            });
        } else if (camelCaseFiles.length > kebabCaseFiles.length) {
            conventions.push({
                type: 'naming',
                rule: 'camelCase for file names',
                examples: camelCaseFiles.slice(0, 3),
            });
        } else if (kebabCaseFiles.length > 0) {
            conventions.push({
                type: 'naming',
                rule: 'kebab-case for file names',
                examples: kebabCaseFiles.slice(0, 3),
            });
        }

        return conventions;
    }

    /**
     * Extract project dependencies
     */
    private async extractDependencies(projectPath: string): Promise<string[]> {
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(content);

            return [
                ...Object.keys(pkg.dependencies || {}),
                ...Object.keys(pkg.devDependencies || {}),
            ];
        } catch {
            return [];
        }
    }

    /**
     * Find matching patterns for a context
     */
    findPatterns(params: {
        context: string;
        language?: string;
        type?: PatternType;
        tags?: string[];
    }): PatternMatch[] {
        const matches: PatternMatch[] = [];
        const contextLower = params.context.toLowerCase();

        for (const pattern of this.patterns.values()) {
            // Filter by language
            if (params.language && pattern.language !== params.language) continue;

            // Filter by type
            if (params.type && pattern.type !== params.type) continue;

            // Filter by tags
            if (params.tags && !params.tags.some(t => pattern.tags.includes(t))) continue;

            // Calculate similarity
            let similarity = 0;

            // Check name match
            if (contextLower.includes(pattern.name.toLowerCase())) {
                similarity += 0.4;
            }

            // Check description match
            const descWords = pattern.description.toLowerCase().split(' ');
            const matchingWords = descWords.filter(w => contextLower.includes(w));
            similarity += (matchingWords.length / descWords.length) * 0.3;

            // Check tag match
            const matchingTags = pattern.tags.filter(t => contextLower.includes(t));
            similarity += (matchingTags.length / pattern.tags.length) * 0.3;

            if (similarity > 0.2) {
                matches.push({
                    pattern,
                    similarity,
                    applicability: pattern.successRate,
                });
            }
        }

        // Sort by similarity
        matches.sort((a, b) => b.similarity - a.similarity);
        return matches.slice(0, 5);
    }

    /**
     * Apply a pattern to generate code
     */
    applyPattern(patternId: string, params: Record<string, any>): string {
        const pattern = this.patterns.get(patternId);
        if (!pattern) {
            throw new Error(`Pattern not found: ${patternId}`);
        }

        let code = pattern.template;

        // Replace parameters
        for (const param of pattern.parameters) {
            const value = params[param.name] ?? param.defaultValue ?? `{{${param.name}}}`;
            code = code.replace(new RegExp(`{{${param.name}}}`, 'g'), value);
        }

        // Update usage count
        pattern.usageCount++;
        pattern.updatedAt = new Date();

        this.emit('pattern:applied', { patternId, params });
        return code;
    }

    /**
     * Add a new pattern
     */
    addPattern(pattern: Omit<Pattern, 'id' | 'usageCount' | 'successRate' | 'createdAt' | 'updatedAt'>): Pattern {
        const newPattern: Pattern = {
            ...pattern,
            id: `pattern-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            usageCount: 0,
            successRate: 1.0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.patterns.set(newPattern.id, newPattern);
        this.emit('pattern:added', newPattern);

        return newPattern;
    }

    /**
     * Record pattern usage feedback
     */
    recordFeedback(patternId: string, success: boolean): void {
        const pattern = this.patterns.get(patternId);
        if (!pattern) return;

        // Update success rate with exponential moving average
        const alpha = 0.1;
        pattern.successRate = pattern.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
        pattern.updatedAt = new Date();

        this.emit('pattern:feedback', { patternId, success, newRate: pattern.successRate });
    }

    // Public API

    /**
     * Get all patterns
     */
    getAllPatterns(): Pattern[] {
        return [...this.patterns.values()];
    }

    /**
     * Get pattern by ID
     */
    getPattern(id: string): Pattern | undefined {
        return this.patterns.get(id);
    }

    /**
     * Get patterns by type
     */
    getPatternsByType(type: PatternType): Pattern[] {
        return [...this.patterns.values()].filter(p => p.type === type);
    }

    /**
     * Get all project learnings
     */
    getProjectLearnings(): ProjectLearning[] {
        return [...this.projectLearnings.values()];
    }

    /**
     * Get project learning by ID
     */
    getProjectLearning(projectId: string): ProjectLearning | undefined {
        return this.projectLearnings.get(projectId);
    }
}

export default CrossProjectLearning;
