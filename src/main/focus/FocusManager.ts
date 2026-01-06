/**
 * Focus Manager - Focus management
 */
import { EventEmitter } from 'events';

export interface FocusableElement { id: string; type: string; order: number; }

export class FocusManager extends EventEmitter {
    private static instance: FocusManager;
    private elements: FocusableElement[] = [];
    private currentIndex = -1;
    private constructor() { super(); }
    static getInstance(): FocusManager { if (!FocusManager.instance) FocusManager.instance = new FocusManager(); return FocusManager.instance; }
    register(id: string, type: string, order: number): void { this.elements.push({ id, type, order }); this.elements.sort((a, b) => a.order - b.order); }
    focusNext(): FocusableElement | null { if (this.elements.length === 0) return null; this.currentIndex = (this.currentIndex + 1) % this.elements.length; const el = this.elements[this.currentIndex]; this.emit('focused', el); return el; }
    focusPrevious(): FocusableElement | null { if (this.elements.length === 0) return null; this.currentIndex = (this.currentIndex - 1 + this.elements.length) % this.elements.length; const el = this.elements[this.currentIndex]; this.emit('focused', el); return el; }
    getCurrent(): FocusableElement | null { return this.currentIndex >= 0 ? this.elements[this.currentIndex] : null; }
    getAll(): FocusableElement[] { return [...this.elements]; }
}
export function getFocusManager(): FocusManager { return FocusManager.getInstance(); }
