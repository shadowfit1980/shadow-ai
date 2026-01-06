/**
 * Stellar State Machine
 * 
 * A state machine aligned with stellar positions,
 * where state transitions follow celestial patterns.
 */

import { EventEmitter } from 'events';

export interface StellarState { id: string; name: string; constellation: string; active: boolean; }
export interface StellarStateMachine { id: string; states: StellarState[]; currentState: string; transitions: number; }

export class StellarStateMachineFactory extends EventEmitter {
    private static instance: StellarStateMachineFactory;
    private machines: Map<string, StellarStateMachine> = new Map();

    private constructor() { super(); }
    static getInstance(): StellarStateMachineFactory {
        if (!StellarStateMachineFactory.instance) { StellarStateMachineFactory.instance = new StellarStateMachineFactory(); }
        return StellarStateMachineFactory.instance;
    }

    create(stateNames: string[]): StellarStateMachine {
        const states = stateNames.map((name, i) => ({
            id: `state_${i}`, name, constellation: ['Orion', 'Cassiopeia', 'Draco'][i % 3], active: i === 0
        }));
        const machine: StellarStateMachine = { id: `machine_${Date.now()}`, states, currentState: states[0]?.id || '', transitions: 0 };
        this.machines.set(machine.id, machine);
        return machine;
    }

    getStats(): { total: number; avgTransitions: number } {
        const machines = Array.from(this.machines.values());
        return { total: machines.length, avgTransitions: machines.length > 0 ? machines.reduce((s, m) => s + m.transitions, 0) / machines.length : 0 };
    }
}

export const stellarStateMachineFactory = StellarStateMachineFactory.getInstance();
