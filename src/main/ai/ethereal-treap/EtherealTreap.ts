/**
 * Ethereal Treap
 */
import { EventEmitter } from 'events';
export class EtherealTreap extends EventEmitter {
    private static instance: EtherealTreap;
    private data: Map<number, { value: unknown; priority: number }> = new Map();
    private constructor() { super(); }
    static getInstance(): EtherealTreap { if (!EtherealTreap.instance) { EtherealTreap.instance = new EtherealTreap(); } return EtherealTreap.instance; }
    insert(key: number, value: unknown): void { this.data.set(key, { value, priority: Math.random() }); }
    get(key: number): unknown | undefined { return this.data.get(key)?.value; }
    getStats(): { size: number } { return { size: this.data.size }; }
}
export const etherealTreap = EtherealTreap.getInstance();
