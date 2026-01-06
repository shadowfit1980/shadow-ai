/**
 * Command Palette - Quick actions
 */
import { EventEmitter } from 'events';

export interface Command { id: string; name: string; category: string; shortcut?: string; handler: () => void; }

export class CommandPalette extends EventEmitter {
    private static instance: CommandPalette;
    private commands: Map<string, Command> = new Map();
    private history: string[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): CommandPalette { if (!CommandPalette.instance) CommandPalette.instance = new CommandPalette(); return CommandPalette.instance; }

    private initDefaults(): void {
        const defaults: Omit<Command, 'handler'>[] = [
            { id: 'file.new', name: 'New File', category: 'File', shortcut: 'Cmd+N' },
            { id: 'file.save', name: 'Save', category: 'File', shortcut: 'Cmd+S' },
            { id: 'edit.undo', name: 'Undo', category: 'Edit', shortcut: 'Cmd+Z' },
            { id: 'ai.chat', name: 'Open AI Chat', category: 'AI', shortcut: 'Cmd+L' }
        ];
        defaults.forEach(c => this.commands.set(c.id, { ...c, handler: () => { } }));
    }

    register(id: string, name: string, category: string, handler: () => void, shortcut?: string): void { this.commands.set(id, { id, name, category, shortcut, handler }); }
    execute(commandId: string): boolean { const c = this.commands.get(commandId); if (!c) return false; c.handler(); this.history.push(commandId); this.emit('executed', c); return true; }
    search(query: string): Command[] { const q = query.toLowerCase(); return Array.from(this.commands.values()).filter(c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)); }
    getByCategory(category: string): Command[] { return Array.from(this.commands.values()).filter(c => c.category === category); }
    getRecent(): Command[] { return this.history.slice(-10).reverse().map(id => this.commands.get(id)!).filter(Boolean); }
}
export function getCommandPalette(): CommandPalette { return CommandPalette.getInstance(); }
