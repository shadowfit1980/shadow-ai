/**
 * UnifiedAgentBus - Inter-Agent Communication Backbone
 * 
 * Enables agents to communicate, collaborate, and delegate tasks
 * through a centralized message bus with topic-based subscriptions.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';
export type MessageType = 'request' | 'response' | 'broadcast' | 'notification' | 'delegation';

export interface AgentCapabilities {
    agentId: string;
    name: string;
    capabilities: string[];
    specializations: string[];
    maxConcurrentTasks: number;
    status: 'idle' | 'busy' | 'offline';
}

export interface BusMessage {
    id: string;
    type: MessageType;
    source: string;
    target?: string;
    topic?: string;
    payload: any;
    priority: MessagePriority;
    timestamp: Date;
    correlationId?: string;
    ttl?: number;
    metadata?: Record<string, any>;
}

export interface AgentRequest {
    action: string;
    params: Record<string, any>;
    timeout?: number;
    priority?: MessagePriority;
}

export interface AgentResponse {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    agentId: string;
}

export type MessageHandler = (message: BusMessage) => void | Promise<void>;
export type RequestHandler = (request: AgentRequest, sourceAgentId: string) => Promise<AgentResponse>;
export type Unsubscribe = () => void;

export interface BusStatus {
    registeredAgents: number;
    activeSubscriptions: number;
    messagesSent: number;
    messagesDelivered: number;
    pendingRequests: number;
}

// ============================================================================
// UNIFIED AGENT BUS
// ============================================================================

export class UnifiedAgentBus extends EventEmitter {
    private static instance: UnifiedAgentBus;

    private agents: Map<string, AgentCapabilities> = new Map();
    private subscriptions: Map<string, Set<MessageHandler>> = new Map();
    private requestHandlers: Map<string, RequestHandler> = new Map();
    private pendingRequests: Map<string, {
        resolve: (value: AgentResponse) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }> = new Map();

    private stats = {
        messagesSent: 0,
        messagesDelivered: 0
    };

    private constructor() {
        super();
    }

    static getInstance(): UnifiedAgentBus {
        if (!UnifiedAgentBus.instance) {
            UnifiedAgentBus.instance = new UnifiedAgentBus();
        }
        return UnifiedAgentBus.instance;
    }

    // ========================================================================
    // AGENT REGISTRATION
    // ========================================================================

    /**
     * Register an agent with the bus
     */
    registerAgent(
        agentId: string,
        name: string,
        capabilities: string[],
        specializations: string[] = []
    ): void {
        const agent: AgentCapabilities = {
            agentId,
            name,
            capabilities,
            specializations,
            maxConcurrentTasks: 5,
            status: 'idle'
        };

        this.agents.set(agentId, agent);
        this.emit('agent:registered', agent);
        console.log(`📡 [AgentBus] Registered agent: ${name} (${agentId})`);
    }

    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): boolean {
        const agent = this.agents.get(agentId);
        if (agent) {
            this.agents.delete(agentId);
            this.requestHandlers.delete(agentId);
            this.emit('agent:unregistered', { agentId });
            console.log(`📡 [AgentBus] Unregistered agent: ${agentId}`);
            return true;
        }
        return false;
    }

    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentCapabilities['status']): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = status;
            this.emit('agent:statusChanged', { agentId, status });
        }
    }

    /**
     * Get agent capabilities
     */
    getAgentCapabilities(agentId: string): AgentCapabilities | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Get all registered agents
     */
    getRegisteredAgents(): AgentCapabilities[] {
        return Array.from(this.agents.values());
    }

    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): AgentCapabilities[] {
        return Array.from(this.agents.values())
            .filter(agent =>
                agent.capabilities.includes(capability) ||
                agent.specializations.includes(capability)
            );
    }

    // ========================================================================
    // MESSAGING
    // ========================================================================

    /**
     * Broadcast a message to all subscribers of a topic
     */
    broadcast(topic: string, payload: any, options?: {
        priority?: MessagePriority;
        source?: string;
    }): void {
        const message: BusMessage = {
            id: this.generateId(),
            type: 'broadcast',
            source: options?.source || 'system',
            topic,
            payload,
            priority: options?.priority || 'normal',
            timestamp: new Date()
        };

        this.deliverMessage(message);
    }

    /**
     * Send a notification to a specific agent
     */
    notify(targetAgentId: string, payload: any, options?: {
        priority?: MessagePriority;
        source?: string;
    }): void {
        const message: BusMessage = {
            id: this.generateId(),
            type: 'notification',
            source: options?.source || 'system',
            target: targetAgentId,
            payload,
            priority: options?.priority || 'normal',
            timestamp: new Date()
        };

        this.deliverToAgent(targetAgentId, message);
    }

    /**
     * Send a request to a specific agent and wait for response
     */
    async request(
        targetAgentId: string,
        request: AgentRequest
    ): Promise<AgentResponse> {
        const handler = this.requestHandlers.get(targetAgentId);
        if (!handler) {
            throw new Error(`No request handler registered for agent: ${targetAgentId}`);
        }

        const agent = this.agents.get(targetAgentId);
        if (!agent || agent.status === 'offline') {
            throw new Error(`Agent ${targetAgentId} is not available`);
        }

        const timeout = request.timeout || 30000;
        const correlationId = this.generateId();

        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(correlationId);
                reject(new Error(`Request to ${targetAgentId} timed out`));
            }, timeout);

            this.pendingRequests.set(correlationId, {
                resolve,
                reject,
                timeout: timeoutHandle
            });

            // Execute the handler
            handler(request, 'system')
                .then(response => {
                    const pending = this.pendingRequests.get(correlationId);
                    if (pending) {
                        clearTimeout(pending.timeout);
                        this.pendingRequests.delete(correlationId);
                        resolve(response);
                    }
                })
                .catch(error => {
                    const pending = this.pendingRequests.get(correlationId);
                    if (pending) {
                        clearTimeout(pending.timeout);
                        this.pendingRequests.delete(correlationId);
                        reject(error);
                    }
                });
        });
    }

    /**
     * Delegate a task to the best available agent
     */
    async delegate(
        capability: string,
        request: AgentRequest
    ): Promise<AgentResponse> {
        const candidates = this.findAgentsByCapability(capability)
            .filter(a => a.status !== 'offline');

        if (candidates.length === 0) {
            throw new Error(`No agents available with capability: ${capability}`);
        }

        // Prefer idle agents
        const idleAgent = candidates.find(a => a.status === 'idle');
        const targetAgent = idleAgent || candidates[0];

        console.log(`📡 [AgentBus] Delegating ${request.action} to ${targetAgent.name}`);
        return this.request(targetAgent.agentId, request);
    }

    // ========================================================================
    // SUBSCRIPTIONS
    // ========================================================================

    /**
     * Subscribe to a topic
     */
    subscribe(topic: string, handler: MessageHandler): Unsubscribe {
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, new Set());
        }

        this.subscriptions.get(topic)!.add(handler);

        return () => {
            const handlers = this.subscriptions.get(topic);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.subscriptions.delete(topic);
                }
            }
        };
    }

    /**
     * Register a request handler for an agent
     */
    registerRequestHandler(agentId: string, handler: RequestHandler): void {
        this.requestHandlers.set(agentId, handler);
        console.log(`📡 [AgentBus] Registered request handler for: ${agentId}`);
    }

    // ========================================================================
    // MESSAGE DELIVERY
    // ========================================================================

    private deliverMessage(message: BusMessage): void {
        this.stats.messagesSent++;

        if (message.topic) {
            const handlers = this.subscriptions.get(message.topic);
            if (handlers) {
                for (const handler of handlers) {
                    try {
                        handler(message);
                        this.stats.messagesDelivered++;
                    } catch (error) {
                        console.error(`[AgentBus] Handler error for topic ${message.topic}:`, error);
                    }
                }
            }
        }

        // Also emit on the bus itself
        this.emit('message', message);
    }

    private deliverToAgent(agentId: string, message: BusMessage): void {
        this.stats.messagesSent++;

        const agent = this.agents.get(agentId);
        if (!agent) {
            console.warn(`[AgentBus] Agent not found: ${agentId}`);
            return;
        }

        this.emit(`agent:${agentId}`, message);
        this.stats.messagesDelivered++;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private generateId(): string {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get bus status
     */
    getStatus(): BusStatus {
        return {
            registeredAgents: this.agents.size,
            activeSubscriptions: Array.from(this.subscriptions.values())
                .reduce((sum, handlers) => sum + handlers.size, 0),
            messagesSent: this.stats.messagesSent,
            messagesDelivered: this.stats.messagesDelivered,
            pendingRequests: this.pendingRequests.size
        };
    }

    /**
     * Get agent directory (list of all agents and capabilities)
     */
    getDirectory(): Array<{
        agentId: string;
        name: string;
        capabilities: string[];
        status: string;
    }> {
        return Array.from(this.agents.values()).map(a => ({
            agentId: a.agentId,
            name: a.name,
            capabilities: a.capabilities,
            status: a.status
        }));
    }

    /**
     * Clear all registrations and subscriptions
     */
    clear(): void {
        this.agents.clear();
        this.subscriptions.clear();
        this.requestHandlers.clear();

        for (const pending of this.pendingRequests.values()) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bus cleared'));
        }
        this.pendingRequests.clear();

        this.stats.messagesSent = 0;
        this.stats.messagesDelivered = 0;
    }
}

// Export singleton
export const agentBus = UnifiedAgentBus.getInstance();
