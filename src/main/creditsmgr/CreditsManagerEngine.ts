/**
 * Credits Manager - Billing credits
 */
import { EventEmitter } from 'events';

export interface CreditTransaction { id: string; type: 'add' | 'deduct' | 'refund'; amount: number; reason: string; timestamp: number; balance: number; }

export class CreditsManagerEngine extends EventEmitter {
    private static instance: CreditsManagerEngine;
    private balance = 0;
    private transactions: CreditTransaction[] = [];
    private constructor() { super(); }
    static getInstance(): CreditsManagerEngine { if (!CreditsManagerEngine.instance) CreditsManagerEngine.instance = new CreditsManagerEngine(); return CreditsManagerEngine.instance; }

    add(amount: number, reason = 'Top up'): CreditTransaction { this.balance += amount; const tx: CreditTransaction = { id: `tx_${Date.now()}`, type: 'add', amount, reason, timestamp: Date.now(), balance: this.balance }; this.transactions.push(tx); this.emit('added', tx); return tx; }
    deduct(amount: number, reason = 'API usage'): boolean { if (this.balance < amount) { this.emit('insufficient', { amount, balance: this.balance }); return false; } this.balance -= amount; const tx: CreditTransaction = { id: `tx_${Date.now()}`, type: 'deduct', amount, reason, timestamp: Date.now(), balance: this.balance }; this.transactions.push(tx); return true; }
    refund(amount: number, reason = 'Refund'): CreditTransaction { this.balance += amount; const tx: CreditTransaction = { id: `tx_${Date.now()}`, type: 'refund', amount, reason, timestamp: Date.now(), balance: this.balance }; this.transactions.push(tx); return tx; }
    getBalance(): number { return this.balance; }
    getTransactions(): CreditTransaction[] { return [...this.transactions]; }
}
export function getCreditsManagerEngine(): CreditsManagerEngine { return CreditsManagerEngine.getInstance(); }
