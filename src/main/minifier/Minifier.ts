/**
 * Minifier - Code minification
 */
import { EventEmitter } from 'events';

export class Minifier extends EventEmitter {
    private static instance: Minifier;
    private constructor() { super(); }
    static getInstance(): Minifier { if (!Minifier.instance) Minifier.instance = new Minifier(); return Minifier.instance; }

    minifyJS(code: string): string {
        return code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim();
    }

    minifyCSS(code: string): string {
        return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};:,])\s*/g, '$1').trim();
    }

    minifyHTML(code: string): string {
        return code.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    }

    minifyJSON(code: string): string {
        try { return JSON.stringify(JSON.parse(code)); } catch { return code; }
    }
}

export function getMinifier(): Minifier { return Minifier.getInstance(); }
