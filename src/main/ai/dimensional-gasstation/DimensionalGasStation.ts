/**
 * Dimensional Gas Station
 */
import { EventEmitter } from 'events';
export class DimensionalGasStation extends EventEmitter {
    private static instance: DimensionalGasStation;
    private constructor() { super(); }
    static getInstance(): DimensionalGasStation { if (!DimensionalGasStation.instance) { DimensionalGasStation.instance = new DimensionalGasStation(); } return DimensionalGasStation.instance; }
    canCompleteCircuit(gas: number[], cost: number[]): number { let totalSurplus = 0, currentSurplus = 0, startIdx = 0; for (let i = 0; i < gas.length; i++) { totalSurplus += gas[i] - cost[i]; currentSurplus += gas[i] - cost[i]; if (currentSurplus < 0) { currentSurplus = 0; startIdx = i + 1; } } return totalSurplus >= 0 ? startIdx : -1; }
    minCostToRefuel(target: number, startFuel: number, stations: number[][]): number { stations.sort((a, b) => a[0] - b[0]); const maxHeap: number[] = []; let fuel = startFuel, refuels = 0, idx = 0; let position = 0; while (position + fuel < target) { while (idx < stations.length && stations[idx][0] <= position + fuel) { maxHeap.push(stations[idx][1]); maxHeap.sort((a, b) => b - a); idx++; } if (maxHeap.length === 0) return -1; const refuel = maxHeap.shift()!; fuel += refuel; refuels++; } return refuels; }
}
export const dimensionalGasStation = DimensionalGasStation.getInstance();
