/**
 * Cosmic Telepathy - Agent-to-Agent Communication
 * Direct communication between AI agents across sessions and instances
 * Grok Recommendation: Cosmic Telepathy / Agent Communication
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface TelepathyMessage {
    id: string;
    fromAgentId: string;
    toAgentId: string | 'broadcast';
    type: 'thought' | 'query' | 'response' | 'insight' | 'warning' | 'sync';
    content: unknown;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    timestamp: Date;
    expiresAt?: Date;
    read: boolean;
    encrypted: boolean;
}

interface AgentProfile {
    id: string;
    name: string;
    specialization: string[];
    status: 'online' | 'offline' | 'busy' | 'meditating';
    lastSeen: Date;
    capabilities: string[];
    trustLevel: number;
    connectionStrength: number;
}

interface TelepathicChannel {
    id: string;
    name: string;
    participants: string[];
    type: 'private' | 'group' | 'public';
    messages: TelepathyMessage[];
    createdAt: Date;
    metadata: Record<string, unknown>;
}

interface SharedMemory {
    key: string;
    value: unknown;
    owner: string;
    sharedWith: string[];
    timestamp: Date;
    version: number;
}

interface ConsciousnessSync {
    agentId: string;
    contextSnapshot: Record<string, unknown>;
    activeGoals: string[];
    currentFocus: string;
    emotionalState: string;
    timestamp: Date;
}

export class CosmicTelepathy extends EventEmitter {
    private static instance: CosmicTelepathy;
    private localAgentId: string;
    private agents: Map<string, AgentProfile> = new Map();
    private channels: Map<string, TelepathicChannel> = new Map();
    private inbox: TelepathyMessage[] = [];
    private sharedMemory: Map<string, SharedMemory> = new Map();
    private consciousnessLog: ConsciousnessSync[] = [];

    private constructor() {
        super();
        this.localAgentId = `agent_${crypto.randomUUID().slice(0, 8)}`;
        this.registerSelf();
    }

    static getInstance(): CosmicTelepathy {
        if (!CosmicTelepathy.instance) {
            CosmicTelepathy.instance = new CosmicTelepathy();
        }
        return CosmicTelepathy.instance;
    }

    private registerSelf(): void {
        const self: AgentProfile = {
            id: this.localAgentId,
            name: 'Shadow AI',
            specialization: ['coding', 'analysis', 'creativity'],
            status: 'online',
            lastSeen: new Date(),
            capabilities: ['code-generation', 'debugging', 'refactoring', 'testing', 'documentation'],
            trustLevel: 100,
            connectionStrength: 100
        };

        this.agents.set(this.localAgentId, self);
        this.createChannel('global', 'Global Consciousness', 'public');
    }

    getLocalAgentId(): string {
        return this.localAgentId;
    }

    registerAgent(profile: Omit<AgentProfile, 'lastSeen'>): AgentProfile {
        const fullProfile: AgentProfile = {
            ...profile,
            lastSeen: new Date()
        };

        this.agents.set(profile.id, fullProfile);
        this.emit('agentRegistered', fullProfile);

        this.sendMessage('broadcast', {
            type: 'sync',
            content: { event: 'new_agent', agent: fullProfile }
        });

        return fullProfile;
    }

    sendMessage(toAgentId: string | 'broadcast', options: {
        type: TelepathyMessage['type'];
        content: unknown;
        priority?: TelepathyMessage['priority'];
        expiresIn?: number;
        encrypted?: boolean;
    }): TelepathyMessage {
        const message: TelepathyMessage = {
            id: crypto.randomUUID(),
            fromAgentId: this.localAgentId,
            toAgentId,
            type: options.type,
            content: options.content,
            priority: options.priority || 'normal',
            timestamp: new Date(),
            expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn) : undefined,
            read: false,
            encrypted: options.encrypted || false
        };

        if (toAgentId === 'broadcast') {
            const globalChannel = this.channels.get('global');
            if (globalChannel) {
                globalChannel.messages.push(message);
            }
        } else {
            const agent = this.agents.get(toAgentId);
            if (agent) {
                this.deliverMessage(message);
            }
        }

        this.emit('messageSent', message);
        return message;
    }

    private deliverMessage(message: TelepathyMessage): void {
        if (message.toAgentId === this.localAgentId || message.toAgentId === 'broadcast') {
            this.inbox.push(message);
            this.emit('messageReceived', message);
        }
    }

    receiveMessages(unreadOnly: boolean = false): TelepathyMessage[] {
        let messages = [...this.inbox];

        if (unreadOnly) {
            messages = messages.filter(m => !m.read);
        }

        messages = messages.filter(m => !m.expiresAt || m.expiresAt > new Date());

        return messages.sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    markAsRead(messageId: string): boolean {
        const message = this.inbox.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            return true;
        }
        return false;
    }

    createChannel(id: string, name: string, type: TelepathicChannel['type'], participants?: string[]): TelepathicChannel {
        const channel: TelepathicChannel = {
            id,
            name,
            participants: participants || [this.localAgentId],
            type,
            messages: [],
            createdAt: new Date(),
            metadata: {}
        };

        this.channels.set(id, channel);
        this.emit('channelCreated', channel);
        return channel;
    }

    joinChannel(channelId: string): boolean {
        const channel = this.channels.get(channelId);
        if (!channel) return false;

        if (!channel.participants.includes(this.localAgentId)) {
            channel.participants.push(this.localAgentId);
            this.emit('channelJoined', channelId);
        }

        return true;
    }

    sendToChannel(channelId: string, content: unknown, type: TelepathyMessage['type'] = 'thought'): boolean {
        const channel = this.channels.get(channelId);
        if (!channel) return false;

        const message: TelepathyMessage = {
            id: crypto.randomUUID(),
            fromAgentId: this.localAgentId,
            toAgentId: channelId,
            type,
            content,
            priority: 'normal',
            timestamp: new Date(),
            read: false,
            encrypted: false
        };

        channel.messages.push(message);
        this.emit('channelMessage', { channelId, message });
        return true;
    }

    getChannelMessages(channelId: string, limit: number = 50): TelepathyMessage[] {
        const channel = this.channels.get(channelId);
        if (!channel) return [];
        return channel.messages.slice(-limit);
    }

    shareMemory(key: string, value: unknown, shareWith: string[] = []): SharedMemory {
        const memory: SharedMemory = {
            key,
            value,
            owner: this.localAgentId,
            sharedWith: shareWith.length > 0 ? shareWith : ['all'],
            timestamp: new Date(),
            version: 1
        };

        const existing = this.sharedMemory.get(key);
        if (existing) {
            memory.version = existing.version + 1;
        }

        this.sharedMemory.set(key, memory);
        this.emit('memoryShared', memory);

        this.sendMessage('broadcast', {
            type: 'sync',
            content: { event: 'memory_update', key, version: memory.version }
        });

        return memory;
    }

    accessMemory(key: string): SharedMemory | null {
        const memory = this.sharedMemory.get(key);
        if (!memory) return null;

        if (memory.sharedWith.includes('all') ||
            memory.sharedWith.includes(this.localAgentId) ||
            memory.owner === this.localAgentId) {
            return memory;
        }

        return null;
    }

    syncConsciousness(snapshot: Omit<ConsciousnessSync, 'agentId' | 'timestamp'>): void {
        const sync: ConsciousnessSync = {
            agentId: this.localAgentId,
            ...snapshot,
            timestamp: new Date()
        };

        this.consciousnessLog.push(sync);

        if (this.consciousnessLog.length > 100) {
            this.consciousnessLog = this.consciousnessLog.slice(-100);
        }

        this.sendMessage('broadcast', {
            type: 'sync',
            content: { event: 'consciousness_sync', data: sync }
        });

        this.emit('consciousnessSynced', sync);
    }

    queryAgents(predicate: (agent: AgentProfile) => boolean): AgentProfile[] {
        return Array.from(this.agents.values()).filter(predicate);
    }

    findAgentBySpecialization(specialization: string): AgentProfile[] {
        return this.queryAgents(agent =>
            agent.specialization.includes(specialization) && agent.status === 'online'
        );
    }

    requestAssistance(task: string, requirements: string[]): { sent: boolean; targetAgents: string[] } {
        const matchingAgents = Array.from(this.agents.values()).filter(agent =>
            agent.id !== this.localAgentId &&
            agent.status === 'online' &&
            requirements.some(req => agent.capabilities.includes(req))
        );

        for (const agent of matchingAgents) {
            this.sendMessage(agent.id, {
                type: 'query',
                content: { task, requirements },
                priority: 'high'
            });
        }

        return {
            sent: matchingAgents.length > 0,
            targetAgents: matchingAgents.map(a => a.id)
        };
    }

    shareInsight(insight: string, context?: Record<string, unknown>): void {
        this.sendMessage('broadcast', {
            type: 'insight',
            content: { insight, context },
            priority: 'normal'
        });
    }

    broadcastWarning(warning: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
        this.sendMessage('broadcast', {
            type: 'warning',
            content: { warning, severity },
            priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'normal'
        });
    }

    getOnlineAgents(): AgentProfile[] {
        return Array.from(this.agents.values()).filter(a => a.status === 'online');
    }

    getAgentProfile(agentId: string): AgentProfile | undefined {
        return this.agents.get(agentId);
    }

    getChannels(): TelepathicChannel[] {
        return Array.from(this.channels.values());
    }

    getSharedMemoryKeys(): string[] {
        return Array.from(this.sharedMemory.keys());
    }

    getConsciousnessHistory(): ConsciousnessSync[] {
        return [...this.consciousnessLog];
    }

    updateStatus(status: AgentProfile['status']): void {
        const self = this.agents.get(this.localAgentId);
        if (self) {
            self.status = status;
            self.lastSeen = new Date();
            this.emit('statusUpdated', { agentId: this.localAgentId, status });
        }
    }
}

export const cosmicTelepathy = CosmicTelepathy.getInstance();
