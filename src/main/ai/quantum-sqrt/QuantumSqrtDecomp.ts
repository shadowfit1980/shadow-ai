/**
 * Quantum Sqrt Decomposition
 */
import { EventEmitter } from 'events';
export class QuantumSqrtDecomp extends EventEmitter {
    private arr: number[];
    private blocks: number[];
    private blockSize: number;
    private numBlocks: number;
    constructor(arr: number[]) { super(); this.arr = [...arr]; this.blockSize = Math.ceil(Math.sqrt(arr.length)); this.numBlocks = Math.ceil(arr.length / this.blockSize); this.blocks = new Array(this.numBlocks).fill(0); for (let i = 0; i < arr.length; i++) this.blocks[Math.floor(i / this.blockSize)] += arr[i]; }
    update(i: number, val: number): void { const block = Math.floor(i / this.blockSize); this.blocks[block] += val - this.arr[i]; this.arr[i] = val; }
    query(l: number, r: number): number { let sum = 0; const startBlock = Math.floor(l / this.blockSize); const endBlock = Math.floor(r / this.blockSize); if (startBlock === endBlock) { for (let i = l; i <= r; i++) sum += this.arr[i]; } else { for (let i = l; i < (startBlock + 1) * this.blockSize; i++) sum += this.arr[i]; for (let b = startBlock + 1; b < endBlock; b++) sum += this.blocks[b]; for (let i = endBlock * this.blockSize; i <= r; i++) sum += this.arr[i]; } return sum; }
}
export const createSqrtDecomp = (arr: number[]) => new QuantumSqrtDecomp(arr);
