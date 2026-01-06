import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentationConfig {
    format: 'markdown' | 'jsdoc' | 'typedoc' | 'readme';
    includeToc: boolean;
    includeExamples: boolean;
    includeTypes: boolean;
    includeChangelog: boolean;
}

interface GeneratedDoc {
    id: string;
    title: string;
    format: string;
    content: string;
    createdAt: Date;
}

export default function DocumentationGenerator() {
    const [inputCode, setInputCode] = useState(`// Example function to document
export async function fetchUserData(userId: string, options?: {
    includeProfile?: boolean;
    includeSettings?: boolean;
}): Promise<User> {
    const response = await api.get(\`/users/\${userId}\`, { params: options });
    return response.data;
}

export class UserService {
    private cache: Map<string, User> = new Map();
    
    async getUser(id: string): Promise<User | null> {
        if (this.cache.has(id)) {
            return this.cache.get(id)!;
        }
        const user = await fetchUserData(id);
        this.cache.set(id, user);
        return user;
    }
    
    clearCache(): void {
        this.cache.clear();
    }
}`);

    const [config, setConfig] = useState<DocumentationConfig>({
        format: 'markdown',
        includeToc: true,
        includeExamples: true,
        includeTypes: true,
        includeChangelog: false
    });

    const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeDoc, setActiveDoc] = useState<GeneratedDoc | null>(null);

    const generateDocumentation = async () => {
        setIsGenerating(true);

        // Simulate AI generation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        let content = '';

        switch (config.format) {
            case 'markdown':
                content = generateMarkdownDoc(inputCode, config);
                break;
            case 'jsdoc':
                content = generateJSDocDoc(inputCode);
                break;
            case 'typedoc':
                content = generateTypeDocDoc(inputCode);
                break;
            case 'readme':
                content = generateReadmeDoc(inputCode, config);
                break;
        }

        const newDoc: GeneratedDoc = {
            id: Math.random().toString(36).substr(2, 9),
            title: `Documentation - ${config.format.toUpperCase()}`,
            format: config.format,
            content,
            createdAt: new Date()
        };

        setGeneratedDocs(prev => [newDoc, ...prev]);
        setActiveDoc(newDoc);
        setIsGenerating(false);
    };

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>📚</span>
                        <span>Documentation Generator</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Auto-generate docs from code</p>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={config.format}
                        onChange={e => setConfig({ ...config, format: e.target.value as any })}
                        className="cyber-input text-sm"
                    >
                        <option value="markdown">Markdown</option>
                        <option value="jsdoc">JSDoc</option>
                        <option value="typedoc">TypeDoc</option>
                        <option value="readme">README</option>
                    </select>
                    <button
                        onClick={generateDocumentation}
                        disabled={isGenerating || !inputCode.trim()}
                        className="cyber-button text-sm disabled:opacity-50"
                    >
                        {isGenerating ? '⏳ Generating...' : '⚡ Generate'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-1/2 border-r border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-medium text-gray-300">Input Code</h3>
                    </div>
                    <textarea
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value)}
                        placeholder="Paste your code here..."
                        className="flex-1 p-4 bg-gray-900 text-gray-300 font-mono text-sm resize-none focus:outline-none"
                        spellCheck={false}
                    />

                    {/* Options */}
                    <div className="p-3 border-t border-gray-700">
                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.includeToc}
                                    onChange={e => setConfig({ ...config, includeToc: e.target.checked })}
                                    className="form-checkbox"
                                />
                                <span className="text-xs text-gray-400">Table of Contents</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.includeExamples}
                                    onChange={e => setConfig({ ...config, includeExamples: e.target.checked })}
                                    className="form-checkbox"
                                />
                                <span className="text-xs text-gray-400">Examples</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.includeTypes}
                                    onChange={e => setConfig({ ...config, includeTypes: e.target.checked })}
                                    className="form-checkbox"
                                />
                                <span className="text-xs text-gray-400">Type Info</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-300">Generated Documentation</h3>
                        {activeDoc && (
                            <button
                                onClick={() => navigator.clipboard.writeText(activeDoc.content)}
                                className="text-xs text-neon-cyan hover:underline"
                            >
                                📋 Copy
                            </button>
                        )}
                    </div>

                    {activeDoc ? (
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                {activeDoc.content}
                            </pre>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-4xl mb-4">📚</div>
                                <p>Generate documentation to see it here</p>
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {generatedDocs.length > 0 && (
                        <div className="p-3 border-t border-gray-700">
                            <p className="text-xs text-gray-500 mb-2">History ({generatedDocs.length})</p>
                            <div className="flex space-x-2 overflow-x-auto">
                                {generatedDocs.slice(0, 5).map(doc => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setActiveDoc(doc)}
                                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${activeDoc?.id === doc.id
                                                ? 'bg-neon-cyan/20 text-neon-cyan'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        {doc.format.toUpperCase()} - {doc.createdAt.toLocaleTimeString()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Documentation generators
function generateMarkdownDoc(code: string, config: DocumentationConfig): string {
    let doc = '# API Documentation\n\n';

    if (config.includeToc) {
        doc += '## Table of Contents\n\n';
        doc += '- [Functions](#functions)\n';
        doc += '- [Classes](#classes)\n';
        if (config.includeTypes) doc += '- [Types](#types)\n';
        doc += '\n---\n\n';
    }

    doc += '## Functions\n\n';
    doc += '### `fetchUserData`\n\n';
    doc += 'Fetches user data from the API.\n\n';

    if (config.includeTypes) {
        doc += '**Parameters:**\n';
        doc += '| Name | Type | Description |\n';
        doc += '|------|------|-------------|\n';
        doc += '| `userId` | `string` | The ID of the user to fetch |\n';
        doc += '| `options` | `object` | Optional configuration |\n';
        doc += '| `options.includeProfile` | `boolean` | Include user profile data |\n';
        doc += '| `options.includeSettings` | `boolean` | Include user settings |\n\n';
        doc += '**Returns:** `Promise<User>`\n\n';
    }

    if (config.includeExamples) {
        doc += '**Example:**\n';
        doc += '```typescript\n';
        doc += 'const user = await fetchUserData("user-123", {\n';
        doc += '  includeProfile: true,\n';
        doc += '  includeSettings: false\n';
        doc += '});\n';
        doc += '```\n\n';
    }

    doc += '---\n\n';
    doc += '## Classes\n\n';
    doc += '### `UserService`\n\n';
    doc += 'Service for managing user data with caching.\n\n';
    doc += '#### Methods\n\n';
    doc += '##### `getUser(id: string): Promise<User | null>`\n\n';
    doc += 'Gets a user by ID, using cache if available.\n\n';
    doc += '##### `clearCache(): void`\n\n';
    doc += 'Clears the user cache.\n\n';

    return doc;
}

function generateJSDocDoc(code: string): string {
    return `/**
 * Fetches user data from the API
 * 
 * @async
 * @function fetchUserData
 * @param {string} userId - The ID of the user to fetch
 * @param {Object} [options] - Optional configuration
 * @param {boolean} [options.includeProfile] - Include user profile data
 * @param {boolean} [options.includeSettings] - Include user settings
 * @returns {Promise<User>} The user data
 * @throws {Error} If the user is not found
 * 
 * @example
 * const user = await fetchUserData("user-123", { includeProfile: true });
 */

/**
 * Service for managing user data with caching
 * 
 * @class UserService
 * @description Provides methods to get and cache user data
 */

/**
 * Gets a user by ID
 * 
 * @method getUser
 * @memberof UserService
 * @param {string} id - The user ID
 * @returns {Promise<User|null>} The user or null if not found
 */

/**
 * Clears the user cache
 * 
 * @method clearCache
 * @memberof UserService
 * @returns {void}
 */`;
}

function generateTypeDocDoc(code: string): string {
    return `/**
 * @module UserModule
 * @description User management functionality
 */

/**
 * Fetches user data from the API
 * 
 * @remarks
 * This function makes an API call to retrieve user data.
 * Results can be customized using the options parameter.
 * 
 * @param userId - The ID of the user to fetch
 * @param options - Optional configuration object
 * @returns A promise that resolves to the user data
 * 
 * @public
 */
export async function fetchUserData(
    userId: string,
    options?: FetchUserOptions
): Promise<User>;

/**
 * Options for fetching user data
 * 
 * @interface FetchUserOptions
 * @public
 */
interface FetchUserOptions {
    /** Include user profile data */
    includeProfile?: boolean;
    /** Include user settings */
    includeSettings?: boolean;
}

/**
 * Service for managing user data with caching
 * 
 * @remarks
 * This service maintains an in-memory cache of user data
 * to reduce API calls.
 * 
 * @public
 */
export class UserService {
    /**
     * Gets a user by ID, using cache if available
     * @param id - The user ID
     * @returns The user or null if not found
     */
    async getUser(id: string): Promise<User | null>;

    /**
     * Clears the user cache
     */
    clearCache(): void;
}`;
}

function generateReadmeDoc(code: string, config: DocumentationConfig): string {
    let readme = '# User Module\n\n';
    readme += '> User management with caching support\n\n';
    readme += '## Installation\n\n';
    readme += '```bash\nnpm install user-module\n```\n\n';
    readme += '## Usage\n\n';
    readme += '```typescript\nimport { fetchUserData, UserService } from \'user-module\';\n\n';
    readme += '// Fetch a single user\n';
    readme += 'const user = await fetchUserData("user-123");\n\n';
    readme += '// Use the service with caching\n';
    readme += 'const service = new UserService();\n';
    readme += 'const cachedUser = await service.getUser("user-123");\n```\n\n';
    readme += '## API Reference\n\n';
    readme += '### `fetchUserData(userId, options?)`\n\n';
    readme += 'Fetches user data from the API.\n\n';
    readme += '### `UserService`\n\n';
    readme += '| Method | Description |\n';
    readme += '|--------|-------------|\n';
    readme += '| `getUser(id)` | Gets user by ID with caching |\n';
    readme += '| `clearCache()` | Clears the user cache |\n\n';
    readme += '## License\n\n';
    readme += 'MIT\n';

    return readme;
}
