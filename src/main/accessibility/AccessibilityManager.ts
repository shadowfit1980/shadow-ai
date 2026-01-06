/**
 * Accessibility Manager - A11y features
 */
import { EventEmitter } from 'events';

export class AccessibilityManager extends EventEmitter {
    private static instance: AccessibilityManager;
    private settings = { highContrast: false, screenReader: false, reducedMotion: false, fontSize: 14 };
    private constructor() { super(); }
    static getInstance(): AccessibilityManager { if (!AccessibilityManager.instance) AccessibilityManager.instance = new AccessibilityManager(); return AccessibilityManager.instance; }
    setHighContrast(v: boolean): void { this.settings.highContrast = v; this.emit('changed', 'highContrast', v); }
    setScreenReader(v: boolean): void { this.settings.screenReader = v; this.emit('changed', 'screenReader', v); }
    setReducedMotion(v: boolean): void { this.settings.reducedMotion = v; this.emit('changed', 'reducedMotion', v); }
    setFontSize(s: number): void { this.settings.fontSize = s; this.emit('changed', 'fontSize', s); }
    getSettings(): typeof this.settings { return { ...this.settings }; }
}
export function getAccessibilityManager(): AccessibilityManager { return AccessibilityManager.getInstance(); }
