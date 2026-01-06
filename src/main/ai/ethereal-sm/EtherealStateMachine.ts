/**
 * Ethereal State Machine
 */
import { EventEmitter } from 'events';
export class EtherealStateMachine<S extends string, E extends string> extends EventEmitter {
    private state: S;
    private transitions: Map<S, Map<E, S>> = new Map();
    constructor(initialState: S) { super(); this.state = initialState; }
    addTransition(from: S, event: E, to: S): void { if (!this.transitions.has(from)) this.transitions.set(from, new Map()); this.transitions.get(from)!.set(event, to); }
    trigger(event: E): boolean { const nextState = this.transitions.get(this.state)?.get(event); if (nextState) { const prev = this.state; this.state = nextState; this.emit('transition', { from: prev, event, to: nextState }); return true; } return false; }
    getState(): S { return this.state; }
    canTrigger(event: E): boolean { return this.transitions.get(this.state)?.has(event) || false; }
}
export const createStateMachine = <S extends string, E extends string>(initial: S) => new EtherealStateMachine<S, E>(initial);
