/**
 * 📖 Tutorial System
 * 
 * In-game tutorials:
 * - Step-by-step guides
 * - Highlighting
 * - Tooltips
 * - Progress tracking
 */

import { EventEmitter } from 'events';

export interface TutorialStep {
    id: string;
    message: string;
    highlight?: { x: number; y: number; width: number; height: number };
    action?: string;
    arrow?: 'up' | 'down' | 'left' | 'right';
}

export class TutorialSystem extends EventEmitter {
    private static instance: TutorialSystem;

    private constructor() { super(); }

    static getInstance(): TutorialSystem {
        if (!TutorialSystem.instance) {
            TutorialSystem.instance = new TutorialSystem();
        }
        return TutorialSystem.instance;
    }

    generateTutorialCode(): string {
        return `
class TutorialSystem {
    constructor() {
        this.tutorials = new Map();
        this.activeTutorial = null;
        this.currentStep = 0;
        this.completed = new Set();
        this.paused = false;
        
        this.overlay = { alpha: 0.7 };
    }

    create(id, steps) {
        this.tutorials.set(id, {
            id,
            steps: steps.map((s, i) => ({
                id: s.id || 'step_' + i,
                message: s.message,
                highlight: s.highlight || null,
                action: s.action || null,
                arrow: s.arrow || null,
                position: s.position || 'bottom',
                waitFor: s.waitFor || null
            }))
        });
    }

    start(tutorialId, force = false) {
        if (!force && this.completed.has(tutorialId)) return false;
        
        const tutorial = this.tutorials.get(tutorialId);
        if (!tutorial) return false;

        this.activeTutorial = tutorial;
        this.currentStep = 0;
        this.paused = false;

        this.onStart?.(tutorialId);
        return true;
    }

    next() {
        if (!this.activeTutorial) return;

        this.currentStep++;
        
        if (this.currentStep >= this.activeTutorial.steps.length) {
            this.complete();
        } else {
            this.onStep?.(this.getCurrentStep());
        }
    }

    previous() {
        if (!this.activeTutorial || this.currentStep <= 0) return;
        this.currentStep--;
        this.onStep?.(this.getCurrentStep());
    }

    skip() {
        if (!this.activeTutorial) return;
        this.complete();
    }

    complete() {
        const id = this.activeTutorial?.id;
        this.completed.add(id);
        this.activeTutorial = null;
        this.currentStep = 0;
        this.onComplete?.(id);
        this.save();
    }

    getCurrentStep() {
        if (!this.activeTutorial) return null;
        return this.activeTutorial.steps[this.currentStep];
    }

    triggerAction(actionName) {
        const step = this.getCurrentStep();
        if (step && step.waitFor === actionName) {
            this.next();
        }
    }

    isActive() {
        return this.activeTutorial !== null && !this.paused;
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    reset(tutorialId = null) {
        if (tutorialId) {
            this.completed.delete(tutorialId);
        } else {
            this.completed.clear();
        }
        this.save();
    }

    save() {
        localStorage.setItem('tutorials_completed', JSON.stringify([...this.completed]));
    }

    load() {
        try {
            const data = localStorage.getItem('tutorials_completed');
            if (data) {
                this.completed = new Set(JSON.parse(data));
            }
        } catch (e) {}
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isActive()) return;

        const step = this.getCurrentStep();
        if (!step) return;

        // Dimmed overlay with highlight cutout
        ctx.fillStyle = \`rgba(0, 0, 0, \${this.overlay.alpha})\`;
        
        if (step.highlight) {
            const h = step.highlight;
            const padding = 10;
            
            // Draw overlay with cutout
            ctx.beginPath();
            ctx.rect(0, 0, canvasWidth, canvasHeight);
            ctx.rect(h.x - padding, h.y - padding, h.width + padding * 2, h.height + padding * 2);
            ctx.fill('evenodd');
            
            // Highlight border
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 3;
            ctx.strokeRect(h.x - padding, h.y - padding, h.width + padding * 2, h.height + padding * 2);
        } else {
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // Message box
        const boxWidth = 400;
        const boxHeight = 120;
        let boxX = (canvasWidth - boxWidth) / 2;
        let boxY = canvasHeight - boxHeight - 50;

        if (step.highlight && step.position === 'above') {
            boxY = step.highlight.y - boxHeight - 30;
        }

        // Box background
        ctx.fillStyle = 'rgba(30, 30, 50, 0.95)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Message text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Word wrap
        const words = step.message.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + word + ' ';
            if (ctx.measureText(testLine).width > boxWidth - 40) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine.trim());

        lines.forEach((line, i) => {
            ctx.fillText(line, boxX + boxWidth / 2, boxY + 30 + i * 24);
        });

        // Arrow
        if (step.arrow && step.highlight) {
            this.drawArrow(ctx, step.highlight, step.arrow);
        }

        // Progress indicator
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText(
            \`\${this.currentStep + 1} / \${this.activeTutorial.steps.length}\`,
            boxX + boxWidth / 2,
            boxY + boxHeight - 15
        );

        // Navigation hints
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Press SPACE to continue, ESC to skip', boxX + 10, boxY + boxHeight - 15);
    }

    drawArrow(ctx, highlight, direction) {
        const cx = highlight.x + highlight.width / 2;
        const cy = highlight.y + highlight.height / 2;
        const size = 20;
        const offset = 40;

        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();

        switch (direction) {
            case 'down':
                ctx.moveTo(cx, highlight.y - offset);
                ctx.lineTo(cx - size, highlight.y - offset - size);
                ctx.lineTo(cx + size, highlight.y - offset - size);
                break;
            case 'up':
                ctx.moveTo(cx, highlight.y + highlight.height + offset);
                ctx.lineTo(cx - size, highlight.y + highlight.height + offset + size);
                ctx.lineTo(cx + size, highlight.y + highlight.height + offset + size);
                break;
            case 'right':
                ctx.moveTo(highlight.x - offset, cy);
                ctx.lineTo(highlight.x - offset - size, cy - size);
                ctx.lineTo(highlight.x - offset - size, cy + size);
                break;
            case 'left':
                ctx.moveTo(highlight.x + highlight.width + offset, cy);
                ctx.lineTo(highlight.x + highlight.width + offset + size, cy - size);
                ctx.lineTo(highlight.x + highlight.width + offset + size, cy + size);
                break;
        }

        ctx.closePath();
        ctx.fill();
    }

    // Callbacks
    onStart = null;
    onStep = null;
    onComplete = null;
}`;
    }
}

export const tutorialSystem = TutorialSystem.getInstance();
