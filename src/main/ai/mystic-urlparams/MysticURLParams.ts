/**
 * Mystic URL Params
 */
import { EventEmitter } from 'events';
export class MysticURLParams extends EventEmitter {
    private static instance: MysticURLParams;
    private constructor() { super(); }
    static getInstance(): MysticURLParams { if (!MysticURLParams.instance) { MysticURLParams.instance = new MysticURLParams(); } return MysticURLParams.instance; }
    parse(queryString: string): Record<string, string> { const params: Record<string, string> = {}; const cleaned = queryString.replace(/^\?/, ''); for (const part of cleaned.split('&')) { const [key, value] = part.split('='); if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || ''); } return params; }
    stringify(params: Record<string, string>): string { return Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); }
    getStats(): { parsed: number } { return { parsed: 0 }; }
}
export const mysticURLParams = MysticURLParams.getInstance();
