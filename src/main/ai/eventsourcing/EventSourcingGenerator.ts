/**
 * Event Sourcing Generator
 * 
 * Generate event sourcing patterns, event stores,
 * aggregates, and CQRS implementations.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface EventDefinition {
    name: string;
    version: number;
    payload: Record<string, { type: string; required?: boolean }>;
    metadata?: Record<string, { type: string }>;
}

export interface AggregateDefinition {
    name: string;
    events: string[];
    state: Record<string, { type: string; default?: any }>;
    commands: CommandDefinition[];
}

export interface CommandDefinition {
    name: string;
    payload: Record<string, { type: string; required?: boolean }>;
    emits: string[];
}

export interface ProjectionDefinition {
    name: string;
    events: string[];
    state: Record<string, { type: string }>;
}

// ============================================================================
// EVENT SOURCING GENERATOR
// ============================================================================

export class EventSourcingGenerator extends EventEmitter {
    private static instance: EventSourcingGenerator;

    private constructor() {
        super();
    }

    static getInstance(): EventSourcingGenerator {
        if (!EventSourcingGenerator.instance) {
            EventSourcingGenerator.instance = new EventSourcingGenerator();
        }
        return EventSourcingGenerator.instance;
    }

    // ========================================================================
    // EVENT STORE
    // ========================================================================

    generateEventStore(usePostgres = true): string {
        if (usePostgres) {
            return `import { Pool } from 'pg';

interface StoredEvent {
    id: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: any;
    metadata: any;
    version: number;
    timestamp: Date;
}

export class PostgresEventStore {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async initialize(): Promise<void> {
        await this.pool.query(\`
            CREATE TABLE IF NOT EXISTS events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                aggregate_id UUID NOT NULL,
                aggregate_type VARCHAR(255) NOT NULL,
                event_type VARCHAR(255) NOT NULL,
                event_data JSONB NOT NULL,
                metadata JSONB DEFAULT '{}',
                version INTEGER NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(aggregate_id, version)
            );
            
            CREATE INDEX IF NOT EXISTS idx_events_aggregate 
            ON events(aggregate_id, version);
            
            CREATE INDEX IF NOT EXISTS idx_events_type 
            ON events(event_type);
        \`);
    }

    async append(
        aggregateId: string,
        aggregateType: string,
        events: Array<{ type: string; data: any; metadata?: any }>,
        expectedVersion: number
    ): Promise<StoredEvent[]> {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Optimistic concurrency check
            const { rows } = await client.query(
                'SELECT MAX(version) as version FROM events WHERE aggregate_id = $1',
                [aggregateId]
            );
            
            const currentVersion = rows[0]?.version ?? -1;
            
            if (currentVersion !== expectedVersion) {
                throw new Error(
                    \`Concurrency conflict: expected version \${expectedVersion}, got \${currentVersion}\`
                );
            }

            const storedEvents: StoredEvent[] = [];
            
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                const version = expectedVersion + i + 1;
                
                const result = await client.query(
                    \`INSERT INTO events (aggregate_id, aggregate_type, event_type, event_data, metadata, version)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING *\`,
                    [aggregateId, aggregateType, event.type, event.data, event.metadata || {}, version]
                );
                
                storedEvents.push(this.mapRow(result.rows[0]));
            }

            await client.query('COMMIT');
            return storedEvents;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getEvents(aggregateId: string, fromVersion = 0): Promise<StoredEvent[]> {
        const { rows } = await this.pool.query(
            \`SELECT * FROM events 
             WHERE aggregate_id = $1 AND version > $2 
             ORDER BY version\`,
            [aggregateId, fromVersion]
        );
        return rows.map(this.mapRow);
    }

    async getEventsByType(eventType: string, limit = 100): Promise<StoredEvent[]> {
        const { rows } = await this.pool.query(
            \`SELECT * FROM events WHERE event_type = $1 ORDER BY timestamp DESC LIMIT $2\`,
            [eventType, limit]
        );
        return rows.map(this.mapRow);
    }

    async getAllEvents(fromPosition = 0, limit = 1000): Promise<StoredEvent[]> {
        const { rows } = await this.pool.query(
            \`SELECT * FROM events ORDER BY timestamp OFFSET $1 LIMIT $2\`,
            [fromPosition, limit]
        );
        return rows.map(this.mapRow);
    }

    private mapRow(row: any): StoredEvent {
        return {
            id: row.id,
            aggregateId: row.aggregate_id,
            aggregateType: row.aggregate_type,
            eventType: row.event_type,
            eventData: row.event_data,
            metadata: row.metadata,
            version: row.version,
            timestamp: row.timestamp,
        };
    }
}

export const eventStore = new PostgresEventStore();
`;
        }

        return `// In-memory event store for development
interface StoredEvent {
    id: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: any;
    metadata: any;
    version: number;
    timestamp: Date;
}

export class InMemoryEventStore {
    private events: StoredEvent[] = [];
    private position = 0;

    append(
        aggregateId: string,
        aggregateType: string,
        events: Array<{ type: string; data: any; metadata?: any }>,
        expectedVersion: number
    ): StoredEvent[] {
        const aggregateEvents = this.events.filter(e => e.aggregateId === aggregateId);
        const currentVersion = aggregateEvents.length > 0 
            ? Math.max(...aggregateEvents.map(e => e.version))
            : -1;

        if (currentVersion !== expectedVersion) {
            throw new Error(\`Concurrency conflict\`);
        }

        const storedEvents: StoredEvent[] = events.map((event, i) => ({
            id: crypto.randomUUID(),
            aggregateId,
            aggregateType,
            eventType: event.type,
            eventData: event.data,
            metadata: event.metadata || {},
            version: expectedVersion + i + 1,
            timestamp: new Date(),
        }));

        this.events.push(...storedEvents);
        return storedEvents;
    }

    getEvents(aggregateId: string, fromVersion = 0): StoredEvent[] {
        return this.events
            .filter(e => e.aggregateId === aggregateId && e.version > fromVersion)
            .sort((a, b) => a.version - b.version);
    }

    getAllEvents(fromPosition = 0, limit = 1000): StoredEvent[] {
        return this.events.slice(fromPosition, fromPosition + limit);
    }
}

export const eventStore = new InMemoryEventStore();
`;
    }

    // ========================================================================
    // AGGREGATE
    // ========================================================================

    generateAggregate(aggregate: AggregateDefinition): string {
        const stateFields = Object.entries(aggregate.state)
            .map(([name, def]) => `    ${name}: ${def.type};`)
            .join('\n');

        const stateDefaults = Object.entries(aggregate.state)
            .map(([name, def]) => `        ${name}: ${def.default !== undefined ? JSON.stringify(def.default) : this.getDefaultValue(def.type)},`)
            .join('\n');

        return `import { eventStore } from './EventStore';

// State
interface ${aggregate.name}State {
${stateFields}
}

// Events
${aggregate.events.map(e => `type ${e}Event = { type: '${e}'; data: any };`).join('\n')}
type ${aggregate.name}Event = ${aggregate.events.map(e => `${e}Event`).join(' | ')};

// Aggregate
export class ${aggregate.name} {
    private state: ${aggregate.name}State;
    private version: number = -1;
    private changes: ${aggregate.name}Event[] = [];

    constructor(private readonly id: string) {
        this.state = {
${stateDefaults}
        };
    }

    // Load from event store
    static async load(id: string): Promise<${aggregate.name}> {
        const aggregate = new ${aggregate.name}(id);
        const events = await eventStore.getEvents(id);
        
        for (const event of events) {
            aggregate.apply(event as any, false);
            aggregate.version = event.version;
        }
        
        return aggregate;
    }

    // Apply event
    private apply(event: ${aggregate.name}Event, isNew: boolean): void {
        this.evolve(event);
        if (isNew) {
            this.changes.push(event);
        }
    }

    // Evolve state based on event
    private evolve(event: ${aggregate.name}Event): void {
        switch (event.type) {
${aggregate.events.map(e => `            case '${e}':
                // TODO: Update state based on ${e} event
                break;`).join('\n')}
        }
    }

    // Commands
${aggregate.commands.map(cmd => `
    ${this.toCamelCase(cmd.name)}(${Object.entries(cmd.payload).map(([n, d]) => `${n}: ${d.type}`).join(', ')}): void {
        // Validate
        // TODO: Add validation logic

        // Apply events
${cmd.emits.map(e => `        this.apply({ type: '${e}', data: { ${Object.keys(cmd.payload).join(', ')} } }, true);`).join('\n')}
    }`).join('\n')}

    // Save changes
    async save(): Promise<void> {
        if (this.changes.length === 0) return;

        const events = this.changes.map(e => ({
            type: e.type,
            data: e.data,
        }));

        await eventStore.append(this.id, '${aggregate.name}', events, this.version);
        this.version += this.changes.length;
        this.changes = [];
    }

    // Getters
    getState(): ${aggregate.name}State {
        return { ...this.state };
    }

    getVersion(): number {
        return this.version;
    }

    getId(): string {
        return this.id;
    }
}
`;
    }

    // ========================================================================
    // PROJECTION
    // ========================================================================

    generateProjection(projection: ProjectionDefinition): string {
        return `import { eventStore } from './EventStore';

interface ${projection.name}State {
${Object.entries(projection.state).map(([n, d]) => `    ${n}: ${d.type};`).join('\n')}
}

export class ${projection.name}Projection {
    private state: Map<string, ${projection.name}State> = new Map();
    private lastProcessedPosition = 0;

    async rebuild(): Promise<void> {
        this.state.clear();
        this.lastProcessedPosition = 0;
        await this.catchUp();
    }

    async catchUp(): Promise<void> {
        const events = await eventStore.getAllEvents(this.lastProcessedPosition);
        
        for (const event of events) {
            if (this.handles(event.eventType)) {
                this.apply(event);
            }
            this.lastProcessedPosition++;
        }
    }

    private handles(eventType: string): boolean {
        return ${JSON.stringify(projection.events)}.includes(eventType);
    }

    private apply(event: any): void {
        switch (event.eventType) {
${projection.events.map(e => `            case '${e}':
                this.on${e}(event);
                break;`).join('\n')}
        }
    }

${projection.events.map(e => `
    private on${e}(event: any): void {
        // TODO: Update projection state
        const id = event.aggregateId;
        const current = this.state.get(id) || this.getInitialState();
        
        // Update based on event
        this.state.set(id, {
            ...current,
            // Apply changes from event.eventData
        });
    }`).join('\n')}

    private getInitialState(): ${projection.name}State {
        return {
${Object.entries(projection.state).map(([n, d]) => `            ${n}: ${this.getDefaultValue(d.type)},`).join('\n')}
        };
    }

    // Query methods
    getById(id: string): ${projection.name}State | undefined {
        return this.state.get(id);
    }

    getAll(): ${projection.name}State[] {
        return Array.from(this.state.values());
    }

    find(predicate: (state: ${projection.name}State) => boolean): ${projection.name}State[] {
        return this.getAll().filter(predicate);
    }
}

export const ${this.toCamelCase(projection.name)}Projection = new ${projection.name}Projection();
`;
    }

    // ========================================================================
    // CQRS
    // ========================================================================

    generateCQRS(): string {
        return `/**
 * CQRS (Command Query Responsibility Segregation) Infrastructure
 */

// Command Bus
type CommandHandler<T = any> = (command: T) => Promise<void>;

class CommandBus {
    private handlers: Map<string, CommandHandler> = new Map();

    register<T>(commandType: string, handler: CommandHandler<T>): void {
        this.handlers.set(commandType, handler);
    }

    async dispatch<T>(commandType: string, command: T): Promise<void> {
        const handler = this.handlers.get(commandType);
        if (!handler) {
            throw new Error(\`No handler for command: \${commandType}\`);
        }
        await handler(command);
    }
}

// Query Bus
type QueryHandler<T = any, R = any> = (query: T) => Promise<R>;

class QueryBus {
    private handlers: Map<string, QueryHandler> = new Map();

    register<T, R>(queryType: string, handler: QueryHandler<T, R>): void {
        this.handlers.set(queryType, handler);
    }

    async dispatch<T, R>(queryType: string, query: T): Promise<R> {
        const handler = this.handlers.get(queryType);
        if (!handler) {
            throw new Error(\`No handler for query: \${queryType}\`);
        }
        return handler(query);
    }
}

// Event Bus
type EventHandler = (event: any) => Promise<void>;

class EventBus {
    private handlers: Map<string, EventHandler[]> = new Map();

    subscribe(eventType: string, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);
    }

    async publish(eventType: string, event: any): Promise<void> {
        const handlers = this.handlers.get(eventType) || [];
        await Promise.all(handlers.map(h => h(event)));
    }
}

export const commandBus = new CommandBus();
export const queryBus = new QueryBus();
export const eventBus = new EventBus();

// Usage example:
// commandBus.register('CreateUser', async (cmd) => { ... });
// await commandBus.dispatch('CreateUser', { name: 'John' });
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private toCamelCase(str: string): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    private getDefaultValue(type: string): string {
        switch (type) {
            case 'string': return "''";
            case 'number': return '0';
            case 'boolean': return 'false';
            case 'Date': return 'new Date()';
            default: return 'null';
        }
    }
}

export const eventSourcingGenerator = EventSourcingGenerator.getInstance();
