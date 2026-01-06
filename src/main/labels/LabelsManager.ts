/**
 * Labels Manager - Labeling system
 */
import { EventEmitter } from 'events';

export interface Label { id: string; name: string; color: string; description?: string; }

export class LabelsManager extends EventEmitter {
    private static instance: LabelsManager;
    private labels: Map<string, Label> = new Map();
    private assignments: Map<string, string[]> = new Map(); // itemId -> labelIds
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): LabelsManager { if (!LabelsManager.instance) LabelsManager.instance = new LabelsManager(); return LabelsManager.instance; }

    private initDefaults(): void {
        this.create('bug', '#EF4444', 'Bug fix');
        this.create('feature', '#10B981', 'New feature');
        this.create('docs', '#3B82F6', 'Documentation');
        this.create('refactor', '#8B5CF6', 'Refactoring');
        this.create('urgent', '#F59E0B', 'Urgent priority');
    }

    create(name: string, color: string, description?: string): Label {
        const label: Label = { id: `lbl_${Date.now()}`, name, color, description };
        this.labels.set(label.id, label);
        return label;
    }

    assign(itemId: string, labelId: string): void { const labels = this.assignments.get(itemId) || []; if (!labels.includes(labelId)) { labels.push(labelId); this.assignments.set(itemId, labels); this.emit('assigned', { itemId, labelId }); } }
    unassign(itemId: string, labelId: string): void { const labels = this.assignments.get(itemId) || []; this.assignments.set(itemId, labels.filter(l => l !== labelId)); }
    getLabels(itemId: string): Label[] { const ids = this.assignments.get(itemId) || []; return ids.map(id => this.labels.get(id)).filter(Boolean) as Label[]; }
    getAll(): Label[] { return Array.from(this.labels.values()); }
    delete(id: string): boolean { return this.labels.delete(id); }
}

export function getLabelsManager(): LabelsManager { return LabelsManager.getInstance(); }
