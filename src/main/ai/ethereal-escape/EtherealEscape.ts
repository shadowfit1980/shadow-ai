/**
 * Ethereal Escape
 */
import { EventEmitter } from 'events';
export class EtherealEscape extends EventEmitter {
    private static instance: EtherealEscape;
    private constructor() { super(); }
    static getInstance(): EtherealEscape { if (!EtherealEscape.instance) { EtherealEscape.instance = new EtherealEscape(); } return EtherealEscape.instance; }
    escapeHtml(str: string): string { const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }; return str.replace(/[&<>"']/g, c => map[c]); }
    unescapeHtml(str: string): string { const map: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }; return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, c => map[c]); }
    getStats(): { escaped: number } { return { escaped: 0 }; }
}
export const etherealEscape = EtherealEscape.getInstance();
