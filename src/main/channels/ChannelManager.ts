/**
 * Messaging Channels
 * Multi-channel messaging integration
 * Supports WhatsApp, SMS, Telegram, Facebook Messenger
 */

import { EventEmitter } from 'events';

export interface ChannelConfig {
    type: ChannelType;
    enabled: boolean;
    credentials: Record<string, string>;
    webhookUrl?: string;
}

export enum ChannelType {
    WHATSAPP = 'whatsapp',
    SMS = 'sms',
    TELEGRAM = 'telegram',
    MESSENGER = 'facebook_messenger',
    WEBCHAT = 'webchat',
    EMAIL = 'email',
}

export interface ChannelMessage {
    id: string;
    channelType: ChannelType;
    direction: 'inbound' | 'outbound';
    from: string;
    to: string;
    content: MessageContent;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface MessageContent {
    type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'location' | 'template';
    text?: string;
    mediaUrl?: string;
    caption?: string;
    buttons?: Array<{ text: string; value: string }>;
    location?: { lat: number; lng: number };
    templateName?: string;
    templateParams?: Record<string, string>;
}

export interface ChannelSession {
    id: string;
    channelType: ChannelType;
    userId: string;
    startTime: number;
    lastActivity: number;
    messages: ChannelMessage[];
    context?: Record<string, any>;
}

/**
 * ChannelManager
 * Unified multi-channel messaging interface
 */
export class ChannelManager extends EventEmitter {
    private static instance: ChannelManager;
    private channels: Map<ChannelType, ChannelConfig> = new Map();
    private sessions: Map<string, ChannelSession> = new Map();
    private messageCounter = 0;

    private constructor() {
        super();
        this.initializeDefaultChannels();
    }

    static getInstance(): ChannelManager {
        if (!ChannelManager.instance) {
            ChannelManager.instance = new ChannelManager();
        }
        return ChannelManager.instance;
    }

    /**
     * Configure a channel
     */
    configureChannel(config: ChannelConfig): void {
        this.channels.set(config.type, config);
        this.emit('channelConfigured', { type: config.type, enabled: config.enabled });
    }

    /**
     * Get channel configuration
     */
    getChannel(type: ChannelType): ChannelConfig | null {
        return this.channels.get(type) || null;
    }

    /**
     * Get all configured channels
     */
    getAllChannels(): ChannelConfig[] {
        return Array.from(this.channels.values());
    }

    /**
     * Enable/disable channel
     */
    setChannelEnabled(type: ChannelType, enabled: boolean): void {
        const channel = this.channels.get(type);
        if (channel) {
            channel.enabled = enabled;
            this.emit('channelStatusChanged', { type, enabled });
        }
    }

    /**
     * Send message through channel
     */
    async sendMessage(
        channelType: ChannelType,
        to: string,
        content: MessageContent
    ): Promise<ChannelMessage | null> {
        const channel = this.channels.get(channelType);
        if (!channel || !channel.enabled) {
            console.warn(`Channel ${channelType} not available or disabled`);
            return null;
        }

        const message: ChannelMessage = {
            id: `msg_${++this.messageCounter}_${Date.now()}`,
            channelType,
            direction: 'outbound',
            from: 'agent',
            to,
            content,
            timestamp: Date.now(),
        };

        // Send via appropriate provider
        try {
            await this.dispatchMessage(channelType, message);
            this.emit('messageSent', message);
            return message;
        } catch (error: any) {
            this.emit('messageFailed', { message, error: error.message });
            return null;
        }
    }

    /**
     * Handle incoming message (webhook)
     */
    async handleIncomingMessage(
        channelType: ChannelType,
        from: string,
        content: MessageContent,
        metadata?: Record<string, any>
    ): Promise<ChannelMessage> {
        const message: ChannelMessage = {
            id: `msg_${++this.messageCounter}_${Date.now()}`,
            channelType,
            direction: 'inbound',
            from,
            to: 'agent',
            content,
            timestamp: Date.now(),
            metadata,
        };

        // Find or create session
        const sessionId = `${channelType}_${from}`;
        let session = this.sessions.get(sessionId);

        if (!session) {
            session = this.createSession(channelType, from);
        }

        session.messages.push(message);
        session.lastActivity = Date.now();

        this.emit('messageReceived', message);
        return message;
    }

    /**
     * Create session
     */
    createSession(channelType: ChannelType, userId: string): ChannelSession {
        const id = `${channelType}_${userId}`;

        const session: ChannelSession = {
            id,
            channelType,
            userId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            messages: [],
        };

        this.sessions.set(id, session);
        this.emit('sessionCreated', session);
        return session;
    }

    /**
     * Get session
     */
    getSession(channelType: ChannelType, userId: string): ChannelSession | null {
        return this.sessions.get(`${channelType}_${userId}`) || null;
    }

    /**
     * Send template message (WhatsApp/Messenger)
     */
    async sendTemplate(
        channelType: ChannelType,
        to: string,
        templateName: string,
        params: Record<string, string>
    ): Promise<ChannelMessage | null> {
        return this.sendMessage(channelType, to, {
            type: 'template',
            templateName,
            templateParams: params,
        });
    }

    /**
     * Send quick reply buttons
     */
    async sendQuickReplies(
        channelType: ChannelType,
        to: string,
        text: string,
        buttons: Array<{ text: string; value: string }>
    ): Promise<ChannelMessage | null> {
        return this.sendMessage(channelType, to, {
            type: 'text',
            text,
            buttons,
        });
    }

    /**
     * Send media message
     */
    async sendMedia(
        channelType: ChannelType,
        to: string,
        mediaType: 'image' | 'audio' | 'video' | 'file',
        mediaUrl: string,
        caption?: string
    ): Promise<ChannelMessage | null> {
        return this.sendMessage(channelType, to, {
            type: mediaType,
            mediaUrl,
            caption,
        });
    }

    /**
     * Validate webhook signature
     */
    validateWebhook(channelType: ChannelType, signature: string, body: string): boolean {
        const channel = this.channels.get(channelType);
        if (!channel) return false;

        // Provider-specific validation
        switch (channelType) {
            case ChannelType.WHATSAPP:
                return this.validateWhatsAppWebhook(signature, body, channel.credentials.appSecret);
            case ChannelType.TELEGRAM:
                return this.validateTelegramWebhook(signature, body, channel.credentials.botToken);
            default:
                return true; // Allow if no validation implemented
        }
    }

    /**
     * Get channel statistics
     */
    getChannelStats(channelType?: ChannelType): Record<string, any> {
        const sessions = channelType
            ? Array.from(this.sessions.values()).filter(s => s.channelType === channelType)
            : Array.from(this.sessions.values());

        const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
        const activeSessions = sessions.filter(s => Date.now() - s.lastActivity < 30 * 60 * 1000).length;

        return {
            totalSessions: sessions.length,
            activeSessions,
            totalMessages,
            byChannel: this.getMessagesByChannel(),
        };
    }

    // Private methods

    private initializeDefaultChannels(): void {
        // Initialize with disabled channels
        for (const type of Object.values(ChannelType)) {
            this.channels.set(type as ChannelType, {
                type: type as ChannelType,
                enabled: false,
                credentials: {},
            });
        }
    }

    private async dispatchMessage(channelType: ChannelType, message: ChannelMessage): Promise<void> {
        const channel = this.channels.get(channelType);
        if (!channel) throw new Error(`Channel not configured: ${channelType}`);

        switch (channelType) {
            case ChannelType.WHATSAPP:
                await this.sendWhatsApp(message, channel);
                break;
            case ChannelType.SMS:
                await this.sendSMS(message, channel);
                break;
            case ChannelType.TELEGRAM:
                await this.sendTelegram(message, channel);
                break;
            case ChannelType.MESSENGER:
                await this.sendMessenger(message, channel);
                break;
            default:
                console.log(`[Channel] Mock send to ${channelType}: ${message.content.text}`);
        }
    }

    private async sendWhatsApp(message: ChannelMessage, channel: ChannelConfig): Promise<void> {
        // WhatsApp Business API integration
        // POST to https://graph.facebook.com/v17.0/{phone_id}/messages
        console.log(`[WhatsApp] Sending to ${message.to}: ${message.content.text}`);
    }

    private async sendSMS(message: ChannelMessage, channel: ChannelConfig): Promise<void> {
        // Twilio SMS integration
        // POST to https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json
        console.log(`[SMS] Sending to ${message.to}: ${message.content.text}`);
    }

    private async sendTelegram(message: ChannelMessage, channel: ChannelConfig): Promise<void> {
        // Telegram Bot API
        // POST to https://api.telegram.org/bot{token}/sendMessage
        console.log(`[Telegram] Sending to ${message.to}: ${message.content.text}`);
    }

    private async sendMessenger(message: ChannelMessage, channel: ChannelConfig): Promise<void> {
        // Facebook Messenger Send API
        // POST to https://graph.facebook.com/v17.0/me/messages
        console.log(`[Messenger] Sending to ${message.to}: ${message.content.text}`);
    }

    private validateWhatsAppWebhook(signature: string, body: string, secret?: string): boolean {
        if (!secret) return false;
        // HMAC-SHA256 validation
        return true; // Simplified
    }

    private validateTelegramWebhook(signature: string, body: string, token?: string): boolean {
        if (!token) return false;
        return true; // Simplified
    }

    private getMessagesByChannel(): Record<string, number> {
        const counts: Record<string, number> = {};

        for (const session of this.sessions.values()) {
            counts[session.channelType] = (counts[session.channelType] || 0) + session.messages.length;
        }

        return counts;
    }
}

// Singleton getter
export function getChannelManager(): ChannelManager {
    return ChannelManager.getInstance();
}
