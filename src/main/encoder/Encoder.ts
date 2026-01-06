/**
 * Encoder - Base64/URL encoding
 */
import { EventEmitter } from 'events';

export class Encoder extends EventEmitter {
    private static instance: Encoder;
    private constructor() { super(); }
    static getInstance(): Encoder { if (!Encoder.instance) Encoder.instance = new Encoder(); return Encoder.instance; }

    base64Encode(text: string): string { return Buffer.from(text).toString('base64'); }
    base64Decode(text: string): string { return Buffer.from(text, 'base64').toString('utf-8'); }
    urlEncode(text: string): string { return encodeURIComponent(text); }
    urlDecode(text: string): string { return decodeURIComponent(text); }
    htmlEncode(text: string): string { return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)); }
    htmlDecode(text: string): string { return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, e => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[e] || e)); }
}

export function getEncoder(): Encoder { return Encoder.getInstance(); }
