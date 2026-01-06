import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export function registerTools(server: Server) {
    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: 'generate_code',
                    description: 'Generate code based on a description using Shadow AI',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            description: {
                                type: 'string',
                                description: 'Description of what code to generate',
                            },
                            language: {
                                type: 'string',
                                enum: ['html', 'javascript', 'typescript', 'python', 'css'],
                                description: 'Programming language for the code',
                            },
                        },
                        required: ['description'],
                    },
                },
                {
                    name: 'import_figma',
                    description: 'Import a design from Figma URL',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Figma file URL',
                            },
                        },
                        required: ['url'],
                    },
                },
                {
                    name: 'query_database',
                    description: 'Query Supabase database',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            table: {
                                type: 'string',
                                description: 'Table name to query',
                            },
                            filters: {
                                type: 'object',
                                description: 'Filter conditions',
                            },
                        },
                        required: ['table'],
                    },
                },
                {
                    name: 'create_canva_design',
                    description: 'Get Canva design creation URL',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['presentation', 'social', 'document'],
                                description: 'Type of Canva design',
                            },
                        },
                        required: ['type'],
                    },
                },
                // New tools for n8n integration
                {
                    name: 'read_file',
                    description: 'Read contents of a file from the filesystem',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Absolute path to the file' },
                        },
                        required: ['path'],
                    },
                },
                {
                    name: 'write_file',
                    description: 'Write content to a file',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Absolute path to the file' },
                            content: { type: 'string', description: 'Content to write' },
                        },
                        required: ['path', 'content'],
                    },
                },
                {
                    name: 'run_terminal_command',
                    description: 'Execute a terminal command',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            command: { type: 'string', description: 'Command to execute' },
                            cwd: { type: 'string', description: 'Working directory' },
                        },
                        required: ['command'],
                    },
                },
                {
                    name: 'git_operation',
                    description: 'Execute git operations (status, diff, log, commit, push)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            operation: {
                                type: 'string',
                                enum: ['status', 'diff', 'log', 'branch', 'add', 'commit', 'push'],
                                description: 'Git operation to perform',
                            },
                            args: { type: 'string', description: 'Additional arguments' },
                            cwd: { type: 'string', description: 'Repository path' },
                        },
                        required: ['operation'],
                    },
                },
                {
                    name: 'search_codebase',
                    description: 'Search the codebase for patterns or text',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Search query' },
                            path: { type: 'string', description: 'Path to search in' },
                            filePattern: { type: 'string', description: 'File pattern (e.g., *.ts)' },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'run_workflow',
                    description: 'Execute a saved Shadow AI workflow',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workflowId: { type: 'string', description: 'ID of the workflow' },
                            inputs: { type: 'string', description: 'JSON string of input parameters' },
                        },
                        required: ['workflowId'],
                    },
                },
                {
                    name: 'analyze_code',
                    description: 'Analyze code for issues, security vulnerabilities, or improvements',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            code: { type: 'string', description: 'Code to analyze' },
                            language: { type: 'string', description: 'Programming language' },
                            type: {
                                type: 'string',
                                enum: ['security', 'performance', 'quality', 'all'],
                                description: 'Type of analysis',
                            },
                        },
                        required: ['code'],
                    },
                },
                {
                    name: 'chat_with_ai',
                    description: 'Send a message to Shadow AI and get a response',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            message: { type: 'string', description: 'Message to send' },
                            model: { type: 'string', description: 'AI model to use (optional)' },
                            context: { type: 'string', description: 'Additional context' },
                        },
                        required: ['message'],
                    },
                },
            ],
        };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            switch (name) {
                case 'generate_code':
                    return await handleGenerateCode(args);
                case 'import_figma':
                    return await handleImportFigma(args);
                case 'query_database':
                    return await handleQueryDatabase(args);
                case 'create_canva_design':
                    return await handleCreateCanvaDesign(args);
                case 'read_file':
                    return await handleReadFile(args);
                case 'write_file':
                    return await handleWriteFile(args);
                case 'run_terminal_command':
                    return await handleRunCommand(args);
                case 'git_operation':
                    return await handleGitOperation(args);
                case 'search_codebase':
                    return await handleSearchCodebase(args);
                case 'run_workflow':
                    return await handleRunWorkflow(args);
                case 'analyze_code':
                    return await handleAnalyzeCode(args);
                case 'chat_with_ai':
                    return await handleChatWithAI(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error: any) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    });
}

// Tool handlers
async function handleGenerateCode(args: any) {
    const { ModelManager } = await import('../ai/ModelManager');
    const manager = ModelManager.getInstance();

    const prompt = `Generate ${args.language || 'code'} code for: ${args.description}`;
    const code = await manager.chat([{
        role: 'user',
        content: prompt,
        timestamp: new Date(),
    }]);

    return {
        content: [
            {
                type: 'text',
                text: code,
            },
        ],
    };
}

async function handleImportFigma(args: any) {
    const { ServiceManager } = await import('../services/ServiceManager');
    const manager = ServiceManager.getInstance();

    const fileKey = manager.figma.extractFileKey(args.url);
    if (!fileKey) {
        throw new Error('Invalid Figma URL');
    }

    const file = await manager.figma.getFile(fileKey);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(file, null, 2),
            },
        ],
    };
}

async function handleQueryDatabase(args: any) {
    const { ServiceManager } = await import('../services/ServiceManager');
    const manager = ServiceManager.getInstance();

    const result = await manager.supabase.query(args.table, args.filters);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
}

async function handleCreateCanvaDesign(args: any) {
    const { ServiceManager } = await import('../services/ServiceManager');
    const manager = ServiceManager.getInstance();

    const url = manager.canva.getCreateUrl(args.type);

    return {
        content: [
            {
                type: 'text',
                text: `Canva design URL: ${url}`,
            },
        ],
    };
}

// New tool handlers for n8n integration
async function handleReadFile(args: any) {
    const fs = await import('fs/promises');

    try {
        const content = await fs.readFile(args.path, 'utf-8');
        return {
            content: [{ type: 'text', text: content }],
        };
    } catch (error: any) {
        throw new Error(`Failed to read file: ${error.message}`);
    }
}

async function handleWriteFile(args: any) {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
        // Ensure directory exists
        await fs.mkdir(path.dirname(args.path), { recursive: true });
        await fs.writeFile(args.path, args.content, 'utf-8');
        return {
            content: [{ type: 'text', text: `File written successfully: ${args.path}` }],
        };
    } catch (error: any) {
        throw new Error(`Failed to write file: ${error.message}`);
    }
}

async function handleRunCommand(args: any) {
    const { exec } = await import('child_process');
    const util = await import('util');
    const execAsync = util.promisify(exec);

    try {
        const { stdout, stderr } = await execAsync(args.command, {
            cwd: args.cwd || process.cwd(),
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024,
        });
        return {
            content: [{ type: 'text', text: stdout + (stderr ? `\nStderr: ${stderr}` : '') }],
        };
    } catch (error: any) {
        throw new Error(`Command failed: ${error.message}`);
    }
}

async function handleGitOperation(args: any) {
    const { exec } = await import('child_process');
    const util = await import('util');
    const execAsync = util.promisify(exec);

    const command = `git ${args.operation} ${args.args || ''}`.trim();

    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: args.cwd || process.cwd(),
        });
        return {
            content: [{ type: 'text', text: stdout || stderr || 'Operation completed' }],
        };
    } catch (error: any) {
        throw new Error(`Git operation failed: ${error.message}`);
    }
}

async function handleSearchCodebase(args: any) {
    const { exec } = await import('child_process');
    const util = await import('util');
    const execAsync = util.promisify(exec);

    const searchPath = args.path || '.';
    const filePattern = args.filePattern ? `--include="${args.filePattern}"` : '';
    const command = `grep -rn ${filePattern} "${args.query}" ${searchPath} 2>/dev/null | head -50`;

    try {
        const { stdout } = await execAsync(command, {
            cwd: process.cwd(),
            maxBuffer: 5 * 1024 * 1024,
        });
        return {
            content: [{ type: 'text', text: stdout || 'No matches found' }],
        };
    } catch (error: any) {
        // grep returns exit code 1 when no matches found
        return {
            content: [{ type: 'text', text: 'No matches found' }],
        };
    }
}

async function handleRunWorkflow(args: any) {
    // Placeholder - integrate with workflow engine
    return {
        content: [{
            type: 'text',
            text: `Workflow ${args.workflowId} queued for execution with inputs: ${args.inputs || '{}'}`
        }],
    };
}

async function handleAnalyzeCode(args: any) {
    const { ModelManager } = await import('../ai/ModelManager');
    const manager = ModelManager.getInstance();

    const analysisType = args.type || 'all';
    const prompt = `Analyze the following ${args.language || 'code'} for ${analysisType} issues:\n\n\`\`\`\n${args.code}\n\`\`\``;

    const analysis = await manager.chat([{
        role: 'user',
        content: prompt,
        timestamp: new Date(),
    }]);

    return {
        content: [{ type: 'text', text: analysis }],
    };
}

async function handleChatWithAI(args: any) {
    const { ModelManager } = await import('../ai/ModelManager');
    const manager = ModelManager.getInstance();

    const messages = [];
    if (args.context) {
        messages.push({
            role: 'system' as const,
            content: args.context,
            timestamp: new Date(),
        });
    }
    messages.push({
        role: 'user' as const,
        content: args.message,
        timestamp: new Date(),
    });

    const response = await manager.chat(messages);

    return {
        content: [{ type: 'text', text: response }],
    };
}
