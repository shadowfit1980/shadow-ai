/**
 * Agent Handoff System
 * 
 * Enables structured handoff between specialized agents with context
 * preservation and lifecycle management.
 */

import { EventEmitter } from 'events';
import { AgentType, AgentResult, ExecutionStep, AgentContext } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type HandoffStatus =
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface HandoffRequest {
    id: string;
    sourceAgent: AgentType;
    targetAgent: AgentType;
    task: string;
    context: Record<string, any>;
    /** Expected deliverables from the target agent */
    expectations: string[];
    /** Priority level */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** Max time allowed for handoff completion (ms) */
    timeout?: number;
    /** Callback data to pass back to source agent */
    callbackData?: any;
    createdAt: Date;
}

export interface HandoffResult {
    handoffId: string;
    status: HandoffStatus;
    success: boolean;
    /** Artifacts produced by target agent */
    artifacts: Record<string, any>;
    /** Messages/notes from target agent */
    notes: string[];
    /** Duration of the handoff */
    duration: number;
    /** Reason if rejected/failed */
    reason?: string;
    completedAt?: Date;
}

export interface ActiveHandoff {
    request: HandoffRequest;
    status: HandoffStatus;
    startedAt?: Date;
    result?: HandoffResult;
}

export interface HandoffPolicy {
    /** Max concurrent handoffs per agent type */
    maxConcurrent: number;
    /** Default timeout for handoffs (ms) */
    defaultTimeout: number;
    /** Allowed handoff routes (source -> targets) */
    allowedRoutes: Map<AgentType, AgentType[]>;
    /** Require acceptance before processing */
    requireAcceptance: boolean;
}

// ============================================================================
// AGENT HANDOFF MANAGER
// ============================================================================

export class AgentHandoffManager extends EventEmitter {
    private static instance: AgentHandoffManager;
    private activeHandoffs: Map<string, ActiveHandoff> = new Map();
    private handoffHistory: HandoffResult[] = [];
    private readonly MAX_HISTORY = 100;

    private policy: HandoffPolicy = {
        maxConcurrent: 5,
        defaultTimeout: 60000, // 1 minute
        allowedRoutes: new Map([
            ['architect', ['coder', 'designer', 'devops']],
            ['coder', ['debugger', 'reviewer', 'architect']],
            ['debugger', ['coder', 'reviewer']],
            ['reviewer', ['coder', 'architect']],
            ['devops', ['architect', 'coder']],
            ['designer', ['coder', 'architect']],
        ]),
        requireAcceptance: false,
    };

    private constructor() {
        super();
    }

    static getInstance(): AgentHandoffManager {
        if (!AgentHandoffManager.instance) {
            AgentHandoffManager.instance = new AgentHandoffManager();
        }
        return AgentHandoffManager.instance;
    }

    // -------------------------------------------------------------------------
    // Handoff Lifecycle
    // -------------------------------------------------------------------------

    /**
     * Request a handoff to another agent
     */
    requestHandoff(
        sourceAgent: AgentType,
        targetAgent: AgentType,
        task: string,
        options?: {
            context?: Record<string, any>;
            expectations?: string[];
            priority?: 'critical' | 'high' | 'medium' | 'low';
            timeout?: number;
            callbackData?: any;
        }
    ): HandoffRequest {
        // Validate route
        const allowedTargets = this.policy.allowedRoutes.get(sourceAgent);
        if (allowedTargets && !allowedTargets.includes(targetAgent)) {
            throw new Error(
                `Handoff from ${sourceAgent} to ${targetAgent} is not allowed by policy`
            );
        }

        // Check concurrent limit
        const activeCount = this.getActiveHandoffsForAgent(targetAgent).length;
        if (activeCount >= this.policy.maxConcurrent) {
            throw new Error(
                `Target agent ${targetAgent} has reached max concurrent handoffs (${this.policy.maxConcurrent})`
            );
        }

        const request: HandoffRequest = {
            id: `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourceAgent,
            targetAgent,
            task,
            context: options?.context || {},
            expectations: options?.expectations || [],
            priority: options?.priority || 'medium',
            timeout: options?.timeout || this.policy.defaultTimeout,
            callbackData: options?.callbackData,
            createdAt: new Date(),
        };

        const activeHandoff: ActiveHandoff = {
            request,
            status: this.policy.requireAcceptance ? 'pending' : 'in_progress',
            startedAt: this.policy.requireAcceptance ? undefined : new Date(),
        };

        this.activeHandoffs.set(request.id, activeHandoff);
        this.emit('handoffRequested', request);

        // Set timeout
        if (request.timeout) {
            setTimeout(() => {
                const handoff = this.activeHandoffs.get(request.id);
                if (handoff && !['completed', 'failed', 'cancelled'].includes(handoff.status)) {
                    this.fail(request.id, 'Handoff timed out');
                }
            }, request.timeout);
        }

        return request;
    }

    /**
     * Accept a pending handoff
     */
    accept(handoffId: string): boolean {
        const handoff = this.activeHandoffs.get(handoffId);
        if (!handoff) {
            throw new Error(`Handoff not found: ${handoffId}`);
        }

        if (handoff.status !== 'pending') {
            throw new Error(`Handoff ${handoffId} is not pending (status: ${handoff.status})`);
        }

        handoff.status = 'in_progress';
        handoff.startedAt = new Date();

        this.emit('handoffAccepted', handoff.request);
        return true;
    }

    /**
     * Reject a pending handoff
     */
    reject(handoffId: string, reason: string): HandoffResult {
        const handoff = this.activeHandoffs.get(handoffId);
        if (!handoff) {
            throw new Error(`Handoff not found: ${handoffId}`);
        }

        if (handoff.status !== 'pending') {
            throw new Error(`Handoff ${handoffId} is not pending (status: ${handoff.status})`);
        }

        const result: HandoffResult = {
            handoffId,
            status: 'rejected',
            success: false,
            artifacts: {},
            notes: [],
            duration: Date.now() - handoff.request.createdAt.getTime(),
            reason,
            completedAt: new Date(),
        };

        handoff.status = 'rejected';
        handoff.result = result;

        this.recordResult(result);
        this.emit('handoffRejected', { request: handoff.request, reason });

        return result;
    }

    /**
     * Complete a handoff successfully
     */
    complete(
        handoffId: string,
        artifacts: Record<string, any>,
        notes?: string[]
    ): HandoffResult {
        const handoff = this.activeHandoffs.get(handoffId);
        if (!handoff) {
            throw new Error(`Handoff not found: ${handoffId}`);
        }

        if (handoff.status !== 'in_progress') {
            throw new Error(
                `Handoff ${handoffId} is not in progress (status: ${handoff.status})`
            );
        }

        const result: HandoffResult = {
            handoffId,
            status: 'completed',
            success: true,
            artifacts,
            notes: notes || [],
            duration: Date.now() - (handoff.startedAt?.getTime() || handoff.request.createdAt.getTime()),
            completedAt: new Date(),
        };

        handoff.status = 'completed';
        handoff.result = result;

        this.recordResult(result);
        this.emit('handoffCompleted', { request: handoff.request, result });

        return result;
    }

    /**
     * Mark a handoff as failed
     */
    fail(handoffId: string, reason: string): HandoffResult {
        const handoff = this.activeHandoffs.get(handoffId);
        if (!handoff) {
            throw new Error(`Handoff not found: ${handoffId}`);
        }

        const result: HandoffResult = {
            handoffId,
            status: 'failed',
            success: false,
            artifacts: {},
            notes: [],
            duration: Date.now() - (handoff.startedAt?.getTime() || handoff.request.createdAt.getTime()),
            reason,
            completedAt: new Date(),
        };

        handoff.status = 'failed';
        handoff.result = result;

        this.recordResult(result);
        this.emit('handoffFailed', { request: handoff.request, reason });

        return result;
    }

    /**
     * Cancel a handoff
     */
    cancel(handoffId: string, reason?: string): boolean {
        const handoff = this.activeHandoffs.get(handoffId);
        if (!handoff) {
            return false;
        }

        if (['completed', 'failed', 'cancelled'].includes(handoff.status)) {
            return false;
        }

        const result: HandoffResult = {
            handoffId,
            status: 'cancelled',
            success: false,
            artifacts: {},
            notes: [],
            duration: Date.now() - handoff.request.createdAt.getTime(),
            reason: reason || 'Cancelled by request',
            completedAt: new Date(),
        };

        handoff.status = 'cancelled';
        handoff.result = result;

        this.recordResult(result);
        this.emit('handoffCancelled', { request: handoff.request, reason });

        return true;
    }

    // -------------------------------------------------------------------------
    // Query Methods
    // -------------------------------------------------------------------------

    /**
     * Get a specific handoff
     */
    getHandoff(handoffId: string): ActiveHandoff | undefined {
        return this.activeHandoffs.get(handoffId);
    }

    /**
     * Get all active handoffs
     */
    getActiveHandoffs(): ActiveHandoff[] {
        return Array.from(this.activeHandoffs.values()).filter(
            h => !['completed', 'failed', 'cancelled', 'rejected'].includes(h.status)
        );
    }

    /**
     * Get active handoffs for a specific agent
     */
    getActiveHandoffsForAgent(agentType: AgentType): ActiveHandoff[] {
        return this.getActiveHandoffs().filter(
            h => h.request.targetAgent === agentType
        );
    }

    /**
     * Get pending handoffs for a specific agent
     */
    getPendingHandoffs(agentType: AgentType): ActiveHandoff[] {
        return Array.from(this.activeHandoffs.values()).filter(
            h => h.request.targetAgent === agentType && h.status === 'pending'
        );
    }

    /**
     * Get handoff history
     */
    getHistory(limit?: number): HandoffResult[] {
        const history = [...this.handoffHistory].reverse();
        return limit ? history.slice(0, limit) : history;
    }

    // -------------------------------------------------------------------------
    // Policy Management
    // -------------------------------------------------------------------------

    /**
     * Update handoff policy
     */
    setPolicy(policy: Partial<HandoffPolicy>): void {
        this.policy = { ...this.policy, ...policy };
        this.emit('policyUpdated', this.policy);
    }

    /**
     * Get current policy
     */
    getPolicy(): HandoffPolicy {
        return { ...this.policy };
    }

    /**
     * Check if a handoff route is allowed
     */
    isRouteAllowed(source: AgentType, target: AgentType): boolean {
        const allowed = this.policy.allowedRoutes.get(source);
        return !allowed || allowed.includes(target);
    }

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    /**
     * Get handoff statistics
     */
    getStats(): {
        totalHandoffs: number;
        activeHandoffs: number;
        successRate: number;
        averageDuration: number;
        byStatus: Record<HandoffStatus, number>;
        byRoute: Record<string, number>;
    } {
        const history = this.handoffHistory;
        const successful = history.filter(h => h.success).length;
        const avgDuration = history.length > 0
            ? history.reduce((sum, h) => sum + h.duration, 0) / history.length
            : 0;

        const byStatus: Record<HandoffStatus, number> = {
            pending: 0,
            accepted: 0,
            rejected: 0,
            in_progress: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
        };

        history.forEach(h => {
            byStatus[h.status]++;
        });

        // Count by route
        const byRoute: Record<string, number> = {};
        this.activeHandoffs.forEach(h => {
            const route = `${h.request.sourceAgent} -> ${h.request.targetAgent}`;
            byRoute[route] = (byRoute[route] || 0) + 1;
        });

        return {
            totalHandoffs: history.length,
            activeHandoffs: this.getActiveHandoffs().length,
            successRate: history.length > 0 ? successful / history.length : 0,
            averageDuration: avgDuration,
            byStatus,
            byRoute,
        };
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private recordResult(result: HandoffResult): void {
        this.handoffHistory.push(result);
        if (this.handoffHistory.length > this.MAX_HISTORY) {
            this.handoffHistory.shift();
        }
    }

    /**
     * Clean up old completed handoffs
     */
    cleanup(maxAge: number = 3600000): number {
        const cutoff = Date.now() - maxAge;
        let cleaned = 0;

        this.activeHandoffs.forEach((handoff, id) => {
            if (
                ['completed', 'failed', 'cancelled', 'rejected'].includes(handoff.status) &&
                handoff.result?.completedAt &&
                handoff.result.completedAt.getTime() < cutoff
            ) {
                this.activeHandoffs.delete(id);
                cleaned++;
            }
        });

        return cleaned;
    }
}

// Export singleton
export const agentHandoffManager = AgentHandoffManager.getInstance();

// ============================================================================
// HELPER TYPES FOR AGENTS
// ============================================================================

/**
 * Mixin interface for agents that support handoffs
 */
export interface HandoffCapable {
    /**
     * Request handoff to another agent
     */
    handoffTo(
        targetAgent: AgentType,
        task: string,
        options?: {
            context?: Record<string, any>;
            expectations?: string[];
            priority?: 'critical' | 'high' | 'medium' | 'low';
        }
    ): Promise<HandoffResult>;

    /**
     * Receive and process a handoff
     */
    receiveHandoff(request: HandoffRequest): Promise<HandoffResult>;

    /**
     * Get pending handoffs for this agent
     */
    getPendingHandoffs(): ActiveHandoff[];
}
