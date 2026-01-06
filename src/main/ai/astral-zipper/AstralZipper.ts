/**
 * Astral Zipper
 */
import { EventEmitter } from 'events';
export class AstralZipper<T> extends EventEmitter {
    private left: T[];
    private focus: T;
    private right: T[];
    private constructor(left: T[], focus: T, right: T[]) { super(); this.left = left; this.focus = focus; this.right = right; }
    static fromArray<T>(arr: T[]): AstralZipper<T> | null { if (arr.length === 0) return null; const [focus, ...right] = arr; return new AstralZipper([], focus, right); }
    getFocus(): T { return this.focus; }
    moveLeft(): AstralZipper<T> | null { if (this.left.length === 0) return null; const newFocus = this.left[this.left.length - 1]; return new AstralZipper(this.left.slice(0, -1), newFocus, [this.focus, ...this.right]); }
    moveRight(): AstralZipper<T> | null { if (this.right.length === 0) return null; const [newFocus, ...newRight] = this.right; return new AstralZipper([...this.left, this.focus], newFocus, newRight); }
    modify(fn: (focus: T) => T): AstralZipper<T> { return new AstralZipper(this.left, fn(this.focus), this.right); }
    toArray(): T[] { return [...this.left, this.focus, ...this.right]; }
}
export const zipper = <T>(arr: T[]) => AstralZipper.fromArray(arr);
