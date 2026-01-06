/**
 * Cursor Manager - Cursor tracking
 */
import { EventEmitter } from 'events';

export interface CursorPosition { file: string; line: number; column: number; timestamp: number; }

export class CursorManager extends EventEmitter {
    private static instance: CursorManager;
    private positions: Map<string, CursorPosition> = new Map();
    private history: CursorPosition[] = [];
    private constructor() { super(); }
    static getInstance(): CursorManager { if (!CursorManager.instance) CursorManager.instance = new CursorManager(); return CursorManager.instance; }

    setPosition(file: string, line: number, column: number): void {
        const pos: CursorPosition = { file, line, column, timestamp: Date.now() };
        this.positions.set(file, pos);
        this.history.push(pos);
        if (this.history.length > 100) this.history.shift();
        this.emit('moved', pos);
    }

    getPosition(file: string): CursorPosition | null { return this.positions.get(file) || null; }
    getHistory(limit = 10): CursorPosition[] { return this.history.slice(-limit); }
    goBack(): CursorPosition | null { return this.history.length > 1 ? this.history[this.history.length - 2] : null; }
    clear(): void { this.positions.clear(); this.history = []; }
}

export function getCursorManager(): CursorManager { return CursorManager.getInstance(); }
