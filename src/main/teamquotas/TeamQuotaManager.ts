/**
 * Team Quotas - Per-team usage limits
 */
import { EventEmitter } from 'events';

export interface TeamQuota { teamId: string; name: string; dailyLimit: number; monthlyLimit: number; dailyUsed: number; monthlyUsed: number; }

export class TeamQuotaManager extends EventEmitter {
    private static instance: TeamQuotaManager;
    private quotas: Map<string, TeamQuota> = new Map();
    private constructor() { super(); }
    static getInstance(): TeamQuotaManager { if (!TeamQuotaManager.instance) TeamQuotaManager.instance = new TeamQuotaManager(); return TeamQuotaManager.instance; }

    create(name: string, dailyLimit: number, monthlyLimit: number): TeamQuota {
        const quota: TeamQuota = { teamId: `team_${Date.now()}`, name, dailyLimit, monthlyLimit, dailyUsed: 0, monthlyUsed: 0 };
        this.quotas.set(quota.teamId, quota);
        return quota;
    }

    use(teamId: string, amount: number): { allowed: boolean; remaining: number } {
        const q = this.quotas.get(teamId); if (!q) return { allowed: false, remaining: 0 };
        if (q.dailyUsed + amount > q.dailyLimit || q.monthlyUsed + amount > q.monthlyLimit) { this.emit('exceeded', q); return { allowed: false, remaining: Math.min(q.dailyLimit - q.dailyUsed, q.monthlyLimit - q.monthlyUsed) }; }
        q.dailyUsed += amount; q.monthlyUsed += amount;
        return { allowed: true, remaining: q.dailyLimit - q.dailyUsed };
    }

    resetDaily(): void { this.quotas.forEach(q => { q.dailyUsed = 0; }); }
    resetMonthly(): void { this.quotas.forEach(q => { q.monthlyUsed = 0; q.dailyUsed = 0; }); }
    getAll(): TeamQuota[] { return Array.from(this.quotas.values()); }
}
export function getTeamQuotaManager(): TeamQuotaManager { return TeamQuotaManager.getInstance(); }
