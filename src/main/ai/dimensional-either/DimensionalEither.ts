/**
 * Dimensional Either
 */
import { EventEmitter } from 'events';
export class DimensionalEither<L, R> extends EventEmitter {
    private left: L | undefined;
    private right: R | undefined;
    private constructor(left?: L, right?: R) { super(); this.left = left; this.right = right; }
    static left<L, R>(value: L): DimensionalEither<L, R> { return new DimensionalEither<L, R>(value); }
    static right<L, R>(value: R): DimensionalEither<L, R> { return new DimensionalEither<L, R>(undefined, value); }
    isLeft(): boolean { return this.left !== undefined; }
    isRight(): boolean { return this.right !== undefined; }
    getLeft(): L { if (!this.isLeft()) throw new Error('Not left'); return this.left!; }
    getRight(): R { if (!this.isRight()) throw new Error('Not right'); return this.right!; }
    fold<T>(leftFn: (l: L) => T, rightFn: (r: R) => T): T { return this.isLeft() ? leftFn(this.left!) : rightFn(this.right!); }
}
