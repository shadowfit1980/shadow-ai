/**
 * Mystic Visitor
 */
import { EventEmitter } from 'events';
export interface Visitor<T> { visit(element: T): void; }
export interface Visitable<T> { accept(visitor: Visitor<T>): void; }
export class MysticVisitorPattern<T> extends EventEmitter {
    private elements: Visitable<T>[] = [];
    add(element: Visitable<T>): void { this.elements.push(element); }
    traverse(visitor: Visitor<T>): void { for (const elem of this.elements) elem.accept(visitor); }
}
export const createVisitorPattern = <T>() => new MysticVisitorPattern<T>();
