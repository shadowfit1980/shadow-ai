/**
 * Ethereal Load Balancer
 * 
 * Balances load across ethereal nodes,
 * distributing work through dimensional planes.
 */

import { EventEmitter } from 'events';

export interface EtherealNode { id: string; name: string; weight: number; connections: number; dimension: number; }

export class EtherealLoadBalancer extends EventEmitter {
    private static instance: EtherealLoadBalancer;
    private nodes: Map<string, EtherealNode> = new Map();

    private constructor() { super(); }
    static getInstance(): EtherealLoadBalancer {
        if (!EtherealLoadBalancer.instance) { EtherealLoadBalancer.instance = new EtherealLoadBalancer(); }
        return EtherealLoadBalancer.instance;
    }

    addNode(name: string, weight: number = 1): EtherealNode {
        const node: EtherealNode = { id: `node_${Date.now()}`, name, weight, connections: 0, dimension: Math.floor(Math.random() * 7) };
        this.nodes.set(node.id, node);
        return node;
    }

    getNext(): EtherealNode | undefined {
        const nodes = Array.from(this.nodes.values());
        if (nodes.length === 0) return undefined;
        const sorted = nodes.sort((a, b) => a.connections / a.weight - b.connections / b.weight);
        sorted[0].connections++;
        return sorted[0];
    }

    getStats(): { total: number; totalConnections: number } {
        const nodes = Array.from(this.nodes.values());
        return { total: nodes.length, totalConnections: nodes.reduce((s, n) => s + n.connections, 0) };
    }
}

export const etherealLoadBalancer = EtherealLoadBalancer.getInstance();
