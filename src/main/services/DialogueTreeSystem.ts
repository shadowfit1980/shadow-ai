/**
 * 💬 Dialogue Tree System
 * 
 * Branching dialogues:
 * - Node-based conversations
 * - Choices
 * - Conditions
 * - Variables
 */

import { EventEmitter } from 'events';

export interface DialogueNode {
    id: string;
    speaker: string;
    text: string;
    choices?: { text: string; next: string; condition?: string }[];
    next?: string;
    effects?: { type: string; key: string; value: any }[];
}

export class DialogueTreeSystem extends EventEmitter {
    private static instance: DialogueTreeSystem;

    private constructor() { super(); }

    static getInstance(): DialogueTreeSystem {
        if (!DialogueTreeSystem.instance) {
            DialogueTreeSystem.instance = new DialogueTreeSystem();
        }
        return DialogueTreeSystem.instance;
    }

    generateDialogueCode(): string {
        return `
class DialogueTree {
    constructor() {
        this.trees = new Map();
        this.variables = new Map();
        this.currentTree = null;
        this.currentNode = null;
        this.history = [];
        this.typewriterSpeed = 30;
        this.displayedText = '';
        this.typewriterIndex = 0;
        this.typing = false;
    }

    create(id, nodes) {
        const nodeMap = new Map();
        for (const node of nodes) {
            nodeMap.set(node.id, node);
        }
        this.trees.set(id, { id, nodes: nodeMap, startNode: nodes[0].id });
    }

    start(treeId, startNodeId = null) {
        const tree = this.trees.get(treeId);
        if (!tree) return false;

        this.currentTree = tree;
        this.currentNode = tree.nodes.get(startNodeId || tree.startNode);
        this.history = [];
        this.startTypewriter();

        this.onStart?.(treeId, this.currentNode);
        return true;
    }

    startTypewriter() {
        this.displayedText = '';
        this.typewriterIndex = 0;
        this.typing = true;
    }

    update(dt) {
        if (!this.typing || !this.currentNode) return;

        const fullText = this.currentNode.text;
        if (this.typewriterIndex < fullText.length) {
            const charsToAdd = Math.max(1, Math.floor(dt * 1000 / this.typewriterSpeed));
            this.typewriterIndex = Math.min(this.typewriterIndex + charsToAdd, fullText.length);
            this.displayedText = fullText.substring(0, this.typewriterIndex);
        } else {
            this.typing = false;
        }
    }

    skipTypewriter() {
        if (this.currentNode) {
            this.displayedText = this.currentNode.text;
            this.typewriterIndex = this.currentNode.text.length;
            this.typing = false;
        }
    }

    advance(choiceIndex = null) {
        if (!this.currentNode) return;

        // If still typing, skip to end
        if (this.typing) {
            this.skipTypewriter();
            return;
        }

        // Apply effects
        if (this.currentNode.effects) {
            for (const effect of this.currentNode.effects) {
                this.applyEffect(effect);
            }
        }

        // Determine next node
        let nextId = null;

        if (this.currentNode.choices && this.currentNode.choices.length > 0) {
            if (choiceIndex === null) return; // Wait for choice
            
            const choice = this.getAvailableChoices()[choiceIndex];
            if (choice) {
                nextId = choice.next;
                this.onChoice?.(choice, choiceIndex);
            }
        } else {
            nextId = this.currentNode.next;
        }

        if (!nextId) {
            this.end();
            return;
        }

        // Move to next node
        this.history.push(this.currentNode.id);
        this.currentNode = this.currentTree.nodes.get(nextId);
        
        if (this.currentNode) {
            this.startTypewriter();
            this.onNode?.(this.currentNode);
        } else {
            this.end();
        }
    }

    getAvailableChoices() {
        if (!this.currentNode || !this.currentNode.choices) return [];
        
        return this.currentNode.choices.filter(choice => {
            if (!choice.condition) return true;
            return this.evaluateCondition(choice.condition);
        });
    }

    evaluateCondition(condition) {
        // Simple condition parsing: "variable operator value"
        const match = condition.match(/^(\\w+)\\s*(==|!=|>=|<=|>|<)\\s*(.+)$/);
        if (!match) return false;

        const [_, varName, op, valueStr] = match;
        const varValue = this.variables.get(varName);
        const checkValue = isNaN(valueStr) ? valueStr : parseFloat(valueStr);

        switch (op) {
            case '==': return varValue == checkValue;
            case '!=': return varValue != checkValue;
            case '>=': return varValue >= checkValue;
            case '<=': return varValue <= checkValue;
            case '>': return varValue > checkValue;
            case '<': return varValue < checkValue;
            default: return false;
        }
    }

    applyEffect(effect) {
        switch (effect.type) {
            case 'set':
                this.variables.set(effect.key, effect.value);
                break;
            case 'add':
                const current = this.variables.get(effect.key) || 0;
                this.variables.set(effect.key, current + effect.value);
                break;
            case 'event':
                this.onEvent?.(effect.key, effect.value);
                break;
        }
    }

    setVariable(key, value) {
        this.variables.set(key, value);
    }

    getVariable(key) {
        return this.variables.get(key);
    }

    end() {
        const treeId = this.currentTree?.id;
        this.currentTree = null;
        this.currentNode = null;
        this.history = [];
        this.displayedText = '';
        this.typing = false;

        this.onEnd?.(treeId);
    }

    isActive() {
        return this.currentNode !== null;
    }

    render(ctx, x, y, width, height, portraits = {}) {
        if (!this.isActive()) return;

        // Dialogue box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Speaker portrait
        const portraitSize = height - 20;
        if (portraits[this.currentNode.speaker]) {
            ctx.drawImage(portraits[this.currentNode.speaker], x + 10, y + 10, portraitSize, portraitSize);
        }

        const textX = portraits[this.currentNode.speaker] ? x + portraitSize + 30 : x + 20;

        // Speaker name
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.currentNode.speaker, textX, y + 15);

        // Dialogue text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        this.renderWrappedText(ctx, this.displayedText, textX, y + 40, width - textX + x - 20, 18);

        // Choices
        if (!this.typing && this.currentNode.choices) {
            const choices = this.getAvailableChoices();
            const choiceY = y + height - (choices.length * 25) - 10;
            
            choices.forEach((choice, i) => {
                ctx.fillStyle = '#aaddff';
                ctx.font = '14px Arial';
                ctx.fillText(\`\${i + 1}. \${choice.text}\`, textX, choiceY + i * 25);
            });
        }

        // Continue indicator
        if (!this.typing && !this.currentNode.choices) {
            ctx.fillStyle = '#888';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('▼ Press SPACE to continue', x + width - 15, y + height - 15);
        }
    }

    renderWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line.trim(), x, currentY);
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
    }

    // Callbacks
    onStart = null;
    onNode = null;
    onChoice = null;
    onEvent = null;
    onEnd = null;
}`;
    }
}

export const dialogueTreeSystem = DialogueTreeSystem.getInstance();
