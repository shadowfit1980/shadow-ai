/**
 * Panel Manager - IDE panels
 */
import { EventEmitter } from 'events';

export interface Panel { id: string; type: 'chat' | 'terminal' | 'preview' | 'files' | 'diff' | 'custom'; position: 'left' | 'right' | 'bottom' | 'center'; visible: boolean; size: number; }

export class PanelManager extends EventEmitter {
    private static instance: PanelManager;
    private panels: Map<string, Panel> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): PanelManager { if (!PanelManager.instance) PanelManager.instance = new PanelManager(); return PanelManager.instance; }

    private initDefaults(): void {
        const defaults: Panel[] = [
            { id: 'files', type: 'files', position: 'left', visible: true, size: 250 },
            { id: 'chat', type: 'chat', position: 'right', visible: true, size: 400 },
            { id: 'terminal', type: 'terminal', position: 'bottom', visible: false, size: 200 },
            { id: 'preview', type: 'preview', position: 'right', visible: false, size: 500 }
        ];
        defaults.forEach(p => this.panels.set(p.id, p));
    }

    toggle(panelId: string): boolean { const p = this.panels.get(panelId); if (!p) return false; p.visible = !p.visible; this.emit('toggled', p); return true; }
    resize(panelId: string, size: number): boolean { const p = this.panels.get(panelId); if (!p) return false; p.size = size; return true; }
    create(type: Panel['type'], position: Panel['position'], size = 300): Panel { const panel: Panel = { id: `panel_${Date.now()}`, type, position, visible: true, size }; this.panels.set(panel.id, panel); return panel; }
    getVisible(): Panel[] { return Array.from(this.panels.values()).filter(p => p.visible); }
    getAll(): Panel[] { return Array.from(this.panels.values()); }
}
export function getPanelManager(): PanelManager { return PanelManager.getInstance(); }
