/**
 * Quantum Graph Coloring
 */
import { EventEmitter } from 'events';
export class QuantumGraphColoring extends EventEmitter {
    private n: number;
    private adj: boolean[][];
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => new Array(n).fill(false)); }
    addEdge(u: number, v: number): void { this.adj[u][v] = true; this.adj[v][u] = true; }
    greedyColoring(): number[] { const colors = new Array(this.n).fill(-1); colors[0] = 0; for (let u = 1; u < this.n; u++) { const usedColors = new Set<number>(); for (let v = 0; v < this.n; v++) { if (this.adj[u][v] && colors[v] !== -1) usedColors.add(colors[v]); } let c = 0; while (usedColors.has(c)) c++; colors[u] = c; } return colors; }
    welshPowell(): number[] { const degrees = Array.from({ length: this.n }, (_, i) => ({ node: i, degree: this.adj[i].filter(x => x).length })); degrees.sort((a, b) => b.degree - a.degree); const colors = new Array(this.n).fill(-1); let color = 0; for (const { node } of degrees) { if (colors[node] !== -1) continue; colors[node] = color; for (const { node: other } of degrees) { if (colors[other] !== -1 || this.adj[node][other]) continue; let canColor = true; for (let v = 0; v < this.n; v++) { if (this.adj[other][v] && colors[v] === color) { canColor = false; break; } } if (canColor) colors[other] = color; } color++; } return colors; }
    chromaticNumber(maxColors: number): number { for (let k = 1; k <= maxColors; k++) { if (this.canColorWithK(k)) return k; } return -1; }
    private canColorWithK(k: number): boolean { const colors = new Array(this.n).fill(-1); const solve = (node: number): boolean => { if (node === this.n) return true; for (let c = 0; c < k; c++) { if (this.isSafe(node, c, colors)) { colors[node] = c; if (solve(node + 1)) return true; colors[node] = -1; } } return false; }; return solve(0); }
    private isSafe(node: number, color: number, colors: number[]): boolean { for (let v = 0; v < this.n; v++) { if (this.adj[node][v] && colors[v] === color) return false; } return true; }
}
export const createGraphColoring = (n: number) => new QuantumGraphColoring(n);
