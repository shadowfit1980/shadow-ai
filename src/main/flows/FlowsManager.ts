/**
 * Flows Manager - Action flows
 */
import { EventEmitter } from 'events';

export interface Flow { id: string; name: string; trigger: 'manual' | 'auto' | 'onSave' | 'onOpen'; actions: { type: string; config: Record<string, string> }[]; enabled: boolean; }

export class FlowsManager extends EventEmitter {
    private static instance: FlowsManager;
    private flows: Map<string, Flow> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): FlowsManager { if (!FlowsManager.instance) FlowsManager.instance = new FlowsManager(); return FlowsManager.instance; }

    private initDefaults(): void {
        const defaults: Flow[] = [
            { id: 'format-on-save', name: 'Format on Save', trigger: 'onSave', actions: [{ type: 'format', config: {} }], enabled: true },
            { id: 'lint-on-save', name: 'Lint on Save', trigger: 'onSave', actions: [{ type: 'lint', config: {} }], enabled: true }
        ];
        defaults.forEach(f => this.flows.set(f.id, f));
    }

    create(name: string, trigger: Flow['trigger'], actions: Flow['actions']): Flow { const flow: Flow = { id: `flow_${Date.now()}`, name, trigger, actions, enabled: true }; this.flows.set(flow.id, flow); return flow; }
    trigger(trigger: Flow['trigger']): Flow[] { const triggered = Array.from(this.flows.values()).filter(f => f.enabled && f.trigger === trigger); this.emit('triggered', triggered); return triggered; }
    toggle(flowId: string): boolean { const f = this.flows.get(flowId); if (!f) return false; f.enabled = !f.enabled; return true; }
    getByTrigger(trigger: Flow['trigger']): Flow[] { return Array.from(this.flows.values()).filter(f => f.trigger === trigger); }
    getAll(): Flow[] { return Array.from(this.flows.values()); }
}
export function getFlowsManager(): FlowsManager { return FlowsManager.getInstance(); }
