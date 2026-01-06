/**
 * Quantum Accounts Merge
 */
import { EventEmitter } from 'events';
export class QuantumAccountsMerge extends EventEmitter {
    private static instance: QuantumAccountsMerge;
    private constructor() { super(); }
    static getInstance(): QuantumAccountsMerge { if (!QuantumAccountsMerge.instance) { QuantumAccountsMerge.instance = new QuantumAccountsMerge(); } return QuantumAccountsMerge.instance; }
    accountsMerge(accounts: string[][]): string[][] { const emailToName = new Map<string, string>(); const parent = new Map<string, string>(); const find = (x: string): string => { if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!)); return parent.get(x)!; }; for (const acc of accounts) { const name = acc[0]; for (let i = 1; i < acc.length; i++) { emailToName.set(acc[i], name); if (!parent.has(acc[i])) parent.set(acc[i], acc[i]); parent.set(find(acc[i]), find(acc[1])); } } const groups = new Map<string, string[]>(); for (const email of parent.keys()) { const root = find(email); if (!groups.has(root)) groups.set(root, []); groups.get(root)!.push(email); } return [...groups.values()].map(emails => [emailToName.get(emails[0])!, ...emails.sort()]); }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const quantumAccountsMerge = QuantumAccountsMerge.getInstance();
