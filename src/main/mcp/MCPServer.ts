import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { registerTools } from './tools.js';
import { registerResources } from './resources.js';
import { registerPrompts } from './prompts.js';

export class ShadowMCPServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'shadow-ai',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {},
                },
            }
        );

        this.setupHandlers();
    }

    private setupHandlers() {
        // Register all tools, resources, and prompts
        registerTools(this.server);
        registerResources(this.server);
        registerPrompts(this.server);

        console.log('✅ MCP Server handlers registered');
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('🚀 Shadow AI MCP Server started on stdio');
    }

    getServer(): Server {
        return this.server;
    }
}

// Main entry point when run standalone
if (require.main === module) {
    const server = new ShadowMCPServer();
    server.start().catch(console.error);
}
