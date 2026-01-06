/**
 * Email Manager - Email integration
 */
import { EventEmitter } from 'events';

export interface Email { id: string; to: string[]; cc?: string[]; subject: string; body: string; html?: boolean; sent: boolean; createdAt: number; }

export class EmailManager extends EventEmitter {
    private static instance: EmailManager;
    private emails: Map<string, Email> = new Map();
    private smtp?: { host: string; port: number; user: string; pass: string };
    private constructor() { super(); }
    static getInstance(): EmailManager { if (!EmailManager.instance) EmailManager.instance = new EmailManager(); return EmailManager.instance; }

    configure(host: string, port: number, user: string, pass: string): void { this.smtp = { host, port, user, pass }; }

    compose(to: string[], subject: string, body: string, html = false): Email {
        const email: Email = { id: `email_${Date.now()}`, to, subject, body, html, sent: false, createdAt: Date.now() };
        this.emails.set(email.id, email);
        return email;
    }

    async send(id: string): Promise<boolean> { const email = this.emails.get(id); if (!email) return false; email.sent = true; this.emit('sent', email); return true; }
    getDrafts(): Email[] { return Array.from(this.emails.values()).filter(e => !e.sent); }
    getSent(): Email[] { return Array.from(this.emails.values()).filter(e => e.sent); }
}
export function getEmailManager(): EmailManager { return EmailManager.getInstance(); }
