/**
 * Dimensional Command
 */
import { EventEmitter } from 'events';
export interface Command { execute(): void; undo(): void; }
export class DimensionalCommandManager extends EventEmitter {
    private static instance: DimensionalCommandManager;
    private history: Command[] = [];
    private future: Command[] = [];
    private constructor() { super(); }
    static getInstance(): DimensionalCommandManager { if (!DimensionalCommandManager.instance) { DimensionalCommandManager.instance = new DimensionalCommandManager(); } return DimensionalCommandManager.instance; }
    execute(cmd: Command): void { cmd.execute(); this.history.push(cmd); this.future = []; }
    undo(): boolean { const cmd = this.history.pop(); if (cmd) { cmd.undo(); this.future.push(cmd); return true; } return false; }
    redo(): boolean { const cmd = this.future.pop(); if (cmd) { cmd.execute(); this.history.push(cmd); return true; } return false; }
    getStats(): { history: number; future: number } { return { history: this.history.length, future: this.future.length }; }
}
export const dimensionalCommandManager = DimensionalCommandManager.getInstance();
