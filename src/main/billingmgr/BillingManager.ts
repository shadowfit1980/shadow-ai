/**
 * Billing Manager - Subscription and billing
 */
import { EventEmitter } from 'events';

export interface Subscription { id: string; plan: 'free' | 'pro' | 'team' | 'enterprise'; status: 'active' | 'cancelled' | 'past_due'; billingCycle: 'monthly' | 'yearly'; amount: number; nextBilling: number; }

export class BillingManager extends EventEmitter {
    private static instance: BillingManager;
    private subscription: Subscription | null = null;
    private balance = 0;
    private constructor() { super(); }
    static getInstance(): BillingManager { if (!BillingManager.instance) BillingManager.instance = new BillingManager(); return BillingManager.instance; }

    subscribe(plan: Subscription['plan'], billingCycle: Subscription['billingCycle']): Subscription {
        const amounts = { free: 0, pro: 20, team: 40, enterprise: 100 };
        const sub: Subscription = { id: `sub_${Date.now()}`, plan, status: 'active', billingCycle, amount: amounts[plan] * (billingCycle === 'yearly' ? 10 : 1), nextBilling: Date.now() + (billingCycle === 'yearly' ? 31536000000 : 2592000000) };
        this.subscription = sub;
        this.emit('subscribed', sub);
        return sub;
    }

    addCredits(amount: number): number { this.balance += amount; this.emit('creditsAdded', amount); return this.balance; }
    getBalance(): number { return this.balance; }
    deduct(amount: number): boolean { if (this.balance < amount) return false; this.balance -= amount; return true; }
    getSubscription(): Subscription | null { return this.subscription; }
    cancel(): boolean { if (!this.subscription) return false; this.subscription.status = 'cancelled'; return true; }
}
export function getBillingManager(): BillingManager { return BillingManager.getInstance(); }
