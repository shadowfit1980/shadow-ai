/**
 * Text Editor - Rich text editing
 */
import { EventEmitter } from 'events';

export interface TextStyle { fontFamily: string; fontSize: number; fontWeight: 'normal' | 'bold'; fontStyle: 'normal' | 'italic'; color: string; textAlign: 'left' | 'center' | 'right'; lineHeight: number; letterSpacing: number; textDecoration: 'none' | 'underline' | 'line-through'; }
export interface TextBlock { id: string; content: string; style: TextStyle; effects: { shadow?: boolean; outline?: boolean; curve?: number }; }

export class TextEditorEngine extends EventEmitter {
    private static instance: TextEditorEngine;
    private blocks: Map<string, TextBlock> = new Map();
    private fonts = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Playfair Display', 'Oswald', 'Raleway'];
    private constructor() { super(); }
    static getInstance(): TextEditorEngine { if (!TextEditorEngine.instance) TextEditorEngine.instance = new TextEditorEngine(); return TextEditorEngine.instance; }

    create(content: string, style?: Partial<TextStyle>): TextBlock {
        const defaultStyle: TextStyle = { fontFamily: 'Inter', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#000000', textAlign: 'left', lineHeight: 1.5, letterSpacing: 0, textDecoration: 'none' };
        const block: TextBlock = { id: `text_${Date.now()}`, content, style: { ...defaultStyle, ...style }, effects: {} };
        this.blocks.set(block.id, block); this.emit('created', block); return block;
    }

    updateContent(blockId: string, content: string): void { const block = this.blocks.get(blockId); if (block) { block.content = content; this.emit('updated', block); } }
    updateStyle(blockId: string, style: Partial<TextStyle>): void { const block = this.blocks.get(blockId); if (block) { Object.assign(block.style, style); this.emit('styled', block); } }
    addEffect(blockId: string, effect: keyof TextBlock['effects'], value: unknown): void { const block = this.blocks.get(blockId); if (block) (block.effects as Record<string, unknown>)[effect] = value; }
    getFonts(): string[] { return [...this.fonts]; }
    get(blockId: string): TextBlock | null { return this.blocks.get(blockId) || null; }
}
export function getTextEditorEngine(): TextEditorEngine { return TextEditorEngine.getInstance(); }
