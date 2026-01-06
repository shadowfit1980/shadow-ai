/**
 * Command Registry - Command system
 */
import { EventEmitter } from 'events';

export interface Command { id: string; title: string; category?: string; handler: () => void | Promise<void>; }

export class CommandRegistry extends EventEmitter {
    private static instance: CommandRegistry;
    private commands: Map<string, Command> = new Map();
    private constructor() { super(); }
    static getInstance(): CommandRegistry { if (!CommandRegistry.instance) CommandRegistry.instance = new CommandRegistry(); return CommandRegistry.instance; }

    register(id: string, title: string, handler: () => void | Promise<void>, category?: string): Command {
        const command: Command = { id, title, category, handler };
        this.commands.set(id, command);
        this.emit('registered', command);
        return command;
    }

    async execute(id: string): Promise<boolean> {
        const cmd = this.commands.get(id);
        if (!cmd) return false;
        try { await cmd.handler(); this.emit('executed', cmd); return true; }
        catch (error) { this.emit('error', { command: cmd, error }); return false; }
    }

    getByCategory(cat: string): Command[] { return Array.from(this.commands.values()).filter(c => c.category === cat); }
    search(query: string): Command[] { const q = query.toLowerCase(); return Array.from(this.commands.values()).filter(c => c.title.toLowerCase().includes(q) || c.id.includes(q)); }
    getAll(): Command[] { return Array.from(this.commands.values()); }
}

export function getCommandRegistry(): CommandRegistry { return CommandRegistry.getInstance(); }
