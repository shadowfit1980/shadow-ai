/**
 * Language Server Protocol (LSP) Server
 * Provides LSP-compatible API for IDE integrations
 * Supports completion, diagnostics, hover, and code actions
 */

import { EventEmitter } from 'events';
import * as net from 'net';

export interface LSPCapabilities {
    completionProvider: boolean;
    hoverProvider: boolean;
    definitionProvider: boolean;
    referencesProvider: boolean;
    codeActionProvider: boolean;
    diagnosticsProvider: boolean;
}

export interface LSPPosition {
    line: number;
    character: number;
}

export interface LSPRange {
    start: LSPPosition;
    end: LSPPosition;
}

export interface LSPDiagnostic {
    range: LSPRange;
    severity: 1 | 2 | 3 | 4; // Error, Warning, Info, Hint
    code?: string | number;
    source?: string;
    message: string;
}

export interface LSPCompletionItem {
    label: string;
    kind: number;
    detail?: string;
    documentation?: string | { kind: 'markdown' | 'plaintext'; value: string };
    insertText?: string;
    insertTextFormat?: 1 | 2; // PlainText, Snippet
    textEdit?: { range: LSPRange; newText: string };
}

export interface LSPHover {
    contents: string | { kind: 'markdown' | 'plaintext'; value: string };
    range?: LSPRange;
}

export interface LSPCodeAction {
    title: string;
    kind: string;
    diagnostics?: LSPDiagnostic[];
    edit?: { changes: Record<string, Array<{ range: LSPRange; newText: string }>> };
    command?: { title: string; command: string; arguments?: any[] };
}

/**
 * LSPServer
 * Language Server Protocol implementation
 */
export class LSPServer extends EventEmitter {
    private static instance: LSPServer;
    private server: net.Server | null = null;
    private clients: Map<string, net.Socket> = new Map();
    private documents: Map<string, { content: string; version: number; languageId: string }> = new Map();
    private capabilities: LSPCapabilities = {
        completionProvider: true,
        hoverProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        codeActionProvider: true,
        diagnosticsProvider: true,
    };

    private constructor() {
        super();
    }

    static getInstance(): LSPServer {
        if (!LSPServer.instance) {
            LSPServer.instance = new LSPServer();
        }
        return LSPServer.instance;
    }

    /**
     * Start LSP server on TCP port
     */
    start(port = 6008): void {
        if (this.server) {
            console.log('[LSPServer] Already running');
            return;
        }

        this.server = net.createServer((socket) => {
            const clientId = `lsp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.clients.set(clientId, socket);

            console.log(`[LSPServer] Client connected: ${clientId}`);
            this.emit('connected', { clientId });

            let buffer = '';

            socket.on('data', (data) => {
                buffer += data.toString();
                this.processBuffer(clientId, buffer, (remaining) => {
                    buffer = remaining;
                });
            });

            socket.on('close', () => {
                this.clients.delete(clientId);
                this.emit('disconnected', { clientId });
            });

            socket.on('error', (error) => {
                console.error(`[LSPServer] Client error:`, error);
            });
        });

        this.server.listen(port, () => {
            console.log(`✅ LSPServer started on port ${port}`);
            this.emit('started', { port });
        });
    }

    /**
     * Stop the server
     */
    stop(): void {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.clients.clear();
            console.log('[LSPServer] Stopped');
            this.emit('stopped');
        }
    }

    /**
     * Get document content
     */
    getDocument(uri: string): { content: string; version: number; languageId: string } | null {
        return this.documents.get(uri) || null;
    }

    /**
     * Publish diagnostics
     */
    publishDiagnostics(uri: string, diagnostics: LSPDiagnostic[]): void {
        const notification = {
            jsonrpc: '2.0',
            method: 'textDocument/publishDiagnostics',
            params: { uri, diagnostics },
        };

        this.broadcastNotification(notification);
    }

    /**
     * Generate completions
     */
    async getCompletions(uri: string, position: LSPPosition): Promise<LSPCompletionItem[]> {
        const doc = this.documents.get(uri);
        if (!doc) return [];

        // Get context around cursor
        const lines = doc.content.split('\n');
        const currentLine = lines[position.line] || '';
        const prefix = currentLine.substring(0, position.character);

        // Emit for external handling
        this.emit('completionRequest', { uri, position, prefix });

        // Generate basic completions
        const completions: LSPCompletionItem[] = [
            {
                label: 'shadow.complete',
                kind: 1, // Text
                detail: 'Shadow AI completion',
                insertText: '// AI-generated completion',
            },
        ];

        return completions;
    }

    /**
     * Get hover information
     */
    async getHover(uri: string, position: LSPPosition): Promise<LSPHover | null> {
        const doc = this.documents.get(uri);
        if (!doc) return null;

        // Get word at position
        const lines = doc.content.split('\n');
        const line = lines[position.line] || '';
        const word = this.getWordAtPosition(line, position.character);

        if (!word) return null;

        // Emit for external handling
        this.emit('hoverRequest', { uri, position, word });

        return {
            contents: {
                kind: 'markdown',
                value: `**${word}**\n\n*Hover information from Shadow AI*`,
            },
        };
    }

    /**
     * Get code actions
     */
    async getCodeActions(uri: string, range: LSPRange, diagnostics: LSPDiagnostic[]): Promise<LSPCodeAction[]> {
        const actions: LSPCodeAction[] = [];

        // Generate fix actions for diagnostics
        for (const diag of diagnostics) {
            actions.push({
                title: `Fix: ${diag.message.substring(0, 50)}`,
                kind: 'quickfix',
                diagnostics: [diag],
            });
        }

        // Add refactoring actions
        actions.push({
            title: 'Shadow AI: Refactor selection',
            kind: 'refactor',
        });

        actions.push({
            title: 'Shadow AI: Explain code',
            kind: 'source',
        });

        actions.push({
            title: 'Shadow AI: Generate tests',
            kind: 'source',
        });

        this.emit('codeActionRequest', { uri, range, diagnostics });

        return actions;
    }

    // Private methods

    private processBuffer(clientId: string, buffer: string, callback: (remaining: string) => void): void {
        // LSP uses Content-Length headers
        const headerMatch = buffer.match(/Content-Length: (\d+)\r\n\r\n/);

        if (headerMatch) {
            const contentLength = parseInt(headerMatch[1], 10);
            const headerEnd = buffer.indexOf('\r\n\r\n') + 4;
            const content = buffer.substring(headerEnd, headerEnd + contentLength);

            if (content.length >= contentLength) {
                try {
                    const message = JSON.parse(content);
                    this.handleMessage(clientId, message);
                } catch (error) {
                    console.error('[LSPServer] Parse error:', error);
                }

                callback(buffer.substring(headerEnd + contentLength));
                return;
            }
        }

        callback(buffer);
    }

    private handleMessage(clientId: string, message: any): void {
        if (message.method) {
            this.handleRequest(clientId, message);
        }
    }

    private async handleRequest(clientId: string, message: any): Promise<void> {
        let result: any = null;

        switch (message.method) {
            case 'initialize':
                result = this.handleInitialize(message.params);
                break;
            case 'initialized':
                // No response needed
                return;
            case 'textDocument/didOpen':
                this.handleDidOpen(message.params);
                return;
            case 'textDocument/didChange':
                this.handleDidChange(message.params);
                return;
            case 'textDocument/didClose':
                this.handleDidClose(message.params);
                return;
            case 'textDocument/completion':
                result = await this.getCompletions(
                    message.params.textDocument.uri,
                    message.params.position
                );
                break;
            case 'textDocument/hover':
                result = await this.getHover(
                    message.params.textDocument.uri,
                    message.params.position
                );
                break;
            case 'textDocument/codeAction':
                result = await this.getCodeActions(
                    message.params.textDocument.uri,
                    message.params.range,
                    message.params.context?.diagnostics || []
                );
                break;
            case 'shutdown':
                result = null;
                break;
            case 'exit':
                this.stop();
                return;
        }

        if (message.id !== undefined) {
            this.sendResponse(clientId, message.id, result);
        }
    }

    private handleInitialize(params: any): any {
        return {
            capabilities: {
                textDocumentSync: 1, // Full
                completionProvider: this.capabilities.completionProvider ? { triggerCharacters: ['.', '('] } : undefined,
                hoverProvider: this.capabilities.hoverProvider,
                definitionProvider: this.capabilities.definitionProvider,
                referencesProvider: this.capabilities.referencesProvider,
                codeActionProvider: this.capabilities.codeActionProvider,
            },
            serverInfo: {
                name: 'Shadow AI LSP',
                version: '1.0.0',
            },
        };
    }

    private handleDidOpen(params: any): void {
        const { uri, languageId, version, text } = params.textDocument;
        this.documents.set(uri, { content: text, version, languageId });
        this.emit('documentOpened', { uri, languageId });
    }

    private handleDidChange(params: any): void {
        const { uri, version } = params.textDocument;
        const doc = this.documents.get(uri);

        if (doc && params.contentChanges?.length > 0) {
            // Full document sync
            doc.content = params.contentChanges[0].text;
            doc.version = version;
            this.emit('documentChanged', { uri, version });
        }
    }

    private handleDidClose(params: any): void {
        const { uri } = params.textDocument;
        this.documents.delete(uri);
        this.emit('documentClosed', { uri });
    }

    private sendResponse(clientId: string, id: number, result: any): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        const response = JSON.stringify({
            jsonrpc: '2.0',
            id,
            result,
        });

        const message = `Content-Length: ${Buffer.byteLength(response)}\r\n\r\n${response}`;
        client.write(message);
    }

    private broadcastNotification(notification: any): void {
        const content = JSON.stringify(notification);
        const message = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n${content}`;

        for (const client of this.clients.values()) {
            client.write(message);
        }
    }

    private getWordAtPosition(line: string, character: number): string | null {
        const before = line.substring(0, character);
        const after = line.substring(character);

        const wordBefore = before.match(/\w+$/)?.[0] || '';
        const wordAfter = after.match(/^\w+/)?.[0] || '';

        const word = wordBefore + wordAfter;
        return word || null;
    }
}

// Singleton getter
export function getLSPServer(): LSPServer {
    return LSPServer.getInstance();
}
