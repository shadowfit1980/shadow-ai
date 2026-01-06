/**
 * Mystic Middleware Chain
 * 
 * A middleware chain infused with mystical properties,
 * where each middleware adds magical enhancements.
 */

import { EventEmitter } from 'events';

export interface MysticMiddleware {
    id: string;
    name: string;
    enchantment: string;
    power: number;
    order: number;
}

export interface MysticChain {
    id: string;
    middlewares: MysticMiddleware[];
    totalPower: number;
}

export class MysticMiddlewareChain extends EventEmitter {
    private static instance: MysticMiddlewareChain;
    private chains: Map<string, MysticChain> = new Map();

    private constructor() { super(); }

    static getInstance(): MysticMiddlewareChain {
        if (!MysticMiddlewareChain.instance) {
            MysticMiddlewareChain.instance = new MysticMiddlewareChain();
        }
        return MysticMiddlewareChain.instance;
    }

    createChain(): MysticChain {
        const chain: MysticChain = {
            id: `chain_${Date.now()}`,
            middlewares: [],
            totalPower: 0,
        };
        this.chains.set(chain.id, chain);
        return chain;
    }

    addMiddleware(chainId: string, name: string, enchantment: string): MysticMiddleware | undefined {
        const chain = this.chains.get(chainId);
        if (!chain) return undefined;

        const middleware: MysticMiddleware = {
            id: `mw_${Date.now()}`,
            name,
            enchantment,
            power: 0.3 + Math.random() * 0.7,
            order: chain.middlewares.length,
        };

        chain.middlewares.push(middleware);
        chain.totalPower = chain.middlewares.reduce((s, m) => s + m.power, 0);
        this.emit('middleware:added', middleware);
        return middleware;
    }

    getStats(): { total: number; avgPower: number } {
        const chains = Array.from(this.chains.values());
        const totalPower = chains.reduce((s, c) => s + c.totalPower, 0);
        return {
            total: chains.length,
            avgPower: chains.length > 0 ? totalPower / chains.length : 0,
        };
    }
}

export const mysticMiddlewareChain = MysticMiddlewareChain.getInstance();
