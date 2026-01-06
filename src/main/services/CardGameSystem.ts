/**
 * 🃏 Card Game System
 * 
 * Card game mechanics:
 * - Deck management
 * - Hand management
 * - Turn-based play
 * - Effects
 */

import { EventEmitter } from 'events';

export interface Card {
    id: string;
    name: string;
    cost: number;
    type: 'attack' | 'defense' | 'skill' | 'power';
    effects: { type: string; value: number }[];
}

export class CardGameSystem extends EventEmitter {
    private static instance: CardGameSystem;

    private constructor() { super(); }

    static getInstance(): CardGameSystem {
        if (!CardGameSystem.instance) {
            CardGameSystem.instance = new CardGameSystem();
        }
        return CardGameSystem.instance;
    }

    generateCardGameCode(): string {
        return `
class CardGame {
    constructor() {
        this.deck = [];
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];
        
        this.energy = 3;
        this.maxEnergy = 3;
        this.maxHandSize = 10;
        
        this.player = { health: 80, maxHealth: 80, block: 0 };
        this.enemy = null;
        
        this.turn = 0;
        this.cardLibrary = new Map();
        
        this.setupDefaultCards();
    }

    setupDefaultCards() {
        this.registerCard({
            id: 'strike',
            name: 'Strike',
            cost: 1,
            type: 'attack',
            description: 'Deal 6 damage',
            effects: [{ type: 'damage', value: 6 }]
        });

        this.registerCard({
            id: 'defend',
            name: 'Defend',
            cost: 1,
            type: 'defense',
            description: 'Gain 5 block',
            effects: [{ type: 'block', value: 5 }]
        });

        this.registerCard({
            id: 'heavy_strike',
            name: 'Heavy Strike',
            cost: 2,
            type: 'attack',
            description: 'Deal 12 damage',
            effects: [{ type: 'damage', value: 12 }]
        });

        this.registerCard({
            id: 'draw_cards',
            name: 'Preparation',
            cost: 0,
            type: 'skill',
            description: 'Draw 2 cards',
            effects: [{ type: 'draw', value: 2 }]
        });

        this.registerCard({
            id: 'strength_up',
            name: 'Flex',
            cost: 0,
            type: 'power',
            description: 'Gain 2 strength this turn',
            effects: [{ type: 'buff', stat: 'strength', value: 2, duration: 1 }]
        });
    }

    registerCard(cardDef) {
        this.cardLibrary.set(cardDef.id, cardDef);
    }

    createDeck(cardIds) {
        this.deck = cardIds.map(id => ({
            ...this.cardLibrary.get(id),
            instanceId: Math.random().toString(36).slice(2)
        }));
        this.shuffle(this.deck);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    startCombat(enemy) {
        this.enemy = enemy;
        this.turn = 0;
        this.discardPile = [];
        this.hand = [];
        this.startTurn();
    }

    startTurn() {
        this.turn++;
        this.energy = this.maxEnergy;
        this.player.block = 0;
        this.drawCards(5);
        this.onTurnStart?.(this.turn);
    }

    endTurn() {
        // Discard hand
        this.discardPile.push(...this.hand);
        this.hand = [];
        
        // Enemy action
        this.enemyAction();
        
        // Next turn
        if (this.player.health > 0 && this.enemy.health > 0) {
            this.startTurn();
        }
    }

    drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.hand.length >= this.maxHandSize) break;
            
            if (this.deck.length === 0) {
                if (this.discardPile.length === 0) break;
                this.deck = [...this.discardPile];
                this.discardPile = [];
                this.shuffle(this.deck);
            }
            
            this.hand.push(this.deck.pop());
        }
    }

    playCard(cardIndex, target = null) {
        const card = this.hand[cardIndex];
        if (!card) return false;
        if (card.cost > this.energy) return false;
        
        this.energy -= card.cost;
        this.hand.splice(cardIndex, 1);
        
        // Apply effects
        for (const effect of card.effects) {
            this.applyEffect(effect, target || this.enemy);
        }
        
        // Discard or exhaust
        if (card.exhaust) {
            this.exhaustPile.push(card);
        } else {
            this.discardPile.push(card);
        }
        
        this.onCardPlayed?.(card);
        return true;
    }

    applyEffect(effect, target) {
        switch (effect.type) {
            case 'damage':
                const damage = effect.value + (this.player.strength || 0);
                this.dealDamage(target, damage);
                break;
            case 'block':
                this.player.block += effect.value;
                break;
            case 'draw':
                this.drawCards(effect.value);
                break;
            case 'heal':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + effect.value);
                break;
            case 'buff':
                this.player[effect.stat] = (this.player[effect.stat] || 0) + effect.value;
                break;
        }
    }

    dealDamage(target, amount) {
        if (target.block > 0) {
            const blocked = Math.min(target.block, amount);
            target.block -= blocked;
            amount -= blocked;
        }
        target.health -= amount;
        target.health = Math.max(0, target.health);
        
        if (target.health === 0) {
            if (target === this.enemy) {
                this.onVictory?.();
            } else {
                this.onDefeat?.();
            }
        }
    }

    enemyAction() {
        if (!this.enemy || !this.enemy.intent) return;
        
        const intent = this.enemy.intent;
        if (intent.type === 'attack') {
            this.dealDamage(this.player, intent.value);
        } else if (intent.type === 'block') {
            this.enemy.block = (this.enemy.block || 0) + intent.value;
        }
        
        // Generate next intent
        this.generateEnemyIntent();
    }

    generateEnemyIntent() {
        const intents = this.enemy.possibleIntents || [
            { type: 'attack', value: 8 },
            { type: 'attack', value: 12 },
            { type: 'block', value: 10 }
        ];
        this.enemy.intent = intents[Math.floor(Math.random() * intents.length)];
    }

    // Callbacks
    onTurnStart = null;
    onCardPlayed = null;
    onVictory = null;
    onDefeat = null;
}`;
    }
}

export const cardGameSystem = CardGameSystem.getInstance();
