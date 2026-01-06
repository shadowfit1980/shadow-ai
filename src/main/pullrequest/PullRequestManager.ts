/**
 * Pull Request Manager - PR automation
 */
import { EventEmitter } from 'events';

export interface PullRequest { id: string; title: string; description: string; branch: string; targetBranch: string; status: 'draft' | 'open' | 'merged' | 'closed'; files: string[]; createdAt: number; }

export class PullRequestManager extends EventEmitter {
    private static instance: PullRequestManager;
    private prs: Map<string, PullRequest> = new Map();
    private constructor() { super(); }
    static getInstance(): PullRequestManager { if (!PullRequestManager.instance) PullRequestManager.instance = new PullRequestManager(); return PullRequestManager.instance; }

    create(title: string, description: string, branch: string, targetBranch = 'main', files: string[] = []): PullRequest {
        const pr: PullRequest = { id: `pr_${Date.now()}`, title, description, branch, targetBranch, status: 'open', files, createdAt: Date.now() };
        this.prs.set(pr.id, pr);
        this.emit('created', pr);
        return pr;
    }

    merge(id: string): boolean { const pr = this.prs.get(id); if (!pr || pr.status !== 'open') return false; pr.status = 'merged'; this.emit('merged', pr); return true; }
    close(id: string): boolean { const pr = this.prs.get(id); if (!pr) return false; pr.status = 'closed'; return true; }
    getOpen(): PullRequest[] { return Array.from(this.prs.values()).filter(pr => pr.status === 'open'); }
    getAll(): PullRequest[] { return Array.from(this.prs.values()); }
}
export function getPullRequestManager(): PullRequestManager { return PullRequestManager.getInstance(); }
