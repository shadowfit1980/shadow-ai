/**
 * Color Picker
 * Color utilities and conversion
 */

import { EventEmitter } from 'events';

export interface ColorInfo {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

export class ColorPicker extends EventEmitter {
    private static instance: ColorPicker;
    private savedColors: string[] = [];

    private constructor() { super(); }

    static getInstance(): ColorPicker {
        if (!ColorPicker.instance) ColorPicker.instance = new ColorPicker();
        return ColorPicker.instance;
    }

    hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return match ? { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) } : null;
    }

    rgbToHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        let h = 0, s = 0;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    parseColor(color: string): ColorInfo | null {
        const rgb = this.hexToRgb(color);
        if (!rgb) return null;
        return { hex: color.startsWith('#') ? color : '#' + color, rgb, hsl: this.rgbToHsl(rgb.r, rgb.g, rgb.b) };
    }

    saveColor(color: string): void { if (!this.savedColors.includes(color)) this.savedColors.push(color); }
    getSaved(): string[] { return [...this.savedColors]; }
}

export function getColorPicker(): ColorPicker { return ColorPicker.getInstance(); }
