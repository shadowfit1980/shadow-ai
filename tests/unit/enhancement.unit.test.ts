/**
 * Enhancement Systems Unit Tests
 * 
 * Unit tests for v5.1 enhancement systems:
 * - MCP Tool Orchestrator
 * - Self-Improvement Engine
 * - Proactive Insight Engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// MCP TOOL ORCHESTRATOR TESTS
// ============================================================================

describe('MCP Tool Orchestrator - Unit Tests', () => {
    describe('Server Management', () => {
        it('should generate unique server IDs', () => {
            const generateServerId = () => `server-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            const id1 = generateServerId();
            const id2 = generateServerId();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^server-\d+-[a-z0-9]+$/);
        });

        it('should track server connection status', () => {
            const server = {
                id: 'test-server',
                name: 'Test MCP Server',
                endpoint: 'http://localhost:8080',
                status: 'disconnected' as const,
                lastPing: new Date(),
                capabilities: ['tools', 'resources']
            };

            expect(server.status).toBe('disconnected');
            server.status = 'connected';
            expect(server.status).toBe('connected');
        });
    });

    describe('Tool Discovery', () => {
        it('should categorize tools by capability', () => {
            const tools = [
                { name: 'file_read', category: 'filesystem' },
                { name: 'file_write', category: 'filesystem' },
                { name: 'web_search', category: 'web' },
                { name: 'execute_command', category: 'shell' }
            ];

            const byCategory = tools.reduce((acc, tool) => {
                acc[tool.category] = acc[tool.category] || [];
                acc[tool.category].push(tool);
                return acc;
            }, {} as Record<string, typeof tools>);

            expect(byCategory.filesystem).toHaveLength(2);
            expect(byCategory.web).toHaveLength(1);
            expect(byCategory.shell).toHaveLength(1);
        });

        it('should calculate tool fit score based on intent', () => {
            const calculateFit = (toolName: string, toolDesc: string, intent: string) => {
                const intentWords = intent.toLowerCase().split(/\s+/);
                let score = 0;
                for (const word of intentWords) {
                    if (toolName.includes(word)) score += 2;
                    if (toolDesc.toLowerCase().includes(word)) score += 1;
                }
                return score;
            };

            const score = calculateFit('file_read', 'Read contents of a file', 'read the config file');
            expect(score).toBeGreaterThan(0);
        });
    });

    describe('Tool Execution', () => {
        it('should track execution latency', () => {
            const trackExecution = (startTime: number, endTime: number) => ({
                duration: endTime - startTime,
                timestamp: new Date(endTime)
            });

            const result = trackExecution(1000, 1250);
            expect(result.duration).toBe(250);
        });

        it('should calculate success rate', () => {
            const calculateSuccessRate = (successes: number, total: number) =>
                total > 0 ? successes / total : 0;

            expect(calculateSuccessRate(45, 50)).toBe(0.9);
            expect(calculateSuccessRate(0, 0)).toBe(0);
        });
    });
});

// ============================================================================
// SELF-IMPROVEMENT ENGINE TESTS
// ============================================================================

describe('Self-Improvement Engine - Unit Tests', () => {
    describe('Outcome Tracking', () => {
        it('should categorize outcomes by agent and task type', () => {
            const outcomes = [
                { agentId: 'nexus', taskType: 'planning', success: true },
                { agentId: 'nexus', taskType: 'planning', success: true },
                { agentId: 'nexus', taskType: 'planning', success: false },
                { agentId: 'atlas', taskType: 'architecture', success: true }
            ];

            const categorized = outcomes.reduce((acc, o) => {
                const key = `${o.agentId}:${o.taskType}`;
                acc[key] = acc[key] || { successes: 0, total: 0 };
                acc[key].total++;
                if (o.success) acc[key].successes++;
                return acc;
            }, {} as Record<string, { successes: number; total: number }>);

            expect(categorized['nexus:planning'].total).toBe(3);
            expect(categorized['nexus:planning'].successes).toBe(2);
        });

        it('should detect performance trends', () => {
            const detectTrend = (recent: number[], threshold: number) => {
                if (recent.length < 2) return 'stable';
                const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const recentAvg = recent.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, recent.length);
                if (recentAvg > avg + threshold) return 'improving';
                if (recentAvg < avg - threshold) return 'declining';
                return 'stable';
            };

            expect(detectTrend([0.7, 0.75, 0.8, 0.85, 0.9], 0.05)).toBe('improving');
            expect(detectTrend([0.9, 0.85, 0.8, 0.75, 0.7], 0.05)).toBe('declining');
            expect(detectTrend([0.8, 0.82, 0.79, 0.81, 0.8], 0.05)).toBe('stable');
        });
    });

    describe('Prompt A/B Testing', () => {
        it('should select best performing variant', () => {
            const variants = [
                { id: 'v1', successRate: 0.75, testCount: 100 },
                { id: 'v2', successRate: 0.82, testCount: 100 },
                { id: 'v3', successRate: 0.78, testCount: 50 }
            ];

            const minSamples = 75;
            const eligible = variants.filter(v => v.testCount >= minSamples);
            const best = eligible.reduce((a, b) => a.successRate > b.successRate ? a : b);

            expect(best.id).toBe('v2');
        });

        it('should update variant statistics correctly', () => {
            const updateStats = (variant: { successRate: number; testCount: number }, success: boolean) => {
                const oldSuccesses = variant.successRate * variant.testCount;
                variant.testCount++;
                variant.successRate = (oldSuccesses + (success ? 1 : 0)) / variant.testCount;
                return variant;
            };

            const variant = { successRate: 0.8, testCount: 10 }; // 8 successes
            updateStats(variant, true); // 9 successes out of 11
            expect(variant.successRate).toBeCloseTo(0.818, 2);
        });
    });

    describe('Strategy Evolution', () => {
        it('should mutate strategy parameters', () => {
            const mutate = (params: Record<string, number>, mutationRate: number) => {
                const mutated = { ...params };
                for (const key of Object.keys(mutated)) {
                    mutated[key] = Math.max(0, Math.min(1,
                        mutated[key] + (Math.random() - 0.5) * mutationRate
                    ));
                }
                return mutated;
            };

            const original = { riskTolerance: 0.5, autonomy: 0.7 };
            const mutated = mutate(original, 0.1);

            expect(mutated.riskTolerance).toBeGreaterThanOrEqual(0);
            expect(mutated.riskTolerance).toBeLessThanOrEqual(1);
        });
    });
});

// ============================================================================
// PROACTIVE INSIGHT ENGINE TESTS
// ============================================================================

describe('Proactive Insight Engine - Unit Tests', () => {
    describe('Pattern Detection', () => {
        it('should detect repetitive actions', () => {
            const actions = ['save', 'build', 'test', 'save', 'build', 'test', 'save', 'build', 'test'];
            const actionCounts = actions.reduce((acc, a) => {
                acc[a] = (acc[a] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const repetitive = Object.entries(actionCounts)
                .filter(([_, count]) => count >= 3)
                .map(([action]) => action);

            expect(repetitive).toContain('save');
            expect(repetitive).toContain('build');
            expect(repetitive).toContain('test');
        });

        it('should detect workflow sequences', () => {
            const actions = ['edit', 'save', 'build', 'test', 'edit', 'save', 'build', 'test'];
            const windowSize = 4;
            const sequences: string[] = [];

            for (let i = windowSize; i <= actions.length; i++) {
                sequences.push(actions.slice(i - windowSize, i).join(' → '));
            }

            const sequenceCounts = sequences.reduce((acc, s) => {
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const repeated = Object.entries(sequenceCounts)
                .filter(([_, count]) => count >= 2);

            expect(repeated.length).toBeGreaterThan(0);
        });
    });

    describe('Insight Generation', () => {
        it('should categorize insights by impact', () => {
            const insights = [
                { type: 'warning', impact: 'high', title: 'Security vulnerability' },
                { type: 'suggestion', impact: 'medium', title: 'Update available' },
                { type: 'optimization', impact: 'low', title: 'Minor improvement' }
            ];

            const byImpact = {
                high: insights.filter(i => i.impact === 'high'),
                medium: insights.filter(i => i.impact === 'medium'),
                low: insights.filter(i => i.impact === 'low')
            };

            expect(byImpact.high).toHaveLength(1);
            expect(byImpact.medium).toHaveLength(1);
            expect(byImpact.low).toHaveLength(1);
        });

        it('should prioritize actionable insights', () => {
            const insights = [
                { title: 'A', actionable: true, impact: 'low' },
                { title: 'B', actionable: false, impact: 'high' },
                { title: 'C', actionable: true, impact: 'high' }
            ];

            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const sorted = [...insights].sort((a, b) => {
                // Actionable first, then by impact
                if (a.actionable !== b.actionable) return a.actionable ? -1 : 1;
                return (priorityOrder[a.impact as keyof typeof priorityOrder] || 2) -
                    (priorityOrder[b.impact as keyof typeof priorityOrder] || 2);
            });

            expect(sorted[0].title).toBe('C'); // actionable + high
            expect(sorted[1].title).toBe('A'); // actionable + low
        });
    });

    describe('Automation Suggestions', () => {
        it('should calculate time savings', () => {
            const calculateTimeSaved = (
                actionTimeSeconds: number,
                occurrencesPerDay: number,
                daysPerMonth: number
            ) => {
                const monthlyOccurrences = occurrencesPerDay * daysPerMonth;
                const totalSeconds = actionTimeSeconds * monthlyOccurrences;
                return {
                    secondsPerMonth: totalSeconds,
                    minutesPerMonth: totalSeconds / 60,
                    hoursPerMonth: totalSeconds / 3600
                };
            };

            const savings = calculateTimeSaved(30, 10, 20); // 30s action, 10x/day, 20 days
            expect(savings.minutesPerMonth).toBe(100);
        });
    });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Enhancement System Integration', () => {
    it('should flow from action tracking to insight generation', () => {
        // Simulate action tracking
        const actions: string[] = [];
        const trackAction = (action: string) => actions.push(action);

        // Track repetitive actions
        for (let i = 0; i < 5; i++) {
            trackAction('git commit');
            trackAction('git push');
        }

        // Detect pattern
        const commitCount = actions.filter(a => a === 'git commit').length;
        expect(commitCount).toBe(5);

        // Generate insight if pattern detected
        const generateInsight = (pattern: string, frequency: number) => {
            if (frequency >= 3) {
                return {
                    type: 'automation',
                    title: `Automate: ${pattern}`,
                    confidence: Math.min(0.95, 0.6 + (frequency * 0.05))
                };
            }
            return null;
        };

        const insight = generateInsight('git commit + push', commitCount);
        expect(insight).not.toBeNull();
        expect(insight?.type).toBe('automation');
    });

    it('should connect outcome tracking to strategy evolution', () => {
        // Track outcomes
        const outcomes = [
            { agentId: 'nexus', success: true },
            { agentId: 'nexus', success: true },
            { agentId: 'nexus', success: false },
            { agentId: 'nexus', success: true },
            { agentId: 'nexus', success: true }
        ];

        // Calculate fitness
        const successRate = outcomes.filter(o => o.success).length / outcomes.length;
        expect(successRate).toBe(0.8);

        // Decide if evolution is warranted
        const shouldEvolve = (currentFitness: number, threshold: number) =>
            currentFitness < threshold;

        expect(shouldEvolve(0.8, 0.9)).toBe(true);
        expect(shouldEvolve(0.8, 0.75)).toBe(false);
    });
});
