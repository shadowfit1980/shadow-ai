/**
 * Model Context Protocol (MCP) Client
 * 
 * Extensible protocol for connecting external tools and services
 * to the AI agent. Inspired by Windsurf's MCP integration.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface MCPTool {
    name: string;
    description: string;
    parameters: MCPParameter[];
    handler: (params: Record<string, any>) => Promise<MCPResult>;
}

export interface MCPParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required: boolean;
    default?: any;
}

export interface MCPResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface MCPServer {
    name: string;
    url: string;
    tools: MCPTool[];
    connected: boolean;
}

// ============================================================================
// MCP CLIENT
// ============================================================================

export class MCPClient extends EventEmitter {
    private static instance: MCPClient;
    private tools: Map<string, MCPTool> = new Map();
    private servers: Map<string, MCPServer> = new Map();

    private constructor() {
        super();
        this.registerBuiltInTools();
    }

    static getInstance(): MCPClient {
        if (!MCPClient.instance) {
            MCPClient.instance = new MCPClient();
        }
        return MCPClient.instance;
    }

    // ========================================================================
    // TOOL REGISTRATION
    // ========================================================================

    /**
     * Register a tool
     */
    registerTool(tool: MCPTool): void {
        this.tools.set(tool.name, tool);
        this.emit('tool:registered', { name: tool.name });
    }

    /**
     * Unregister a tool
     */
    unregisterTool(name: string): boolean {
        const deleted = this.tools.delete(name);
        if (deleted) this.emit('tool:unregistered', { name });
        return deleted;
    }

    /**
     * Get available tools
     */
    listTools(): MCPTool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tool by name
     */
    getTool(name: string): MCPTool | undefined {
        return this.tools.get(name);
    }

    // ========================================================================
    // TOOL EXECUTION
    // ========================================================================

    /**
     * Execute a tool
     */
    async executeTool(name: string, params: Record<string, any>): Promise<MCPResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            return { success: false, error: `Tool '${name}' not found` };
        }

        // Validate required parameters
        for (const param of tool.parameters) {
            if (param.required && !(param.name in params)) {
                return { success: false, error: `Missing required parameter: ${param.name}` };
            }
        }

        this.emit('tool:executing', { name, params });

        try {
            const result = await tool.handler(params);
            this.emit('tool:executed', { name, result });
            return result;
        } catch (error: any) {
            const result = { success: false, error: error.message };
            this.emit('tool:error', { name, error: error.message });
            return result;
        }
    }

    // ========================================================================
    // BUILT-IN TOOLS
    // ========================================================================

    private registerBuiltInTools(): void {
        // HTTP Request Tool
        this.registerTool({
            name: 'http_request',
            description: 'Make HTTP requests to external APIs',
            parameters: [
                { name: 'url', type: 'string', description: 'Request URL', required: true },
                { name: 'method', type: 'string', description: 'HTTP method', required: false, default: 'GET' },
                { name: 'headers', type: 'object', description: 'Request headers', required: false },
                { name: 'body', type: 'object', description: 'Request body', required: false },
            ],
            handler: async (params) => {
                try {
                    const response = await fetch(params.url, {
                        method: params.method || 'GET',
                        headers: params.headers,
                        body: params.body ? JSON.stringify(params.body) : undefined,
                    });
                    const data = await response.json();
                    return { success: true, data };
                } catch (error: any) {
                    return { success: false, error: error.message };
                }
            },
        });

        // Database Query Tool
        this.registerTool({
            name: 'database_query',
            description: 'Execute database queries (simulated)',
            parameters: [
                { name: 'query', type: 'string', description: 'SQL query', required: true },
                { name: 'connection', type: 'string', description: 'Connection string', required: true },
            ],
            handler: async (params) => {
                // Simulated - would connect to actual database
                return {
                    success: true,
                    data: {
                        message: 'Query executed (simulated)',
                        query: params.query
                    }
                };
            },
        });

        // Shell Command Tool
        this.registerTool({
            name: 'shell_command',
            description: 'Execute shell commands',
            parameters: [
                { name: 'command', type: 'string', description: 'Command to execute', required: true },
                { name: 'cwd', type: 'string', description: 'Working directory', required: false },
            ],
            handler: async (params) => {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);

                try {
                    const { stdout, stderr } = await execAsync(params.command, { cwd: params.cwd });
                    return { success: true, data: { stdout, stderr } };
                } catch (error: any) {
                    return { success: false, error: error.message };
                }
            },
        });

        // File Read Tool
        this.registerTool({
            name: 'read_file',
            description: 'Read file contents',
            parameters: [
                { name: 'path', type: 'string', description: 'File path', required: true },
                { name: 'encoding', type: 'string', description: 'File encoding', required: false, default: 'utf-8' },
            ],
            handler: async (params) => {
                const fs = await import('fs/promises');
                try {
                    const content = await fs.readFile(params.path, params.encoding || 'utf-8');
                    return { success: true, data: { content } };
                } catch (error: any) {
                    return { success: false, error: error.message };
                }
            },
        });

        // File Write Tool
        this.registerTool({
            name: 'write_file',
            description: 'Write content to a file',
            parameters: [
                { name: 'path', type: 'string', description: 'File path', required: true },
                { name: 'content', type: 'string', description: 'Content to write', required: true },
            ],
            handler: async (params) => {
                const fs = await import('fs/promises');
                try {
                    await fs.writeFile(params.path, params.content);
                    return { success: true, data: { path: params.path } };
                } catch (error: any) {
                    return { success: false, error: error.message };
                }
            },
        });
    }

    // ========================================================================
    // SERVER CONNECTIONS
    // ========================================================================

    /**
     * Connect to an MCP server
     */
    async connectServer(name: string, url: string): Promise<boolean> {
        try {
            // Would make actual connection to MCP server
            const server: MCPServer = {
                name,
                url,
                tools: [],
                connected: true,
            };
            this.servers.set(name, server);
            this.emit('server:connected', { name, url });
            return true;
        } catch (error: any) {
            this.emit('server:error', { name, error: error.message });
            return false;
        }
    }

    /**
     * Disconnect from server
     */
    disconnectServer(name: string): boolean {
        const server = this.servers.get(name);
        if (server) {
            server.connected = false;
            this.servers.delete(name);
            this.emit('server:disconnected', { name });
            return true;
        }
        return false;
    }

    /**
     * List connected servers
     */
    listServers(): MCPServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * Generate tool definitions for AI
     */
    getToolDefinitions(): string {
        const tools = this.listTools();
        return tools.map(t =>
            `- ${t.name}: ${t.description}\n  Parameters: ${t.parameters.map(p => p.name).join(', ')}`
        ).join('\n');
    }
}

// Export singleton
export const mcpClient = MCPClient.getInstance();
