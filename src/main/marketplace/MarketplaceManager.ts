/**
 * Marketplace Manager - Extension marketplace
 */
import { EventEmitter } from 'events';

export interface MarketplaceItem { id: string; name: string; author: string; description: string; version: string; downloads: number; rating: number; category: string; price: number; }

export class MarketplaceManager extends EventEmitter {
    private static instance: MarketplaceManager;
    private items: Map<string, MarketplaceItem> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): MarketplaceManager { if (!MarketplaceManager.instance) MarketplaceManager.instance = new MarketplaceManager(); return MarketplaceManager.instance; }

    private initDefaults(): void {
        this.addItem({ id: 'theme-dark', name: 'Dark Pro Theme', author: 'Shadow AI', description: 'Professional dark theme', version: '1.0.0', downloads: 10000, rating: 4.8, category: 'themes', price: 0 });
        this.addItem({ id: 'linter-pack', name: 'Linter Pack', author: 'Shadow AI', description: 'All-in-one linter collection', version: '2.0.0', downloads: 5000, rating: 4.5, category: 'tools', price: 0 });
    }

    addItem(item: MarketplaceItem): void { this.items.set(item.id, item); }
    search(query: string): MarketplaceItem[] { const q = query.toLowerCase(); return Array.from(this.items.values()).filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)); }
    getByCategory(cat: string): MarketplaceItem[] { return Array.from(this.items.values()).filter(i => i.category === cat); }
    getPopular(limit = 10): MarketplaceItem[] { return [...this.items.values()].sort((a, b) => b.downloads - a.downloads).slice(0, limit); }
    getAll(): MarketplaceItem[] { return Array.from(this.items.values()); }
}

export function getMarketplaceManager(): MarketplaceManager { return MarketplaceManager.getInstance(); }
