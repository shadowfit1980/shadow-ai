// Queue System Generator - Generate background job queues
import Anthropic from '@anthropic-ai/sdk';

class QueueSystemGenerator {
    private anthropic: Anthropic | null = null;

    generateBullMQSetup(): string {
        return `import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Email queue
export const emailQueue = new Queue('email', { connection });

// Worker to process email jobs
export const emailWorker = new Worker('email', async (job: Job) => {
    const { to, subject, html } = job.data;
    console.log(\`Sending email to \${to}: \${subject}\`);
    // Implement actual email sending here
    return { sent: true, to };
}, { connection, concurrency: 5 });

emailWorker.on('completed', (job) => {
    console.log(\`Email job \${job.id} completed\`);
});

emailWorker.on('failed', (job, err) => {
    console.error(\`Email job \${job?.id} failed:\`, err);
});

// Add email to queue
export async function queueEmail(to: string, subject: string, html: string, delay?: number) {
    return emailQueue.add('send', { to, subject, html }, {
        delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
    });
}

// Generic job queue factory
export function createQueue<T>(name: string, processor: (job: Job<T>) => Promise<unknown>) {
    const queue = new Queue<T>(name, { connection });
    const worker = new Worker<T>(name, processor, { connection });
    
    return {
        queue,
        worker,
        add: (data: T, opts = {}) => queue.add(name, data, opts),
    };
}
`;
    }

    generateAgendaSetup(): string {
        return `import Agenda from 'agenda';

const agenda = new Agenda({
    db: { address: process.env.MONGODB_URL || 'mongodb://localhost:27017/agenda' },
    processEvery: '30 seconds',
    maxConcurrency: 20,
});

// Define jobs
agenda.define('send-email', async (job) => {
    const { to, subject, html } = job.attrs.data;
    console.log(\`Sending email to \${to}\`);
    // Implement email sending
});

agenda.define('cleanup-old-data', async (job) => {
    console.log('Cleaning up old data...');
    // Implement cleanup logic
});

agenda.define('generate-report', async (job) => {
    const { reportType, userId } = job.attrs.data;
    console.log(\`Generating \${reportType} report for user \${userId}\`);
    // Implement report generation
});

// Start agenda
export async function startAgenda() {
    await agenda.start();
    console.log('Agenda started');
    
    // Schedule recurring jobs
    await agenda.every('0 0 * * *', 'cleanup-old-data'); // Daily at midnight
}

// Queue a one-time job
export async function queueJob(name: string, data: Record<string, unknown>, when?: Date) {
    if (when) {
        return agenda.schedule(when, name, data);
    }
    return agenda.now(name, data);
}

// Schedule recurring job
export async function scheduleRecurring(name: string, interval: string, data?: Record<string, unknown>) {
    return agenda.every(interval, name, data);
}

export { agenda };
`;
    }

    generateBreeSetup(): string {
        return `import Bree from 'bree';
import path from 'path';

const bree = new Bree({
    root: path.join(__dirname, 'jobs'),
    defaultExtension: process.env.NODE_ENV === 'production' ? 'js' : 'ts',
    jobs: [
        // Run every 5 minutes
        { name: 'sync-data', interval: '5m' },
        
        // Run daily at 3am
        { name: 'cleanup', cron: '0 3 * * *' },
        
        // Run once at specific time
        { name: 'send-newsletter', date: new Date('2024-01-01T10:00:00') },
        
        // Run with worker data
        {
            name: 'process-batch',
            interval: '1h',
            worker: {
                workerData: { batchSize: 100 },
            },
        },
    ],
});

bree.on('worker created', (name) => {
    console.log(\`Worker created: \${name}\`);
});

bree.on('worker deleted', (name) => {
    console.log(\`Worker deleted: \${name}\`);
});

export async function startScheduler() {
    await bree.start();
    console.log('Bree scheduler started');
}

export async function stopScheduler() {
    await bree.stop();
}

// Example job file (jobs/sync-data.ts)
export const syncDataJob = \`
const { parentPort, workerData } = require('worker_threads');

async function main() {
    console.log('Syncing data...');
    // Your sync logic here
    
    if (parentPort) {
        parentPort.postMessage('done');
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
\`;

export { bree };
`;
    }

    generateCronSetup(): string {
        return `import { CronJob } from 'cron';

interface ScheduledJob {
    name: string;
    job: CronJob;
    running: boolean;
}

const jobs = new Map<string, ScheduledJob>();

export function scheduleJob(name: string, cronTime: string, onTick: () => void | Promise<void>) {
    if (jobs.has(name)) {
        throw new Error(\`Job "\${name}" already exists\`);
    }

    const job = new CronJob(
        cronTime,
        async () => {
            console.log(\`[Cron] Running job: \${name}\`);
            try {
                await onTick();
            } catch (error) {
                console.error(\`[Cron] Job \${name} failed:\`, error);
            }
        },
        null,
        false,
        'UTC'
    );

    jobs.set(name, { name, job, running: false });
    return job;
}

export function startJob(name: string) {
    const scheduled = jobs.get(name);
    if (!scheduled) throw new Error(\`Job "\${name}" not found\`);
    scheduled.job.start();
    scheduled.running = true;
}

export function stopJob(name: string) {
    const scheduled = jobs.get(name);
    if (!scheduled) throw new Error(\`Job "\${name}" not found\`);
    scheduled.job.stop();
    scheduled.running = false;
}

export function startAllJobs() {
    jobs.forEach((scheduled) => {
        scheduled.job.start();
        scheduled.running = true;
    });
}

export function getJobStatus() {
    return Array.from(jobs.values()).map(j => ({
        name: j.name,
        running: j.running,
        nextRun: j.job.nextDate().toISO(),
    }));
}
`;
    }
}

export const queueSystemGenerator = new QueueSystemGenerator();
