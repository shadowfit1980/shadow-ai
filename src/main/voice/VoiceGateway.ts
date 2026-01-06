/**
 * Voice Gateway
 * SIP/WebRTC phone call handling for AI voice agents
 * Integrates with Twilio or Vapi.ai for phone connectivity
 */

import { EventEmitter } from 'events';

export interface VoiceConfig {
    provider: 'twilio' | 'vapi' | 'custom';
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    phoneNumber?: string;
    webhookUrl?: string;
}

export interface VoiceCall {
    id: string;
    direction: 'inbound' | 'outbound';
    from: string;
    to: string;
    status: 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
    startTime: number;
    endTime?: number;
    duration?: number;
    recordingUrl?: string;
    transcript?: string;
}

export interface TTSOptions {
    voice?: string;
    speed?: number;
    pitch?: number;
    language?: string;
}

export interface STTOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
}

/**
 * VoiceGateway
 * Manages phone call connectivity and voice AI interactions
 */
export class VoiceGateway extends EventEmitter {
    private static instance: VoiceGateway;
    private config: VoiceConfig | null = null;
    private activeCalls: Map<string, VoiceCall> = new Map();
    private callCounter = 0;

    private constructor() {
        super();
    }

    static getInstance(): VoiceGateway {
        if (!VoiceGateway.instance) {
            VoiceGateway.instance = new VoiceGateway();
        }
        return VoiceGateway.instance;
    }

    /**
     * Initialize voice gateway with provider config
     */
    async initialize(config: VoiceConfig): Promise<void> {
        this.config = config;

        // Validate configuration
        if (config.provider === 'twilio') {
            if (!config.accountSid || !config.authToken) {
                throw new Error('Twilio requires accountSid and authToken');
            }
        } else if (config.provider === 'vapi') {
            if (!config.apiKey) {
                throw new Error('Vapi requires apiKey');
            }
        }

        console.log(`✅ VoiceGateway initialized with ${config.provider}`);
        this.emit('initialized', { provider: config.provider });
    }

    /**
     * Make outbound call
     */
    async makeCall(to: string, options?: {
        from?: string;
        greeting?: string;
        agentScript?: string;
    }): Promise<VoiceCall> {
        if (!this.config) {
            throw new Error('VoiceGateway not initialized');
        }

        const callId = `call_${++this.callCounter}_${Date.now()}`;

        const call: VoiceCall = {
            id: callId,
            direction: 'outbound',
            from: options?.from || this.config.phoneNumber || 'unknown',
            to,
            status: 'ringing',
            startTime: Date.now(),
        };

        this.activeCalls.set(callId, call);
        this.emit('callStarted', call);

        // Simulate call establishment (would use actual Twilio/Vapi SDK)
        if (this.config.provider === 'twilio') {
            await this.twilioMakeCall(call, options);
        } else if (this.config.provider === 'vapi') {
            await this.vapiMakeCall(call, options);
        }

        return call;
    }

    /**
     * Handle incoming call
     */
    async handleIncomingCall(callData: {
        callSid: string;
        from: string;
        to: string;
    }): Promise<VoiceCall> {
        const call: VoiceCall = {
            id: callData.callSid,
            direction: 'inbound',
            from: callData.from,
            to: callData.to,
            status: 'ringing',
            startTime: Date.now(),
        };

        this.activeCalls.set(call.id, call);
        this.emit('incomingCall', call);

        return call;
    }

    /**
     * Answer incoming call
     */
    async answerCall(callId: string, options?: {
        greeting?: string;
        agentPrompt?: string;
    }): Promise<void> {
        const call = this.activeCalls.get(callId);
        if (!call) throw new Error(`Call not found: ${callId}`);

        call.status = 'in-progress';
        this.emit('callAnswered', { callId, options });
    }

    /**
     * End call
     */
    async endCall(callId: string): Promise<VoiceCall> {
        const call = this.activeCalls.get(callId);
        if (!call) throw new Error(`Call not found: ${callId}`);

        call.status = 'completed';
        call.endTime = Date.now();
        call.duration = call.endTime - call.startTime;

        this.emit('callEnded', call);
        return call;
    }

    /**
     * Send speech to caller (TTS)
     */
    async speak(callId: string, text: string, options?: TTSOptions): Promise<void> {
        const call = this.activeCalls.get(callId);
        if (!call) throw new Error(`Call not found: ${callId}`);
        if (call.status !== 'in-progress') {
            throw new Error(`Call is not in progress: ${call.status}`);
        }

        this.emit('speaking', { callId, text, options });

        // In production, this would use Twilio's <Say> or ElevenLabs TTS
        console.log(`[VoiceGateway] Speaking on call ${callId}: "${text}"`);
    }

    /**
     * Listen for speech (STT)
     */
    async listen(callId: string, options?: STTOptions): Promise<string> {
        const call = this.activeCalls.get(callId);
        if (!call) throw new Error(`Call not found: ${callId}`);

        return new Promise((resolve) => {
            // In production, this would use Twilio's <Gather> or Whisper STT
            this.once(`transcription:${callId}`, (transcript: string) => {
                resolve(transcript);
            });

            this.emit('listening', { callId, options });
        });
    }

    /**
     * Process transcription from STT
     */
    async processTranscription(callId: string, transcript: string): Promise<void> {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        call.transcript = (call.transcript || '') + transcript + ' ';
        this.emit(`transcription:${callId}`, transcript);
        this.emit('transcription', { callId, transcript });
    }

    /**
     * Transfer call to human agent
     */
    async transferCall(callId: string, destination: string): Promise<void> {
        const call = this.activeCalls.get(callId);
        if (!call) throw new Error(`Call not found: ${callId}`);

        this.emit('callTransferred', { callId, destination });
        console.log(`[VoiceGateway] Transferring call ${callId} to ${destination}`);
    }

    /**
     * Get call info
     */
    getCall(callId: string): VoiceCall | null {
        return this.activeCalls.get(callId) || null;
    }

    /**
     * Get all active calls
     */
    getActiveCalls(): VoiceCall[] {
        return Array.from(this.activeCalls.values())
            .filter(c => c.status === 'in-progress' || c.status === 'ringing');
    }

    /**
     * Get call history
     */
    getCallHistory(limit = 50): VoiceCall[] {
        return Array.from(this.activeCalls.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }

    // Private methods for provider integration

    private async twilioMakeCall(call: VoiceCall, options?: any): Promise<void> {
        // Twilio integration placeholder
        // In production: const twilio = require('twilio')(accountSid, authToken);
        // twilio.calls.create({ to, from, url: webhookUrl })

        console.log(`[Twilio] Making call to ${call.to}`);

        // Simulate connection
        setTimeout(() => {
            call.status = 'in-progress';
            this.emit('callConnected', call);
        }, 2000);
    }

    private async vapiMakeCall(call: VoiceCall, options?: any): Promise<void> {
        // Vapi.ai integration placeholder
        // In production: POST to https://api.vapi.ai/call

        console.log(`[Vapi] Making call to ${call.to}`);

        // Simulate connection
        setTimeout(() => {
            call.status = 'in-progress';
            this.emit('callConnected', call);
        }, 2000);
    }

    /**
     * Generate TwiML for voice responses
     */
    generateTwiML(actions: Array<{
        type: 'say' | 'gather' | 'dial' | 'hangup';
        text?: string;
        voice?: string;
        action?: string;
    }>): string {
        const parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<Response>'];

        for (const action of actions) {
            if (action.type === 'say') {
                const voice = action.voice || 'Polly.Amy';
                parts.push(`<Say voice="${voice}">${action.text}</Say>`);
            } else if (action.type === 'gather') {
                parts.push(`<Gather input="speech" action="${action.action}" speechTimeout="auto">`);
                if (action.text) {
                    parts.push(`<Say>${action.text}</Say>`);
                }
                parts.push('</Gather>');
            } else if (action.type === 'dial') {
                parts.push(`<Dial>${action.text}</Dial>`);
            } else if (action.type === 'hangup') {
                parts.push('<Hangup/>');
            }
        }

        parts.push('</Response>');
        return parts.join('\n');
    }
}

// Singleton getter
export function getVoiceGateway(): VoiceGateway {
    return VoiceGateway.getInstance();
}
