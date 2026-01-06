/**
 * 💬 Dialogue Director
 * 
 * AI-powered branching dialogue system for games:
 * - Dynamic conversation trees
 * - Context-aware responses
 * - Character mood integration
 * - Consequence tracking
 * - Procedural dialogue generation
 */

import { EventEmitter } from 'events';

export interface DialogueNode {
    id: string;
    speaker: string;
    text: string;
    emotion?: string;
    animation?: string;
    conditions?: DialogueCondition[];
    responses?: DialogueResponse[];
    effects?: DialogueEffect[];
    next?: string; // Auto-continue to next node
}

export interface DialogueCondition {
    type: 'hasItem' | 'relationshipLevel' | 'questState' | 'statCheck' | 'custom';
    target: string;
    operator: '>' | '<' | '==' | '>=' | '<=' | 'has' | 'not';
    value: any;
}

export interface DialogueResponse {
    id: string;
    text: string;
    conditions?: DialogueCondition[];
    effects?: DialogueEffect[];
    next: string;
    personality?: string; // Shows for certain personality types
}

export interface DialogueEffect {
    type: 'giveItem' | 'removeItem' | 'modifyRelationship' | 'triggerQuest' | 'setFlag' | 'triggerEmotion';
    target?: string;
    value: any;
}

export interface Conversation {
    id: string;
    name: string;
    participants: string[];
    nodes: Map<string, DialogueNode>;
    startNode: string;
    variables: Map<string, any>;
}

export class DialogueDirector extends EventEmitter {
    private static instance: DialogueDirector;

    private conversations: Map<string, Conversation> = new Map();
    private activeConversation: string | null = null;
    private currentNode: string | null = null;
    private gameState: Map<string, any> = new Map();

    private constructor() { super(); }

    static getInstance(): DialogueDirector {
        if (!DialogueDirector.instance) {
            DialogueDirector.instance = new DialogueDirector();
        }
        return DialogueDirector.instance;
    }

    // ========================================================================
    // CONVERSATION CREATION
    // ========================================================================

    createConversation(id: string, name: string, participants: string[]): Conversation {
        const conversation: Conversation = {
            id,
            name,
            participants,
            nodes: new Map(),
            startNode: '',
            variables: new Map()
        };

        this.conversations.set(id, conversation);
        return conversation;
    }

    addNode(conversationId: string, node: DialogueNode): void {
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
            conversation.nodes.set(node.id, node);
            if (!conversation.startNode) {
                conversation.startNode = node.id;
            }
        }
    }

    // ========================================================================
    // DIALOGUE FLOW
    // ========================================================================

    startConversation(conversationId: string): DialogueNode | null {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return null;

        this.activeConversation = conversationId;
        this.currentNode = conversation.startNode;

        const node = conversation.nodes.get(conversation.startNode);
        if (node) {
            this.executeEffects(node.effects || []);
            this.emit('conversationStarted', { conversationId, node });
        }

        return node || null;
    }

    getAvailableResponses(): DialogueResponse[] {
        if (!this.activeConversation || !this.currentNode) return [];

        const conversation = this.conversations.get(this.activeConversation);
        if (!conversation) return [];

        const node = conversation.nodes.get(this.currentNode);
        if (!node || !node.responses) return [];

        // Filter responses by conditions
        return node.responses.filter(response =>
            this.evaluateConditions(response.conditions || [])
        );
    }

    selectResponse(responseId: string): DialogueNode | null {
        if (!this.activeConversation || !this.currentNode) return null;

        const conversation = this.conversations.get(this.activeConversation);
        if (!conversation) return null;

        const currentNode = conversation.nodes.get(this.currentNode);
        if (!currentNode) return null;

        const response = currentNode.responses?.find(r => r.id === responseId);
        if (!response) return null;

        // Execute response effects
        this.executeEffects(response.effects || []);

        // Move to next node
        this.currentNode = response.next;
        const nextNode = conversation.nodes.get(response.next);

        if (nextNode) {
            this.executeEffects(nextNode.effects || []);
            this.emit('nodeChanged', { conversationId: this.activeConversation, node: nextNode });
        } else {
            this.endConversation();
        }

        return nextNode || null;
    }

    continueDialogue(): DialogueNode | null {
        if (!this.activeConversation || !this.currentNode) return null;

        const conversation = this.conversations.get(this.activeConversation);
        if (!conversation) return null;

        const currentNode = conversation.nodes.get(this.currentNode);
        if (!currentNode?.next) {
            this.endConversation();
            return null;
        }

        this.currentNode = currentNode.next;
        const nextNode = conversation.nodes.get(currentNode.next);

        if (nextNode) {
            this.executeEffects(nextNode.effects || []);
            this.emit('nodeChanged', { conversationId: this.activeConversation, node: nextNode });
        }

        return nextNode || null;
    }

    endConversation(): void {
        const conversationId = this.activeConversation;
        this.activeConversation = null;
        this.currentNode = null;
        this.emit('conversationEnded', { conversationId });
    }

    // ========================================================================
    // CONDITIONS & EFFECTS
    // ========================================================================

    private evaluateConditions(conditions: DialogueCondition[]): boolean {
        return conditions.every(condition => {
            const currentValue = this.gameState.get(condition.target);

            switch (condition.operator) {
                case '>': return currentValue > condition.value;
                case '<': return currentValue < condition.value;
                case '==': return currentValue === condition.value;
                case '>=': return currentValue >= condition.value;
                case '<=': return currentValue <= condition.value;
                case 'has': return currentValue !== undefined && currentValue !== null;
                case 'not': return currentValue === undefined || currentValue === null;
                default: return false;
            }
        });
    }

    private executeEffects(effects: DialogueEffect[]): void {
        effects.forEach(effect => {
            this.emit('effectTriggered', effect);

            switch (effect.type) {
                case 'setFlag':
                    this.gameState.set(effect.target || '', effect.value);
                    break;
                case 'modifyRelationship':
                    const current = this.gameState.get(`relationship_${effect.target}`) || 0;
                    this.gameState.set(`relationship_${effect.target}`, current + effect.value);
                    break;
            }
        });
    }

    setGameState(key: string, value: any): void {
        this.gameState.set(key, value);
    }

    // ========================================================================
    // PROCEDURAL DIALOGUE
    // ========================================================================

    generateGreeting(npcName: string, relationship: number, timeOfDay: string): string {
        const greetings = {
            hostile: [
                "What do you want?",
                "You again? Make it quick.",
                "I see you've returned... unfortunately."
            ],
            neutral: [
                `Good ${timeOfDay}, traveler.`,
                "Greetings. How may I help you?",
                "Oh, hello there."
            ],
            friendly: [
                `Ah, ${npcName}! Good to see you!`,
                "My friend! Welcome back!",
                `What a pleasant surprise! Good ${timeOfDay}!`
            ]
        };

        let tier: 'hostile' | 'neutral' | 'friendly';
        if (relationship < -30) tier = 'hostile';
        else if (relationship < 30) tier = 'neutral';
        else tier = 'friendly';

        const options = greetings[tier];
        return options[Math.floor(Math.random() * options.length)];
    }

    generateBarkDialogue(emotion: string, context: string): string {
        const barks: Record<string, Record<string, string[]>> = {
            combat: {
                anger: ["You'll pay for that!", "Die!", "No mercy!"],
                fear: ["Stay back!", "Help me!", "I don't want to fight!"],
                joy: ["Haha! Is that all you've got?", "This is too easy!"],
            },
            idle: {
                joy: ["What a beautiful day!", "Life is good.", "*whistles*"],
                sadness: ["*sigh*", "I miss the old days...", "Why bother..."],
                anger: ["Grr...", "This is ridiculous.", "*mutters*"],
                fear: ["Did you hear that?", "Something feels wrong...", "*nervous look*"],
            },
            discovery: {
                surprise: ["What's this?!", "I've never seen anything like it!", "Incredible!"],
                joy: ["Treasure!", "At last!", "This is exactly what I needed!"],
            }
        };

        const contextBarks = barks[context] || barks.idle;
        const emotionBarks = contextBarks[emotion] || ["..."];

        return emotionBarks[Math.floor(Math.random() * emotionBarks.length)];
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateDialogueSystemCode(): string {
        return `
// Branching Dialogue System
class DialogueSystem {
    constructor() {
        this.conversations = new Map();
        this.currentConversation = null;
        this.currentNode = null;
        this.gameState = {};
    }

    loadConversation(data) {
        const conversation = {
            id: data.id,
            nodes: new Map(data.nodes.map(n => [n.id, n])),
            startNode: data.startNode
        };
        this.conversations.set(data.id, conversation);
    }

    start(conversationId) {
        const conv = this.conversations.get(conversationId);
        if (!conv) return null;

        this.currentConversation = conv;
        this.currentNode = conv.nodes.get(conv.startNode);
        
        this.executeEffects(this.currentNode.effects);
        return this.currentNode;
    }

    getResponses() {
        if (!this.currentNode?.responses) return [];
        
        return this.currentNode.responses.filter(r => 
            this.checkConditions(r.conditions)
        );
    }

    selectResponse(responseId) {
        const response = this.currentNode.responses?.find(r => r.id === responseId);
        if (!response) return null;

        this.executeEffects(response.effects);
        this.currentNode = this.currentConversation.nodes.get(response.next);
        
        if (this.currentNode) {
            this.executeEffects(this.currentNode.effects);
        } else {
            this.end();
        }

        return this.currentNode;
    }

    checkConditions(conditions = []) {
        return conditions.every(c => {
            const value = this.gameState[c.target];
            switch (c.operator) {
                case '>': return value > c.value;
                case '<': return value < c.value;
                case '==': return value === c.value;
                case 'has': return value !== undefined;
                default: return false;
            }
        });
    }

    executeEffects(effects = []) {
        effects.forEach(e => {
            switch (e.type) {
                case 'setFlag':
                    this.gameState[e.target] = e.value;
                    break;
                case 'giveItem':
                    game.inventory.add(e.target, e.value);
                    break;
                case 'triggerQuest':
                    game.quests.start(e.target);
                    break;
            }
        });
    }

    end() {
        this.currentConversation = null;
        this.currentNode = null;
        game.emit('dialogueEnded');
    }
}

// Example conversation data
const shopkeeperConvo = {
    id: 'shopkeeper_greeting',
    startNode: 'greeting',
    nodes: [
        {
            id: 'greeting',
            speaker: 'Shopkeeper',
            text: 'Welcome to my shop! What can I do for you?',
            responses: [
                { id: 'buy', text: 'I want to buy something.', next: 'show_wares' },
                { id: 'sell', text: 'I have items to sell.', next: 'show_sell' },
                { 
                    id: 'quest', 
                    text: "I'm here about the missing shipment.",
                    conditions: [{ target: 'quest_shipment', operator: 'has' }],
                    next: 'quest_talk'
                },
                { id: 'leave', text: 'Goodbye.', next: 'farewell' }
            ]
        },
        // ... more nodes
    ]
};`;
    }
}

export const dialogueDirector = DialogueDirector.getInstance();
