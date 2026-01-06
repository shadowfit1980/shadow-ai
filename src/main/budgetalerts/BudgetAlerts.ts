/**
 * Budget Alerts - Cost threshold alerts
 */
import { EventEmitter } from 'events';

export interface BudgetAlert { id: string; name: string; threshold: number; current: number; triggered: boolean; action: 'notify' | 'pause' | 'limit'; }

export class BudgetAlerts extends EventEmitter {
    private static instance: BudgetAlerts;
    private alerts: Map<string, BudgetAlert> = new Map();
    private constructor() { super(); }
    static getInstance(): BudgetAlerts { if (!BudgetAlerts.instance) BudgetAlerts.instance = new BudgetAlerts(); return BudgetAlerts.instance; }

    create(name: string, threshold: number, action: BudgetAlert['action'] = 'notify'): BudgetAlert {
        const alert: BudgetAlert = { id: `alert_${Date.now()}`, name, threshold, current: 0, triggered: false, action };
        this.alerts.set(alert.id, alert);
        return alert;
    }

    update(id: string, amount: number): BudgetAlert | null {
        const alert = this.alerts.get(id); if (!alert) return null;
        alert.current += amount;
        if (alert.current >= alert.threshold && !alert.triggered) { alert.triggered = true; this.emit('triggered', alert); }
        return alert;
    }

    reset(id: string): boolean { const alert = this.alerts.get(id); if (!alert) return false; alert.current = 0; alert.triggered = false; return true; }
    getTriggered(): BudgetAlert[] { return Array.from(this.alerts.values()).filter(a => a.triggered); }
    getAll(): BudgetAlert[] { return Array.from(this.alerts.values()); }
}
export function getBudgetAlerts(): BudgetAlerts { return BudgetAlerts.getInstance(); }
