import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export function registerResources(server: Server) {
    // List available resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: 'shadow://code/current',
                    name: 'Current Code',
                    description: 'The code currently being edited in Shadow AI',
                    mimeType: 'text/plain',
                },
                {
                    uri: 'shadow://chat/history',
                    name: 'Chat History',
                    description: 'Complete chat conversation history',
                    mimeType: 'application/json',
                },
                {
                    uri: 'shadow://services/status',
                    name: 'Services Status',
                    description: 'Status of external services (Canva, Supabase, Figma)',
                    mimeType: 'application/json',
                },
            ],
        };
    });

    // Handle resource reads
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;

        try {
            switch (uri) {
                case 'shadow://code/current':
                    return await readCurrentCode();
                case 'shadow://chat/history':
                    return await readChatHistory();
                case 'shadow://services/status':
                    return await readServicesStatus();
                default:
                    throw new Error(`Unknown resource: ${uri}`);
            }
        } catch (error: any) {
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'text/plain',
                        text: `Error: ${error.message}`,
                    },
                ],
            };
        }
    });
}

// Resource readers
async function readCurrentCode() {
    // In a real implementation, this would read from app state
    // For now, return a placeholder
    return {
        contents: [
            {
                uri: 'shadow://code/current',
                mimeType: 'text/plain',
                text: '// Current code would be retrieved from app state\n// This is a placeholder',
            },
        ],
    };
}

async function readChatHistory() {
    // In a real implementation, this would read from app state
    return {
        contents: [
            {
                uri: 'shadow://chat/history',
                mimeType: 'application/json',
                text: JSON.stringify({
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                }, null, 2),
            },
        ],
    };
}

async function readServicesStatus() {
    const { ServiceManager } = await import('../services/ServiceManager');
    const manager = ServiceManager.getInstance();
    const status = manager.getServicesStatus();

    return {
        contents: [
            {
                uri: 'shadow://services/status',
                mimeType: 'application/json',
                text: JSON.stringify(status, null, 2),
            },
        ],
    };
}
