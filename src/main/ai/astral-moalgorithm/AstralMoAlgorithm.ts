/**
 * Astral Mo's Algorithm
 */
import { EventEmitter } from 'events';
export interface MoQuery { l: number; r: number; idx: number; }
export class AstralMoAlgorithm extends EventEmitter {
    private blockSize: number;
    constructor(n: number) { super(); this.blockSize = Math.ceil(Math.sqrt(n)); }
    processQueries<T>(arr: T[], queries: MoQuery[], add: (idx: number, val: T) => void, remove: (idx: number, val: T) => void, answer: () => number): number[] { const sorted = [...queries].sort((a, b) => { const blockA = Math.floor(a.l / this.blockSize); const blockB = Math.floor(b.l / this.blockSize); if (blockA !== blockB) return blockA - blockB; return blockA % 2 === 0 ? a.r - b.r : b.r - a.r; }); const answers = new Array(queries.length); let curL = 0, curR = -1; for (const q of sorted) { while (curR < q.r) { curR++; add(curR, arr[curR]); } while (curL > q.l) { curL--; add(curL, arr[curL]); } while (curR > q.r) { remove(curR, arr[curR]); curR--; } while (curL < q.l) { remove(curL, arr[curL]); curL++; } answers[q.idx] = answer(); } return answers; }
}
export const createMoAlgorithm = (n: number) => new AstralMoAlgorithm(n);
