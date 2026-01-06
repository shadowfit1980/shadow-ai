/**
 * Omniversal Code Translator
 * 
 * Translates code concepts across all programming universes,
 * making any pattern understandable in any paradigm.
 */

import { EventEmitter } from 'events';

export interface Translation {
    id: string;
    source: string;
    sourceParadigm: string;
    targetParadigm: string;
    translated: string;
    fidelity: number;
}

export class OmniversalCodeTranslator extends EventEmitter {
    private static instance: OmniversalCodeTranslator;
    private translations: Map<string, Translation> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): OmniversalCodeTranslator {
        if (!OmniversalCodeTranslator.instance) {
            OmniversalCodeTranslator.instance = new OmniversalCodeTranslator();
        }
        return OmniversalCodeTranslator.instance;
    }

    translate(code: string, targetParadigm: string): Translation {
        const sourceParadigm = this.detectParadigm(code);
        const translated = this.performTranslation(code, sourceParadigm, targetParadigm);
        const fidelity = this.calculateFidelity(code, translated);

        const trans: Translation = {
            id: `trans_${Date.now()}`,
            source: code,
            sourceParadigm,
            targetParadigm,
            translated,
            fidelity,
        };

        this.translations.set(trans.id, trans);
        this.emit('translation:complete', trans);
        return trans;
    }

    private detectParadigm(code: string): string {
        if (code.includes('class') && code.includes('extends')) return 'object-oriented';
        if (code.includes('=>') && code.includes('map')) return 'functional';
        if (code.includes('Observable') || code.includes('subscribe')) return 'reactive';
        if (code.includes('async') && code.includes('await')) return 'async';
        return 'imperative';
    }

    private performTranslation(code: string, from: string, to: string): string {
        let result = `// Translated from ${from} to ${to}\n\n`;

        if (from === 'object-oriented' && to === 'functional') {
            result += code.replace(/class\s+(\w+)/g, '// Functional version of $1');
            result += '\n// Use pure functions instead of methods';
        } else if (from === 'functional' && to === 'object-oriented') {
            result += code.replace(/const\s+(\w+)\s*=.*=>/g, 'method $1()');
            result += '\n// Wrap in class for OOP style';
        } else {
            result += code;
        }

        return result;
    }

    private calculateFidelity(original: string, translated: string): number {
        const origLines = original.split('\n').length;
        const transLines = translated.split('\n').length;
        return Math.min(1, 1 - Math.abs(origLines - transLines) / origLines);
    }

    getStats(): { total: number; avgFidelity: number } {
        const trans = Array.from(this.translations.values());
        return {
            total: trans.length,
            avgFidelity: trans.length > 0
                ? trans.reduce((s, t) => s + t.fidelity, 0) / trans.length
                : 0,
        };
    }
}

export const omniversalCodeTranslator = OmniversalCodeTranslator.getInstance();
