/**
 * TODO Tracker - Track TODOs/FIXMEs
 */
import { EventEmitter } from 'events';

export interface TodoItem { id: string; file: string; line: number; type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE'; text: string; author?: string; }

export class TodoTracker extends EventEmitter {
    private static instance: TodoTracker;
    private todos: Map<string, TodoItem[]> = new Map();
    private patterns = [/\/\/\s*(TODO|FIXME|HACK|NOTE):?\s*(.+)/gi, /#\s*(TODO|FIXME|HACK|NOTE):?\s*(.+)/gi];
    private constructor() { super(); }
    static getInstance(): TodoTracker { if (!TodoTracker.instance) TodoTracker.instance = new TodoTracker(); return TodoTracker.instance; }

    scan(file: string, code: string): TodoItem[] {
        const items: TodoItem[] = [];
        const lines = code.split('\n');
        lines.forEach((line, i) => { this.patterns.forEach(pattern => { let match; while ((match = pattern.exec(line)) !== null) { items.push({ id: `todo_${Date.now()}_${items.length}`, file, line: i + 1, type: match[1].toUpperCase() as TodoItem['type'], text: match[2].trim() }); } pattern.lastIndex = 0; }); });
        this.todos.set(file, items); this.emit('scanned', { file, count: items.length }); return items;
    }

    getByFile(file: string): TodoItem[] { return this.todos.get(file) || []; }
    getByType(type: TodoItem['type']): TodoItem[] { return Array.from(this.todos.values()).flat().filter(t => t.type === type); }
    getAll(): TodoItem[] { return Array.from(this.todos.values()).flat(); }
    getStats(): Record<TodoItem['type'], number> { const all = this.getAll(); return { TODO: all.filter(t => t.type === 'TODO').length, FIXME: all.filter(t => t.type === 'FIXME').length, HACK: all.filter(t => t.type === 'HACK').length, NOTE: all.filter(t => t.type === 'NOTE').length }; }
}
export function getTodoTracker(): TodoTracker { return TodoTracker.getInstance(); }
