/**
 * State Manager
 * Global state management
 */

import { EventEmitter } from 'events';

/**
 * StateManager
 * Manage global app state
 */
export class StateManager<T extends Record<string, any> = Record<string, any>> extends EventEmitter {
    private static instance: StateManager;
    private state: T;
    private history: T[] = [];
    private maxHistory = 50;

    private constructor(initialState: T = {} as T) {
        super();
        this.state = initialState;
    }

    static getInstance<T extends Record<string, any>>(): StateManager<T> {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager<T>();
        }
        return StateManager.instance as StateManager<T>;
    }

    get<K extends keyof T>(key: K): T[K] {
        return this.state[key];
    }

    set<K extends keyof T>(key: K, value: T[K]): void {
        this.saveHistory();
        this.state[key] = value;
        this.emit('stateChanged', { key, value });
    }

    update(partial: Partial<T>): void {
        this.saveHistory();
        this.state = { ...this.state, ...partial };
        this.emit('stateUpdated', partial);
    }

    getState(): T {
        return { ...this.state };
    }

    setState(newState: T): void {
        this.saveHistory();
        this.state = newState;
        this.emit('stateReplaced', newState);
    }

    private saveHistory(): void {
        this.history.push({ ...this.state });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    undo(): boolean {
        const previous = this.history.pop();
        if (!previous) return false;

        this.state = previous;
        this.emit('undone', this.state);
        return true;
    }

    reset(initialState: T = {} as T): void {
        this.state = initialState;
        this.history = [];
        this.emit('reset');
    }

    subscribe(listener: (state: T) => void): () => void {
        const handler = () => listener(this.state);
        this.on('stateChanged', handler);
        this.on('stateUpdated', handler);
        return () => {
            this.off('stateChanged', handler);
            this.off('stateUpdated', handler);
        };
    }
}

export function getStateManager<T extends Record<string, any>>(): StateManager<T> {
    return StateManager.getInstance<T>();
}
