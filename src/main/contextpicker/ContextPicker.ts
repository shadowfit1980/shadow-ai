/**
 * Context Picker - @context selection
 */
import { EventEmitter } from 'events';

export interface ContextItem { id: string; type: 'file' | 'folder' | 'symbol' | 'docs' | 'web' | 'image'; path: string; content?: string; selected: boolean; }

export class ContextPicker extends EventEmitter {
    private static instance: ContextPicker;
    private items: Map<string, ContextItem> = new Map();
    private constructor() { super(); }
    static getInstance(): ContextPicker { if (!ContextPicker.instance) ContextPicker.instance = new ContextPicker(); return ContextPicker.instance; }

    add(type: ContextItem['type'], path: string, content?: string): ContextItem { const item: ContextItem = { id: `ctx_${Date.now()}_${this.items.size}`, type, path, content, selected: true }; this.items.set(item.id, item); this.emit('added', item); return item; }
    toggle(itemId: string): boolean { const i = this.items.get(itemId); if (!i) return false; i.selected = !i.selected; return true; }
    remove(itemId: string): boolean { return this.items.delete(itemId); }
    getSelected(): ContextItem[] { return Array.from(this.items.values()).filter(i => i.selected); }
    getByType(type: ContextItem['type']): ContextItem[] { return Array.from(this.items.values()).filter(i => i.type === type); }
    buildContext(): string { return this.getSelected().map(i => `[${i.type}] ${i.path}${i.content ? '\n' + i.content : ''}`).join('\n\n'); }
    clear(): void { this.items.clear(); }
}
export function getContextPicker(): ContextPicker { return ContextPicker.getInstance(); }
