/**
 * Command Palette - Quick actions
 */
import { EventEmitter } from 'events';

export interface Command { id: string; title: string; category: string; shortcut?: string; handler: () => Promise<void> | void; }
export interface CommandExecution { commandId: string; timestamp: number; success: boolean; }

export class CommandPaletteEngine extends EventEmitter {
    private static instance: CommandPaletteEngine;
    private commands: Map<string, Command> = new Map();
    private history: CommandExecution[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): CommandPaletteEngine { if (!CommandPaletteEngine.instance) CommandPaletteEngine.instance = new CommandPaletteEngine(); return CommandPaletteEngine.instance; }

    private initDefaults(): void {
        const defaults: Omit<Command, 'handler'>[] = [
            { id: 'file.new', title: 'New File', category: 'File', shortcut: 'Cmd+N' },
            { id: 'file.save', title: 'Save', category: 'File', shortcut: 'Cmd+S' },
            { id: 'ai.chat', title: 'Open AI Chat', category: 'AI', shortcut: 'Cmd+L' },
            { id: 'ai.build', title: 'Start Builder Mode', category: 'AI', shortcut: 'Cmd+Shift+B' },
            { id: 'search.files', title: 'Search Files', category: 'Search', shortcut: 'Cmd+P' },
            { id: 'search.symbols', title: 'Search Symbols', category: 'Search', shortcut: 'Cmd+Shift+O' }
        ];
        defaults.forEach(d => this.commands.set(d.id, { ...d, handler: async () => { } }));
    }

    register(command: Command): void { this.commands.set(command.id, command); this.emit('registered', command.id); }
    async execute(commandId: string): Promise<boolean> { const cmd = this.commands.get(commandId); if (!cmd) return false; try { await cmd.handler(); this.history.push({ commandId, timestamp: Date.now(), success: true }); this.emit('executed', commandId); return true; } catch { this.history.push({ commandId, timestamp: Date.now(), success: false }); return false; } }
    search(query: string): Command[] { const q = query.toLowerCase(); return Array.from(this.commands.values()).filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)).slice(0, 15); }
    getByCategory(category: string): Command[] { return Array.from(this.commands.values()).filter(c => c.category === category); }
    getRecent(limit = 10): CommandExecution[] { return this.history.slice(-limit); }
}
export function getCommandPaletteEngine(): CommandPaletteEngine { return CommandPaletteEngine.getInstance(); }
