/**
 * Dimensional Pocket Storage
 * 
 * Stores code snippets in dimensional pockets - accessible storage
 * spaces that exist outside the normal codebase structure.
 */

import { EventEmitter } from 'events';

export interface DimensionalPocket {
    id: string;
    name: string;
    dimension: number;
    capacity: number;
    contents: PocketItem[];
    stability: number;
    createdAt: Date;
}

export interface PocketItem {
    id: string;
    type: 'snippet' | 'template' | 'pattern' | 'data';
    name: string;
    content: string;
    metadata: Record<string, unknown>;
    addedAt: Date;
}

export interface DimensionalPortal {
    fromPocket: string;
    toPocket: string;
    stability: number;
}

export class DimensionalPocketStorage extends EventEmitter {
    private static instance: DimensionalPocketStorage;
    private pockets: Map<string, DimensionalPocket> = new Map();
    private portals: DimensionalPortal[] = [];

    private constructor() {
        super();
        this.createDefaultPocket();
    }

    static getInstance(): DimensionalPocketStorage {
        if (!DimensionalPocketStorage.instance) {
            DimensionalPocketStorage.instance = new DimensionalPocketStorage();
        }
        return DimensionalPocketStorage.instance;
    }

    private createDefaultPocket(): void {
        const pocket: DimensionalPocket = {
            id: 'prime_pocket',
            name: 'Prime Dimension',
            dimension: 0,
            capacity: 100,
            contents: [],
            stability: 1.0,
            createdAt: new Date(),
        };
        this.pockets.set(pocket.id, pocket);
    }

    createPocket(name: string, dimension: number = 1): DimensionalPocket {
        const pocket: DimensionalPocket = {
            id: `pocket_${Date.now()}`,
            name,
            dimension,
            capacity: 50 - dimension * 5, // Higher dimensions have less capacity
            contents: [],
            stability: 1 - dimension * 0.1, // Higher dimensions are less stable
            createdAt: new Date(),
        };

        this.pockets.set(pocket.id, pocket);
        this.emit('pocket:created', pocket);
        return pocket;
    }

    store(pocketId: string, item: Omit<PocketItem, 'id' | 'addedAt'>): PocketItem | undefined {
        const pocket = this.pockets.get(pocketId);
        if (!pocket || pocket.contents.length >= pocket.capacity) {
            return undefined;
        }

        const pocketItem: PocketItem = {
            ...item,
            id: `item_${Date.now()}`,
            addedAt: new Date(),
        };

        pocket.contents.push(pocketItem);
        pocket.stability = Math.max(0.1, pocket.stability - 0.01);

        this.emit('item:stored', { pocket, item: pocketItem });
        return pocketItem;
    }

    retrieve(pocketId: string, itemId: string): PocketItem | undefined {
        const pocket = this.pockets.get(pocketId);
        if (!pocket) return undefined;

        const index = pocket.contents.findIndex(i => i.id === itemId);
        if (index === -1) return undefined;

        const [item] = pocket.contents.splice(index, 1);
        pocket.stability = Math.min(1, pocket.stability + 0.01);

        this.emit('item:retrieved', { pocket, item });
        return item;
    }

    createPortal(fromId: string, toId: string): DimensionalPortal | undefined {
        const from = this.pockets.get(fromId);
        const to = this.pockets.get(toId);
        if (!from || !to) return undefined;

        const portal: DimensionalPortal = {
            fromPocket: fromId,
            toPocket: toId,
            stability: (from.stability + to.stability) / 2,
        };

        this.portals.push(portal);
        this.emit('portal:created', portal);
        return portal;
    }

    transferThroughPortal(portalIndex: number, itemId: string): boolean {
        const portal = this.portals[portalIndex];
        if (!portal) return false;

        const item = this.retrieve(portal.fromPocket, itemId);
        if (!item) return false;

        const stored = this.store(portal.toPocket, item);
        return !!stored;
    }

    searchAcrossDimensions(query: string): Array<{ pocket: DimensionalPocket; item: PocketItem }> {
        const results: Array<{ pocket: DimensionalPocket; item: PocketItem }> = [];
        const queryLower = query.toLowerCase();

        for (const pocket of this.pockets.values()) {
            for (const item of pocket.contents) {
                if (item.name.toLowerCase().includes(queryLower) ||
                    item.content.toLowerCase().includes(queryLower)) {
                    results.push({ pocket, item });
                }
            }
        }

        return results;
    }

    stabilizePocket(pocketId: string): number {
        const pocket = this.pockets.get(pocketId);
        if (!pocket) return 0;

        pocket.stability = Math.min(1, pocket.stability + 0.1);
        this.emit('pocket:stabilized', pocket);
        return pocket.stability;
    }

    getPocket(id: string): DimensionalPocket | undefined {
        return this.pockets.get(id);
    }

    getAllPockets(): DimensionalPocket[] {
        return Array.from(this.pockets.values());
    }

    getStats(): { totalPockets: number; totalItems: number; avgStability: number } {
        const pockets = Array.from(this.pockets.values());
        const totalItems = pockets.reduce((s, p) => s + p.contents.length, 0);

        return {
            totalPockets: pockets.length,
            totalItems,
            avgStability: pockets.length > 0
                ? pockets.reduce((s, p) => s + p.stability, 0) / pockets.length
                : 0,
        };
    }
}

export const dimensionalPocketStorage = DimensionalPocketStorage.getInstance();
