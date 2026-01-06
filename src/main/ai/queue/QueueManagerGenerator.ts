/**
 * Queue Manager Generator
 * 
 * Generate message queue configurations, workers,
 * and job processors for BullMQ, RabbitMQ, and SQS.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type QueueProvider = 'bullmq' | 'rabbitmq' | 'sqs' | 'redis-pubsub';

export interface QueueConfig {
    provider: QueueProvider;
    name: string;
    concurrency?: number;
    retries?: number;
    backoff?: { type: 'exponential' | 'fixed'; delay: number };
    timeout?: number;
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
}

export interface JobDefinition {
    name: string;
    data: Record<string, { type: string; required?: boolean }>;
    options?: {
        priority?: number;
        delay?: number;
        attempts?: number;
        backoff?: number;
    };
}

// ============================================================================
// QUEUE MANAGER GENERATOR
// ============================================================================

export class QueueManagerGenerator extends EventEmitter {
    private static instance: QueueManagerGenerator;

    private constructor() {
        super();
    }

    static getInstance(): QueueManagerGenerator {
        if (!QueueManagerGenerator.instance) {
            QueueManagerGenerator.instance = new QueueManagerGenerator();
        }
        return QueueManagerGenerator.instance;
    }

    // ========================================================================
    // BULLMQ
    // ========================================================================

    generateBullMQQueue(config: QueueConfig, jobs: JobDefinition[]): string {
        return `import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Queue
export const ${config.name}Queue = new Queue('${config.name}', {
    connection,
    defaultJobOptions: {
        attempts: ${config.retries || 3},
        backoff: {
            type: '${config.backoff?.type || 'exponential'}',
            delay: ${config.backoff?.delay || 1000},
        },
        removeOnComplete: ${config.removeOnComplete ?? 100},
        removeOnFail: ${config.removeOnFail ?? 1000},
    },
});

// Job types
${jobs.map(job => `
export interface ${job.name}JobData {
${Object.entries(job.data).map(([k, v]) => `    ${k}${v.required === false ? '?' : ''}: ${v.type};`).join('\n')}
}

export async function add${job.name}Job(data: ${job.name}JobData, opts?: { priority?: number; delay?: number }) {
    return ${config.name}Queue.add('${job.name}', data, {
        priority: opts?.priority ?? ${job.options?.priority || 0},
        delay: opts?.delay ?? ${job.options?.delay || 0},
        attempts: ${job.options?.attempts || 3},
    });
}`).join('\n')}

// Worker
export function create${this.toPascalCase(config.name)}Worker() {
    const worker = new Worker(
        '${config.name}',
        async (job: Job) => {
            console.log(\`Processing job \${job.id}: \${job.name}\`);
            
            switch (job.name) {
${jobs.map(job => `                case '${job.name}':
                    return process${job.name}(job.data as ${job.name}JobData);`).join('\n')}
                default:
                    throw new Error(\`Unknown job type: \${job.name}\`);
            }
        },
        {
            connection,
            concurrency: ${config.concurrency || 5},
            limiter: {
                max: 100,
                duration: 1000,
            },
        }
    );

    worker.on('completed', (job) => {
        console.log(\`Job \${job.id} completed\`);
    });

    worker.on('failed', (job, err) => {
        console.error(\`Job \${job?.id} failed:\`, err);
    });

    return worker;
}

// Job processors
${jobs.map(job => `
async function process${job.name}(data: ${job.name}JobData): Promise<void> {
    // TODO: Implement ${job.name} processing logic
    console.log('Processing ${job.name}:', data);
}`).join('\n')}

// Queue events
export const ${config.name}Events = new QueueEvents('${config.name}', { connection });

${config.name}Events.on('completed', ({ jobId }) => {
    console.log(\`Job \${jobId} has completed\`);
});

${config.name}Events.on('failed', ({ jobId, failedReason }) => {
    console.error(\`Job \${jobId} has failed with reason: \${failedReason}\`);
});

// Dashboard (optional)
export function getQueueStats() {
    return ${config.name}Queue.getJobCounts();
}
`;
    }

    // ========================================================================
    // RABBITMQ
    // ========================================================================

    generateRabbitMQ(config: QueueConfig, jobs: JobDefinition[]): string {
        return `import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';

class RabbitMQManager {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly queueName = '${config.name}';

    async connect(): Promise<void> {
        this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        this.channel = await this.connection.createChannel();
        
        await this.channel.assertQueue(this.queueName, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': \`\${this.queueName}.dlx\`,
            },
        });

        // Dead letter queue
        await this.channel.assertExchange(\`\${this.queueName}.dlx\`, 'direct');
        await this.channel.assertQueue(\`\${this.queueName}.dlq\`, { durable: true });
        await this.channel.bindQueue(\`\${this.queueName}.dlq\`, \`\${this.queueName}.dlx\`, '');

        this.channel.prefetch(${config.concurrency || 5});
    }

    async publish(jobType: string, data: any, options?: { priority?: number; delay?: number }): Promise<void> {
        if (!this.channel) throw new Error('Not connected');

        const message = JSON.stringify({ type: jobType, data, timestamp: Date.now() });

        this.channel.sendToQueue(this.queueName, Buffer.from(message), {
            persistent: true,
            priority: options?.priority || 0,
            headers: {
                'x-delay': options?.delay || 0,
                'x-retry-count': 0,
            },
        });
    }

    async consume(handler: (jobType: string, data: any) => Promise<void>): Promise<void> {
        if (!this.channel) throw new Error('Not connected');

        await this.channel.consume(this.queueName, async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            try {
                const { type, data } = JSON.parse(msg.content.toString());
                await handler(type, data);
                this.channel!.ack(msg);
            } catch (error) {
                const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
                
                if (retryCount <= ${config.retries || 3}) {
                    // Requeue with retry count
                    this.channel!.nack(msg, false, false);
                    this.channel!.sendToQueue(this.queueName, msg.content, {
                        ...msg.properties,
                        headers: { ...msg.properties.headers, 'x-retry-count': retryCount },
                    });
                } else {
                    // Send to DLQ
                    this.channel!.nack(msg, false, false);
                }
            }
        });
    }

    async close(): Promise<void> {
        await this.channel?.close();
        await this.connection?.close();
    }
}

export const rabbitMQ = new RabbitMQManager();

// Job types
${jobs.map(job => `
export interface ${job.name}JobData {
${Object.entries(job.data).map(([k, v]) => `    ${k}${v.required === false ? '?' : ''}: ${v.type};`).join('\n')}
}

export async function publish${job.name}(data: ${job.name}JobData) {
    return rabbitMQ.publish('${job.name}', data);
}`).join('\n')}

// Worker
export async function startWorker() {
    await rabbitMQ.connect();
    
    await rabbitMQ.consume(async (jobType, data) => {
        switch (jobType) {
${jobs.map(job => `            case '${job.name}':
                await process${job.name}(data);
                break;`).join('\n')}
            default:
                console.warn(\`Unknown job type: \${jobType}\`);
        }
    });

    console.log('Worker started');
}

// Job processors
${jobs.map(job => `
async function process${job.name}(data: ${job.name}JobData): Promise<void> {
    // TODO: Implement ${job.name} processing logic
    console.log('Processing ${job.name}:', data);
}`).join('\n')}
`;
    }

    // ========================================================================
    // AWS SQS
    // ========================================================================

    generateSQS(config: QueueConfig, jobs: JobDefinition[]): string {
        return `import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

const QUEUE_URL = process.env.SQS_QUEUE_URL!;

// Job types
${jobs.map(job => `
export interface ${job.name}JobData {
${Object.entries(job.data).map(([k, v]) => `    ${k}${v.required === false ? '?' : ''}: ${v.type};`).join('\n')}
}

export async function send${job.name}Job(data: ${job.name}JobData, delaySeconds?: number) {
    const command = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ type: '${job.name}', data, timestamp: Date.now() }),
        DelaySeconds: delaySeconds || ${job.options?.delay ? Math.floor(job.options.delay / 1000) : 0},
        MessageAttributes: {
            JobType: {
                DataType: 'String',
                StringValue: '${job.name}',
            },
        },
    });
    
    return sqsClient.send(command);
}`).join('\n')}

// Worker
export async function startWorker() {
    console.log('SQS Worker started');
    
    while (true) {
        try {
            const receiveCommand = new ReceiveMessageCommand({
                QueueUrl: QUEUE_URL,
                MaxNumberOfMessages: ${config.concurrency || 10},
                WaitTimeSeconds: 20,
                MessageAttributeNames: ['All'],
            });

            const response = await sqsClient.send(receiveCommand);

            if (response.Messages) {
                for (const message of response.Messages) {
                    try {
                        const { type, data } = JSON.parse(message.Body!);
                        
                        switch (type) {
${jobs.map(job => `                            case '${job.name}':
                                await process${job.name}(data);
                                break;`).join('\n')}
                            default:
                                console.warn(\`Unknown job type: \${type}\`);
                        }

                        // Delete message after successful processing
                        await sqsClient.send(new DeleteMessageCommand({
                            QueueUrl: QUEUE_URL,
                            ReceiptHandle: message.ReceiptHandle,
                        }));
                    } catch (error) {
                        console.error('Error processing message:', error);
                        // Message will be returned to queue after visibility timeout
                    }
                }
            }
        } catch (error) {
            console.error('Error receiving messages:', error);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// Job processors
${jobs.map(job => `
async function process${job.name}(data: ${job.name}JobData): Promise<void> {
    // TODO: Implement ${job.name} processing logic
    console.log('Processing ${job.name}:', data);
}`).join('\n')}
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private toPascalCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export const queueManagerGenerator = QueueManagerGenerator.getInstance();
