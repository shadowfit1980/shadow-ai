/**
 * Email & SMS Generator
 * 
 * Generate email sending with SendGrid, Resend, Nodemailer,
 * and SMS with Twilio.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type EmailProvider = 'sendgrid' | 'resend' | 'nodemailer' | 'mailgun' | 'ses';
export type SMSProvider = 'twilio' | 'vonage' | 'messagebird';

export interface EmailTemplate {
    name: string;
    subject: string;
    variables: string[];
}

// ============================================================================
// EMAIL & SMS GENERATOR
// ============================================================================

export class EmailSMSGenerator extends EventEmitter {
    private static instance: EmailSMSGenerator;

    private constructor() {
        super();
    }

    static getInstance(): EmailSMSGenerator {
        if (!EmailSMSGenerator.instance) {
            EmailSMSGenerator.instance = new EmailSMSGenerator();
        }
        return EmailSMSGenerator.instance;
    }

    // ========================================================================
    // RESEND (Modern Email)
    // ========================================================================

    generateResend(): string {
        return `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export const emailService = {
  async send(options: EmailOptions) {
    const { data, error } = await resend.emails.send({
      from: options.from || 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      attachments: options.attachments,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  // Pre-built templates
  async sendWelcome(to: string, name: string) {
    return this.send({
      to,
      subject: 'Welcome to Our App!',
      html: \`
        <h1>Welcome, \${name}!</h1>
        <p>Thanks for joining us. We're excited to have you on board.</p>
        <a href="\${process.env.APP_URL}/getting-started">Get Started</a>
      \`,
    });
  },

  async sendPasswordReset(to: string, resetUrl: string) {
    return this.send({
      to,
      subject: 'Reset Your Password',
      html: \`
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="\${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      \`,
    });
  },

  async sendVerification(to: string, verifyUrl: string) {
    return this.send({
      to,
      subject: 'Verify Your Email',
      html: \`
        <h1>Verify Your Email</h1>
        <p>Please verify your email address:</p>
        <a href="\${verifyUrl}">Verify Email</a>
      \`,
    });
  },

  async sendInvoice(to: string, invoiceData: { id: string; amount: number; items: any[] }) {
    return this.send({
      to,
      subject: \`Invoice #\${invoiceData.id}\`,
      html: \`
        <h1>Invoice #\${invoiceData.id}</h1>
        <p>Amount: $\${invoiceData.amount.toFixed(2)}</p>
        <table>
          <tr><th>Item</th><th>Price</th></tr>
          \${invoiceData.items.map(i => \`<tr><td>\${i.name}</td><td>$\${i.price}</td></tr>\`).join('')}
        </table>
      \`,
    });
  },

  async sendNotification(to: string, title: string, message: string, actionUrl?: string) {
    return this.send({
      to,
      subject: title,
      html: \`
        <h1>\${title}</h1>
        <p>\${message}</p>
        \${actionUrl ? \`<a href="\${actionUrl}">View Details</a>\` : ''}
      \`,
    });
  },
};

// React Email Templates (optional)
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome!',
    html: \`<h1>Welcome, \${name}!</h1>\`,
  }),
};
`;
    }

    // ========================================================================
    // SENDGRID
    // ========================================================================

    generateSendGrid(): string {
        return `import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface SendGridOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export const sendGridService = {
  async send(options: SendGridOptions) {
    const msg = {
      to: options.to,
      from: options.from || process.env.SENDGRID_FROM_EMAIL!,
      subject: options.subject,
      text: options.text,
      html: options.html,
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData,
    };

    return sgMail.send(msg);
  },

  async sendMultiple(messages: SendGridOptions[]) {
    return sgMail.send(messages.map(msg => ({
      ...msg,
      from: msg.from || process.env.SENDGRID_FROM_EMAIL!,
    })));
  },

  // Using SendGrid templates
  async sendWithTemplate(to: string, templateId: string, data: Record<string, any>) {
    return this.send({
      to,
      subject: '', // Subject is in template
      templateId,
      dynamicTemplateData: data,
    });
  },
};
`;
    }

    // ========================================================================
    // NODEMAILER
    // ========================================================================

    generateNodemailer(): string {
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

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

export const mailService = {
  async send(options: MailOptions) {
    return transporter.sendMail({
      from: options.from || process.env.SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
  },

  async verify() {
    return transporter.verify();
  },
};
`;
    }

    // ========================================================================
    // TWILIO SMS
    // ========================================================================

    generateTwilio(): string {
        return `import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

export const smsService = {
  async send(to: string, body: string) {
    return client.messages.create({
      body,
      from: FROM_NUMBER,
      to,
    });
  },

  async sendVerificationCode(to: string, code: string) {
    return this.send(to, \`Your verification code is: \${code}\`);
  },

  async sendNotification(to: string, message: string) {
    return this.send(to, message);
  },

  // Using Twilio Verify
  async startVerification(to: string, channel: 'sms' | 'call' = 'sms') {
    return client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to, channel });
  },

  async checkVerification(to: string, code: string) {
    return client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to, code });
  },
};

// Express routes for SMS
import express from 'express';
const router = express.Router();

router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    await smsService.startVerification(phone);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;
    const result = await smsService.checkVerification(phone, code);
    res.json({ valid: result.status === 'approved' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export { router as smsRouter };
`;
    }

    // ========================================================================
    // FLUTTER
    // ========================================================================

    generateFlutterEmail(): string {
        return `// For sending emails via your backend API
import 'package:http/http.dart' as http;
import 'dart:convert';

class EmailService {
  static const String _baseUrl = 'YOUR_API_URL';

  static Future<bool> sendEmail({
    required String to,
    required String subject,
    required String body,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('\$_baseUrl/api/email/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'to': to,
          'subject': subject,
          'body': body,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Email error: \$e');
      return false;
    }
  }

  static Future<bool> sendVerificationEmail(String email) async {
    final response = await http.post(
      Uri.parse('\$_baseUrl/api/auth/send-verification'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    return response.statusCode == 200;
  }
}

// For opening email client on device
import 'package:url_launcher/url_launcher.dart';

class MailLauncher {
  static Future<void> compose({
    required String to,
    String? subject,
    String? body,
  }) async {
    final uri = Uri(
      scheme: 'mailto',
      path: to,
      query: _encodeQueryParameters({
        if (subject != null) 'subject': subject,
        if (body != null) 'body': body,
      }),
    );
    
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  static String _encodeQueryParameters(Map<String, String> params) {
    return params.entries
        .map((e) => '\${Uri.encodeComponent(e.key)}=\${Uri.encodeComponent(e.value)}')
        .join('&');
  }
}
`;
    }

    generateEnvTemplate(provider: EmailProvider | SMSProvider): string {
        switch (provider) {
            case 'resend':
                return `RESEND_API_KEY=re_...`;
            case 'sendgrid':
                return `SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com`;
            case 'nodemailer':
                return `SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=Your App <noreply@yourdomain.com>`;
            case 'twilio':
                return `TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_VERIFY_SERVICE_SID=VA...`;
            default:
                return '';
        }
    }
}

export const emailSMSGenerator = EmailSMSGenerator.getInstance();
