import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export function registerPrompts(server: Server) {
    // List available prompts
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        return {
            prompts: [
                {
                    name: 'create_component',
                    description: 'Create a React component with specified features',
                    arguments: [
                        {
                            name: 'componentName',
                            description: 'Name of the component to create',
                            required: true,
                        },
                        {
                            name: 'features',
                            description: 'Features to include in the component',
                            required: false,
                        },
                    ],
                },
                {
                    name: 'debug_code',
                    description: 'Debug and fix code issues',
                    arguments: [
                        {
                            name: 'code',
                            description: 'Code to debug',
                            required: true,
                        },
                        {
                            name: 'error',
                            description: 'Error message or description',
                            required: false,
                        },
                    ],
                },
                {
                    name: 'optimize_code',
                    description: 'Optimize code for performance',
                    arguments: [
                        {
                            name: 'code',
                            description: 'Code to optimize',
                            required: true,
                        },
                        {
                            name: 'language',
                            description: 'Programming language',
                            required: false,
                        },
                    ],
                },
            ],
        };
    });

    // Handle prompt requests
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        switch (name) {
            case 'create_component':
                return createComponentPrompt(args);
            case 'debug_code':
                return debugCodePrompt(args);
            case 'optimize_code':
                return optimizeCodePrompt(args);
            default:
                throw new Error(`Unknown prompt: ${name}`);
        }
    });
}

// Prompt templates
function createComponentPrompt(args: any) {
    const { componentName, features } = args || {};

    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Create a React component called "${componentName || 'MyComponent'}"${features ? ` with the following features: ${features}` : ''
                        }. Include:\n- TypeScript types\n- Modern styling\n- Responsive design\n- Accessibility features`,
                },
            },
        ],
    };
}

function debugCodePrompt(args: any) {
    const { code, error } = args || {};

    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Debug the following code${error ? ` that produces this error: ${error}` : ''}:\n\n${code || 'No code provided'}\n\nProvide:\n- The bug explanation\n- Fixed code\n- Prevention tips`,
                },
            },
        ],
    };
}

function optimizeCodePrompt(args: any) {
    const { code, language } = args || {};

    return {
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: `Optimize the following ${language || ''} code for performance:\n\n${code || 'No code provided'}\n\nProvide:\n- Performance analysis\n- Optimized version\n- Explanation of improvements`,
                },
            },
        ],
    };
}
