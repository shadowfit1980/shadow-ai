/**
 * Astral Suffix Automaton
 */
import { EventEmitter } from 'events';
interface SAState { len: number; link: number; next: Map<string, number>; }
export class AstralSuffixAutomaton extends EventEmitter {
    private states: SAState[] = [];
    private last: number = 0;
    constructor() { super(); this.states.push({ len: 0, link: -1, next: new Map() }); }
    extend(c: string): void { const cur = this.states.length; this.states.push({ len: this.states[this.last].len + 1, link: 0, next: new Map() }); let p = this.last; while (p !== -1 && !this.states[p].next.has(c)) { this.states[p].next.set(c, cur); p = this.states[p].link; } if (p === -1) { this.states[cur].link = 0; } else { const q = this.states[p].next.get(c)!; if (this.states[p].len + 1 === this.states[q].len) { this.states[cur].link = q; } else { const clone = this.states.length; this.states.push({ len: this.states[p].len + 1, link: this.states[q].link, next: new Map(this.states[q].next) }); while (p !== -1 && this.states[p].next.get(c) === q) { this.states[p].next.set(c, clone); p = this.states[p].link; } this.states[q].link = clone; this.states[cur].link = clone; } } this.last = cur; }
    build(s: string): void { for (const c of s) this.extend(c); }
    countDistinctSubstrings(): number { let count = 0; for (let i = 1; i < this.states.length; i++) count += this.states[i].len - this.states[this.states[i].link].len; return count; }
    contains(pattern: string): boolean { let state = 0; for (const c of pattern) { if (!this.states[state].next.has(c)) return false; state = this.states[state].next.get(c)!; } return true; }
}
export const createSuffixAutomaton = () => new AstralSuffixAutomaton();
