/**
 * Mystic Dancing Links
 */
import { EventEmitter } from 'events';
class DLXNode { left: DLXNode = this; right: DLXNode = this; up: DLXNode = this; down: DLXNode = this; column: DLXColumn | null = null; row: number = 0; }
class DLXColumn extends DLXNode { size: number = 0; name: number = 0; }
export class MysticDancingLinks extends EventEmitter {
    private header: DLXColumn;
    private columns: DLXColumn[] = [];
    private solutions: number[][] = [];
    constructor(numCols: number) { super(); this.header = new DLXColumn(); let prev = this.header; for (let i = 0; i < numCols; i++) { const col = new DLXColumn(); col.name = i; col.left = prev; prev.right = col; this.columns.push(col); prev = col; } prev.right = this.header; this.header.left = prev; }
    addRow(row: number, cols: number[]): void { let first: DLXNode | null = null; let prev: DLXNode | null = null; for (const c of cols) { const col = this.columns[c]; const node = new DLXNode(); node.column = col; node.row = row; node.up = col.up; node.down = col; col.up.down = node; col.up = node; col.size++; if (first === null) first = node; if (prev !== null) { prev.right = node; node.left = prev; } prev = node; } if (first && prev) { prev.right = first; first.left = prev; } }
    private cover(col: DLXColumn): void { col.right.left = col.left; col.left.right = col.right; for (let row = col.down; row !== col; row = row.down) { for (let node = row.right; node !== row; node = node.right) { node.down.up = node.up; node.up.down = node.down; node.column!.size--; } } }
    private uncover(col: DLXColumn): void { for (let row = col.up; row !== col; row = row.up) { for (let node = row.left; node !== row; node = node.left) { node.column!.size++; node.down.up = node; node.up.down = node; } } col.right.left = col; col.left.right = col; }
    solve(): number[][] { const solution: number[] = []; this.search(solution); return this.solutions; }
    private search(solution: number[]): boolean { if (this.header.right === this.header) { this.solutions.push([...solution]); return true; } let col = this.header.right as DLXColumn; for (let c = this.header.right as DLXColumn; c !== this.header; c = c.right as DLXColumn) if (c.size < col.size) col = c; if (col.size === 0) return false; this.cover(col); for (let row = col.down; row !== col; row = row.down) { solution.push(row.row); for (let node = row.right; node !== row; node = node.right) this.cover(node.column!); this.search(solution); solution.pop(); for (let node = row.left; node !== row; node = node.left) this.uncover(node.column!); } this.uncover(col); return false; }
}
export const createDancingLinks = (numCols: number) => new MysticDancingLinks(numCols);
