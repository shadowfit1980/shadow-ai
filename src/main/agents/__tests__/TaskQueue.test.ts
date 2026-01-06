// src/main/agents/__tests__/TaskQueue.test.ts
import { TaskQueue, TaskPriority } from '../../agents/TaskQueue';

describe('TaskQueue', () => {
    let queue: TaskQueue;

    beforeEach(() => {
        // Reset singleton instance by accessing private static (not directly possible), so we create a new instance via getInstance and clear tasks.
        queue = TaskQueue.getInstance();
        // Clear any existing tasks to ensure test isolation
        (queue as any).tasks.clear();
        (queue as any).runningTasks.clear();
        (queue as any).taskIdCounter = 0;
    });

    test('adds tasks with correct priority ordering', () => {
        // First, fill up the max concurrent slots to prevent auto-starting
        (queue as any).maxConcurrent = 0; // Temporarily disable auto-start

        const ids: string[] = [];
        ids.push(queue.addTask('test', '/dummy', {}, 'low'));
        ids.push(queue.addTask('test', '/dummy', {}, 'critical'));
        ids.push(queue.addTask('test', '/dummy', {}, 'high'));

        // Get pending tasks directly via private method (using any cast)
        const pending = (queue as any).getPendingTasks();
        expect(pending.map((t: any) => t.priority)).toEqual(['critical', 'high', 'low']);
    });

    test('respects max concurrent tasks', () => {
        // Set max concurrent to 2 for test
        (queue as any).setMaxConcurrent(2);
        // Add three tasks that will stay pending (no execution logic, just simulate start)
        const id1 = queue.addTask('test', '/dummy', {}, 'normal');
        const id2 = queue.addTask('test', '/dummy', {}, 'normal');
        const id3 = queue.addTask('test', '/dummy', {}, 'normal');
        // Manually start first two tasks to simulate running
        (queue as any).startTask(id1);
        (queue as any).startTask(id2);
        // Process queue should not start third because max concurrent reached
        (queue as any).processQueue();
        const running = (queue as any).runningTasks;
        expect(running.size).toBe(2);
        expect(running.has(id3)).toBe(false);
    });
});
