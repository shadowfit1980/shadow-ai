/**
 * Astral Camel Case
 */
import { EventEmitter } from 'events';
export class AstralCamelCase extends EventEmitter {
    private static instance: AstralCamelCase;
    private constructor() { super(); }
    static getInstance(): AstralCamelCase { if (!AstralCamelCase.instance) { AstralCamelCase.instance = new AstralCamelCase(); } return AstralCamelCase.instance; }
    camelCase(str: string): string { return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, c => c.toLowerCase()); }
    snakeCase(str: string): string { return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[-\s]+/g, '_'); }
    kebabCase(str: string): string { return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/[_\s]+/g, '-'); }
    getStats(): { converted: number } { return { converted: 0 }; }
}
export const astralCamelCase = AstralCamelCase.getInstance();
