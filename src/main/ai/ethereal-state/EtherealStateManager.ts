/**
 * Ethereal State Manager
 * 
 * Manages state in the ethereal realm, where state exists
 * in superposition until observed.
 */

import { EventEmitter } from 'events';

export interface EtherealState {
    id: string;
    name: string;
    possibleValues: unknown[];
    observedValue: unknown | null;
    collapsed: boolean;
    probability: number;
}

export class EtherealStateManager extends EventEmitter {
    private static instance: EtherealStateManager;
    private states: Map<string, EtherealState> = new Map();

    private constructor() { super(); }

    static getInstance(): EtherealStateManager {
        if (!EtherealStateManager.instance) {
            EtherealStateManager.instance = new EtherealStateManager();
        }
        return EtherealStateManager.instance;
    }

    createState(name: string, possibleValues: unknown[]): EtherealState {
        const state: EtherealState = {
            id: `state_${Date.now()}`,
            name,
            possibleValues,
            observedValue: null,
            collapsed: false,
            probability: 1 / possibleValues.length,
        };

        this.states.set(state.id, state);
        this.emit('state:created', state);
        return state;
    }

    observe(stateId: string): unknown | undefined {
        const state = this.states.get(stateId);
        if (!state || state.collapsed) return state?.observedValue;

        const index = Math.floor(Math.random() * state.possibleValues.length);
        state.observedValue = state.possibleValues[index];
        state.collapsed = true;

        this.emit('state:collapsed', state);
        return state.observedValue;
    }

    reset(stateId: string): boolean {
        const state = this.states.get(stateId);
        if (!state) return false;
        state.collapsed = false;
        state.observedValue = null;
        return true;
    }

    getStats(): { total: number; collapsed: number } {
        const states = Array.from(this.states.values());
        return {
            total: states.length,
            collapsed: states.filter(s => s.collapsed).length,
        };
    }
}

export const etherealStateManager = EtherealStateManager.getInstance();
