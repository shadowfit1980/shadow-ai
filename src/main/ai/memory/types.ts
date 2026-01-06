/**
 * Shadow Memory System - Type Definitions
 * 
 * Defines all types used by the long-term memory system
 */

// ==================== Core Memory Types ====================

export type MemoryType = 'code' | 'decision' | 'style' | 'architecture' | 'conversation' | 'git';

export interface Memory {
    id?: string;
    type: MemoryType;
    content: string;
    metadata: Record<string, any>;
    timestamp?: Date;
    relevance?: number;
}

export interface MemoryVector {
    id: string;
    embedding: number[];
    content: string;
    type: string;
    metadata: Record<string, any>;
}

export interface SearchResult {
    id: string;
    content: string;
    type: string;
    metadata: Record<string, any>;
    score: number;
    timestamp: Date;
}

// ==================== Specialized Memory Types ====================

export interface CodeMemory extends Memory {
    type: 'code';
    metadata: {
        file: string;
        language: string;
        size: number;
        lastModified: number;
        functions?: string[];
        classes?: string[];
    };
}

export interface DecisionMemory extends Memory {
    type: 'decision';
    metadata: {
        title: string;
        category: string;
        impact: 'low' | 'medium' | 'high';
        timestamp: number;
    };
}

export interface StyleMemory extends Memory {
    type: 'style';
    metadata: {
        files: number;
        confidence: number;
        patterns: StylePatterns;
    };
}

export interface ArchitectureMemory extends Memory {
    type: 'architecture';
    metadata: {
        component: string;
        relationships: string[];
        diagram?: string;
    };
}

export interface ConversationMemory extends Memory {
    type: 'conversation';
    metadata: {
        query: string;
        response: string;
        satisfaction?: number;
        learned?: string[];
    };
}

export interface GitMemory extends Memory {
    type: 'git';
    metadata: {
        commitHash: string;
        author: string;
        date: number;
        filesChanged: string[];
        additions: number;
        deletions: number;
    };
}

// ==================== Context & Retrieval Types ====================

export interface ProjectContext {
    code: Memory[];
    decisions: Memory[];
    styles: Memory[];
    architecture: Memory[];
    conversations?: Memory[];
}

export interface CodeMatch {
    code: string;
    file: string;
    similarity: number;
    language: string;
}

// ==================== Style Learning ====================

export interface StylePatterns {
    indentation: {
        type: 'spaces' | 'tabs';
        size?: number;
        confidence: number;
    };
    quotes: {
        type: 'single' | 'double';
        confidence: number;
    };
    semicolons: {
        required: boolean;
        confidence: number;
    };
    naming: {
        variables: 'camelCase' | 'snake_case' | 'PascalCase';
        constants: 'UPPER_CASE' | 'camelCase';
        functions: 'camelCase' | 'snake_case';
        classes: 'PascalCase';
        confidence: number;
    };
    imports: {
        style: 'require' | 'import';
        grouping: boolean;
        sorting: boolean;
        confidence: number;
    };
}

export interface CodingStyle {
    indentation: StylePatterns['indentation'];
    quotes: StylePatterns['quotes'];
    semicolons: StylePatterns['semicolons'];
    naming: StylePatterns['naming'];
    imports: StylePatterns['imports'];
}

// ==================== Decisions ====================

export interface ArchitectureDecision {
    title: string;
    reasoning: string;
    alternatives: string[];
    category: string;
    impact: 'low' | 'medium' | 'high';
    outcome?: string;
}

// ==================== Git Types ====================

export interface GitRepo {
    path: string;
    branch: string;
}

export interface Commit {
    hash: string;
    message: string;
    author: string;
    date: Date;
    files: string[];
    diff?: string;
}

export interface Diff {
    file: string;
    oldContent: string;
    newContent: string;
    additions: number;
    deletions: number;
}

// ==================== Configuration ====================

export interface MemoryEngineConfig {
    dbPath?: string;
    embeddingModel?: string;
    maxMemories?: number;
    autoIndex?: boolean;
    gitSync?: boolean;
}

export interface IndexingProgress {
    total: number;
    indexed: number;
    current: string;
    percentage: number;
}

// ==================== Query Options ====================

export interface SearchOptions {
    limit?: number;
    filters?: {
        type?: MemoryType;
        language?: string;
        dateRange?: {
            start: Date;
            end: Date;
        };
        minRelevance?: number;
    };
    includeMetadata?: boolean;
}
