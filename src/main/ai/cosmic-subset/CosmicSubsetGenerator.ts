/**
 * Cosmic Subset Generator
 */
import { EventEmitter } from 'events';
export class CosmicSubsetGenerator extends EventEmitter {
    private static instance: CosmicSubsetGenerator;
    private constructor() { super(); }
    static getInstance(): CosmicSubsetGenerator { if (!CosmicSubsetGenerator.instance) { CosmicSubsetGenerator.instance = new CosmicSubsetGenerator(); } return CosmicSubsetGenerator.instance; }
    subsets<T>(arr: T[]): T[][] { const result: T[][] = [[]]; for (const elem of arr) { const newSubsets = result.map(subset => [...subset, elem]); result.push(...newSubsets); } return result; }
    getStats(): { generated: number } { return { generated: 0 }; }
}
export const cosmicSubsetGenerator = CosmicSubsetGenerator.getInstance();
