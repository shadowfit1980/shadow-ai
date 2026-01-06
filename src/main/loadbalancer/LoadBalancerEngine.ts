/**
 * Load Balancer - Request distribution
 */
import { EventEmitter } from 'events';

export interface LoadBalancerTarget { id: string; endpoint: string; weight: number; healthy: boolean; activeConnections: number; }
export interface LoadBalancerConfig { id: string; name: string; algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'random'; targets: LoadBalancerTarget[]; }

export class LoadBalancerEngine extends EventEmitter {
    private static instance: LoadBalancerEngine;
    private balancers: Map<string, LoadBalancerConfig> = new Map();
    private roundRobinIndex: Map<string, number> = new Map();
    private constructor() { super(); }
    static getInstance(): LoadBalancerEngine { if (!LoadBalancerEngine.instance) LoadBalancerEngine.instance = new LoadBalancerEngine(); return LoadBalancerEngine.instance; }

    create(name: string, algorithm: LoadBalancerConfig['algorithm'] = 'round_robin'): LoadBalancerConfig { const lb: LoadBalancerConfig = { id: `lb_${Date.now()}`, name, algorithm, targets: [] }; this.balancers.set(lb.id, lb); return lb; }
    addTarget(lbId: string, endpoint: string, weight = 1): boolean { const lb = this.balancers.get(lbId); if (!lb) return false; lb.targets.push({ id: `tgt_${Date.now()}`, endpoint, weight, healthy: true, activeConnections: 0 }); return true; }

    getNext(lbId: string): LoadBalancerTarget | null {
        const lb = this.balancers.get(lbId); if (!lb) return null;
        const healthy = lb.targets.filter(t => t.healthy); if (healthy.length === 0) return null;
        if (lb.algorithm === 'round_robin') { const idx = (this.roundRobinIndex.get(lbId) || 0) % healthy.length; this.roundRobinIndex.set(lbId, idx + 1); return healthy[idx]; }
        if (lb.algorithm === 'least_connections') return healthy.reduce((min, t) => t.activeConnections < min.activeConnections ? t : min);
        if (lb.algorithm === 'weighted') { const total = healthy.reduce((s, t) => s + t.weight, 0); let r = Math.random() * total; for (const t of healthy) { r -= t.weight; if (r <= 0) return t; } }
        return healthy[Math.floor(Math.random() * healthy.length)];
    }

    setHealthy(lbId: string, targetId: string, healthy: boolean): void { const lb = this.balancers.get(lbId); if (!lb) return; const target = lb.targets.find(t => t.id === targetId); if (target) target.healthy = healthy; }
    getAll(): LoadBalancerConfig[] { return Array.from(this.balancers.values()); }
}
export function getLoadBalancerEngine(): LoadBalancerEngine { return LoadBalancerEngine.getInstance(); }
