/**
 * Variant Manager - Component variants
 */
import { EventEmitter } from 'events';

export interface Variant { id: string; name: string; styles: Record<string, string>; }
export interface VariantGroup { id: string; component: string; property: string; variants: Variant[]; default: string; }

export class VariantManagerEngine extends EventEmitter {
    private static instance: VariantManagerEngine;
    private groups: Map<string, VariantGroup> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): VariantManagerEngine { if (!VariantManagerEngine.instance) VariantManagerEngine.instance = new VariantManagerEngine(); return VariantManagerEngine.instance; }

    private initDefaults(): void {
        this.createGroup('button', 'variant', [
            { id: 'v1', name: 'primary', styles: { backgroundColor: 'var(--color-primary)', color: 'white' } },
            { id: 'v2', name: 'secondary', styles: { backgroundColor: 'var(--color-secondary)', color: 'white' } },
            { id: 'v3', name: 'outline', styles: { backgroundColor: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' } },
            { id: 'v4', name: 'ghost', styles: { backgroundColor: 'transparent', color: 'var(--color-primary)' } }
        ], 'primary');
        this.createGroup('button', 'size', [
            { id: 's1', name: 'sm', styles: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' } },
            { id: 's2', name: 'md', styles: { padding: '0.5rem 1rem', fontSize: '1rem' } },
            { id: 's3', name: 'lg', styles: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' } }
        ], 'md');
    }

    createGroup(component: string, property: string, variants: Variant[], defaultVariant: string): VariantGroup {
        const group: VariantGroup = { id: `vg_${Date.now()}`, component, property, variants, default: defaultVariant };
        this.groups.set(group.id, group); return group;
    }

    getVariant(component: string, property: string, variantName: string): Variant | null { const group = Array.from(this.groups.values()).find(g => g.component === component && g.property === property); return group?.variants.find(v => v.name === variantName) || null; }
    getStyles(component: string, variantSelections: Record<string, string>): Record<string, string> { let styles: Record<string, string> = {}; Object.entries(variantSelections).forEach(([prop, name]) => { const v = this.getVariant(component, prop, name); if (v) styles = { ...styles, ...v.styles }; }); return styles; }
    getGroupsFor(component: string): VariantGroup[] { return Array.from(this.groups.values()).filter(g => g.component === component); }
}
export function getVariantManagerEngine(): VariantManagerEngine { return VariantManagerEngine.getInstance(); }
