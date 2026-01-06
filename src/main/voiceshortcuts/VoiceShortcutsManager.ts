/**
 * Voice Shortcuts - Quick voice actions
 */
import { EventEmitter } from 'events';

export interface VoiceShortcut { id: string; name: string; phrase: string; template: string; variables: string[]; }

export class VoiceShortcutsManager extends EventEmitter {
    private static instance: VoiceShortcutsManager;
    private shortcuts: Map<string, VoiceShortcut> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): VoiceShortcutsManager { if (!VoiceShortcutsManager.instance) VoiceShortcutsManager.instance = new VoiceShortcutsManager(); return VoiceShortcutsManager.instance; }

    private initDefaults(): void {
        const defaults: VoiceShortcut[] = [
            { id: 'func', name: 'Create Function', phrase: 'create function', template: 'function {{name}}() {\n  \n}', variables: ['name'] },
            { id: 'class', name: 'Create Class', phrase: 'create class', template: 'class {{name}} {\n  constructor() {\n  }\n}', variables: ['name'] },
            { id: 'import', name: 'Import', phrase: 'import from', template: "import { {{name}} } from '{{module}}';", variables: ['name', 'module'] }
        ];
        defaults.forEach(s => this.shortcuts.set(s.id, s));
    }

    add(name: string, phrase: string, template: string): VoiceShortcut { const vars = (template.match(/\{\{(\w+)\}\}/g) || []).map(v => v.slice(2, -2)); const shortcut: VoiceShortcut = { id: `vs_${Date.now()}`, name, phrase: phrase.toLowerCase(), template, variables: vars }; this.shortcuts.set(shortcut.id, shortcut); return shortcut; }
    match(transcript: string): VoiceShortcut | null { return Array.from(this.shortcuts.values()).find(s => transcript.toLowerCase().includes(s.phrase)) || null; }
    expand(shortcutId: string, values: Record<string, string>): string { const s = this.shortcuts.get(shortcutId); if (!s) return ''; let result = s.template; Object.entries(values).forEach(([k, v]) => { result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v); }); return result; }
    getAll(): VoiceShortcut[] { return Array.from(this.shortcuts.values()); }
}
export function getVoiceShortcutsManager(): VoiceShortcutsManager { return VoiceShortcutsManager.getInstance(); }
