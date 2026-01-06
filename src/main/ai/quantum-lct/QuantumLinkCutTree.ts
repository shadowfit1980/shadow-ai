/**
 * Quantum Link Cut Tree
 */
import { EventEmitter } from 'events';
class LCTNode { parent: LCTNode | null = null; left: LCTNode | null = null; right: LCTNode | null = null; pathParent: LCTNode | null = null; reversed: boolean = false; value: number; constructor(value: number) { this.value = value; } }
export class QuantumLinkCutTree extends EventEmitter {
    private nodes: LCTNode[] = [];
    constructor(n: number) { super(); for (let i = 0; i < n; i++) this.nodes.push(new LCTNode(i)); }
    private isRoot(v: LCTNode): boolean { return !v.parent || (v.parent.left !== v && v.parent.right !== v); }
    private push(v: LCTNode): void { if (v.reversed) { [v.left, v.right] = [v.right, v.left]; if (v.left) v.left.reversed = !v.left.reversed; if (v.right) v.right.reversed = !v.right.reversed; v.reversed = false; } }
    private rotate(v: LCTNode): void { const p = v.parent!; const g = p.parent; if (g) { if (g.left === p) g.left = v; else if (g.right === p) g.right = v; } v.parent = g; if (p.left === v) { p.left = v.right; if (v.right) v.right.parent = p; v.right = p; } else { p.right = v.left; if (v.left) v.left.parent = p; v.left = p; } p.parent = v; v.pathParent = p.pathParent; p.pathParent = null; }
    private splay(v: LCTNode): void { while (!this.isRoot(v)) { const p = v.parent!; if (!this.isRoot(p)) { const g = p.parent!; this.push(g); this.push(p); this.push(v); if ((g.left === p) === (p.left === v)) this.rotate(p); else this.rotate(v); } else { this.push(p); this.push(v); } this.rotate(v); } this.push(v); }
    private access(v: LCTNode): void { this.splay(v); v.right = null; while (v.pathParent) { const w = v.pathParent; this.splay(w); w.right = v; v.pathParent = null; this.splay(v); } }
    link(u: number, v: number): void { const uNode = this.nodes[u]; const vNode = this.nodes[v]; this.access(uNode); this.access(vNode); uNode.reversed = true; uNode.pathParent = vNode; }
    cut(v: number): void { const vNode = this.nodes[v]; this.access(vNode); if (vNode.left) { vNode.left.parent = null; vNode.left = null; } }
    findRoot(v: number): number { const vNode = this.nodes[v]; this.access(vNode); let root = vNode; while (root.left) { this.push(root); root = root.left; } this.splay(root); return root.value; }
    connected(u: number, v: number): boolean { return this.findRoot(u) === this.findRoot(v); }
}
export const createLinkCutTree = (n: number) => new QuantumLinkCutTree(n);
