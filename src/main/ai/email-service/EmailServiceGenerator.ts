// Email Service Generator - Generate email sending utilities
import Anthropic from '@anthropic-ai/sdk';

class EmailServiceGenerator {
    private anthropic: Anthropic | null = null;

    generateNodemailerSetup(): string {
        return `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{ filename: string; content: Buffer | string }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
    });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
    await sendEmail({
        to: email,
        subject: 'Welcome!',
        html: \`<h1>Welcome, \${name}!</h1><p>Thanks for signing up.</p>\`,
    });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    await sendEmail({
        to: email,
        subject: 'Reset Your Password',
        html: \`<p>Click <a href="\${resetUrl}">here</a> to reset your password.</p>\`,
    });
}
`;
    }

    generateResendSetup(): string {
        return `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    react?: React.ReactElement;
}

export async function sendEmail(options: EmailOptions): Promise<{ id: string }> {
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        react: options.react,
    });

    if (error) throw new Error(error.message);
    return { id: data!.id };
}

// React email template example
export function WelcomeEmail({ name }: { name: string }) {
    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
            <h1 style={{ color: '#333' }}>Welcome, {name}!</h1>
            <p>Thanks for joining us. We're excited to have you!</p>
            <a href="https://example.com/dashboard" 
               style={{ background: '#007bff', color: 'white', padding: '10px 20px', textDecoration: 'none', borderRadius: '5px' }}>
                Get Started
            </a>
        </div>
    );
}
`;
    }

    generateSendGridSetup(): string {
        return `import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    templateId?: string;
    dynamicData?: Record<string, unknown>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    const msg = {
        to: options.to,
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        subject: options.subject,
        html: options.html,
    };

    await sgMail.send(msg);
}

export async function sendTemplateEmail(to: string, templateId: string, data: Record<string, unknown>): Promise<void> {
    await sgMail.send({
        to,
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        templateId,
        dynamicTemplateData: data,
    });
}

export async function sendBulkEmails(emails: Array<{ to: string; subject: string; html: string }>): Promise<void> {
    const messages = emails.map(email => ({
        to: email.to,
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        subject: email.subject,
        html: email.html,
    }));

    await sgMail.send(messages);
}
`;
    }

    generateEmailTemplates(): string {
        return `// Base email template
export function baseTemplate(content: string, title: string): string {
    return \`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>\${title}</h1></div>
        <div class="content">\${content}</div>
        <div class="footer">
            <p>&copy; \${new Date().getFullYear()} Your Company. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>\`;
}

export function welcomeTemplate(name: string, ctaUrl: string): string {
    return baseTemplate(\`
        <h2>Welcome, \${name}!</h2>
        <p>Thanks for signing up. We're thrilled to have you on board.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="\${ctaUrl}" class="button">Get Started</a>
        </p>
    \`, 'Welcome!');
}

export function passwordResetTemplate(resetUrl: string, expiresIn: string): string {
    return baseTemplate(\`
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click the button below to create a new password.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="\${resetUrl}" class="button">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px;">This link expires in \${expiresIn}.</p>
    \`, 'Password Reset');
}
`;
    }
}

export const emailServiceGenerator = new EmailServiceGenerator();
