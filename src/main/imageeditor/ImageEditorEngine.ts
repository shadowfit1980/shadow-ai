/**
 * Image Editor - Image manipulation
 */
import { EventEmitter } from 'events';

export interface ImageFilters { brightness: number; contrast: number; saturation: number; blur: number; grayscale: boolean; sepia: boolean; }
export interface ImageEdit { id: string; src: string; filters: ImageFilters; crop: { x: number; y: number; width: number; height: number } | null; flip: { horizontal: boolean; vertical: boolean }; rotation: number; }

export class ImageEditorEngine extends EventEmitter {
    private static instance: ImageEditorEngine;
    private edits: Map<string, ImageEdit> = new Map();
    private constructor() { super(); }
    static getInstance(): ImageEditorEngine { if (!ImageEditorEngine.instance) ImageEditorEngine.instance = new ImageEditorEngine(); return ImageEditorEngine.instance; }

    load(src: string): ImageEdit {
        const edit: ImageEdit = { id: `img_${Date.now()}`, src, filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: false, sepia: false }, crop: null, flip: { horizontal: false, vertical: false }, rotation: 0 };
        this.edits.set(edit.id, edit); this.emit('loaded', edit); return edit;
    }

    applyFilter(editId: string, filter: keyof ImageFilters, value: unknown): void { const edit = this.edits.get(editId); if (edit) { (edit.filters as unknown as Record<string, unknown>)[filter] = value; this.emit('filtered', edit); } }
    crop(editId: string, x: number, y: number, width: number, height: number): void { const edit = this.edits.get(editId); if (edit) { edit.crop = { x, y, width, height }; this.emit('cropped', edit); } }
    flip(editId: string, direction: 'horizontal' | 'vertical'): void { const edit = this.edits.get(editId); if (edit) edit.flip[direction] = !edit.flip[direction]; }
    rotate(editId: string, degrees: number): void { const edit = this.edits.get(editId); if (edit) edit.rotation = (edit.rotation + degrees) % 360; }
    removeBackground(editId: string): Promise<void> { return new Promise(r => { this.emit('bgRemoved', editId); setTimeout(r, 500); }); }
    toCSS(editId: string): string { const e = this.edits.get(editId); if (!e) return ''; return `filter: brightness(${e.filters.brightness}%) contrast(${e.filters.contrast}%) saturate(${e.filters.saturation}%) ${e.filters.grayscale ? 'grayscale(1)' : ''} ${e.filters.sepia ? 'sepia(1)' : ''} blur(${e.filters.blur}px); transform: rotate(${e.rotation}deg) ${e.flip.horizontal ? 'scaleX(-1)' : ''} ${e.flip.vertical ? 'scaleY(-1)' : ''};`; }
    get(editId: string): ImageEdit | null { return this.edits.get(editId) || null; }
}
export function getImageEditorEngine(): ImageEditorEngine { return ImageEditorEngine.getInstance(); }
