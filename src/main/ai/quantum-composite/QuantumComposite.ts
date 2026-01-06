/**
 * Quantum Composite
 */
import { EventEmitter } from 'events';
export interface Component { operation(): string; }
export class QuantumComposite extends EventEmitter implements Component {
    private children: Component[] = [];
    add(component: Component): void { this.children.push(component); }
    remove(component: Component): void { this.children = this.children.filter(c => c !== component); }
    operation(): string { return this.children.map(c => c.operation()).join(', '); }
    getChildren(): Component[] { return [...this.children]; }
}
export const createComposite = () => new QuantumComposite();
