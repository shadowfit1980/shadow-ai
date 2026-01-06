/**
 * Mystic Tim Sort
 */
import { EventEmitter } from 'events';
export class MysticTimSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    private minRun: number = 32;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; const n = result.length; for (let i = 0; i < n; i += this.minRun) { this.insertionSort(result, i, Math.min(i + this.minRun - 1, n - 1)); } for (let size = this.minRun; size < n; size *= 2) { for (let left = 0; left < n; left += 2 * size) { const mid = Math.min(left + size - 1, n - 1); const right = Math.min(left + 2 * size - 1, n - 1); if (mid < right) this.merge(result, left, mid, right); } } return result; }
    private insertionSort(arr: T[], left: number, right: number): void { for (let i = left + 1; i <= right; i++) { const key = arr[i]; let j = i - 1; while (j >= left && this.compare(arr[j], key) > 0) { arr[j + 1] = arr[j]; j--; } arr[j + 1] = key; } }
    private merge(arr: T[], left: number, mid: number, right: number): void { const leftArr = arr.slice(left, mid + 1); const rightArr = arr.slice(mid + 1, right + 1); let i = 0, j = 0, k = left; while (i < leftArr.length && j < rightArr.length) { if (this.compare(leftArr[i], rightArr[j]) <= 0) arr[k++] = leftArr[i++]; else arr[k++] = rightArr[j++]; } while (i < leftArr.length) arr[k++] = leftArr[i++]; while (j < rightArr.length) arr[k++] = rightArr[j++]; }
}
export const createTimSort = <T>(compare?: (a: T, b: T) => number) => new MysticTimSort<T>(compare);
