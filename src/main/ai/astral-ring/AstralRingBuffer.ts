/**
 * Astral Ring Buffer
 */
import { EventEmitter } from 'events';
export class AstralRingBuffer extends EventEmitter {
    private static instance: AstralRingBuffer;
    private buffer: unknown[] = [];
    private maxSize: number = 1000;
    private constructor() { super(); }
    static getInstance(): AstralRingBuffer { if (!AstralRingBuffer.instance) { AstralRingBuffer.instance = new AstralRingBuffer(); } return AstralRingBuffer.instance; }
    push(item: unknown): void { if (this.buffer.length >= this.maxSize) this.buffer.shift(); this.buffer.push(item); }
    getAll(): unknown[] { return [...this.buffer]; }
    getStats(): { size: number } { return { size: this.buffer.length }; }
}
export const astralRingBuffer = AstralRingBuffer.getInstance();
