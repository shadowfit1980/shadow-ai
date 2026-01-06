/**
 * Custom Commands System
 * Reusable AI prompts like Cursor's custom commands
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CustomCommand {
    id: string;
    name: string;
    description: string;
    prompt: string;
    category: string;
    shortcut?: string;
    model?: string;
    isBuiltIn: boolean;
    createdAt: number;
    usageCount: number;
}

export interface CommandResult {
    commandId: string;
    prompt: string;
    response?: string;
    timestamp: number;
}

/**
 * CustomCommands
 * Manages reusable AI prompt templates
 */
export class CustomCommands extends EventEmitter {
    private static instance: CustomCommands;
    private commands: Map<string, CustomCommand> = new Map();
    private commandHistory: CommandResult[] = [];
    private storePath: string | null = null;

    private constructor() {
        super();
        this.initializeBuiltInCommands();
    }

    static getInstance(): CustomCommands {
        if (!CustomCommands.instance) {
            CustomCommands.instance = new CustomCommands();
        }
        return CustomCommands.instance;
    }

    /**
     * Set storage path for persistence
     */
    setStorePath(storagePath: string): void {
        this.storePath = storagePath;
        this.loadCustomCommands();
    }

    /**
     * Get all commands
     */
    getAllCommands(): CustomCommand[] {
        return Array.from(this.commands.values()).sort((a, b) => b.usageCount - a.usageCount);
    }

    /**
     * Get command by ID
     */
    getCommand(id: string): CustomCommand | null {
        return this.commands.get(id) || null;
    }

    /**
     * Get commands by category
     */
    getByCategory(category: string): CustomCommand[] {
        return Array.from(this.commands.values())
            .filter(c => c.category === category);
    }

    /**
     * Search commands
     */
    searchCommands(query: string): CustomCommand[] {
        const queryLower = query.toLowerCase();
        return Array.from(this.commands.values()).filter(c =>
            c.name.toLowerCase().includes(queryLower) ||
            c.description.toLowerCase().includes(queryLower)
        );
    }

    /**
     * Execute a command
     */
    async executeCommand(
        commandId: string,
        context: { code?: string; file?: string; selection?: string }
    ): Promise<string> {
        const command = this.commands.get(commandId);
        if (!command) {
            throw new Error(`Command not found: ${commandId}`);
        }

        // Build the prompt with context
        let prompt = command.prompt;

        // Replace context variables
        if (context.code) {
            prompt = prompt.replace(/\{\{code\}\}/g, context.code);
        }
        if (context.file) {
            prompt = prompt.replace(/\{\{file\}\}/g, context.file);
        }
        if (context.selection) {
            prompt = prompt.replace(/\{\{selection\}\}/g, context.selection);
        }

        // Update usage count
        command.usageCount++;
        this.emit('commandExecuted', { commandId, prompt });

        // Save history
        this.commandHistory.push({
            commandId,
            prompt,
            timestamp: Date.now(),
        });

        // Save if persistent
        await this.saveCustomCommands();

        return prompt;
    }

    /**
     * Create a custom command
     */
    async createCommand(options: {
        name: string;
        description: string;
        prompt: string;
        category?: string;
        shortcut?: string;
    }): Promise<CustomCommand> {
        const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const command: CustomCommand = {
            id,
            name: options.name,
            description: options.description,
            prompt: options.prompt,
            category: options.category || 'Custom',
            shortcut: options.shortcut,
            isBuiltIn: false,
            createdAt: Date.now(),
            usageCount: 0,
        };

        this.commands.set(id, command);
        await this.saveCustomCommands();

        this.emit('commandCreated', command);
        return command;
    }

    /**
     * Update a command
     */
    async updateCommand(id: string, updates: Partial<CustomCommand>): Promise<CustomCommand | null> {
        const command = this.commands.get(id);
        if (!command || command.isBuiltIn) {
            return null;
        }

        Object.assign(command, updates);
        this.commands.set(id, command);
        await this.saveCustomCommands();

        this.emit('commandUpdated', command);
        return command;
    }

    /**
     * Delete a command
     */
    async deleteCommand(id: string): Promise<boolean> {
        const command = this.commands.get(id);
        if (!command || command.isBuiltIn) {
            return false;
        }

        this.commands.delete(id);
        await this.saveCustomCommands();

        this.emit('commandDeleted', { id });
        return true;
    }

    /**
     * Get command categories
     */
    getCategories(): string[] {
        const categories = new Set<string>();
        for (const command of this.commands.values()) {
            categories.add(command.category);
        }
        return Array.from(categories).sort();
    }

    /**
     * Get command history
     */
    getHistory(limit = 50): CommandResult[] {
        return this.commandHistory.slice(-limit).reverse();
    }

    /**
     * Export commands
     */
    exportCommands(): string {
        const customCommands = Array.from(this.commands.values())
            .filter(c => !c.isBuiltIn);
        return JSON.stringify(customCommands, null, 2);
    }

    /**
     * Import commands
     */
    async importCommands(json: string): Promise<number> {
        const commands = JSON.parse(json) as CustomCommand[];
        let imported = 0;

        for (const cmd of commands) {
            if (!cmd.id || !cmd.name || !cmd.prompt) continue;

            // Generate new ID to avoid conflicts
            const newId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.commands.set(newId, {
                ...cmd,
                id: newId,
                isBuiltIn: false,
                createdAt: Date.now(),
                usageCount: 0,
            });
            imported++;
        }

        await this.saveCustomCommands();
        return imported;
    }

    // Private methods

    private async loadCustomCommands(): Promise<void> {
        if (!this.storePath) return;

        try {
            const filePath = path.join(this.storePath, 'custom-commands.json');
            const content = await fs.readFile(filePath, 'utf-8');
            const commands = JSON.parse(content) as CustomCommand[];

            for (const cmd of commands) {
                if (!cmd.isBuiltIn) {
                    this.commands.set(cmd.id, cmd);
                }
            }
        } catch {
            // File doesn't exist yet
        }
    }

    private async saveCustomCommands(): Promise<void> {
        if (!this.storePath) return;

        try {
            await fs.mkdir(this.storePath, { recursive: true });
            const filePath = path.join(this.storePath, 'custom-commands.json');
            const customCommands = Array.from(this.commands.values())
                .filter(c => !c.isBuiltIn);
            await fs.writeFile(filePath, JSON.stringify(customCommands, null, 2));
        } catch {
            // Ignore save errors
        }
    }

    private initializeBuiltInCommands(): void {
        const builtIn: Omit<CustomCommand, 'id' | 'createdAt' | 'usageCount'>[] = [
            {
                name: 'Explain Code',
                description: 'Explain the selected code in detail',
                prompt: 'Please explain the following code in detail:\n\n```\n{{selection}}\n```\n\nExplain what it does, how it works, and any important patterns or techniques used.',
                category: 'Understanding',
                shortcut: 'Cmd+Shift+E',
                isBuiltIn: true,
            },
            {
                name: 'Refactor',
                description: 'Suggest improvements and refactoring',
                prompt: 'Please review the following code and suggest refactoring improvements:\n\n```\n{{selection}}\n```\n\nFocus on:\n- Code clarity\n- Performance\n- Best practices\n- Error handling',
                category: 'Editing',
                shortcut: 'Cmd+Shift+R',
                isBuiltIn: true,
            },
            {
                name: 'Fix Bug',
                description: 'Find and fix bugs in code',
                prompt: 'Please analyze the following code for bugs and provide fixes:\n\n```\n{{selection}}\n```\n\nIdentify any potential issues including:\n- Logic errors\n- Edge cases\n- Type errors\n- Security vulnerabilities',
                category: 'Debugging',
                shortcut: 'Cmd+Shift+F',
                isBuiltIn: true,
            },
            {
                name: 'Generate Tests',
                description: 'Generate unit tests for code',
                prompt: 'Generate comprehensive unit tests for the following code:\n\n```\n{{selection}}\n```\n\nInclude:\n- Happy path tests\n- Edge cases\n- Error handling\n- Mocking as needed',
                category: 'Testing',
                shortcut: 'Cmd+Shift+T',
                isBuiltIn: true,
            },
            {
                name: 'Add Documentation',
                description: 'Add JSDoc/docstrings to code',
                prompt: 'Add comprehensive documentation to the following code:\n\n```\n{{selection}}\n```\n\nInclude:\n- Function/method descriptions\n- Parameter types and descriptions\n- Return value documentation\n- Usage examples',
                category: 'Documentation',
                isBuiltIn: true,
            },
            {
                name: 'Code Review',
                description: 'Perform a thorough code review',
                prompt: 'Perform a comprehensive code review on:\n\n```\n{{selection}}\n```\n\nCheck for:\n- Code quality\n- Performance issues\n- Security vulnerabilities\n- Best practices\n- Maintainability\n\nProvide specific, actionable feedback.',
                category: 'Review',
                shortcut: 'Cmd+Shift+C',
                isBuiltIn: true,
            },
            {
                name: 'Optimize Performance',
                description: 'Optimize code for better performance',
                prompt: 'Analyze and optimize the following code for performance:\n\n```\n{{selection}}\n```\n\nConsider:\n- Time complexity\n- Space complexity\n- Memory usage\n- Caching opportunities\n- Algorithm improvements',
                category: 'Performance',
                isBuiltIn: true,
            },
            {
                name: 'Convert to TypeScript',
                description: 'Convert JavaScript to TypeScript',
                prompt: 'Convert the following JavaScript code to TypeScript with proper types:\n\n```\n{{selection}}\n```\n\nAdd:\n- Interface definitions\n- Type annotations\n- Generic types where appropriate\n- Strict null checks',
                category: 'Conversion',
                isBuiltIn: true,
            },
            {
                name: 'Create API Endpoint',
                description: 'Generate REST API endpoint',
                prompt: 'Create a REST API endpoint based on this description: {{selection}}\n\nInclude:\n- Route handler\n- Input validation\n- Error handling\n- Response formatting\n- TypeScript types',
                category: 'Generation',
                isBuiltIn: true,
            },
            {
                name: 'SQL to ORM',
                description: 'Convert SQL to ORM queries',
                prompt: 'Convert this SQL query to an ORM query (Prisma/TypeORM/Sequelize):\n\n```sql\n{{selection}}\n```\n\nProvide the ORM equivalent with proper types.',
                category: 'Conversion',
                isBuiltIn: true,
            },
        ];

        for (const cmd of builtIn) {
            const id = cmd.name.toLowerCase().replace(/\s+/g, '-');
            this.commands.set(id, {
                ...cmd,
                id,
                createdAt: 0,
                usageCount: 0,
            });
        }
    }
}

// Singleton getter
export function getCustomCommands(): CustomCommands {
    return CustomCommands.getInstance();
}
