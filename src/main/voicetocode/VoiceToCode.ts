/**
 * Voice To Code - Speech to code
 */
import { EventEmitter } from 'events';

export interface VoiceCodeSession { id: string; language: string; code: string; transcript: string; status: 'listening' | 'processing' | 'complete'; }

export class VoiceToCode extends EventEmitter {
    private static instance: VoiceToCode;
    private sessions: Map<string, VoiceCodeSession> = new Map();
    private constructor() { super(); }
    static getInstance(): VoiceToCode { if (!VoiceToCode.instance) VoiceToCode.instance = new VoiceToCode(); return VoiceToCode.instance; }

    start(language: string): VoiceCodeSession {
        const session: VoiceCodeSession = { id: `vc_${Date.now()}`, language, code: '', transcript: '', status: 'listening' };
        this.sessions.set(session.id, session); this.emit('started', session); return session;
    }

    process(sessionId: string, transcript: string): string {
        const s = this.sessions.get(sessionId); if (!s) return '';
        s.transcript = transcript; s.status = 'processing';
        s.code = this.transcriptToCode(transcript, s.language);
        s.status = 'complete'; this.emit('processed', s); return s.code;
    }

    private transcriptToCode(transcript: string, language: string): string {
        let code = transcript.replace(/new line/gi, '\n').replace(/indent/gi, '  ').replace(/open brace/gi, '{').replace(/close brace/gi, '}').replace(/semicolon/gi, ';').replace(/equals/gi, '=');
        return code;
    }

    get(sessionId: string): VoiceCodeSession | null { return this.sessions.get(sessionId) || null; }
}
export function getVoiceToCode(): VoiceToCode { return VoiceToCode.getInstance(); }
