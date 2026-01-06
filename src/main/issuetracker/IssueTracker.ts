/**
 * Issue Tracker - Issue management
 */
import { EventEmitter } from 'events';

export interface Issue { id: string; title: string; description: string; status: 'open' | 'in-progress' | 'closed'; assignee?: string; labels: string[]; createdAt: number; }

export class IssueTracker extends EventEmitter {
    private static instance: IssueTracker;
    private issues: Map<string, Issue> = new Map();
    private constructor() { super(); }
    static getInstance(): IssueTracker { if (!IssueTracker.instance) IssueTracker.instance = new IssueTracker(); return IssueTracker.instance; }

    create(title: string, description: string, labels: string[] = []): Issue {
        const issue: Issue = { id: `issue_${Date.now()}`, title, description, status: 'open', labels, createdAt: Date.now() };
        this.issues.set(issue.id, issue);
        this.emit('created', issue);
        return issue;
    }

    assignToAI(id: string): boolean { const i = this.issues.get(id); if (!i) return false; i.assignee = 'copilot'; i.status = 'in-progress'; this.emit('assigned', i); return true; }
    close(id: string): boolean { const i = this.issues.get(id); if (!i) return false; i.status = 'closed'; return true; }
    getOpen(): Issue[] { return Array.from(this.issues.values()).filter(i => i.status === 'open'); }
    getAll(): Issue[] { return Array.from(this.issues.values()); }
}
export function getIssueTracker(): IssueTracker { return IssueTracker.getInstance(); }
