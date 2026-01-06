/**
 * 💰 IAP Manager
 * 
 * In-app purchases:
 * - Product management
 * - Purchase flow
 * - Receipt validation
 */

import { EventEmitter } from 'events';

export interface Product {
    id: string;
    name: string;
    price: string;
    type: 'consumable' | 'non_consumable' | 'subscription';
}

export class IAPManager extends EventEmitter {
    private static instance: IAPManager;

    private constructor() { super(); }

    static getInstance(): IAPManager {
        if (!IAPManager.instance) {
            IAPManager.instance = new IAPManager();
        }
        return IAPManager.instance;
    }

    generateIAPCode(): string {
        return `
class IAPManager {
    constructor() {
        this.products = new Map();
        this.purchased = new Set();
        this.pending = new Map();
        
        this.initialized = false;
        this.testMode = true; // Set to false in production
        
        this.setupDefaultProducts();
    }

    setupDefaultProducts() {
        // Define your products
        this.registerProduct({
            id: 'remove_ads',
            name: 'Remove Ads',
            price: '$2.99',
            type: 'non_consumable'
        });

        this.registerProduct({
            id: 'coins_100',
            name: '100 Coins',
            price: '$0.99',
            type: 'consumable'
        });

        this.registerProduct({
            id: 'coins_500',
            name: '500 Coins + Bonus',
            price: '$3.99',
            type: 'consumable'
        });

        this.registerProduct({
            id: 'premium',
            name: 'Premium Monthly',
            price: '$4.99/month',
            type: 'subscription'
        });
    }

    registerProduct(product) {
        this.products.set(product.id, product);
    }

    async initialize() {
        // In a real implementation, connect to app store
        // For web games, this would connect to a payment provider
        
        try {
            // Load purchased items from storage
            const saved = localStorage.getItem('iap_purchased');
            if (saved) {
                this.purchased = new Set(JSON.parse(saved));
            }
            
            this.initialized = true;
            this.onInitialized?.();
            return true;
        } catch (e) {
            console.error('IAP init failed:', e);
            return false;
        }
    }

    getProducts() {
        return Array.from(this.products.values());
    }

    getProduct(id) {
        return this.products.get(id);
    }

    isPurchased(id) {
        const product = this.products.get(id);
        if (!product) return false;
        
        if (product.type === 'non_consumable') {
            return this.purchased.has(id);
        }
        return false;
    }

    async purchase(productId) {
        const product = this.products.get(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        if (this.pending.has(productId)) {
            throw new Error('Purchase already in progress');
        }

        this.pending.set(productId, true);
        this.onPurchaseStart?.(product);

        try {
            if (this.testMode) {
                // Simulate purchase for testing
                await this.simulatePurchase(product);
            } else {
                // Real purchase flow would go here
                await this.realPurchase(product);
            }

            // Handle successful purchase
            this.handlePurchaseSuccess(product);
            this.onPurchaseSuccess?.(product);
            
            return { success: true, product };
        } catch (error) {
            this.onPurchaseError?.(product, error);
            throw error;
        } finally {
            this.pending.delete(productId);
        }
    }

    async simulatePurchase(product) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
            return { transactionId: 'test_' + Date.now() };
        }
        throw new Error('Purchase cancelled');
    }

    async realPurchase(product) {
        // Implement real purchase logic here
        // This would depend on your payment provider
        // (Stripe, PayPal, App Store, Play Store, etc.)
        throw new Error('Real purchases not implemented');
    }

    handlePurchaseSuccess(product) {
        switch (product.type) {
            case 'non_consumable':
                this.purchased.add(product.id);
                this.savePurchases();
                break;
            case 'consumable':
                this.grantConsumable(product);
                break;
            case 'subscription':
                this.activateSubscription(product);
                break;
        }
    }

    grantConsumable(product) {
        // Override this to grant items
        const amounts = {
            'coins_100': 100,
            'coins_500': 550 // With bonus
        };
        
        const amount = amounts[product.id] || 0;
        this.onCoinsGranted?.(amount);
    }

    activateSubscription(product) {
        // Store subscription status
        localStorage.setItem('subscription_active', 'true');
        localStorage.setItem('subscription_expiry', Date.now() + 30 * 24 * 60 * 60 * 1000);
        this.onSubscriptionActivated?.(product);
    }

    isSubscribed() {
        const expiry = localStorage.getItem('subscription_expiry');
        return expiry && parseInt(expiry) > Date.now();
    }

    async restorePurchases() {
        // Restore non-consumable purchases
        // In a real implementation, this would verify with the store
        
        try {
            const saved = localStorage.getItem('iap_purchased');
            if (saved) {
                this.purchased = new Set(JSON.parse(saved));
            }
            
            this.onPurchasesRestored?.(Array.from(this.purchased));
            return Array.from(this.purchased);
        } catch (e) {
            console.error('Restore failed:', e);
            return [];
        }
    }

    savePurchases() {
        localStorage.setItem('iap_purchased', JSON.stringify(Array.from(this.purchased)));
    }

    // Price formatting
    formatPrice(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Callbacks
    onInitialized = null;
    onPurchaseStart = null;
    onPurchaseSuccess = null;
    onPurchaseError = null;
    onCoinsGranted = null;
    onSubscriptionActivated = null;
    onPurchasesRestored = null;
}

// Virtual Currency Manager
class VirtualCurrency {
    constructor() {
        this.currencies = new Map();
        this.load();
    }

    register(id, name = id) {
        this.currencies.set(id, { id, name, amount: 0 });
    }

    get(id) {
        return this.currencies.get(id)?.amount || 0;
    }

    add(id, amount) {
        const currency = this.currencies.get(id);
        if (currency) {
            currency.amount += amount;
            this.save();
            this.onChange?.(id, currency.amount);
        }
    }

    spend(id, amount) {
        const currency = this.currencies.get(id);
        if (!currency || currency.amount < amount) return false;
        
        currency.amount -= amount;
        this.save();
        this.onChange?.(id, currency.amount);
        return true;
    }

    save() {
        const data = {};
        for (const [id, currency] of this.currencies) {
            data[id] = currency.amount;
        }
        localStorage.setItem('virtual_currency', JSON.stringify(data));
    }

    load() {
        try {
            const data = JSON.parse(localStorage.getItem('virtual_currency') || '{}');
            for (const [id, amount] of Object.entries(data)) {
                if (this.currencies.has(id)) {
                    this.currencies.get(id).amount = amount;
                }
            }
        } catch (e) {}
    }

    onChange = null;
}`;
    }
}

export const iapManager = IAPManager.getInstance();
