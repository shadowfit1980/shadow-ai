/**
 * MCP Client - Model Context Protocol Client
 * 
 * Connect to external MCP servers (like n8n) to consume their tools
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';

interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

interface MCPPrompt {
    name: string;
    description?: string;
    arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

interface MCPServerConfig {
    id: string;
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    enabled: boolean;
}

interface MCPConnection {
    config: MCPServerConfig;
    process: ChildProcess | null;
    tools: MCPTool[];
    resources: MCPResource[];
    prompts: MCPPrompt[];
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    error?: string;
}

/**
 * MCPClient - Connect to and consume external MCP servers
 */
export class MCPClient extends EventEmitter {
    private static instance: MCPClient;
    private connections: Map<string, MCPConnection> = new Map();
    private requestId: number = 0;
    private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): MCPClient {
        if (!MCPClient.instance) {
            MCPClient.instance = new MCPClient();
        }
        return MCPClient.instance;
    }

    /**
     * Add a server configuration
     */
    addServer(config: MCPServerConfig): void {
        this.connections.set(config.id, {
            config,
            process: null,
            tools: [],
            resources: [],
            prompts: [],
            status: 'disconnected',
        });
        this.emit('server:added', config);
    }

    /**
     * Remove a server
     */
    async removeServer(id: string): Promise<void> {
        await this.disconnect(id);
        this.connections.delete(id);
        this.emit('server:removed', id);
    }

    /**
     * Connect to an MCP server
     */
    async connect(serverId: string): Promise<boolean> {
        const connection = this.connections.get(serverId);
        if (!connection) {
            throw new Error(`Server not found: ${serverId}`);
        }

        if (connection.status === 'connected') {
            return true;
        }

        connection.status = 'connecting';

        try {
            // Spawn the MCP server process
            const proc = spawn(connection.config.command, connection.config.args || [], {
                env: { ...process.env, ...connection.config.env },
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            connection.process = proc;

            // Set up readline for JSON-RPC messages
            const rl = readline.createInterface({ input: proc.stdout! });

            rl.on('line', (line) => {
                try {
                    const message = JSON.parse(line);
                    this.handleMessage(serverId, message);
                } catch (e) {
                    // Ignore non-JSON lines
                }
            });

            proc.stderr!.on('data', (data) => {
                console.error(`[MCP ${serverId}] stderr:`, data.toString());
            });

            proc.on('close', (code) => {
                connection.status = 'disconnected';
                connection.process = null;
                this.emit('server:disconnected', { id: serverId, code });
            });

            proc.on('error', (error) => {
                connection.status = 'error';
                connection.error = error.message;
                this.emit('server:error', { id: serverId, error });
            });

            // Initialize connection
            await this.sendRequest(serverId, 'initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'shadow-ai',
                    version: '1.0.0',
                },
            });

            // Send initialized notification
            this.sendNotification(serverId, 'notifications/initialized', {});

            // Discover available tools
            const toolsResult = await this.sendRequest(serverId, 'tools/list', {});
            connection.tools = toolsResult.tools || [];

            // Discover resources
            try {
                const resourcesResult = await this.sendRequest(serverId, 'resources/list', {});
                connection.resources = resourcesResult.resources || [];
            } catch {
                // Resources not supported
            }

            // Discover prompts
            try {
                const promptsResult = await this.sendRequest(serverId, 'prompts/list', {});
                connection.prompts = promptsResult.prompts || [];
            } catch {
                // Prompts not supported
            }

            connection.status = 'connected';
            this.emit('server:connected', { id: serverId, tools: connection.tools });

            return true;
        } catch (error: any) {
            connection.status = 'error';
            connection.error = error.message;
            this.emit('server:error', { id: serverId, error: error.message });
            return false;
        }
    }

    /**
     * Disconnect from an MCP server
     */
    async disconnect(serverId: string): Promise<void> {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.process) return;

        connection.process.kill();
        connection.process = null;
        connection.status = 'disconnected';
        this.emit('server:disconnected', { id: serverId });
    }

    /**
     * Call a tool on an MCP server
     */
    async callTool(serverId: string, toolName: string, args: any): Promise<any> {
        const connection = this.connections.get(serverId);
        if (!connection || connection.status !== 'connected') {
            throw new Error(`Server not connected: ${serverId}`);
        }

        const result = await this.sendRequest(serverId, 'tools/call', {
            name: toolName,
            arguments: args,
        });

        return result;
    }

    /**
     * Read a resource from an MCP server
     */
    async readResource(serverId: string, uri: string): Promise<any> {
        const connection = this.connections.get(serverId);
        if (!connection || connection.status !== 'connected') {
            throw new Error(`Server not connected: ${serverId}`);
        }

        return await this.sendRequest(serverId, 'resources/read', { uri });
    }

    /**
     * Get a prompt from an MCP server
     */
    async getPrompt(serverId: string, name: string, args?: Record<string, string>): Promise<any> {
        const connection = this.connections.get(serverId);
        if (!connection || connection.status !== 'connected') {
            throw new Error(`Server not connected: ${serverId}`);
        }

        return await this.sendRequest(serverId, 'prompts/get', { name, arguments: args });
    }

    /**
     * Send a JSON-RPC request
     */
    private sendRequest(serverId: string, method: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const connection = this.connections.get(serverId);
            if (!connection || !connection.process) {
                reject(new Error('Not connected'));
                return;
            }

            const id = ++this.requestId;
            this.pendingRequests.set(id, { resolve, reject });

            const request = {
                jsonrpc: '2.0',
                id,
                method,
                params,
            };

            connection.process.stdin!.write(JSON.stringify(request) + '\n');

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Send a JSON-RPC notification
     */
    private sendNotification(serverId: string, method: string, params: any): void {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.process) return;

        const notification = {
            jsonrpc: '2.0',
            method,
            params,
        };

        connection.process.stdin!.write(JSON.stringify(notification) + '\n');
    }

    /**
     * Handle incoming message
     */
    private handleMessage(serverId: string, message: any): void {
        if (message.id !== undefined && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);

            if (message.error) {
                reject(new Error(message.error.message));
            } else {
                resolve(message.result);
            }
        }

        // Handle notifications
        if (message.method && !message.id) {
            this.emit('notification', { serverId, method: message.method, params: message.params });
        }
    }

    /**
     * Get all connected servers
     */
    getServers(): Array<{ id: string; name: string; status: string; tools: MCPTool[] }> {
        return Array.from(this.connections.entries()).map(([id, conn]) => ({
            id,
            name: conn.config.name,
            status: conn.status,
            tools: conn.tools,
        }));
    }

    /**
     * Get all available tools across all connected servers
     */
    getAllTools(): Array<{ serverId: string; tool: MCPTool }> {
        const tools: Array<{ serverId: string; tool: MCPTool }> = [];

        for (const [id, conn] of this.connections) {
            if (conn.status === 'connected') {
                for (const tool of conn.tools) {
                    tools.push({ serverId: id, tool });
                }
            }
        }

        return tools;
    }

    /**
     * Check if a server is connected
     */
    isConnected(serverId: string): boolean {
        const connection = this.connections.get(serverId);
        return connection?.status === 'connected';
    }
}

export default MCPClient;
