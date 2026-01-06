/**
 * Dimensional Validated
 */
import { EventEmitter } from 'events';
export class DimensionalValidated<E, A> extends EventEmitter {
    private errors: E[];
    private value: A | undefined;
    private constructor(errors: E[], value?: A) { super(); this.errors = errors; this.value = value; }
    static valid<E, A>(value: A): DimensionalValidated<E, A> { return new DimensionalValidated([], value); }
    static invalid<E, A>(errors: E[]): DimensionalValidated<E, A> { return new DimensionalValidated(errors); }
    isValid(): boolean { return this.errors.length === 0; }
    isInvalid(): boolean { return this.errors.length > 0; }
    getErrors(): E[] { return [...this.errors]; }
    getValue(): A | undefined { return this.value; }
    map<B>(fn: (a: A) => B): DimensionalValidated<E, B> { return this.isValid() ? DimensionalValidated.valid(fn(this.value!)) : DimensionalValidated.invalid(this.errors); }
    combine<B>(other: DimensionalValidated<E, B>): DimensionalValidated<E, [A, B]> { if (this.isValid() && other.isValid()) return DimensionalValidated.valid([this.value!, other.value!]); return DimensionalValidated.invalid([...this.errors, ...other.errors]); }
}
export const valid = <E, A>(value: A) => DimensionalValidated.valid<E, A>(value);
export const invalid = <E, A>(...errors: E[]) => DimensionalValidated.invalid<E, A>(errors);
