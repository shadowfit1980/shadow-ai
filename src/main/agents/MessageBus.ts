/**
 * MessageBus - Inter-Agent Communication System
 * 
 * Provides pub/sub and direct messaging between agents:
 * - Topic-based subscriptions
 * - Direct agent-to-agent messaging
 * - Request/response patterns
 * - Message persistence and replay
 * - Delivery guarantees
 */

import { EventEmitter } from 'events';
import { Worker, MessageChannel, MessagePort } from 'worker_threads';

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
    id: string;
    type: 'broadcast' | 'direct' | 'request' | 'response';
    topic?: string;
    from: string;
    to?: string;
    payload: any;
    correlationId?: string;  // For request/response pairing
    timestamp: Date;
    ttl?: number;  // Time to live in ms
    priority: 'low' | 'normal' | 'high' | 'critical';
    delivered: boolean;
    acknowledged: boolean;
}

export interface Subscription {
    id: string;
    agentId: string;
    topic: string;
    handler: (message: Message) => void | Promise<void>;
    filter?: (message: Message) => boolean;
    createdAt: Date;
}

export interface AgentConnection {
    agentId: string;
    port?: MessagePort;
    worker?: Worker;
    status: 'connected' | 'disconnected' | 'busy';
    lastSeen: Date;
    messageCount: number;
}

export interface MessageStats {
    totalSent: number;
    totalReceived: number;
    totalBroadcast: number;
    totalDirect: number;
    deliveryRate: number;
    avgLatency: number;
}

// ============================================================================
// MESSAGE BUS CLASS
// ============================================================================

export class MessageBus extends EventEmitter {
    private agents: Map<string, AgentConnection> = new Map();
    private subscriptions: Map<string, Subscription[]> = new Map();  // topic -> subscriptions
    private pendingRequests: Map<string, {
        resolve: (response: any) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }> = new Map();
    private messageHistory: Message[] = [];
    private stats: MessageStats = {
        totalSent: 0,
        totalReceived: 0,
        totalBroadcast: 0,
        totalDirect: 0,
        deliveryRate: 1,
        avgLatency: 0
    };

    private maxHistorySize = 1000;
    private defaultRequestTimeout = 30000;

    constructor() {
        super();
        console.log('[MessageBus] Initialized');
    }

    /**
     * Register an agent with the message bus
     */
    registerAgent(agentId: string, worker?: Worker): AgentConnection {
        const existing = this.agents.get(agentId);
        if (existing) {
            existing.status = 'connected';
            existing.lastSeen = new Date();
            return existing;
        }

        const connection: AgentConnection = {
            agentId,
            worker,
            status: 'connected',
            lastSeen: new Date(),
            messageCount: 0
        };

        // If worker provided, set up message channel
        if (worker) {
            worker.on('message', (msg) => {
                this.handleWorkerMessage(agentId, msg);
            });

            worker.on('error', (err) => {
                console.error(`[MessageBus] Worker error for ${agentId}:`, err);
                connection.status = 'disconnected';
            });

            worker.on('exit', () => {
                connection.status = 'disconnected';
            });
        }

        this.agents.set(agentId, connection);
        this.emit('agentRegistered', { agentId });
        console.log(`[MessageBus] Agent registered: ${agentId}`);

        return connection;
    }

    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = 'disconnected';

            // Remove all subscriptions for this agent
            for (const [topic, subs] of this.subscriptions) {
                this.subscriptions.set(topic, subs.filter(s => s.agentId !== agentId));
            }

            this.agents.delete(agentId);
            this.emit('agentUnregistered', { agentId });
        }
    }

    /**
     * Subscribe to a topic
     */
    subscribe(
        agentId: string,
        topic: string,
        handler: (message: Message) => void | Promise<void>,
        filter?: (message: Message) => boolean
    ): string {
        const subscription: Subscription = {
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            agentId,
            topic,
            handler,
            filter,
            createdAt: new Date()
        };

        const existing = this.subscriptions.get(topic) || [];
        existing.push(subscription);
        this.subscriptions.set(topic, existing);

        this.emit('subscribed', { agentId, topic, subscriptionId: subscription.id });
        return subscription.id;
    }

    /**
     * Unsubscribe from a topic
     */
    unsubscribe(subscriptionId: string): boolean {
        for (const [topic, subs] of this.subscriptions) {
            const index = subs.findIndex(s => s.id === subscriptionId);
            if (index !== -1) {
                subs.splice(index, 1);
                this.subscriptions.set(topic, subs);
                this.emit('unsubscribed', { subscriptionId });
                return true;
            }
        }
        return false;
    }

    /**
     * Broadcast a message to all subscribers of a topic
     */
    async broadcast(from: string, topic: string, payload: any, priority: Message['priority'] = 'normal'): Promise<number> {
        const message = this.createMessage('broadcast', from, undefined, topic, payload, priority);

        this.stats.totalBroadcast++;
        this.stats.totalSent++;
        this.addToHistory(message);

        const subscribers = this.subscriptions.get(topic) || [];
        let deliveredCount = 0;

        for (const sub of subscribers) {
            if (sub.agentId === from) continue;  // Don't deliver to sender
            if (sub.filter && !sub.filter(message)) continue;  // Apply filter

            try {
                await Promise.resolve(sub.handler(message));
                deliveredCount++;
            } catch (error) {
                console.error(`[MessageBus] Error delivering to ${sub.agentId}:`, error);
            }
        }

        message.delivered = deliveredCount > 0;
        this.emit('messageSent', { message, deliveredCount });

        return deliveredCount;
    }

    /**
     * Send a direct message to a specific agent
     */
    async send(from: string, to: string, payload: any, priority: Message['priority'] = 'normal'): Promise<boolean> {
        const message = this.createMessage('direct', from, to, undefined, payload, priority);

        this.stats.totalDirect++;
        this.stats.totalSent++;
        this.addToHistory(message);

        const agent = this.agents.get(to);
        if (!agent || agent.status === 'disconnected') {
            console.warn(`[MessageBus] Agent ${to} not available`);
            return false;
        }

        try {
            // If agent has a worker, send through worker
            if (agent.worker) {
                agent.worker.postMessage({
                    type: 'message',
                    message
                });
            }

            // Also emit for in-process handlers
            this.emit(`message:${to}`, message);

            agent.messageCount++;
            agent.lastSeen = new Date();
            message.delivered = true;

            return true;
        } catch (error) {
            console.error(`[MessageBus] Error sending to ${to}:`, error);
            return false;
        }
    }

    /**
     * Send a request and wait for response
     */
    async request<T = any>(
        from: string,
        to: string,
        payload: any,
        timeout: number = this.defaultRequestTimeout
    ): Promise<T> {
        const correlationId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
        const message = this.createMessage('request', from, to, undefined, payload, 'normal');
        message.correlationId = correlationId;

        this.stats.totalSent++;
        this.addToHistory(message);

        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(correlationId);
                reject(new Error(`Request to ${to} timed out after ${timeout}ms`));
            }, timeout);

            // Store pending request
            this.pendingRequests.set(correlationId, {
                resolve: (response) => {
                    clearTimeout(timeoutId);
                    this.pendingRequests.delete(correlationId);
                    resolve(response);
                },
                reject: (error) => {
                    clearTimeout(timeoutId);
                    this.pendingRequests.delete(correlationId);
                    reject(error);
                },
                timeout: timeoutId
            });

            // Send the request
            this.send(from, to, { ...payload, correlationId })
                .then(sent => {
                    if (!sent) {
                        clearTimeout(timeoutId);
                        this.pendingRequests.delete(correlationId);
                        reject(new Error(`Failed to send request to ${to}`));
                    }
                });
        });
    }

    /**
     * Send a response to a request
     */
    async respond(from: string, to: string, correlationId: string, payload: any): Promise<boolean> {
        const message = this.createMessage('response', from, to, undefined, payload, 'normal');
        message.correlationId = correlationId;

        this.stats.totalSent++;
        this.addToHistory(message);

        // Check if there's a pending request for this correlation
        const pending = this.pendingRequests.get(correlationId);
        if (pending) {
            pending.resolve(payload);
            return true;
        }

        // Otherwise send as normal message
        return this.send(from, to, { ...payload, correlationId, isResponse: true });
    }

    /**
     * Handle message from worker thread
     */
    private handleWorkerMessage(agentId: string, msg: any): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastSeen = new Date();
            this.stats.totalReceived++;
        }

        if (msg.type === 'broadcast' && msg.topic && msg.payload) {
            this.broadcast(agentId, msg.topic, msg.payload, msg.priority);
        } else if (msg.type === 'send' && msg.to && msg.payload) {
            this.send(agentId, msg.to, msg.payload, msg.priority);
        } else if (msg.type === 'request' && msg.to && msg.payload) {
            // Forward request
            this.request(agentId, msg.to, msg.payload, msg.timeout)
                .then(response => {
                    agent?.worker?.postMessage({ type: 'response', correlationId: msg.correlationId, response });
                })
                .catch(error => {
                    agent?.worker?.postMessage({ type: 'response', correlationId: msg.correlationId, error: error.message });
                });
        } else if (msg.type === 'response' && msg.correlationId) {
            this.respond(agentId, msg.to, msg.correlationId, msg.payload);
        }

        this.emit('workerMessage', { agentId, message: msg });
    }

    /**
     * Create a message object
     */
    private createMessage(
        type: Message['type'],
        from: string,
        to: string | undefined,
        topic: string | undefined,
        payload: any,
        priority: Message['priority']
    ): Message {
        return {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
            type,
            topic,
            from,
            to,
            payload,
            timestamp: new Date(),
            priority,
            delivered: false,
            acknowledged: false
        };
    }

    /**
     * Add message to history
     */
    private addToHistory(message: Message): void {
        this.messageHistory.push(message);

        // Trim history if too large
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory = this.messageHistory.slice(-this.maxHistorySize / 2);
        }
    }

    /**
     * Get message history for an agent
     */
    getHistory(agentId: string, limit: number = 50): Message[] {
        return this.messageHistory
            .filter(m => m.from === agentId || m.to === agentId)
            .slice(-limit);
    }

    /**
     * Get all connected agents
     */
    getConnectedAgents(): AgentConnection[] {
        return Array.from(this.agents.values()).filter(a => a.status === 'connected');
    }

    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentConnection | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Get all topics with subscribers
     */
    getTopics(): { topic: string; subscriberCount: number }[] {
        return Array.from(this.subscriptions.entries()).map(([topic, subs]) => ({
            topic,
            subscriberCount: subs.length
        }));
    }

    /**
     * Get statistics
     */
    getStats(): MessageStats {
        const delivered = this.messageHistory.filter(m => m.delivered).length;
        const total = this.messageHistory.length;

        return {
            ...this.stats,
            deliveryRate: total > 0 ? delivered / total : 1
        };
    }

    /**
     * Clear all messages and subscriptions
     */
    clear(): void {
        this.messageHistory = [];
        this.subscriptions.clear();
        this.pendingRequests.forEach((pending) => {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Message bus cleared'));
        });
        this.pendingRequests.clear();
    }

    /**
     * Shutdown the message bus
     */
    shutdown(): void {
        this.clear();
        this.agents.forEach(agent => {
            if (agent.worker) {
                agent.worker.terminate();
            }
        });
        this.agents.clear();
        this.emit('shutdown');
    }
}

// Singleton
export const messageBus = new MessageBus();
