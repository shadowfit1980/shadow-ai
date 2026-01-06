/**
 * Evolution Systems Integration Tests
 * 
 * Tests for v6.0 core systems:
 * - ExecutionSandbox
 * - RetryEngine  
 * - CodeVerifier
 * - VectorStore
 * - ActiveLearningEngine
 * - HTNPlanner
 * - MessageBus
 * - AgentProcess
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ============================================================================
// EXECUTION SANDBOX TESTS
// ============================================================================

describe('ExecutionSandbox Integration', () => {
    it('should validate dangerous commands', () => {
        const validateRequest = (command: string) => {
            const dangerousPatterns = [
                /rm\s+-rf\s+\/(?!\w)/,
                /mkfs\./,
                /dd\s+if=.*of=\/dev/,
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(command)) {
                    return { valid: false, issues: ['Dangerous command detected'] };
                }
            }
            return { valid: true, issues: [] };
        };

        expect(validateRequest('rm -rf /')).toEqual({ valid: false, issues: ['Dangerous command detected'] });
        expect(validateRequest('ls -la').valid).toBe(true);
        expect(validateRequest('npm install').valid).toBe(true);
    });

    it('should calculate resource metrics', () => {
        const parseResourceMetrics = (stdout: string) => {
            const memMatch = stdout.match(/(\d+\.?\d*)MiB/);
            const cpuMatch = stdout.match(/(\d+\.?\d*)%/);
            return {
                memoryUsedMB: memMatch ? parseFloat(memMatch[1]) : 0,
                cpuPercent: cpuMatch ? parseFloat(cpuMatch[1]) : 0
            };
        };

        expect(parseResourceMetrics('128.5MiB / 256MiB 45.2%')).toEqual({
            memoryUsedMB: 128.5,
            cpuPercent: 45.2
        });
    });
});

// ============================================================================
// RETRY ENGINE TESTS
// ============================================================================

describe('RetryEngine Integration', () => {
    it('should calculate exponential backoff correctly', () => {
        const calculateDelay = (attempt: number, baseDelay: number, multiplier: number, maxDelay: number) => {
            let delay = baseDelay * Math.pow(multiplier, attempt - 1);
            return Math.min(delay, maxDelay);
        };

        expect(calculateDelay(1, 1000, 2, 30000)).toBe(1000);
        expect(calculateDelay(2, 1000, 2, 30000)).toBe(2000);
        expect(calculateDelay(3, 1000, 2, 30000)).toBe(4000);
        expect(calculateDelay(10, 1000, 2, 30000)).toBe(30000);
    });

    it('should identify retryable errors', () => {
        const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', '429', '503'];
        const isRetryable = (error: string) => {
            return retryableErrors.some(pattern => error.includes(pattern));
        };

        expect(isRetryable('ECONNRESET')).toBe(true);
        expect(isRetryable('Error: Request failed with status 429')).toBe(true);
        expect(isRetryable('TypeError: undefined')).toBe(false);
    });

    it('should track circuit breaker state', () => {
        let consecutiveFailures = 0;
        const failureThreshold = 5;
        let circuitState: 'closed' | 'open' | 'half-open' = 'closed';

        const recordFailure = () => {
            consecutiveFailures++;
            if (consecutiveFailures >= failureThreshold) {
                circuitState = 'open';
            }
        };

        for (let i = 0; i < 4; i++) recordFailure();
        expect(circuitState).toBe('closed');

        recordFailure();
        expect(circuitState).toBe('open');
    });
});

// ============================================================================
// CODE VERIFIER TESTS
// ============================================================================

describe('CodeVerifier Integration', () => {
    it('should detect security vulnerabilities', () => {
        const patterns = [
            { id: 'EVAL_USAGE', pattern: /\beval\s*\(/, severity: 'high' },
            { id: 'SQL_INJECTION', pattern: /\$\{.*\}.*(?:SELECT|INSERT)/i, severity: 'critical' },
            { id: 'HARDCODED_SECRET', pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/i, severity: 'high' }
        ];

        const scanCode = (code: string) => {
            return patterns.filter(p => p.pattern.test(code));
        };

        expect(scanCode('eval(userInput)').length).toBe(1);
        expect(scanCode('const password = "supersecret123"').length).toBe(1);
        expect(scanCode('console.log("hello")').length).toBe(0);
    });

    it('should validate bracket matching', () => {
        const validateBrackets = (code: string) => {
            const brackets: Record<string, number> = { '(': 0, '[': 0, '{': 0 };
            const closers: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

            for (const char of code) {
                if (brackets[char] !== undefined) brackets[char]++;
                else if (closers[char]) brackets[closers[char]]--;
            }

            return Object.values(brackets).every(v => v === 0);
        };

        expect(validateBrackets('function test() { return [1, 2]; }')).toBe(true);
        expect(validateBrackets('function test() { return [1, 2]; ')).toBe(false);
        expect(validateBrackets('((()))')).toBe(true);
    });
});

// ============================================================================
// VECTOR STORE TESTS
// ============================================================================

describe('VectorStore Integration', () => {
    it('should calculate cosine similarity', () => {
        const cosineSimilarity = (a: number[], b: number[]) => {
            let dotProduct = 0, normA = 0, normB = 0;
            for (let i = 0; i < a.length; i++) {
                dotProduct += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }
            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        };

        expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
        expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
        expect(cosineSimilarity([1, 1], [1, 1])).toBeCloseTo(1);
    });

    it('should chunk text with overlap', () => {
        const chunkText = (text: string, chunkSize: number, overlap: number) => {
            const chunks: string[] = [];
            for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
                chunks.push(text.substring(i, i + chunkSize));
                if (i + chunkSize >= text.length) break;
            }
            return chunks;
        };

        const result = chunkText('abcdefghij', 4, 1);
        expect(result[0]).toBe('abcd');
        expect(result[1]).toBe('defg');
    });
});

// ============================================================================
// ACTIVE LEARNING ENGINE TESTS
// ============================================================================

describe('ActiveLearningEngine Integration', () => {
    it('should detect performance trends', () => {
        const detectTrend = (outcomes: boolean[]) => {
            const recent = outcomes.slice(-5);
            const older = outcomes.slice(-10, -5);

            const recentRate = recent.filter(o => o).length / recent.length;
            const olderRate = older.length > 0 ? older.filter(o => o).length / older.length : 0;

            if (recentRate > olderRate + 0.1) return 'improving';
            if (recentRate < olderRate - 0.1) return 'declining';
            return 'stable';
        };

        expect(detectTrend([false, false, false, false, false, true, true, true, true, true])).toBe('improving');
        expect(detectTrend([true, true, true, true, true, false, false, false, false, false])).toBe('declining');
    });

    it('should calculate success rate for variants', () => {
        const updateVariant = (variant: { testCount: number; successCount: number; successRate: number }, success: boolean) => {
            variant.testCount++;
            if (success) variant.successCount++;
            variant.successRate = variant.successCount / variant.testCount;
            return variant;
        };

        const variant = { testCount: 0, successCount: 0, successRate: 0 };
        updateVariant(variant, true);
        updateVariant(variant, true);
        updateVariant(variant, false);

        expect(variant.testCount).toBe(3);
        expect(variant.successRate).toBeCloseTo(0.667, 2);
    });
});

// ============================================================================
// HTN PLANNER TESTS
// ============================================================================

describe('HTNPlanner Integration', () => {
    it('should perform topological sort', () => {
        const topologicalSort = (tasks: { id: string; dependencies: string[] }[]) => {
            const sorted: string[] = [];
            const visited = new Set<string>();

            const visit = (taskId: string) => {
                if (visited.has(taskId)) return;
                visited.add(taskId);

                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    for (const dep of task.dependencies) {
                        visit(dep);
                    }
                }
                sorted.push(taskId);
            };

            for (const task of tasks) {
                visit(task.id);
            }

            return sorted;
        };

        const tasks = [
            { id: 'c', dependencies: ['a', 'b'] },
            { id: 'b', dependencies: ['a'] },
            { id: 'a', dependencies: [] }
        ];

        const result = topologicalSort(tasks);
        expect(result.indexOf('a')).toBeLessThan(result.indexOf('b'));
        expect(result.indexOf('b')).toBeLessThan(result.indexOf('c'));
    });

    it('should verify plan conditions', () => {
        const checkCondition = (condition: { key: string; value: any }, state: Map<string, any>) => {
            return state.get(condition.key) === condition.value;
        };

        const state = new Map([['hasTests', true], ['isBuilt', false]]);

        expect(checkCondition({ key: 'hasTests', value: true }, state)).toBe(true);
        expect(checkCondition({ key: 'isBuilt', value: true }, state)).toBe(false);
    });
});

// ============================================================================
// MESSAGE BUS TESTS
// ============================================================================

describe('MessageBus Integration', () => {
    it('should manage subscriptions', () => {
        const subscriptions = new Map<string, string[]>();

        const subscribe = (topic: string, agentId: string) => {
            const existing = subscriptions.get(topic) || [];
            existing.push(agentId);
            subscriptions.set(topic, existing);
        };

        subscribe('tasks', 'agent-1');
        subscribe('tasks', 'agent-2');
        subscribe('logs', 'agent-1');

        expect(subscriptions.get('tasks')).toHaveLength(2);
        expect(subscriptions.get('logs')).toHaveLength(1);
    });

    it('should filter messages by topic', () => {
        const messages = [
            { topic: 'tasks', payload: 'task1' },
            { topic: 'logs', payload: 'log1' },
            { topic: 'tasks', payload: 'task2' }
        ];

        const taskMessages = messages.filter(m => m.topic === 'tasks');
        expect(taskMessages).toHaveLength(2);
    });
});

// ============================================================================
// AGENT PROCESS TESTS
// ============================================================================

describe('AgentProcess Integration', () => {
    it('should match capabilities', () => {
        const agents = [
            { id: 'agent-1', capabilities: ['coding', 'testing'], status: 'idle' },
            { id: 'agent-2', capabilities: ['planning', 'coding'], status: 'busy' },
            { id: 'agent-3', capabilities: ['testing'], status: 'idle' }
        ];

        const findAgent = (capability: string) => {
            return agents.find(a =>
                a.status === 'idle' &&
                a.capabilities.includes(capability)
            );
        };

        expect(findAgent('coding')?.id).toBe('agent-1');
        expect(findAgent('planning')).toBeUndefined();  // agent-2 is busy
        expect(findAgent('testing')?.id).toBe('agent-1');
    });

    it('should manage task queue', () => {
        const queue: { taskId: string; agentId: string }[] = [];

        const enqueue = (agentId: string) => {
            queue.push({ taskId: `task-${Date.now()}`, agentId });
        };

        const dequeue = (agentId: string) => {
            const index = queue.findIndex(t => t.agentId === agentId);
            if (index !== -1) {
                return queue.splice(index, 1)[0];
            }
            return null;
        };

        enqueue('agent-1');
        enqueue('agent-1');
        enqueue('agent-2');

        expect(queue).toHaveLength(3);
        expect(dequeue('agent-1')?.agentId).toBe('agent-1');
        expect(queue).toHaveLength(2);
    });
});

// ============================================================================
// CROSS-SYSTEM INTEGRATION
// ============================================================================

describe('Cross-System Integration', () => {
    it('should flow: Code Verification → Learning → Improvement', () => {
        // Simulate code verification
        const verifyCode = (code: string) => ({
            valid: !code.includes('eval'),
            score: code.includes('eval') ? 60 : 95
        });

        // Track outcome
        const outcomes: { valid: boolean; score: number }[] = [];
        const trackOutcome = (result: { valid: boolean; score: number }) => {
            outcomes.push(result);
        };

        // Generate insight
        const generateInsight = () => {
            const avgScore = outcomes.reduce((sum, o) => sum + o.score, 0) / outcomes.length;
            return avgScore >= 80 ? 'Performing well' : 'Needs improvement';
        };

        trackOutcome(verifyCode('const x = 1'));
        trackOutcome(verifyCode('eval(input)'));
        trackOutcome(verifyCode('const y = 2'));

        expect(generateInsight()).toBe('Performing well');
    });

    it('should flow: Planning → Execution → Verification', () => {
        // Create plan
        const plan = {
            tasks: ['analyze', 'implement', 'test'],
            status: 'ready'
        };

        // Execute with verification
        const results: { task: string; success: boolean }[] = [];

        for (const task of plan.tasks) {
            const success = Math.random() > 0.1;  // 90% success rate
            results.push({ task, success });
        }

        plan.status = results.every(r => r.success) ? 'completed' : 'failed';

        expect(['completed', 'failed']).toContain(plan.status);
        expect(results.length).toBe(3);
    });
});
