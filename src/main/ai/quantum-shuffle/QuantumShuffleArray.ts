/**
 * Quantum Shuffle Array
 */
import { EventEmitter } from 'events';
export class QuantumShuffleArray extends EventEmitter {
    private original: number[];
    constructor(nums: number[]) { super(); this.original = [...nums]; }
    reset(): number[] { return [...this.original]; }
    shuffle(): number[] { const result = [...this.original]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[result[i], result[j]] = [result[j], result[i]]; } return result; }
}
export class RandomSampling extends EventEmitter {
    private static instance: RandomSampling;
    private constructor() { super(); }
    static getInstance(): RandomSampling { if (!RandomSampling.instance) { RandomSampling.instance = new RandomSampling(); } return RandomSampling.instance; }
    reservoirSample<T>(stream: T[], k: number): T[] { const reservoir = stream.slice(0, k); for (let i = k; i < stream.length; i++) { const j = Math.floor(Math.random() * (i + 1)); if (j < k) reservoir[j] = stream[i]; } return reservoir; }
    randomSubset<T>(arr: T[], k: number): T[] { const result = [...arr]; for (let i = 0; i < k; i++) { const j = i + Math.floor(Math.random() * (result.length - i));[result[i], result[j]] = [result[j], result[i]]; } return result.slice(0, k); }
}
export const createShuffleArray = (nums: number[]) => new QuantumShuffleArray(nums);
export const randomSampling = RandomSampling.getInstance();
