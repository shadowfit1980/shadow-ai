/**
 * Mystic Cheapest Flights
 */
import { EventEmitter } from 'events';
export class MysticCheapestFlights extends EventEmitter {
    private static instance: MysticCheapestFlights;
    private constructor() { super(); }
    static getInstance(): MysticCheapestFlights { if (!MysticCheapestFlights.instance) { MysticCheapestFlights.instance = new MysticCheapestFlights(); } return MysticCheapestFlights.instance; }
    findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number { let prices = new Array(n).fill(Infinity); prices[src] = 0; for (let i = 0; i <= k; i++) { const temp = [...prices]; for (const [from, to, price] of flights) if (prices[from] !== Infinity) temp[to] = Math.min(temp[to], prices[from] + price); prices = temp; } return prices[dst] === Infinity ? -1 : prices[dst]; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const mysticCheapestFlights = MysticCheapestFlights.getInstance();
