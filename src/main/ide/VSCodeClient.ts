/**
 * VS Code Extension API Client
 * Provides a WebSocket connection layer for VS Code extension integration
 * Allows Shadow AI to communicate with IDE extensions
 */

import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';

export interface VSCodeMessage {
    id: string;
    type: 'request' | 'response' | 'notification';
    method: string;
    params?: any;
    result?: any;
    error?: { code: number; message: string };
}

export interface VSCodeDocument {
    uri: string;
    languageId: string;
    version: number;
    text: string;
}

export interface VSCodePosition {
    line: number;
    character: number;
}

export interface VSCodeRange {
    start: VSCodePosition;
    end: VSCodePosition;
}

export interface CompletionRequest {
    document: VSCodeDocument;
    position: VSCodePosition;
    context?: { triggerKind: number; triggerCharacter?: string };
}

export interface CompletionItem {
    label: string;
    kind: number;
    detail?: string;
    documentation?: string;
    insertText: string;
    range?: VSCodeRange;
}

/**
 * VSCodeClient
 * WebSocket server for VS Code extension connections
 */
export class VSCodeClient extends EventEmitter {
    private static instance: VSCodeClient;
    private server: WebSocketServer | null = null;
    private clients: Map<string, WebSocket> = new Map();
    private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();
    private requestCounter = 0;

    private constructor() {
        super();
    }

    static getInstance(): VSCodeClient {
        if (!VSCodeClient.instance) {
            VSCodeClient.instance = new VSCodeClient();
        }
        return VSCodeClient.instance;
    }

    /**
     * Start the WebSocket server for VS Code connections
     */
    start(port = 8765): void {
        if (this.server) {
            console.log('[VSCodeClient] Server already running');
            return;
        }

        try {
            this.server = new WebSocketServer({ port });

            this.server.on('connection', (ws, req) => {
                const clientId = `vscode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.clients.set(clientId, ws);

                console.log(`[VSCodeClient] Extension connected: ${clientId}`);
                this.emit('connected', { clientId });

                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString()) as VSCodeMessage;
                        this.handleMessage(clientId, message);
                    } catch (error) {
                        console.error('[VSCodeClient] Invalid message:', error);
                    }
                });

                ws.on('close', () => {
                    this.clients.delete(clientId);
                    console.log(`[VSCodeClient] Extension disconnected: ${clientId}`);
                    this.emit('disconnected', { clientId });
                });

                ws.on('error', (error) => {
                    console.error(`[VSCodeClient] Client error:`, error);
                });
            });

            console.log(`✅ VSCodeClient server started on port ${port}`);
            this.emit('started', { port });
        } catch (error: any) {
            console.error('[VSCodeClient] Failed to start server:', error.message);
        }
    }

    /**
     * Stop the server
     */
    stop(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.clients.clear();
            console.log('[VSCodeClient] Server stopped');
            this.emit('stopped');
        }
    }

    /**
     * Get connected clients
     */
    getConnectedClients(): string[] {
        return Array.from(this.clients.keys());
    }

    /**
     * Send completion items to extension
     */
    sendCompletions(clientId: string, completions: CompletionItem[]): void {
        this.sendNotification(clientId, 'shadow/completions', { items: completions });
    }

    /**
     * Send inline suggestion
     */
    sendInlineSuggestion(clientId: string, text: string, range: VSCodeRange): void {
        this.sendNotification(clientId, 'shadow/inlineSuggestion', { text, range });
    }

    /**
     * Send diagnostics
     */
    sendDiagnostics(clientId: string, uri: string, diagnostics: Array<{
        range: VSCodeRange;
        message: string;
        severity: 1 | 2 | 3 | 4; // Error, Warning, Info, Hint
    }>): void {
        this.sendNotification(clientId, 'shadow/diagnostics', { uri, diagnostics });
    }

    /**
     * Request document content from extension
     */
    async requestDocument(clientId: string, uri: string): Promise<VSCodeDocument | null> {
        return this.sendRequest(clientId, 'shadow/getDocument', { uri });
    }

    /**
     * Request workspace files
     */
    async requestWorkspaceFiles(clientId: string, pattern?: string): Promise<string[]> {
        return this.sendRequest(clientId, 'shadow/getWorkspaceFiles', { pattern }) || [];
    }

    /**
     * Apply edit to document
     */
    async applyEdit(clientId: string, uri: string, edits: Array<{
        range: VSCodeRange;
        newText: string;
    }>): Promise<boolean> {
        return this.sendRequest(clientId, 'shadow/applyEdit', { uri, edits }) || false;
    }

    /**
     * Show message in VS Code
     */
    showMessage(clientId: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
        this.sendNotification(clientId, 'shadow/showMessage', { message, type });
    }

    /**
     * Open file in VS Code
     */
    openFile(clientId: string, uri: string, line?: number): void {
        this.sendNotification(clientId, 'shadow/openFile', { uri, line });
    }

    /**
     * Execute command in VS Code
     */
    async executeCommand(clientId: string, command: string, args?: any[]): Promise<any> {
        return this.sendRequest(clientId, 'shadow/executeCommand', { command, args });
    }

    /**
     * Broadcast to all clients
     */
    broadcast(method: string, params: any): void {
        for (const clientId of this.clients.keys()) {
            this.sendNotification(clientId, method, params);
        }
    }

    // Private methods

    private handleMessage(clientId: string, message: VSCodeMessage): void {
        if (message.type === 'response') {
            // Handle response to our request
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
                if (message.error) {
                    pending.reject(new Error(message.error.message));
                } else {
                    pending.resolve(message.result);
                }
                this.pendingRequests.delete(message.id);
            }
        } else if (message.type === 'request') {
            // Handle request from extension
            this.handleRequest(clientId, message);
        } else if (message.type === 'notification') {
            // Handle notification from extension
            this.handleNotification(clientId, message);
        }
    }

    private async handleRequest(clientId: string, message: VSCodeMessage): Promise<void> {
        let result: any;
        let error: { code: number; message: string } | undefined;

        try {
            switch (message.method) {
                case 'shadow/getCompletions':
                    result = await this.handleCompletionRequest(message.params);
                    break;
                case 'shadow/chat':
                    result = await this.handleChatRequest(message.params);
                    break;
                case 'shadow/generateCode':
                    result = await this.handleGenerateCodeRequest(message.params);
                    break;
                case 'shadow/explainCode':
                    result = await this.handleExplainCodeRequest(message.params);
                    break;
                case 'shadow/refactorCode':
                    result = await this.handleRefactorRequest(message.params);
                    break;
                default:
                    error = { code: -32601, message: `Unknown method: ${message.method}` };
            }
        } catch (e: any) {
            error = { code: -32603, message: e.message };
        }

        this.sendResponse(clientId, message.id, result, error);
    }

    private handleNotification(clientId: string, message: VSCodeMessage): void {
        switch (message.method) {
            case 'textDocument/didOpen':
            case 'textDocument/didChange':
            case 'textDocument/didClose':
                this.emit('documentChange', { clientId, ...message.params });
                break;
            case 'shadow/cursorMove':
                this.emit('cursorMove', { clientId, ...message.params });
                break;
            default:
                this.emit('notification', { clientId, method: message.method, params: message.params });
        }
    }

    private async handleCompletionRequest(params: CompletionRequest): Promise<CompletionItem[]> {
        // Generate completions using Shadow AI's completion engine
        this.emit('completionRequest', params);

        // Placeholder - in production, would call CompletionEngine
        return [{
            label: 'shadow.suggestion',
            kind: 1,
            detail: 'Shadow AI suggestion',
            insertText: '// Generated by Shadow AI',
        }];
    }

    private async handleChatRequest(params: { message: string; context?: any }): Promise<{ response: string }> {
        this.emit('chatRequest', params);
        return { response: 'Processing...' };
    }

    private async handleGenerateCodeRequest(params: { prompt: string; language: string }): Promise<{ code: string }> {
        this.emit('generateRequest', params);
        return { code: '// Generated code' };
    }

    private async handleExplainCodeRequest(params: { code: string }): Promise<{ explanation: string }> {
        this.emit('explainRequest', params);
        return { explanation: 'Code explanation...' };
    }

    private async handleRefactorRequest(params: { code: string; instruction: string }): Promise<{ refactored: string }> {
        this.emit('refactorRequest', params);
        return { refactored: params.code };
    }

    private sendRequest(clientId: string, method: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const client = this.clients.get(clientId);
            if (!client) {
                reject(new Error('Client not connected'));
                return;
            }

            const id = `req_${++this.requestCounter}_${Date.now()}`;
            this.pendingRequests.set(id, { resolve, reject });

            const message: VSCodeMessage = {
                id,
                type: 'request',
                method,
                params,
            };

            client.send(JSON.stringify(message));

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    private sendResponse(clientId: string, id: string, result?: any, error?: { code: number; message: string }): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        const message: VSCodeMessage = {
            id,
            type: 'response',
            method: '',
            result,
            error,
        };

        client.send(JSON.stringify(message));
    }

    private sendNotification(clientId: string, method: string, params: any): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        const message: VSCodeMessage = {
            id: '',
            type: 'notification',
            method,
            params,
        };

        client.send(JSON.stringify(message));
    }
}

// Singleton getter
export function getVSCodeClient(): VSCodeClient {
    return VSCodeClient.getInstance();
}
