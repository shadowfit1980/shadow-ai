/**
 * Quantum Channel
 */
import { EventEmitter } from 'events';
export class QuantumChannel<T> extends EventEmitter {
    private buffer: T[] = [];
    private capacity: number;
    private receivers: ((value: T) => void)[] = [];
    private senders: (() => void)[] = [];
    constructor(capacity: number = 0) { super(); this.capacity = capacity; }
    async send(value: T): Promise<void> { if (this.receivers.length > 0) { const receiver = this.receivers.shift()!; receiver(value); return; } if (this.capacity > 0 && this.buffer.length < this.capacity) { this.buffer.push(value); return; } return new Promise<void>(resolve => { this.buffer.push(value); this.senders.push(resolve); }); }
    async receive(): Promise<T> { if (this.buffer.length > 0) { const value = this.buffer.shift()!; if (this.senders.length > 0) { const sender = this.senders.shift()!; sender(); } return value; } return new Promise<T>(resolve => this.receivers.push(resolve)); }
    close(): void { this.emit('closed'); }
}
export const createChannel = <T>(capacity?: number) => new QuantumChannel<T>(capacity);
