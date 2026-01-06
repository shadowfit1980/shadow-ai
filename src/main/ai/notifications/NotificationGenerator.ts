/**
 * Notification System Generator
 * 
 * Generate notification integrations for Slack, Discord,
 * Telegram, Twilio SMS, and push notifications.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationProvider = 'slack' | 'discord' | 'telegram' | 'twilio' | 'fcm' | 'apn';

export interface NotificationConfig {
    provider: NotificationProvider;
}

// ============================================================================
// NOTIFICATION GENERATOR
// ============================================================================

export class NotificationGenerator extends EventEmitter {
    private static instance: NotificationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): NotificationGenerator {
        if (!NotificationGenerator.instance) {
            NotificationGenerator.instance = new NotificationGenerator();
        }
        return NotificationGenerator.instance;
    }

    // ========================================================================
    // SLACK
    // ========================================================================

    generateSlackIntegration(): string {
        return `import { WebClient } from '@slack/web-api';
import { IncomingWebhook } from '@slack/webhook';

// Web API client (requires OAuth token)
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

// Webhook (simpler, use for basic notifications)
const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL!);

export interface SlackMessage {
    channel?: string;
    text: string;
    attachments?: Array<{
        color?: 'good' | 'warning' | 'danger' | string;
        title?: string;
        text?: string;
        fields?: Array<{ title: string; value: string; short?: boolean }>;
    }>;
    blocks?: any[];
}

// Send message via webhook
export async function sendSlackNotification(message: SlackMessage) {
    await webhook.send({
        text: message.text,
        attachments: message.attachments,
        blocks: message.blocks,
    });
}

// Send message via Web API
export async function postSlackMessage(message: SlackMessage) {
    await client.chat.postMessage({
        channel: message.channel || 'general',
        text: message.text,
        attachments: message.attachments,
        blocks: message.blocks,
    });
}

// Send rich formatted message
export async function sendRichSlackMessage(options: {
    channel: string;
    title: string;
    message: string;
    color?: 'good' | 'warning' | 'danger';
    fields?: Array<{ title: string; value: string }>;
}) {
    await client.chat.postMessage({
        channel: options.channel,
        text: options.title,
        attachments: [{
            color: options.color || 'good',
            title: options.title,
            text: options.message,
            fields: options.fields?.map(f => ({ ...f, short: true })),
            footer: 'Application',
            ts: Math.floor(Date.now() / 1000).toString(),
        }],
    });
}

// Send alert
export async function sendSlackAlert(title: string, message: string, severity: 'info' | 'warning' | 'error') {
    const colorMap = {
        info: 'good',
        warning: 'warning',
        error: 'danger',
    };
    
    await webhook.send({
        attachments: [{
            color: colorMap[severity],
            title: \`🚨 \${title}\`,
            text: message,
            footer: process.env.APP_NAME || 'Application',
            ts: Math.floor(Date.now() / 1000).toString(),
        }],
    });
}
`;
    }

    // ========================================================================
    // DISCORD
    // ========================================================================

    generateDiscordIntegration(): string {
        return `import { WebhookClient, EmbedBuilder } from 'discord.js';

const webhook = new WebhookClient({
    url: process.env.DISCORD_WEBHOOK_URL!,
});

export interface DiscordMessage {
    content?: string;
    embeds?: Array<{
        title?: string;
        description?: string;
        color?: number;
        fields?: Array<{ name: string; value: string; inline?: boolean }>;
        footer?: { text: string };
        timestamp?: Date;
    }>;
}

// Send simple message
export async function sendDiscordNotification(message: string) {
    await webhook.send({ content: message });
}

// Send embed message
export async function sendDiscordEmbed(options: {
    title: string;
    description: string;
    color?: 'success' | 'warning' | 'error' | 'info';
    fields?: Array<{ name: string; value: string }>;
}) {
    const colorMap = {
        success: 0x00ff00,
        warning: 0xffaa00,
        error: 0xff0000,
        info: 0x0099ff,
    };
    
    const embed = new EmbedBuilder()
        .setTitle(options.title)
        .setDescription(options.description)
        .setColor(colorMap[options.color || 'info'])
        .setTimestamp();
    
    if (options.fields) {
        embed.addFields(options.fields.map(f => ({ name: f.name, value: f.value, inline: true })));
    }
    
    await webhook.send({ embeds: [embed] });
}

// Send alert
export async function sendDiscordAlert(title: string, message: string, severity: 'info' | 'warning' | 'error') {
    const emojiMap = { info: 'ℹ️', warning: '⚠️', error: '🚨' };
    const colorMap = { info: 0x0099ff, warning: 0xffaa00, error: 0xff0000 };
    
    const embed = new EmbedBuilder()
        .setTitle(\`\${emojiMap[severity]} \${title}\`)
        .setDescription(message)
        .setColor(colorMap[severity])
        .setTimestamp()
        .setFooter({ text: process.env.APP_NAME || 'Application' });
    
    await webhook.send({ embeds: [embed] });
}
`;
    }

    // ========================================================================
    // TELEGRAM
    // ========================================================================

    generateTelegramIntegration(): string {
        return `import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// Send simple message
export async function sendTelegramMessage(message: string) {
    await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
}

// Send formatted message
export async function sendTelegramNotification(options: {
    title: string;
    message: string;
    severity?: 'info' | 'warning' | 'error';
}) {
    const emoji = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '🚨',
    };
    
    const text = \`
*\${emoji[options.severity || 'info']} \${options.title}*

\${options.message}

_\${new Date().toLocaleString()}_
\`;
    
    await bot.sendMessage(CHAT_ID, text, { parse_mode: 'Markdown' });
}

// Send alert
export async function sendTelegramAlert(title: string, message: string) {
    await bot.sendMessage(CHAT_ID, \`🚨 *ALERT: \${title}*\\n\\n\${message}\`, {
        parse_mode: 'Markdown',
    });
}

// Send document
export async function sendTelegramDocument(filePath: string, caption?: string) {
    await bot.sendDocument(CHAT_ID, filePath, { caption });
}
`;
    }

    // ========================================================================
    // TWILIO SMS
    // ========================================================================

    generateTwilioSMS(): string {
        return `import twilio from 'twilio';

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER!;

// Send SMS
export async function sendSMS(to: string, message: string) {
    await client.messages.create({
        body: message,
        from: TWILIO_PHONE,
        to,
    });
}

// Send alert SMS
export async function sendAlertSMS(to: string, title: string, message: string) {
    await client.messages.create({
        body: \`ALERT: \${title}\\n\\n\${message}\`,
        from: TWILIO_PHONE,
        to,
    });
}

// Send OTP
export async function sendOTP(to: string, code: string) {
    await client.messages.create({
        body: \`Your verification code is: \${code}\\n\\nValid for 10 minutes.\`,
        from: TWILIO_PHONE,
        to,
    });
}

// Make phone call
export async function makeCall(to: string, message: string) {
    await client.calls.create({
        twiml: \`<Response><Say>\${message}</Say></Response>\`,
        from: TWILIO_PHONE,
        to,
    });
}
`;
    }

    // ========================================================================
    // FIREBASE CLOUD MESSAGING (PUSH NOTIFICATIONS)
    // ========================================================================

    generateFCMIntegration(): string {
        return `import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
    }),
});

const messaging = admin.messaging();

export interface PushNotification {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}

// Send push notification to single device
export async function sendPushNotification(notification: PushNotification) {
    await messaging.send({
        token: notification.token,
        notification: {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
        },
        data: notification.data,
    });
}

// Send to multiple devices
export async function sendMulticastNotification(tokens: string[], notification: Omit<PushNotification, 'token'>) {
    await messaging.sendEachForMulticast({
        tokens,
        notification: {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
        },
        data: notification.data,
    });
}

// Send to topic
export async function sendTopicNotification(topic: string, notification: Omit<PushNotification, 'token'>) {
    await messaging.send({
        topic,
        notification: {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
        },
        data: notification.data,
    });
}

// Subscribe to topic
export async function subscribeToTopic(tokens: string[], topic: string) {
    await messaging.subscribeToTopic(tokens, topic);
}

// Unsubscribe from topic
export async function unsubscribeFromTopic(tokens: string[], topic: string) {
    await messaging.unsubscribeFromTopic(tokens, topic);
}
`;
    }

    // ========================================================================
    // UNIFIED NOTIFICATION SERVICE
    // ========================================================================

    generateUnifiedNotificationService(): string {
        return `import { sendSlackAlert } from './slack';
import { sendDiscordAlert } from './discord';
import { sendTelegramAlert } from './telegram';
import { sendAlertSMS } from './twilio';

export type NotificationChannel = 'slack' | 'discord' | 'telegram' | 'sms' | 'all';
export type NotificationSeverity = 'info' | 'warning' | 'error';

export interface NotificationOptions {
    title: string;
    message: string;
    severity: NotificationSeverity;
    channels: NotificationChannel[];
    metadata?: Record<string, string>;
}

class NotificationService {
    async send(options: NotificationOptions) {
        const promises: Promise<any>[] = [];
        
        const channels = options.channels.includes('all')
            ? ['slack', 'discord', 'telegram'] as const
            : options.channels;
        
        for (const channel of channels) {
            switch (channel) {
                case 'slack':
                    promises.push(sendSlackAlert(options.title, options.message, options.severity));
                    break;
                case 'discord':
                    promises.push(sendDiscordAlert(options.title, options.message, options.severity));
                    break;
                case 'telegram':
                    promises.push(sendTelegramAlert(options.title, options.message));
                    break;
                case 'sms':
                    if (process.env.ALERT_PHONE_NUMBER) {
                        promises.push(sendAlertSMS(
                            process.env.ALERT_PHONE_NUMBER,
                            options.title,
                            options.message
                        ));
                    }
                    break;
            }
        }
        
        await Promise.allSettled(promises);
    }
    
    // Convenience methods
    async info(title: string, message: string, channels: NotificationChannel[] = ['slack']) {
        await this.send({ title, message, severity: 'info', channels });
    }
    
    async warning(title: string, message: string, channels: NotificationChannel[] = ['slack']) {
        await this.send({ title, message, severity: 'warning', channels });
    }
    
    async error(title: string, message: string, channels: NotificationChannel[] = ['all']) {
        await this.send({ title, message, severity: 'error', channels });
    }
}

export const notifications = new NotificationService();

// Usage:
// await notifications.error('Database Connection Failed', 'Unable to connect to primary database');
// await notifications.info('Deployment Complete', 'v1.2.3 deployed to production', ['slack', 'discord']);
`;
    }
}

export const notificationGenerator = NotificationGenerator.getInstance();
