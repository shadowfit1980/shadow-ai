/**
 * Validator - Input validation
 */
import { EventEmitter } from 'events';

export class Validator extends EventEmitter {
    private static instance: Validator;
    private constructor() { super(); }
    static getInstance(): Validator { if (!Validator.instance) Validator.instance = new Validator(); return Validator.instance; }

    isEmail(str: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str); }
    isURL(str: string): boolean { try { new URL(str); return true; } catch { return false; } }
    isJSON(str: string): boolean { try { JSON.parse(str); return true; } catch { return false; } }
    isUUID(str: string): boolean { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str); }
    isIP(str: string): boolean { return /^(\d{1,3}\.){3}\d{1,3}$/.test(str) || /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i.test(str); }
    isPhone(str: string): boolean { return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(str); }
    isHex(str: string): boolean { return /^#?[0-9a-f]+$/i.test(str); }
    isEmpty(str: string): boolean { return !str || str.trim().length === 0; }
}

export function getValidator(): Validator { return Validator.getInstance(); }
