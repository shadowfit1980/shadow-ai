/**
 * Contacts Manager - Contact management
 */
import { EventEmitter } from 'events';

export interface Contact { id: string; name: string; email?: string; phone?: string; company?: string; tags: string[]; }

export class ContactsManager extends EventEmitter {
    private static instance: ContactsManager;
    private contacts: Map<string, Contact> = new Map();
    private constructor() { super(); }
    static getInstance(): ContactsManager { if (!ContactsManager.instance) ContactsManager.instance = new ContactsManager(); return ContactsManager.instance; }

    add(name: string, email?: string, phone?: string, company?: string): Contact {
        const contact: Contact = { id: `con_${Date.now()}`, name, email, phone, company, tags: [] };
        this.contacts.set(contact.id, contact);
        return contact;
    }

    update(id: string, updates: Partial<Contact>): Contact | null { const c = this.contacts.get(id); if (!c) return null; Object.assign(c, updates); return c; }
    search(query: string): Contact[] { const q = query.toLowerCase(); return Array.from(this.contacts.values()).filter(c => c.name.toLowerCase().includes(q) || c.email?.includes(q) || c.company?.toLowerCase().includes(q)); }
    getAll(): Contact[] { return Array.from(this.contacts.values()); }
    delete(id: string): boolean { return this.contacts.delete(id); }
}
export function getContactsManager(): ContactsManager { return ContactsManager.getInstance(); }
