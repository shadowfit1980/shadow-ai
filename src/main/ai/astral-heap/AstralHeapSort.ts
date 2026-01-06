/**
 * Astral Heap Sort
 */
import { EventEmitter } from 'events';
export class AstralHeapSort extends EventEmitter {
    private static instance: AstralHeapSort;
    private constructor() { super(); }
    static getInstance(): AstralHeapSort { if (!AstralHeapSort.instance) { AstralHeapSort.instance = new AstralHeapSort(); } return AstralHeapSort.instance; }
    sort(arr: number[]): number[] { const n = arr.length; const a = [...arr]; for (let i = Math.floor(n / 2) - 1; i >= 0; i--) this.heapify(a, n, i); for (let i = n - 1; i > 0; i--) { [a[0], a[i]] = [a[i], a[0]]; this.heapify(a, i, 0); } return a; }
    private heapify(arr: number[], n: number, i: number): void { let largest = i; const left = 2 * i + 1, right = 2 * i + 2; if (left < n && arr[left] > arr[largest]) largest = left; if (right < n && arr[right] > arr[largest]) largest = right; if (largest !== i) { [arr[i], arr[largest]] = [arr[largest], arr[i]]; this.heapify(arr, n, largest); } }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const astralHeapSort = AstralHeapSort.getInstance();
