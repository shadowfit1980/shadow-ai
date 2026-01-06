/**
 * Ethereal KMP Matcher
 */
import { EventEmitter } from 'events';
export class EtherealKMPMatcher extends EventEmitter {
    private static instance: EtherealKMPMatcher;
    private constructor() { super(); }
    static getInstance(): EtherealKMPMatcher { if (!EtherealKMPMatcher.instance) { EtherealKMPMatcher.instance = new EtherealKMPMatcher(); } return EtherealKMPMatcher.instance; }
    search(text: string, pattern: string): number[] { const indices: number[] = []; let idx = text.indexOf(pattern); while (idx >= 0) { indices.push(idx); idx = text.indexOf(pattern, idx + 1); } return indices; }
    getStats(): { matches: number } { return { matches: 0 }; }
}
export const etherealKMPMatcher = EtherealKMPMatcher.getInstance();
