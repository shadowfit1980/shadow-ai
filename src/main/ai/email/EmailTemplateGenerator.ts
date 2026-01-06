/**
 * Email Template Generator
 * 
 * Generate email templates,  transactional emails,
 * and email service integrations (SendGrid, Mailgun, SES).
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type EmailProvider = 'sendgrid' | 'mailgun' | 'ses' | 'nodemailer';

export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
    variables?: Record<string, string>;
}

export interface EmailConfig {
    provider: EmailProvider;
    from: string;
    replyTo?: string;
}

// ============================================================================
// EMAIL TEMPLATE GENERATOR
// ============================================================================

export class EmailTemplateGenerator extends EventEmitter {
    private static instance: EmailTemplateGenerator;

    private constructor() {
        super();
    }

    static getInstance(): EmailTemplateGenerator {
        if (!EmailTemplateGenerator.instance) {
            EmailTemplateGenerator.instance = new EmailTemplateGenerator();
        }
        return EmailTemplateGenerator.instance;
    }

    // ========================================================================
    // EMAIL SERVICE
    // ========================================================================

    generateEmailService(provider: EmailProvider): string {
        switch (provider) {
            case 'sendgrid':
                return this.generateSendGridService();
            case 'mailgun':
                return this.generateMailgunService();
            case 'ses':
                return this.generateSESService();
            default:
                return this.generateNodemailerService();
        }
    }

    private generateSendGridService(): string {
        return `import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: Array<{ content: string; filename: string; type?: string }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    const msg = {
        to: options.to,
        from: options.from || process.env.EMAIL_FROM || 'noreply@example.com',
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
    };
    
    await sgMail.send(msg);
}

export async function sendBulkEmail(messages: EmailOptions[]): Promise<void> {
    const msgs = messages.map(msg => ({
        to: msg.to,
        from: msg.from || process.env.EMAIL_FROM || 'noreply@example.com',
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
    }));
    
    await sgMail.send(msgs);
}
`;
    }

    private generateMailgunService(): string {
        return `import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY!,
});

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
        from: options.from || process.env.EMAIL_FROM || 'noreply@example.com',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
    });
}
`;
    }

    private generateSESService(): string {
        return `import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    const command = new SendEmailCommand({
        Source: options.from || process.env.EMAIL_FROM!,
        Destination: {
            ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
        },
        Message: {
            Subject: { Data: options.subject },
            Body: {
                Html: { Data: options.html },
                Text: options.text ? { Data: options.text } : undefined,
            },
        },
    });
    
    await sesClient.send(command);
}
`;
    }

    private generateNodemailerService(): string {
        return `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
    },
});

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    attachments?: Array<{ filename: string; path: string }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    await transporter.sendMail({
        from: options.from || process.env.EMAIL_FROM!,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
    });
}
`;
    }

    // ========================================================================
    // EMAIL TEMPLATES
    // ========================================================================

    generateWelcomeEmail(): EmailTemplate {
        return {
            subject: 'Welcome to {{appName}}!',
            variables: { appName: 'App', userName: 'User' },
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{appName}}!</h1>
        </div>
        <div class="content">
            <p>Hi {{userName}},</p>
            <p>Thank you for signing up! We're excited to have you on board.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <center>
                <a href="{{verificationUrl}}" class="button">Verify Email</a>
            </center>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <p>Best regards,<br>The {{appName}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
            <p>{{companyAddress}}</p>
        </div>
    </div>
</body>
</html>`,
            text: `Welcome to {{appName}}!\n\nHi {{userName}},\n\nThank you for signing up! Please verify your email: {{verificationUrl}}`,
        };
    }

    generatePasswordResetEmail(): EmailTemplate {
        return {
            subject: 'Reset Your Password',
            variables: { userName: 'User', resetUrl: '', expiresIn: '1 hour' },
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .button { display: inline-block; padding: 12px 30px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hi {{userName}},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <center>
                <a href="{{resetUrl}}" class="button">Reset Password</a>
            </center>
            <p>This link will expire in {{expiresIn}}.</p>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
        </div>
    </div>
</body>
</html>`,
        };
    }

    generateOrderConfirmationEmail(): EmailTemplate {
        return {
            subject: 'Order Confirmation #{{orderNumber}}',
            variables: { orderNumber: '', customerName: '', items: '', total: '', trackingUrl: '' },
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .order-details { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .item { border-bottom: 1px solid #ddd; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Order Confirmed</h1>
        </div>
        <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Thank you for your order! Your order #{{orderNumber}} has been confirmed.</p>
            <div class="order-details">
                <h3>Order Details:</h3>
                {{items}}
                <div class="total">Total: {{total}}</div>
            </div>
            <p>Track your order: <a href="{{trackingUrl}}">Click here</a></p>
        </div>
    </div>
</body>
</html>`,
        };
    }

    // ========================================================================
    // TEMPLATE ENGINE
    // ========================================================================

    generateTemplateEngine(): string {
        return `export function renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\\{\\{(\\w+)\\}\\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
    });
}

export function renderEmailTemplate(
    template: { subject: string; html: string; text?: string },
    data: Record<string, any>
): { subject: string; html: string; text?: string } {
    return {
        subject: renderTemplate(template.subject, data),
        html: renderTemplate(template.html, data),
        text: template.text ? renderTemplate(template.text, data) : undefined,
    };
}
`;
    }
}

export const emailTemplateGenerator = EmailTemplateGenerator.getInstance();
