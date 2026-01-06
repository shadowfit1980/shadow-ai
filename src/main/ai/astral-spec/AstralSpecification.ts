/**
 * Astral Specification
 */
import { EventEmitter } from 'events';
export interface Specification<T> { isSatisfiedBy(candidate: T): boolean; }
export class AstralSpecification<T> extends EventEmitter implements Specification<T> {
    private predicate: (candidate: T) => boolean;
    constructor(predicate: (candidate: T) => boolean) { super(); this.predicate = predicate; }
    isSatisfiedBy(candidate: T): boolean { return this.predicate(candidate); }
    and(other: Specification<T>): AstralSpecification<T> { return new AstralSpecification<T>(c => this.isSatisfiedBy(c) && other.isSatisfiedBy(c)); }
    or(other: Specification<T>): AstralSpecification<T> { return new AstralSpecification<T>(c => this.isSatisfiedBy(c) || other.isSatisfiedBy(c)); }
    not(): AstralSpecification<T> { return new AstralSpecification<T>(c => !this.isSatisfiedBy(c)); }
}
export const createSpecification = <T>(predicate: (c: T) => boolean) => new AstralSpecification<T>(predicate);
