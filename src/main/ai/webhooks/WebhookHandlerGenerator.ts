// Webhook Handler Generator - Webhook processing, signatures, and retry logic
import Anthropic from '@anthropic-ai/sdk';

class WebhookHandlerGenerator {
    private anthropic: Anthropic | null = null;

    generateStripeWebhook(): string {
        return `import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutComplete(session);
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionChange(subscription);
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentSuccess(invoice);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
    }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;
    await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: 'active' } });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;
    await prisma.subscription.upsert({
        where: { stripeSubscriptionId: subscription.id },
        create: { userId, stripeSubscriptionId: subscription.id, status: subscription.status },
        update: { status: subscription.status },
    });
}
`;
    }

    generateGitHubWebhook(): string {
        return `import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET!;

function verifySignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event');
    const deliveryId = req.headers.get('x-github-delivery');

    if (!signature || !verifySignature(body, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log(\`GitHub webhook: \${event} (delivery: \${deliveryId})\`);

    try {
        switch (event) {
            case 'push':
                await handlePush(payload);
                break;
            case 'pull_request':
                await handlePullRequest(payload);
                break;
            case 'issues':
                await handleIssue(payload);
                break;
            case 'workflow_run':
                await handleWorkflowRun(payload);
                break;
        }
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('GitHub webhook error:', error);
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
    }
}

async function handlePush(payload: any) {
    const { repository, commits, ref } = payload;
    console.log(\`Push to \${repository.full_name}:\${ref} with \${commits.length} commits\`);
}

async function handlePullRequest(payload: any) {
    const { action, pull_request, repository } = payload;
    console.log(\`PR #\${pull_request.number} \${action} in \${repository.full_name}\`);
}

async function handleIssue(payload: any) {
    const { action, issue, repository } = payload;
    console.log(\`Issue #\${issue.number} \${action} in \${repository.full_name}\`);
}

async function handleWorkflowRun(payload: any) {
    const { action, workflow_run } = payload;
    console.log(\`Workflow \${workflow_run.name} \${action}: \${workflow_run.conclusion}\`);
}
`;
    }

    generateGenericWebhookHandler(): string {
        return `import crypto from 'crypto';
import { EventEmitter } from 'events';

interface WebhookConfig {
    secret: string;
    signatureHeader: string;
    signatureAlgorithm: 'sha256' | 'sha1' | 'sha512';
    signaturePrefix?: string;
}

class WebhookHandler extends EventEmitter {
    private config: WebhookConfig;

    constructor(config: WebhookConfig) {
        super();
        this.config = config;
    }

    verifySignature(payload: string, signature: string): boolean {
        const { secret, signatureAlgorithm, signaturePrefix = '' } = this.config;
        const hmac = crypto.createHmac(signatureAlgorithm, secret);
        const expected = signaturePrefix + hmac.update(payload).digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
        } catch {
            return false;
        }
    }

    async handle(headers: Record<string, string>, body: string): Promise<{ success: boolean; error?: string }> {
        const signature = headers[this.config.signatureHeader.toLowerCase()];
        
        if (!signature || !this.verifySignature(body, signature)) {
            return { success: false, error: 'Invalid signature' };
        }

        try {
            const payload = JSON.parse(body);
            const eventType = headers['x-event-type'] || headers['x-webhook-event'] || 'unknown';
            
            this.emit('webhook', { type: eventType, payload, headers });
            this.emit(eventType, payload);
            
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

export default WebhookHandler;

// Usage:
// const handler = new WebhookHandler({ secret: '...', signatureHeader: 'x-signature', signatureAlgorithm: 'sha256' });
// handler.on('order.created', (payload) => { ... });
`;
    }

    generateWebhookRetryQueue(): string {
        return `import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface WebhookPayload {
    url: string;
    body: object;
    headers?: Record<string, string>;
    attempts?: number;
    maxAttempts?: number;
}

const webhookQueue = new Queue<WebhookPayload>('webhooks', { connection });

export async function sendWebhook(payload: WebhookPayload): Promise<string> {
    const job = await webhookQueue.add('deliver', {
        ...payload,
        attempts: 0,
        maxAttempts: payload.maxAttempts || 5,
    }, {
        attempts: payload.maxAttempts || 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
    });
    return job.id!;
}

const worker = new Worker<WebhookPayload>('webhooks', async (job: Job<WebhookPayload>) => {
    const { url, body, headers = {} } = job.data;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(\`Webhook failed: \${response.status} - \${text}\`);
    }

    return { status: response.status, deliveredAt: new Date().toISOString() };
}, {
    connection,
    concurrency: 10,
});

worker.on('completed', (job, result) => {
    console.log(\`Webhook \${job.id} delivered successfully\`);
});

worker.on('failed', (job, err) => {
    console.error(\`Webhook \${job?.id} failed: \${err.message}\`);
});

export { webhookQueue, worker };
`;
    }
}

export const webhookHandlerGenerator = new WebhookHandlerGenerator();
