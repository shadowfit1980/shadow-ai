/**
 * Inline Edit - Inline code editing
 */
import { EventEmitter } from 'events';

export interface InlineEditRequest { file: string; line: number; instruction: string; }
export interface InlineEditResult { id: string; original: string; modified: string; file: string; line: number; }

export class InlineEditManager extends EventEmitter {
    private static instance: InlineEditManager;
    private edits: InlineEditResult[] = [];
    private constructor() { super(); }
    static getInstance(): InlineEditManager { if (!InlineEditManager.instance) InlineEditManager.instance = new InlineEditManager(); return InlineEditManager.instance; }

    async edit(request: InlineEditRequest, originalLine: string): Promise<InlineEditResult> {
        const result: InlineEditResult = { id: `inline_${Date.now()}`, original: originalLine, modified: `// ${request.instruction}\n${originalLine}`, file: request.file, line: request.line };
        this.edits.push(result);
        this.emit('edited', result);
        return result;
    }

    async multiLineEdit(file: string, startLine: number, endLine: number, instruction: string): Promise<InlineEditResult[]> {
        const results: InlineEditResult[] = [];
        for (let line = startLine; line <= endLine; line++) {
            results.push(await this.edit({ file, line, instruction }, `// line ${line}`));
        }
        return results;
    }

    getHistory(): InlineEditResult[] { return [...this.edits]; }
    undo(): InlineEditResult | null { return this.edits.pop() || null; }
}
export function getInlineEditManager(): InlineEditManager { return InlineEditManager.getInstance(); }
