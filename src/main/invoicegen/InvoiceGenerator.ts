/**
 * Invoice Generator - Billing invoices
 */
import { EventEmitter } from 'events';

export interface InvoiceItem { description: string; quantity: number; unitPrice: number; total: number; }
export interface Invoice { id: string; date: number; dueDate: number; items: InvoiceItem[]; subtotal: number; tax: number; total: number; status: 'draft' | 'sent' | 'paid' | 'overdue'; }

export class InvoiceGenerator extends EventEmitter {
    private static instance: InvoiceGenerator;
    private invoices: Map<string, Invoice> = new Map();
    private taxRate = 0.1;
    private constructor() { super(); }
    static getInstance(): InvoiceGenerator { if (!InvoiceGenerator.instance) InvoiceGenerator.instance = new InvoiceGenerator(); return InvoiceGenerator.instance; }

    create(items: { description: string; quantity: number; unitPrice: number }[]): Invoice {
        const invoiceItems = items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
        const subtotal = invoiceItems.reduce((s, i) => s + i.total, 0);
        const tax = subtotal * this.taxRate;
        const invoice: Invoice = { id: `inv_${Date.now()}`, date: Date.now(), dueDate: Date.now() + 2592000000, items: invoiceItems, subtotal, tax, total: subtotal + tax, status: 'draft' };
        this.invoices.set(invoice.id, invoice);
        return invoice;
    }

    send(id: string): boolean { const inv = this.invoices.get(id); if (!inv) return false; inv.status = 'sent'; this.emit('sent', inv); return true; }
    markPaid(id: string): boolean { const inv = this.invoices.get(id); if (!inv) return false; inv.status = 'paid'; return true; }
    setTaxRate(rate: number): void { this.taxRate = rate; }
    getByStatus(status: Invoice['status']): Invoice[] { return Array.from(this.invoices.values()).filter(i => i.status === status); }
    getAll(): Invoice[] { return Array.from(this.invoices.values()); }
}
export function getInvoiceGenerator(): InvoiceGenerator { return InvoiceGenerator.getInstance(); }
