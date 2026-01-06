/**
 * Quantum Trim
 */
import { EventEmitter } from 'events';
export class QuantumTrim extends EventEmitter {
    private static instance: QuantumTrim;
    private constructor() { super(); }
    static getInstance(): QuantumTrim { if (!QuantumTrim.instance) { QuantumTrim.instance = new QuantumTrim(); } return QuantumTrim.instance; }
    trim(str: string, chars?: string): string { if (!chars) return str.trim(); const regex = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g'); return str.replace(regex, ''); }
    trimStart(str: string, chars?: string): string { if (!chars) return str.trimStart(); return str.replace(new RegExp(`^[${chars}]+`), ''); }
    trimEnd(str: string, chars?: string): string { if (!chars) return str.trimEnd(); return str.replace(new RegExp(`[${chars}]+$`), ''); }
    getStats(): { trimmed: number } { return { trimmed: 0 }; }
}
export const quantumTrim = QuantumTrim.getInstance();
