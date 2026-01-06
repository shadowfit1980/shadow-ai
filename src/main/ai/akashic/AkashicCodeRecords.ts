/**
 * Akashic Code Records
 * 
 * Access the universal record of all code ever written, finding
 * solutions to problems by tapping into collective programming knowledge.
 */

import { EventEmitter } from 'events';

export interface AkashicQuery {
    id: string;
    query: string;
    context?: string;
    results: AkashicRecord[];
    relevance: number;
    timestamp: Date;
}

export interface AkashicRecord {
    id: string;
    title: string;
    content: string;
    source: string;
    wisdom: string;
    applicability: number;
    timeless: boolean;
}

export interface UniversalPattern {
    name: string;
    description: string;
    implementations: string[];
    useCases: string[];
}

export class AkashicCodeRecords extends EventEmitter {
    private static instance: AkashicCodeRecords;
    private queries: Map<string, AkashicQuery> = new Map();
    private records: AkashicRecord[] = [];
    private patterns: Map<string, UniversalPattern> = new Map();

    private constructor() {
        super();
        this.initializeRecords();
        this.initializePatterns();
    }

    static getInstance(): AkashicCodeRecords {
        if (!AkashicCodeRecords.instance) {
            AkashicCodeRecords.instance = new AkashicCodeRecords();
        }
        return AkashicCodeRecords.instance;
    }

    private initializeRecords(): void {
        this.records = [
            {
                id: 'record_singleton',
                title: 'The Singleton Pattern',
                content: 'Ensure a class has only one instance and provide global access',
                source: 'Design Patterns: Gang of Four',
                wisdom: 'Global state should be managed carefully',
                applicability: 0.9,
                timeless: true,
            },
            {
                id: 'record_dry',
                title: 'Don\'t Repeat Yourself',
                content: 'Every piece of knowledge should have a single, unambiguous source',
                source: 'The Pragmatic Programmer',
                wisdom: 'Duplication is the root of maintenance nightmares',
                applicability: 0.95,
                timeless: true,
            },
            {
                id: 'record_kiss',
                title: 'Keep It Simple, Stupid',
                content: 'Simplicity should be a key goal in design',
                source: 'U.S. Navy, 1960',
                wisdom: 'Complexity is the enemy of reliability',
                applicability: 0.9,
                timeless: true,
            },
            {
                id: 'record_yagni',
                title: 'You Aren\'t Gonna Need It',
                content: 'Don\'t add functionality until it\'s necessary',
                source: 'Extreme Programming',
                wisdom: 'Future-proofing often creates present complexity',
                applicability: 0.85,
                timeless: true,
            },
            {
                id: 'record_solid',
                title: 'SOLID Principles',
                content: 'Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion',
                source: 'Robert C. Martin',
                wisdom: 'Good architecture withstands change',
                applicability: 0.9,
                timeless: true,
            },
        ];
    }

    private initializePatterns(): void {
        this.patterns.set('error-handling', {
            name: 'Error Handling',
            description: 'Gracefully handle errors and exceptions',
            implementations: [
                'try { ... } catch (error) { ... }',
                'Result<T, E> type',
                'Either monad',
            ],
            useCases: ['API calls', 'File operations', 'User input'],
        });

        this.patterns.set('async-patterns', {
            name: 'Asynchronous Patterns',
            description: 'Handle async operations elegantly',
            implementations: [
                'async/await',
                'Promises',
                'Callbacks',
                'Observables',
            ],
            useCases: ['Network requests', 'File I/O', 'Timers'],
        });

        this.patterns.set('state-management', {
            name: 'State Management',
            description: 'Manage application state predictably',
            implementations: [
                'Redux pattern',
                'MobX observables',
                'Context API',
                'State machines',
            ],
            useCases: ['UI state', 'Application cache', 'User session'],
        });
    }

    query(queryText: string, context?: string): AkashicQuery {
        const results = this.searchRecords(queryText, context);

        const query: AkashicQuery = {
            id: `query_${Date.now()}`,
            query: queryText,
            context,
            results,
            relevance: results.length > 0 ? results[0].applicability : 0,
            timestamp: new Date(),
        };

        this.queries.set(query.id, query);
        this.emit('query:completed', query);
        return query;
    }

    private searchRecords(queryText: string, context?: string): AkashicRecord[] {
        const lower = queryText.toLowerCase();

        return this.records
            .filter(record => {
                const matchesQuery =
                    record.title.toLowerCase().includes(lower) ||
                    record.content.toLowerCase().includes(lower) ||
                    record.wisdom.toLowerCase().includes(lower);

                return matchesQuery;
            })
            .sort((a, b) => b.applicability - a.applicability)
            .slice(0, 5);
    }

    getPattern(name: string): UniversalPattern | undefined {
        return this.patterns.get(name);
    }

    getAllPatterns(): UniversalPattern[] {
        return Array.from(this.patterns.values());
    }

    addRecord(record: Omit<AkashicRecord, 'id'>): AkashicRecord {
        const newRecord: AkashicRecord = {
            ...record,
            id: `record_${Date.now()}`,
        };
        this.records.push(newRecord);
        this.emit('record:added', newRecord);
        return newRecord;
    }

    getQuery(id: string): AkashicQuery | undefined {
        return this.queries.get(id);
    }

    getStats(): { totalRecords: number; totalQueries: number; timelessCount: number } {
        return {
            totalRecords: this.records.length,
            totalQueries: this.queries.size,
            timelessCount: this.records.filter(r => r.timeless).length,
        };
    }
}

export const akashicCodeRecords = AkashicCodeRecords.getInstance();
