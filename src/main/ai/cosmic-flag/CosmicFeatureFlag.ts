/**
 * Cosmic Feature Flag
 * 
 * Feature flags that span the cosmic network,
 * enabling gradual rollouts across dimensions.
 */

import { EventEmitter } from 'events';

export interface CosmicFlag { id: string; name: string; enabled: boolean; dimension: number; rolloutPercent: number; }

export class CosmicFeatureFlag extends EventEmitter {
    private static instance: CosmicFeatureFlag;
    private flags: Map<string, CosmicFlag> = new Map();

    private constructor() { super(); }
    static getInstance(): CosmicFeatureFlag {
        if (!CosmicFeatureFlag.instance) { CosmicFeatureFlag.instance = new CosmicFeatureFlag(); }
        return CosmicFeatureFlag.instance;
    }

    create(name: string, enabled: boolean = false, rolloutPercent: number = 0): CosmicFlag {
        const flag: CosmicFlag = { id: `flag_${Date.now()}`, name, enabled, dimension: Math.floor(Math.random() * 7), rolloutPercent };
        this.flags.set(flag.id, flag);
        return flag;
    }

    isEnabled(flagId: string): boolean {
        const flag = this.flags.get(flagId);
        if (!flag) return false;
        if (!flag.enabled) return false;
        return Math.random() * 100 < flag.rolloutPercent;
    }

    getStats(): { total: number; enabled: number } {
        const flags = Array.from(this.flags.values());
        return { total: flags.length, enabled: flags.filter(f => f.enabled).length };
    }
}

export const cosmicFeatureFlag = CosmicFeatureFlag.getInstance();
