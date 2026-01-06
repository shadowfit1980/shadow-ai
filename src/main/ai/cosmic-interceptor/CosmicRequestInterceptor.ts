/**
 * Cosmic Request Interceptor
 * 
 * Intercepts requests through cosmic barriers,
 * adding celestial transformations.
 */

import { EventEmitter } from 'events';

export interface CosmicInterception { id: string; originalPath: string; transformedPath: string; cosmicBoost: number; }

export class CosmicRequestInterceptor extends EventEmitter {
    private static instance: CosmicRequestInterceptor;
    private interceptions: Map<string, CosmicInterception> = new Map();

    private constructor() { super(); }
    static getInstance(): CosmicRequestInterceptor {
        if (!CosmicRequestInterceptor.instance) { CosmicRequestInterceptor.instance = new CosmicRequestInterceptor(); }
        return CosmicRequestInterceptor.instance;
    }

    intercept(path: string): CosmicInterception {
        const interception: CosmicInterception = { id: `intercept_${Date.now()}`, originalPath: path, transformedPath: `/cosmic${path}`, cosmicBoost: 0.8 + Math.random() * 0.2 };
        this.interceptions.set(interception.id, interception);
        return interception;
    }

    getStats(): { total: number; avgBoost: number } {
        const ints = Array.from(this.interceptions.values());
        return { total: ints.length, avgBoost: ints.length > 0 ? ints.reduce((s, i) => s + i.cosmicBoost, 0) / ints.length : 0 };
    }
}

export const cosmicRequestInterceptor = CosmicRequestInterceptor.getInstance();
