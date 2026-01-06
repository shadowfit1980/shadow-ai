/**
 * Command Palette
 * Quick command execution interface
 */

import { EventEmitter } from 'events';

export interface Command {
    id: string;
    name: string;
    description?: string;
    shortcut?: string;
    category: string;
    handler: () => void | Promise<void>;
}

/**
 * CommandPalette
 * Register and execute commands
 */
export class CommandPalette extends EventEmitter {
    private static instance: CommandPalette;
    private commands: Map<string, Command> = new Map();
    private history: string[] = [];

    private constructor() {
        super();
    }

    static getInstance(): CommandPalette {
        if (!CommandPalette.instance) {
            CommandPalette.instance = new CommandPalette();
        }
        return CommandPalette.instance;
    }

    register(command: Omit<Command, 'handler'> & { handler: () => void | Promise<void> }): void {
        this.commands.set(command.id, command as Command);
        this.emit('commandRegistered', command);
    }

    unregister(id: string): boolean {
        return this.commands.delete(id);
    }

    async execute(id: string): Promise<boolean> {
        const command = this.commands.get(id);
        if (!command) return false;

        try {
            await command.handler();
            this.history.push(id);
            this.emit('commandExecuted', command);
            return true;
        } catch (error) {
            this.emit('commandFailed', { command, error });
            return false;
        }
    }

    search(query: string): Command[] {
        const lower = query.toLowerCase();
        return Array.from(this.commands.values()).filter(
            c => c.name.toLowerCase().includes(lower) || c.description?.toLowerCase().includes(lower)
        );
    }

    getAll(): Command[] {
        return Array.from(this.commands.values());
    }

    getByCategory(category: string): Command[] {
        return Array.from(this.commands.values()).filter(c => c.category === category);
    }

    getHistory(limit = 10): string[] {
        return this.history.slice(-limit).reverse();
    }
}

export function getCommandPalette(): CommandPalette {
    return CommandPalette.getInstance();
}
