/**
 * Background Jobs & Scheduled Tasks Generator
 * 
 * Generate background job processing with BullMQ,
 * Agenda, cron jobs, and serverless functions.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type JobQueueProvider = 'bullmq' | 'agenda' | 'bee-queue';

// ============================================================================
// BACKGROUND JOBS GENERATOR
// ============================================================================

export class BackgroundJobsGenerator extends EventEmitter {
    private static instance: BackgroundJobsGenerator;

    private constructor() {
        super();
    }

    static getInstance(): BackgroundJobsGenerator {
        if (!BackgroundJobsGenerator.instance) {
            BackgroundJobsGenerator.instance = new BackgroundJobsGenerator();
        }
        return BackgroundJobsGenerator.instance;
    }

    // ========================================================================
    // BULLMQ
    // ========================================================================

    generateBullMQ(): string {
        return `import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

// Create queues
export const emailQueue = new Queue('email', { connection });
export const processQueue = new Queue('process', { connection });
export const scheduledQueue = new Queue('scheduled', { connection });

// Email worker
const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    const { to, subject, body } = job.data;
    console.log(\`Sending email to \${to}\`);
    // await sendEmail(to, subject, body);
    return { sent: true, to };
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000, // 100 emails per minute
    },
  }
);

// Process worker with progress
const processWorker = new Worker(
  'process',
  async (job: Job) => {
    const total = job.data.items.length;
    
    for (let i = 0; i < total; i++) {
      // Process item
      await processItem(job.data.items[i]);
      await job.updateProgress((i + 1) / total * 100);
    }
    
    return { processed: total };
  },
  { connection }
);

async function processItem(item: any) {
  // Simulate processing
  await new Promise(r => setTimeout(r, 100));
}

// Event listeners
emailWorker.on('completed', (job) => {
  console.log(\`Email job \${job.id} completed\`);
});

emailWorker.on('failed', (job, err) => {
  console.error(\`Email job \${job?.id} failed:\`, err);
});

// Queue events
const queueEvents = new QueueEvents('email', { connection });

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(\`Job \${jobId} completed with:\`, returnvalue);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(\`Job \${jobId} failed:\`, failedReason);
});

// Add jobs
export const jobs = {
  // Send email
  async sendEmail(to: string, subject: string, body: string, options?: {
    delay?: number;
    priority?: number;
  }) {
    return emailQueue.add('send', { to, subject, body }, {
      delay: options?.delay,
      priority: options?.priority,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  },

  // Bulk process
  async bulkProcess(items: any[]) {
    return processQueue.add('bulk', { items }, {
      attempts: 3,
    });
  },

  // Scheduled job (cron)
  async scheduleDaily(name: string, data: any, cronExpression: string) {
    return scheduledQueue.add(name, data, {
      repeat: { pattern: cronExpression },
    });
  },

  // Get job status
  async getJobStatus(queueName: string, jobId: string) {
    const queue = new Queue(queueName, { connection });
    const job = await queue.getJob(jobId);
    if (!job) return null;
    
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      state: await job.getState(),
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
    };
  },

  // Cancel job
  async cancelJob(queueName: string, jobId: string) {
    const queue = new Queue(queueName, { connection });
    const job = await queue.getJob(jobId);
    await job?.remove();
  },
};

// Scheduled tasks
export async function setupScheduledJobs() {
  // Daily cleanup at midnight
  await scheduledQueue.add(
    'cleanup',
    {},
    { repeat: { pattern: '0 0 * * *' } }
  );

  // Hourly stats update
  await scheduledQueue.add(
    'stats',
    {},
    { repeat: { pattern: '0 * * * *' } }
  );

  // Weekly report on Mondays
  await scheduledQueue.add(
    'weekly-report',
    {},
    { repeat: { pattern: '0 9 * * 1' } }
  );
}

// Scheduled worker
const scheduledWorker = new Worker(
  'scheduled',
  async (job: Job) => {
    switch (job.name) {
      case 'cleanup':
        // Clean old data
        console.log('Running cleanup...');
        break;
      case 'stats':
        // Update statistics
        console.log('Updating stats...');
        break;
      case 'weekly-report':
        // Generate weekly report
        console.log('Generating weekly report...');
        break;
    }
    return { success: true };
  },
  { connection }
);

// Dashboard routes (for Bull Board)
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

export function setupBullBoard(app: any) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(processQueue),
      new BullMQAdapter(scheduledQueue),
    ],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
}
`;
    }

    // ========================================================================
    // NODE CRON
    // ========================================================================

    generateNodeCron(): string {
        return `import cron from 'node-cron';

// Schedule definitions
const schedules = {
  everyMinute: '* * * * *',
  everyHour: '0 * * * *',
  everyDay: '0 0 * * *',
  everyWeek: '0 0 * * 0',
  everyMonth: '0 0 1 * *',
  weekdays9am: '0 9 * * 1-5',
};

// Scheduled tasks
export function setupCronJobs() {
  // Daily cleanup at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cleanup...');
    try {
      // await cleanupOldData();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }, {
    timezone: 'UTC',
  });

  // Send daily digest at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Sending daily digest...');
    // await sendDailyDigest();
  });

  // Update stats every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Updating stats...');
    // await updateStats();
  });

  // Weekly backup on Sundays at 2 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('Running weekly backup...');
    // await createBackup();
  });

  // Monthly report on 1st at 6 AM
  cron.schedule('0 6 1 * *', async () => {
    console.log('Generating monthly report...');
    // await generateMonthlyReport();
  });

  console.log('Cron jobs scheduled');
}

// Task registry for management
interface ScheduledTask {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  task?: cron.ScheduledTask;
  lastRun?: Date;
  nextRun?: Date;
}

class CronManager {
  private tasks = new Map<string, ScheduledTask>();

  register(name: string, schedule: string, handler: () => Promise<void>) {
    const task = cron.schedule(schedule, async () => {
      const taskInfo = this.tasks.get(name);
      if (taskInfo) {
        taskInfo.lastRun = new Date();
      }
      
      try {
        await handler();
      } catch (error) {
        console.error(\`Task \${name} failed:\`, error);
      }
    });

    this.tasks.set(name, { name, schedule, handler, task });
    console.log(\`Registered cron task: \${name} (\${schedule})\`);
  }

  start(name: string) {
    this.tasks.get(name)?.task?.start();
  }

  stop(name: string) {
    this.tasks.get(name)?.task?.stop();
  }

  stopAll() {
    this.tasks.forEach(t => t.task?.stop());
  }

  list() {
    return Array.from(this.tasks.values()).map(t => ({
      name: t.name,
      schedule: t.schedule,
      lastRun: t.lastRun,
    }));
  }
}

export const cronManager = new CronManager();

// Usage
// cronManager.register('cleanup', '0 0 * * *', async () => {
//   await cleanupOldData();
// });
`;
    }

    // ========================================================================
    // VERCEL CRON (SERVERLESS)
    // ========================================================================

    generateVercelCron(): string {
        return `// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-cleanup",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/hourly-sync",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * 1"
    }
  ]
}

// app/api/cron/daily-cleanup/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Running daily cleanup...');
    
    // Cleanup old sessions
    // await prisma.session.deleteMany({
    //   where: { expiresAt: { lt: new Date() } }
    // });
    
    // Cleanup old logs
    // await prisma.log.deleteMany({
    //   where: { createdAt: { lt: subDays(new Date(), 30) } }
    // });

    return NextResponse.json({ success: true, timestamp: new Date() });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

// app/api/cron/hourly-sync/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Running hourly sync...');
    
    // Sync data with external service
    // await syncWithExternalAPI();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// Trigger.dev alternative (for complex jobs)
/*
import { TriggerClient, eventTrigger } from '@trigger.dev/sdk';

const client = new TriggerClient({
  id: 'my-app',
  apiKey: process.env.TRIGGER_API_KEY,
});

client.defineJob({
  id: 'send-welcome-email',
  name: 'Send Welcome Email',
  version: '1.0.0',
  trigger: eventTrigger({ name: 'user.signup' }),
  run: async (payload, io) => {
    await io.runTask('send-email', async () => {
      // Send email
    });
  },
});

// Usage
await client.sendEvent({ name: 'user.signup', payload: { userId: '123' } });
*/
`;
    }

    // ========================================================================
    // FLUTTER BACKGROUND
    // ========================================================================

    generateFlutterBackground(): string {
        return `import 'dart:async';
import 'dart:isolate';
import 'package:workmanager/workmanager.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Task identifiers
const syncTask = 'syncTask';
const cleanupTask = 'cleanupTask';
const notificationTask = 'notificationTask';

// Callback dispatcher (must be top-level)
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    switch (task) {
      case syncTask:
        await _performSync();
        break;
      case cleanupTask:
        await _performCleanup();
        break;
      case notificationTask:
        await _showScheduledNotification(inputData);
        break;
    }
    return true;
  });
}

Future<void> _performSync() async {
  // Sync data with server
  print('Performing background sync...');
}

Future<void> _performCleanup() async {
  // Clean up cache, old data
  print('Performing cleanup...');
}

Future<void> _showScheduledNotification(Map<String, dynamic>? data) async {
  final notifications = FlutterLocalNotificationsPlugin();
  await notifications.show(
    0,
    data?['title'] ?? 'Notification',
    data?['body'] ?? 'You have a new notification',
    const NotificationDetails(
      android: AndroidNotificationDetails(
        'scheduled',
        'Scheduled Notifications',
        importance: Importance.high,
      ),
    ),
  );
}

class BackgroundTaskService {
  static Future<void> initialize() async {
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: false,
    );
  }

  // Register periodic sync (every 15 minutes minimum)
  static Future<void> registerPeriodicSync() async {
    await Workmanager().registerPeriodicTask(
      'periodic-sync',
      syncTask,
      frequency: const Duration(hours: 1),
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
      ),
    );
  }

  // Register one-time task
  static Future<void> scheduleOneTimeTask(
    String uniqueName,
    String taskName, {
    Duration? delay,
    Map<String, dynamic>? inputData,
  }) async {
    await Workmanager().registerOneOffTask(
      uniqueName,
      taskName,
      initialDelay: delay ?? Duration.zero,
      inputData: inputData,
    );
  }

  // Cancel task
  static Future<void> cancelTask(String uniqueName) async {
    await Workmanager().cancelByUniqueName(uniqueName);
  }

  // Cancel all tasks
  static Future<void> cancelAllTasks() async {
    await Workmanager().cancelAll();
  }
}

// Usage in main.dart
// void main() async {
//   WidgetsFlutterBinding.ensureInitialized();
//   await BackgroundTaskService.initialize();
//   await BackgroundTaskService.registerPeriodicSync();
//   runApp(const MyApp());
// }
`;
    }

    generateEnvTemplate(provider: JobQueueProvider): string {
        switch (provider) {
            case 'bullmq':
                return `REDIS_URL=redis://localhost:6379`;
            default:
                return '';
        }
    }
}

export const backgroundJobsGenerator = BackgroundJobsGenerator.getInstance();
