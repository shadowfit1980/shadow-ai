/**
 * MCP Tool Orchestrator
 * 
 * Dynamic tool discovery and execution from connected MCP servers.
 * Provides smart routing, capability caching, and execution tracking.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface MCPServer {
    id: string;
    name: string;
    endpoint: string;
    status: 'connected' | 'disconnected' | 'error';
    lastPing: Date;
    capabilities: string[];
}

export interface ToolCapability {
    id: string;
    name: string;
    server: string;
    serverId: string;
    description: string;
    schema: {
        input: Record<string, any>;
        output: Record<string, any>;
    };
    estimatedLatency: number;
    successRate: number;
    lastUsed?: Date;
    usageCount: number;
}

export interface ToolExecutionRequest {
    toolId: string;
    inputs: Record<string, any>;
    context?: Record<string, any>;
    timeout?: number;
}

export interface ToolExecutionResult {
    success: boolean;
    output: any;
    error?: string;
    executionTime: number;
    toolId: string;
    serverId: string;
    timestamp: Date;
}

export interface ToolSelectionCriteria {
    intent: string;
    requiredCapabilities?: string[];
    preferredServer?: string;
    maxLatency?: number;
    minSuccessRate?: number;
}

export interface ToolRouteResult {
    selectedTool: ToolCapability;
    reasoning: string;
    confidence: number;
    alternatives: ToolCapability[];
}

// ============================================================================
// MCP TOOL ORCHESTRATOR
// ============================================================================

export class MCPToolOrchestrator extends EventEmitter {
    private static instance: MCPToolOrchestrator;
    private modelManager: ModelManager;

    // Registry
    private servers: Map<string, MCPServer> = new Map();
    private tools: Map<string, ToolCapability> = new Map();
    private executionHistory: ToolExecutionResult[] = [];

    // Caching
    private toolCacheExpiry = 5 * 60 * 1000; // 5 minutes
    private lastDiscovery: Date | null = null;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
        console.log('[MCPToolOrchestrator] Initialized');
    }

    static getInstance(): MCPToolOrchestrator {
        if (!MCPToolOrchestrator.instance) {
            MCPToolOrchestrator.instance = new MCPToolOrchestrator();
        }
        return MCPToolOrchestrator.instance;
    }

    // ========================================================================
    // SERVER MANAGEMENT
    // ========================================================================

    /**
     * Register an MCP server
     */
    registerServer(server: Omit<MCPServer, 'status' | 'lastPing'>): MCPServer {
        const registered: MCPServer = {
            ...server,
            status: 'disconnected',
            lastPing: new Date()
        };

        this.servers.set(server.id, registered);
        this.emit('server:registered', registered);
        console.log(`[MCPToolOrchestrator] Registered server: ${server.name}`);

        return registered;
    }

    /**
     * Connect to an MCP server and discover tools
     */
    async connectServer(serverId: string): Promise<boolean> {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`Server ${serverId} not found`);
        }

        try {
            // Simulate connection (in production, use actual MCP client)
            server.status = 'connected';
            server.lastPing = new Date();

            // Discover tools from this server
            await this.discoverToolsFromServer(server);

            this.emit('server:connected', server);
            console.log(`[MCPToolOrchestrator] Connected to: ${server.name}`);
            return true;

        } catch (error) {
            server.status = 'error';
            this.emit('server:error', { server, error });
            return false;
        }
    }

    /**
     * Disconnect from an MCP server
     */
    disconnectServer(serverId: string): void {
        const server = this.servers.get(serverId);
        if (server) {
            server.status = 'disconnected';
            // Remove tools from this server
            for (const [toolId, tool] of this.tools.entries()) {
                if (tool.serverId === serverId) {
                    this.tools.delete(toolId);
                }
            }
            this.emit('server:disconnected', server);
        }
    }

    /**
     * Get all registered servers
     */
    getServers(): MCPServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * Get connected servers only
     */
    getConnectedServers(): MCPServer[] {
        return this.getServers().filter(s => s.status === 'connected');
    }

    // ========================================================================
    // TOOL DISCOVERY
    // ========================================================================

    /**
     * Discover tools from all connected servers
     */
    async discoverAllTools(): Promise<ToolCapability[]> {
        console.log('[MCPToolOrchestrator] Discovering tools from all servers...');

        const connectedServers = this.getConnectedServers();
        const allTools: ToolCapability[] = [];

        for (const server of connectedServers) {
            const tools = await this.discoverToolsFromServer(server);
            allTools.push(...tools);
        }

        this.lastDiscovery = new Date();
        console.log(`[MCPToolOrchestrator] Discovered ${allTools.length} tools`);

        return allTools;
    }

    /**
     * Discover tools from a specific server
     */
    private async discoverToolsFromServer(server: MCPServer): Promise<ToolCapability[]> {
        // Simulate tool discovery (in production, use MCP protocol)
        const discoveredTools = this.generateMockTools(server);

        for (const tool of discoveredTools) {
            this.tools.set(tool.id, tool);
        }

        this.emit('tools:discovered', { server, tools: discoveredTools });
        return discoveredTools;
    }

    /**
     * Generate mock tools for demonstration
     */
    private generateMockTools(server: MCPServer): ToolCapability[] {
        const baseTools: Partial<ToolCapability>[] = [
            {
                name: 'file_read',
                description: 'Read contents of a file',
                schema: {
                    input: { path: { type: 'string', required: true } },
                    output: { content: { type: 'string' } }
                },
                estimatedLatency: 50
            },
            {
                name: 'file_write',
                description: 'Write content to a file',
                schema: {
                    input: {
                        path: { type: 'string', required: true },
                        content: { type: 'string', required: true }
                    },
                    output: { success: { type: 'boolean' } }
                },
                estimatedLatency: 100
            },
            {
                name: 'search_files',
                description: 'Search for files matching a pattern',
                schema: {
                    input: {
                        pattern: { type: 'string', required: true },
                        directory: { type: 'string' }
                    },
                    output: { files: { type: 'array' } }
                },
                estimatedLatency: 200
            },
            {
                name: 'execute_command',
                description: 'Execute a shell command',
                schema: {
                    input: {
                        command: { type: 'string', required: true },
                        cwd: { type: 'string' }
                    },
                    output: {
                        stdout: { type: 'string' },
                        stderr: { type: 'string' },
                        exitCode: { type: 'number' }
                    }
                },
                estimatedLatency: 500
            },
            {
                name: 'web_search',
                description: 'Search the web for information',
                schema: {
                    input: { query: { type: 'string', required: true } },
                    output: { results: { type: 'array' } }
                },
                estimatedLatency: 1000
            }
        ];

        return baseTools.map((tool, index) => ({
            id: `${server.id}-${tool.name}`,
            name: tool.name!,
            server: server.name,
            serverId: server.id,
            description: tool.description!,
            schema: tool.schema!,
            estimatedLatency: tool.estimatedLatency!,
            successRate: 0.95 + Math.random() * 0.05,
            usageCount: 0
        }));
    }

    /**
     * Get all available tools
     */
    getTools(): ToolCapability[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tool by ID
     */
    getTool(toolId: string): ToolCapability | undefined {
        return this.tools.get(toolId);
    }

    /**
     * Search tools by name or description
     */
    searchTools(query: string): ToolCapability[] {
        const lower = query.toLowerCase();
        return this.getTools().filter(tool =>
            tool.name.toLowerCase().includes(lower) ||
            tool.description.toLowerCase().includes(lower)
        );
    }

    // ========================================================================
    // SMART TOOL ROUTING
    // ========================================================================

    /**
     * Select the best tool for a given intent
     */
    async selectToolForIntent(criteria: ToolSelectionCriteria): Promise<ToolRouteResult | null> {
        const availableTools = this.getTools();

        if (availableTools.length === 0) {
            return null;
        }

        // Filter by criteria
        let candidates = availableTools.filter(tool => {
            if (criteria.maxLatency && tool.estimatedLatency > criteria.maxLatency) {
                return false;
            }
            if (criteria.minSuccessRate && tool.successRate < criteria.minSuccessRate) {
                return false;
            }
            if (criteria.preferredServer && tool.serverId !== criteria.preferredServer) {
                return false;
            }
            return true;
        });

        if (candidates.length === 0) {
            candidates = availableTools; // Fall back to all tools
        }

        // Use AI to select best tool
        const prompt = `Given the user intent: "${criteria.intent}"

Available tools:
${candidates.map(t => `- ${t.name}: ${t.description} (latency: ${t.estimatedLatency}ms, success: ${(t.successRate * 100).toFixed(1)}%)`).join('\n')}

Select the BEST tool and explain why. Respond in JSON:
\`\`\`json
{
    "selectedTool": "tool_name",
    "reasoning": "why this tool is best",
    "confidence": 0.0-1.0
}
\`\`\``;

        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are a tool selection expert. Pick the most appropriate tool for the task.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            const parsed = this.parseJSON(response);
            const selected = candidates.find(t => t.name === parsed.selectedTool);

            if (selected) {
                return {
                    selectedTool: selected,
                    reasoning: parsed.reasoning || 'Best fit for intent',
                    confidence: parsed.confidence || 0.8,
                    alternatives: candidates.filter(t => t.id !== selected.id).slice(0, 3)
                };
            }
        } catch (error) {
            console.error('[MCPToolOrchestrator] AI selection failed:', error);
        }

        // Fallback: select by keyword matching
        const intentWords = criteria.intent.toLowerCase().split(/\s+/);
        const scored = candidates.map(tool => {
            let score = 0;
            for (const word of intentWords) {
                if (tool.name.includes(word)) score += 2;
                if (tool.description.toLowerCase().includes(word)) score += 1;
            }
            return { tool, score };
        }).sort((a, b) => b.score - a.score);

        return {
            selectedTool: scored[0].tool,
            reasoning: 'Keyword matching fallback',
            confidence: 0.6,
            alternatives: scored.slice(1, 4).map(s => s.tool)
        };
    }

    // ========================================================================
    // TOOL EXECUTION
    // ========================================================================

    /**
     * Execute a tool
     */
    async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
        const startTime = Date.now();
        const tool = this.tools.get(request.toolId);

        if (!tool) {
            return {
                success: false,
                output: null,
                error: `Tool ${request.toolId} not found`,
                executionTime: Date.now() - startTime,
                toolId: request.toolId,
                serverId: 'unknown',
                timestamp: new Date()
            };
        }

        const server = this.servers.get(tool.serverId);
        if (!server || server.status !== 'connected') {
            return {
                success: false,
                output: null,
                error: `Server ${tool.serverId} not connected`,
                executionTime: Date.now() - startTime,
                toolId: request.toolId,
                serverId: tool.serverId,
                timestamp: new Date()
            };
        }

        this.emit('tool:executing', { tool, request });

        try {
            // Simulate tool execution (in production, use actual MCP call)
            await new Promise(resolve => setTimeout(resolve, tool.estimatedLatency));

            const output = this.simulateToolOutput(tool, request.inputs);

            const result: ToolExecutionResult = {
                success: true,
                output,
                executionTime: Date.now() - startTime,
                toolId: request.toolId,
                serverId: tool.serverId,
                timestamp: new Date()
            };

            // Update tool stats
            tool.usageCount++;
            tool.lastUsed = new Date();

            this.executionHistory.push(result);
            this.emit('tool:completed', { tool, result });

            return result;

        } catch (error: any) {
            const result: ToolExecutionResult = {
                success: false,
                output: null,
                error: error.message,
                executionTime: Date.now() - startTime,
                toolId: request.toolId,
                serverId: tool.serverId,
                timestamp: new Date()
            };

            this.executionHistory.push(result);
            this.emit('tool:failed', { tool, result });

            return result;
        }
    }

    /**
     * Execute a tool based on intent (auto-select best tool)
     */
    async executeForIntent(intent: string, context?: any): Promise<ToolExecutionResult | null> {
        const route = await this.selectToolForIntent({ intent });

        if (!route) {
            return null;
        }

        // Extract inputs from intent using AI
        const inputs = await this.extractInputsFromIntent(intent, route.selectedTool);

        return this.execute({
            toolId: route.selectedTool.id,
            inputs,
            context
        });
    }

    /**
     * Extract tool inputs from natural language intent
     */
    private async extractInputsFromIntent(
        intent: string,
        tool: ToolCapability
    ): Promise<Record<string, any>> {
        const requiredParams = Object.entries(tool.schema.input)
            .filter(([_, schema]: [string, any]) => schema.required)
            .map(([name]) => name);

        const prompt = `Extract parameters for the "${tool.name}" tool from this intent.

Intent: "${intent}"

Required parameters: ${requiredParams.join(', ')}
All parameters: ${Object.keys(tool.schema.input).join(', ')}

Respond with JSON containing parameter values:
\`\`\`json
{
    ${Object.keys(tool.schema.input).map(p => `"${p}": "extracted value or null"`).join(',\n    ')}
}
\`\`\``;

        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'Extract parameter values from natural language. Return only valid JSON.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            return this.parseJSON(response);
        } catch {
            return {};
        }
    }

    /**
     * Simulate tool output for demonstration
     */
    private simulateToolOutput(tool: ToolCapability, inputs: Record<string, any>): any {
        switch (tool.name) {
            case 'file_read':
                return { content: `// Contents of ${inputs.path}\nconsole.log('Hello World');` };
            case 'file_write':
                return { success: true, bytesWritten: inputs.content?.length || 0 };
            case 'search_files':
                return { files: ['src/index.ts', 'src/utils.ts', 'package.json'] };
            case 'execute_command':
                return { stdout: 'Command executed successfully', stderr: '', exitCode: 0 };
            case 'web_search':
                return { results: [{ title: 'Result 1', url: 'https://example.com' }] };
            default:
                return { result: 'Operation completed' };
        }
    }

    // ========================================================================
    // ANALYTICS & STATS
    // ========================================================================

    /**
     * Get execution history
     */
    getExecutionHistory(limit = 50): ToolExecutionResult[] {
        return this.executionHistory.slice(-limit);
    }

    /**
     * Get tool usage statistics
     */
    getStats(): {
        totalServers: number;
        connectedServers: number;
        totalTools: number;
        totalExecutions: number;
        successRate: number;
        avgLatency: number;
    } {
        const executions = this.executionHistory;
        const successful = executions.filter(e => e.success);

        return {
            totalServers: this.servers.size,
            connectedServers: this.getConnectedServers().length,
            totalTools: this.tools.size,
            totalExecutions: executions.length,
            successRate: executions.length > 0 ? successful.length / executions.length : 1,
            avgLatency: executions.length > 0
                ? executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length
                : 0
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private parseJSON(text: string): any {
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : text;
            return JSON.parse(jsonStr);
        } catch {
            return {};
        }
    }
}

// Export singleton
export const mcpToolOrchestrator = MCPToolOrchestrator.getInstance();
