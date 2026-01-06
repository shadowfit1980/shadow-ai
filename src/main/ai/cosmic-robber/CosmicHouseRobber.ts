/**
 * Cosmic House Robber
 */
import { EventEmitter } from 'events';
export class CosmicHouseRobber extends EventEmitter {
    private static instance: CosmicHouseRobber;
    private constructor() { super(); }
    static getInstance(): CosmicHouseRobber { if (!CosmicHouseRobber.instance) { CosmicHouseRobber.instance = new CosmicHouseRobber(); } return CosmicHouseRobber.instance; }
    maxRob(houses: number[]): number { if (houses.length === 0) return 0; if (houses.length === 1) return houses[0]; let prev1 = 0, prev2 = 0; for (const h of houses) { const curr = Math.max(prev1, prev2 + h); prev2 = prev1; prev1 = curr; } return prev1; }
    getStats(): { solves: number } { return { solves: 0 }; }
}
export const cosmicHouseRobber = CosmicHouseRobber.getInstance();
