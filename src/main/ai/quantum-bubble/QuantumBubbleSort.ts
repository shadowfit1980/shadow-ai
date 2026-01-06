/**
 * Quantum Bubble Sort
 */
import { EventEmitter } from 'events';
export class QuantumBubbleSort extends EventEmitter {
    private static instance: QuantumBubbleSort;
    private constructor() { super(); }
    static getInstance(): QuantumBubbleSort { if (!QuantumBubbleSort.instance) { QuantumBubbleSort.instance = new QuantumBubbleSort(); } return QuantumBubbleSort.instance; }
    sort(arr: number[]): number[] { const a = [...arr]; for (let i = 0; i < a.length - 1; i++) for (let j = 0; j < a.length - i - 1; j++) if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]]; return a; }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const quantumBubbleSort = QuantumBubbleSort.getInstance();
