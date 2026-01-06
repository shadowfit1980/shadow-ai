/**
 * Issue Tracker 2 - Advanced issue management
 */
import { EventEmitter } from 'events';

export interface Issue { id: string; file: string; line: number; type: 'bug' | 'vulnerability' | 'code_smell'; severity: 'blocker' | 'critical' | 'major' | 'minor' | 'info'; status: 'open' | 'confirmed' | 'resolved' | 'reopened' | 'closed'; resolution?: 'fixed' | 'wontfix' | 'false_positive'; message: string; assignee?: string; }

export class IssueTracker2 extends EventEmitter {
    private static instance: IssueTracker2;
    private issues: Map<string, Issue> = new Map();
    private constructor() { super(); }
    static getInstance(): IssueTracker2 { if (!IssueTracker2.instance) IssueTracker2.instance = new IssueTracker2(); return IssueTracker2.instance; }

    create(file: string, line: number, type: Issue['type'], severity: Issue['severity'], message: string): Issue {
        const issue: Issue = { id: `issue_${Date.now()}`, file, line, type, severity, status: 'open', message };
        this.issues.set(issue.id, issue); this.emit('created', issue); return issue;
    }

    resolve(id: string, resolution: Issue['resolution']): boolean { const i = this.issues.get(id); if (!i) return false; i.status = 'resolved'; i.resolution = resolution; return true; }
    assign(id: string, assignee: string): boolean { const i = this.issues.get(id); if (!i) return false; i.assignee = assignee; return true; }
    getByStatus(status: Issue['status']): Issue[] { return Array.from(this.issues.values()).filter(i => i.status === status); }
    getByType(type: Issue['type']): Issue[] { return Array.from(this.issues.values()).filter(i => i.type === type); }
    getStats(): { bugs: number; vulnerabilities: number; smells: number; open: number } { const all = Array.from(this.issues.values()); return { bugs: all.filter(i => i.type === 'bug').length, vulnerabilities: all.filter(i => i.type === 'vulnerability').length, smells: all.filter(i => i.type === 'code_smell').length, open: all.filter(i => i.status === 'open').length }; }
}
export function getIssueTracker2(): IssueTracker2 { return IssueTracker2.getInstance(); }
