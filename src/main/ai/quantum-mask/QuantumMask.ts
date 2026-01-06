/**
 * Quantum Mask
 */
import { EventEmitter } from 'events';
export class QuantumMask extends EventEmitter {
    private static instance: QuantumMask;
    private constructor() { super(); }
    static getInstance(): QuantumMask { if (!QuantumMask.instance) { QuantumMask.instance = new QuantumMask(); } return QuantumMask.instance; }
    maskEmail(email: string): string { const [local, domain] = email.split('@'); if (!domain) return email; const masked = local.length <= 2 ? local : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]; return `${masked}@${domain}`; }
    maskPhone(phone: string): string { const digits = phone.replace(/\D/g, ''); return digits.length <= 4 ? phone : '*'.repeat(digits.length - 4) + digits.slice(-4); }
    maskCard(card: string): string { const digits = card.replace(/\D/g, ''); return '*'.repeat(digits.length - 4) + digits.slice(-4); }
    getStats(): { masked: number } { return { masked: 0 }; }
}
export const quantumMask = QuantumMask.getInstance();
