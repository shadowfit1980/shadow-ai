/**
 * Dimensional Rope
 */
import { EventEmitter } from 'events';
export class DimensionalRope extends EventEmitter {
    private left: DimensionalRope | null = null;
    private right: DimensionalRope | null = null;
    private str: string = '';
    private len: number = 0;
    constructor(str?: string) { super(); if (str) { this.str = str; this.len = str.length; } }
    static concat(left: DimensionalRope, right: DimensionalRope): DimensionalRope { const rope = new DimensionalRope(); rope.left = left; rope.right = right; rope.len = left.length() + right.length(); return rope; }
    length(): number { return this.len; }
    charAt(index: number): string | undefined { if (index < 0 || index >= this.len) return undefined; if (this.str) return this.str.charAt(index); if (this.left && index < this.left.length()) return this.left.charAt(index); if (this.right) return this.right.charAt(index - (this.left?.length() || 0)); return undefined; }
    toString(): string { if (this.str) return this.str; return (this.left?.toString() || '') + (this.right?.toString() || ''); }
}
export const createRope = (str?: string) => new DimensionalRope(str);
