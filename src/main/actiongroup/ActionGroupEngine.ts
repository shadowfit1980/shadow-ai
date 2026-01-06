/**
 * Action Group - Agent tools/actions
 */
import { EventEmitter } from 'events';

export interface ActionDefinition { name: string; description: string; parameters: { name: string; type: string; required: boolean }[]; handler?: (params: Record<string, unknown>) => Promise<string>; }
export interface ActionGroupConfig { id: string; name: string; actions: ActionDefinition[]; apiSchema?: string; lambdaArn?: string; }

export class ActionGroupEngine extends EventEmitter {
    private static instance: ActionGroupEngine;
    private groups: Map<string, ActionGroupConfig> = new Map();
    private constructor() { super(); }
    static getInstance(): ActionGroupEngine { if (!ActionGroupEngine.instance) ActionGroupEngine.instance = new ActionGroupEngine(); return ActionGroupEngine.instance; }

    create(name: string, actions: ActionDefinition[]): ActionGroupConfig { const group: ActionGroupConfig = { id: `ag_${Date.now()}`, name, actions }; this.groups.set(group.id, group); return group; }

    async execute(groupId: string, actionName: string, params: Record<string, unknown>): Promise<string> {
        const group = this.groups.get(groupId); if (!group) throw new Error('Action group not found');
        const action = group.actions.find(a => a.name === actionName); if (!action) throw new Error('Action not found');
        if (action.handler) return action.handler(params);
        return `Executed ${actionName} with params: ${JSON.stringify(params)}`;
    }

    addAction(groupId: string, action: ActionDefinition): boolean { const g = this.groups.get(groupId); if (!g) return false; g.actions.push(action); return true; }
    getAll(): ActionGroupConfig[] { return Array.from(this.groups.values()); }
}
export function getActionGroupEngine(): ActionGroupEngine { return ActionGroupEngine.getInstance(); }
