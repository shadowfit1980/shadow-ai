/**
 * Component Builder - Dynamic component generation
 */
import { EventEmitter } from 'events';

export interface ComponentDef { id: string; name: string; type: 'button' | 'card' | 'input' | 'modal' | 'menu' | 'toast' | 'badge' | 'avatar'; props: Record<string, unknown>; variants: string[]; code: string; }

export class ComponentBuilderEngine extends EventEmitter {
    private static instance: ComponentBuilderEngine;
    private components: Map<string, ComponentDef> = new Map();
    private constructor() { super(); }
    static getInstance(): ComponentBuilderEngine { if (!ComponentBuilderEngine.instance) ComponentBuilderEngine.instance = new ComponentBuilderEngine(); return ComponentBuilderEngine.instance; }

    create(type: ComponentDef['type'], name: string, props: Record<string, unknown> = {}): ComponentDef {
        const defaults: Record<ComponentDef['type'], Record<string, unknown>> = {
            button: { variant: 'primary', size: 'md', disabled: false },
            card: { padding: 'md', shadow: 'sm', rounded: 'lg' },
            input: { type: 'text', placeholder: '', required: false },
            modal: { size: 'md', closable: true, backdrop: true },
            menu: { orientation: 'vertical', items: [] },
            toast: { duration: 3000, position: 'bottom-right' },
            badge: { variant: 'default', size: 'sm' },
            avatar: { size: 'md', fallback: 'initials' }
        };
        const merged = { ...defaults[type], ...props };
        const code = this.generateCode(type, name, merged);
        const comp: ComponentDef = { id: `comp_${Date.now()}`, name, type, props: merged, variants: ['default', 'primary', 'secondary'], code };
        this.components.set(comp.id, comp); this.emit('created', comp); return comp;
    }

    private generateCode(type: string, name: string, props: Record<string, unknown>): string {
        return `export function ${name}(props) {\n  return (\n    <div className="${type} ${Object.entries(props).map(([k, v]) => `${k}-${v}`).join(' ')}">\n      {props.children}\n    </div>\n  );\n}`;
    }

    get(componentId: string): ComponentDef | null { return this.components.get(componentId) || null; }
    getByType(type: ComponentDef['type']): ComponentDef[] { return Array.from(this.components.values()).filter(c => c.type === type); }
    export(componentId: string): string { return this.components.get(componentId)?.code || ''; }
}
export function getComponentBuilderEngine(): ComponentBuilderEngine { return ComponentBuilderEngine.getInstance(); }
