/**
 * Ethereal Selection Sort
 */
import { EventEmitter } from 'events';
export class EtherealSelectionSort extends EventEmitter {
    private static instance: EtherealSelectionSort;
    private constructor() { super(); }
    static getInstance(): EtherealSelectionSort { if (!EtherealSelectionSort.instance) { EtherealSelectionSort.instance = new EtherealSelectionSort(); } return EtherealSelectionSort.instance; }
    sort(arr: number[]): number[] { const a = [...arr]; for (let i = 0; i < a.length - 1; i++) { let minIdx = i; for (let j = i + 1; j < a.length; j++) if (a[j] < a[minIdx]) minIdx = j;[a[i], a[minIdx]] = [a[minIdx], a[i]]; } return a; }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const etherealSelectionSort = EtherealSelectionSort.getInstance();
