/**
 * Cosmic Reconstruct Itinerary
 */
import { EventEmitter } from 'events';
export class CosmicReconstructItinerary extends EventEmitter {
    private static instance: CosmicReconstructItinerary;
    private constructor() { super(); }
    static getInstance(): CosmicReconstructItinerary { if (!CosmicReconstructItinerary.instance) { CosmicReconstructItinerary.instance = new CosmicReconstructItinerary(); } return CosmicReconstructItinerary.instance; }
    findItinerary(tickets: string[][]): string[] { const graph: Map<string, string[]> = new Map(); for (const [from, to] of tickets) { if (!graph.has(from)) graph.set(from, []); graph.get(from)!.push(to); } for (const dests of graph.values()) dests.sort().reverse(); const result: string[] = []; const dfs = (airport: string): void => { const dests = graph.get(airport); while (dests && dests.length) dfs(dests.pop()!); result.push(airport); }; dfs('JFK'); return result.reverse(); }
}
export const cosmicReconstructItinerary = CosmicReconstructItinerary.getInstance();
