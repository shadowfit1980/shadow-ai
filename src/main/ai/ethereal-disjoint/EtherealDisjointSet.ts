/**
 * Ethereal Disjoint Set
 */
import { EventEmitter } from 'events';
export class EtherealDisjointSet extends EventEmitter {
    private static instance: EtherealDisjointSet;
    private parent: Map<string, string> = new Map();
    private constructor() { super(); }
    static getInstance(): EtherealDisjointSet { if (!EtherealDisjointSet.instance) { EtherealDisjointSet.instance = new EtherealDisjointSet(); } return EtherealDisjointSet.instance; }
    makeSet(x: string): void { this.parent.set(x, x); }
    find(x: string): string { if (this.parent.get(x) === x) return x; const root = this.find(this.parent.get(x)!); this.parent.set(x, root); return root; }
    union(x: string, y: string): void { const xRoot = this.find(x); const yRoot = this.find(y); if (xRoot !== yRoot) this.parent.set(xRoot, yRoot); }
    getStats(): { size: number } { return { size: this.parent.size }; }
}
export const etherealDisjointSet = EtherealDisjointSet.getInstance();
