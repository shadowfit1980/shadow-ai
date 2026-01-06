// MCP Server Types
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface MCPResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}

export interface MCPPrompt {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required?: boolean;
    }>;
}

export interface ToolCallParams {
    name: string;
    arguments: Record<string, any>;
}

export interface ResourceReadParams {
    uri: string;
}

export interface PromptGetParams {
    name: string;
    arguments?: Record<string, string>;
}
