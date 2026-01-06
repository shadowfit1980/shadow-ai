/**
 * Tool Registry - Agent tools
 */
import { EventEmitter } from 'events';

export interface AgentTool { id: string; name: string; description: string; parameters: { name: string; type: string; required: boolean }[]; enabled: boolean; usageCount: number; }

export class ToolRegistry extends EventEmitter {
    private static instance: ToolRegistry;
    private tools: Map<string, AgentTool> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ToolRegistry { if (!ToolRegistry.instance) ToolRegistry.instance = new ToolRegistry(); return ToolRegistry.instance; }

    private initDefaults(): void {
        const defaults: AgentTool[] = [
            { id: 'web_search', name: 'Web Search', description: 'Search the internet', parameters: [{ name: 'query', type: 'string', required: true }], enabled: true, usageCount: 0 },
            { id: 'read_file', name: 'Read File', description: 'Read file contents', parameters: [{ name: 'path', type: 'string', required: true }], enabled: true, usageCount: 0 },
            { id: 'write_file', name: 'Write File', description: 'Write to file', parameters: [{ name: 'path', type: 'string', required: true }, { name: 'content', type: 'string', required: true }], enabled: true, usageCount: 0 }
        ];
        defaults.forEach(t => this.tools.set(t.id, t));
    }

    register(name: string, description: string, parameters: AgentTool['parameters']): AgentTool { const tool: AgentTool = { id: `tool_${Date.now()}`, name, description, parameters, enabled: true, usageCount: 0 }; this.tools.set(tool.id, tool); return tool; }
    use(toolId: string): boolean { const t = this.tools.get(toolId); if (!t || !t.enabled) return false; t.usageCount++; this.emit('used', t); return true; }
    toggle(toolId: string, enabled: boolean): boolean { const t = this.tools.get(toolId); if (!t) return false; t.enabled = enabled; return true; }
    getEnabled(): AgentTool[] { return Array.from(this.tools.values()).filter(t => t.enabled); }
    getAll(): AgentTool[] { return Array.from(this.tools.values()); }
}
export function getToolRegistry(): ToolRegistry { return ToolRegistry.getInstance(); }
