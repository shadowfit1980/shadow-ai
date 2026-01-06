/**
 * Technical Debt Tracker - Track tech debt
 */
import { EventEmitter } from 'events';

export interface DebtItem { id: string; file: string; type: 'complexity' | 'duplication' | 'coverage' | 'bug' | 'vulnerability' | 'smell'; remediationTime: number; createdAt: number; resolved: boolean; }

export class TechnicalDebtTracker extends EventEmitter {
    private static instance: TechnicalDebtTracker;
    private debt: Map<string, DebtItem[]> = new Map();
    private constructor() { super(); }
    static getInstance(): TechnicalDebtTracker { if (!TechnicalDebtTracker.instance) TechnicalDebtTracker.instance = new TechnicalDebtTracker(); return TechnicalDebtTracker.instance; }

    add(file: string, type: DebtItem['type'], remediationTime: number): DebtItem {
        const item: DebtItem = { id: `debt_${Date.now()}`, file, type, remediationTime, createdAt: Date.now(), resolved: false };
        const items = this.debt.get(file) || []; items.push(item); this.debt.set(file, items); this.emit('added', item); return item;
    }

    resolve(id: string): boolean { for (const items of this.debt.values()) { const item = items.find(i => i.id === id); if (item) { item.resolved = true; return true; } } return false; }
    getTotalDebt(): { totalMinutes: number; rating: 'A' | 'B' | 'C' | 'D' | 'E' } { const total = Array.from(this.debt.values()).flat().filter(i => !i.resolved).reduce((s, i) => s + i.remediationTime, 0); const rating = total < 60 ? 'A' : total < 240 ? 'B' : total < 480 ? 'C' : total < 960 ? 'D' : 'E'; return { totalMinutes: total, rating }; }
    getByFile(file: string): DebtItem[] { return this.debt.get(file) || []; }
    getAll(): DebtItem[] { return Array.from(this.debt.values()).flat(); }
}
export function getTechnicalDebtTracker(): TechnicalDebtTracker { return TechnicalDebtTracker.getInstance(); }
