/**
 * Interaction State - UI state management
 */
import { EventEmitter } from 'events';

export interface InteractionDef { id: string; name: string; states: string[]; current: string; transitions: Record<string, string[]>; }
export interface StateStyle { state: string; styles: Record<string, string>; }

export class InteractionStateEngine extends EventEmitter {
    private static instance: InteractionStateEngine;
    private interactions: Map<string, InteractionDef> = new Map();
    private styles: Map<string, StateStyle[]> = new Map();
    private constructor() { super(); }
    static getInstance(): InteractionStateEngine { if (!InteractionStateEngine.instance) InteractionStateEngine.instance = new InteractionStateEngine(); return InteractionStateEngine.instance; }

    create(name: string, states: string[], initial: string): InteractionDef {
        const transitions: Record<string, string[]> = {};
        states.forEach(s => { transitions[s] = states.filter(t => t !== s); });
        const def: InteractionDef = { id: `int_${Date.now()}`, name, states, current: initial, transitions };
        this.interactions.set(def.id, def); return def;
    }

    transition(interactionId: string, toState: string): boolean {
        const def = this.interactions.get(interactionId); if (!def) return false;
        if (def.transitions[def.current]?.includes(toState)) { const from = def.current; def.current = toState; this.emit('transition', { from, to: toState }); return true; }
        return false;
    }

    setStyles(interactionId: string, styles: StateStyle[]): void { this.styles.set(interactionId, styles); }
    getStyles(interactionId: string, state: string): Record<string, string> { return this.styles.get(interactionId)?.find(s => s.state === state)?.styles || {}; }
    get(interactionId: string): InteractionDef | null { return this.interactions.get(interactionId) || null; }

    createButton(): InteractionDef { return this.create('button', ['default', 'hover', 'active', 'focus', 'disabled'], 'default'); }
    createToggle(): InteractionDef { return this.create('toggle', ['off', 'on'], 'off'); }
}
export function getInteractionStateEngine(): InteractionStateEngine { return InteractionStateEngine.getInstance(); }
