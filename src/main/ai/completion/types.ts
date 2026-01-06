/**
 * Completion Types
 * TypeScript interfaces for code completion system
 */

export interface Position {
    line: number;
    character: number;
}

export interface Range {
    start: Position;
    end: Position;
}

export interface EditorContext {
    filePath: string;
    content: string;
    language: string;
    cursorPosition: Position;
    selection?: Range;
    recentEdits?: Edit[];
    openFiles?: string[];
    workspace?: string;
}

export interface Edit {
    range: Range;
    text: string;
    timestamp: number;
}

export interface Completion {
    text: string;
    displayText?: string;
    range: Range;
    kind: CompletionKind;
    detail?: string;
    documentation?: string;
    sortText?: string;
    filterText?: string;
    insertText?: string;
    score: number;
    source: 'ai' | 'local' | 'snippet';
}

export enum CompletionKind {
    Function = 'function',
    Method = 'method',
    Class = 'class',
    Interface = 'interface',
    Variable = 'variable',
    Constant = 'constant',
    Property = 'property',
    Keyword = 'keyword',
    Snippet = 'snippet',
    Text = 'text',
}

export interface InlineCompletion {
    text: string;
    range: Range;
    command?: CompletionCommand;
}

export interface CompletionCommand {
    id: string;
    title: string;
    arguments?: any[];
}

export interface CompletionCache {
    key: string;
    completions: Completion[];
    timestamp: number;
    context: Partial<EditorContext>;
}

export interface CompletionConfig {
    enabled: boolean;
    debounceMs: number;
    maxSuggestions: number;
    minChars: number;
    cacheEnabled: boolean;
    cacheTTL: number; // milliseconds
    streamingEnabled: boolean;
    multiLine: boolean;
    contextLines: number; // lines before/after cursor to include
}

export interface CompletionMetrics {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    averageLatency: number;
    acceptedSuggestions: number;
    rejectedSuggestions: number;
    partialAccepts: number;
}

export interface FileContext {
    imports: string[];
    exports: string[];
    functions: string[];
    classes: string[];
    variables: string[];
    types: string[];
}

export interface WorkspaceContext {
    files: string[];
    symbols: Map<string, Symbol[]>;
    dependencies: string[];
    framework?: string;
}

export interface Symbol {
    name: string;
    kind: string;
    location: {
        file: string;
        range: Range;
    };
    documentation?: string;
}
