/**
 * Ethereal Sanitize
 */
import { EventEmitter } from 'events';
export class EtherealSanitize extends EventEmitter {
    private static instance: EtherealSanitize;
    private constructor() { super(); }
    static getInstance(): EtherealSanitize { if (!EtherealSanitize.instance) { EtherealSanitize.instance = new EtherealSanitize(); } return EtherealSanitize.instance; }
    sanitizeHtml(str: string): string { return str.replace(/<[^>]*>/g, ''); }
    sanitizeFilename(str: string): string { return str.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_'); }
    getStats(): { sanitized: number } { return { sanitized: 0 }; }
}
export const etherealSanitize = EtherealSanitize.getInstance();
