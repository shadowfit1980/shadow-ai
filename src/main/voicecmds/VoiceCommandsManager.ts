/**
 * Voice Commands - Spoken actions
 */
import { EventEmitter } from 'events';

export interface VoiceCommand { id: string; phrase: string; action: string; enabled: boolean; }

export class VoiceCommandsManager extends EventEmitter {
    private static instance: VoiceCommandsManager;
    private commands: Map<string, VoiceCommand> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): VoiceCommandsManager { if (!VoiceCommandsManager.instance) VoiceCommandsManager.instance = new VoiceCommandsManager(); return VoiceCommandsManager.instance; }

    private initDefaults(): void {
        const defaults: VoiceCommand[] = [
            { id: 'undo', phrase: 'undo', action: 'edit.undo', enabled: true },
            { id: 'redo', phrase: 'redo', action: 'edit.redo', enabled: true },
            { id: 'save', phrase: 'save file', action: 'file.save', enabled: true },
            { id: 'run', phrase: 'run code', action: 'run.execute', enabled: true },
            { id: 'search', phrase: 'search for', action: 'search.open', enabled: true }
        ];
        defaults.forEach(c => this.commands.set(c.id, c));
    }

    register(phrase: string, action: string): VoiceCommand { const cmd: VoiceCommand = { id: `cmd_${Date.now()}`, phrase: phrase.toLowerCase(), action, enabled: true }; this.commands.set(cmd.id, cmd); return cmd; }
    match(transcript: string): VoiceCommand | null { const t = transcript.toLowerCase(); return Array.from(this.commands.values()).find(c => c.enabled && t.includes(c.phrase)) || null; }
    toggle(commandId: string): boolean { const c = this.commands.get(commandId); if (!c) return false; c.enabled = !c.enabled; return true; }
    getAll(): VoiceCommand[] { return Array.from(this.commands.values()); }
}
export function getVoiceCommandsManager(): VoiceCommandsManager { return VoiceCommandsManager.getInstance(); }
