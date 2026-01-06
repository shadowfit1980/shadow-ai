/**
 * Code Styler - Code formatting
 */
import { EventEmitter } from 'events';

export interface CodeStyle { indent: 'tabs' | 'spaces'; indentSize: number; lineWidth: number; semicolons: boolean; quotes: 'single' | 'double'; trailingComma: boolean; }

export class CodeStyler extends EventEmitter {
    private static instance: CodeStyler;
    private style: CodeStyle = { indent: 'spaces', indentSize: 2, lineWidth: 100, semicolons: true, quotes: 'single', trailingComma: true };
    private constructor() { super(); }
    static getInstance(): CodeStyler { if (!CodeStyler.instance) CodeStyler.instance = new CodeStyler(); return CodeStyler.instance; }

    setStyle(style: Partial<CodeStyle>): void { this.style = { ...this.style, ...style }; this.emit('styleChanged', this.style); }
    getStyle(): CodeStyle { return { ...this.style }; }

    format(code: string): string {
        let formatted = code;
        if (this.style.quotes === 'single') formatted = formatted.replace(/"/g, "'");
        if (!this.style.semicolons) formatted = formatted.replace(/;(\s*\n)/g, '$1');
        const indent = this.style.indent === 'tabs' ? '\t' : ' '.repeat(this.style.indentSize);
        formatted = formatted.replace(/^(\s+)/gm, (match) => indent.repeat(Math.floor(match.length / (this.style.indent === 'tabs' ? 1 : this.style.indentSize))));
        this.emit('formatted', { length: formatted.length }); return formatted;
    }

    reindent(code: string, newIndent: number): string { return code.replace(/^(\s+)/gm, (m) => ' '.repeat(newIndent * Math.ceil(m.length / this.style.indentSize))); }
}
export function getCodeStyler(): CodeStyler { return CodeStyler.getInstance(); }
