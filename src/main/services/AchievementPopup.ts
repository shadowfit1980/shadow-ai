/**
 * 🏅 Achievement Popup
 * 
 * Achievement notifications:
 * - Animated popups
 * - Queue system
 * - Unlock effects
 */

import { EventEmitter } from 'events';

export interface AchievementPopupConfig {
    duration: number;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    style: 'modern' | 'retro' | 'minimal';
}

export class AchievementPopup extends EventEmitter {
    private static instance: AchievementPopup;

    private constructor() { super(); }

    static getInstance(): AchievementPopup {
        if (!AchievementPopup.instance) {
            AchievementPopup.instance = new AchievementPopup();
        }
        return AchievementPopup.instance;
    }

    generatePopupCode(): string {
        return `
class AchievementPopup {
    constructor(config = {}) {
        this.duration = config.duration || 3000;
        this.position = config.position || 'top-right';
        this.style = config.style || 'modern';
        this.queue = [];
        this.current = null;
        this.animState = 'idle';
        this.animProgress = 0;
        this.width = 320;
        this.height = 80;
        this.margin = 20;
    }

    show(achievement) {
        this.queue.push({
            id: achievement.id,
            title: achievement.title || 'Achievement Unlocked!',
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon || null,
            rarity: achievement.rarity || 'common',
            points: achievement.points || 0
        });

        if (!this.current) {
            this.showNext();
        }
    }

    showNext() {
        if (this.queue.length === 0) {
            this.current = null;
            return;
        }

        this.current = this.queue.shift();
        this.animState = 'entering';
        this.animProgress = 0;

        this.onShow?.(this.current);
    }

    update(dt) {
        if (!this.current) return;

        this.animProgress += dt * 1000;

        switch (this.animState) {
            case 'entering':
                if (this.animProgress >= 300) {
                    this.animState = 'showing';
                    this.animProgress = 0;
                }
                break;
            case 'showing':
                if (this.animProgress >= this.duration) {
                    this.animState = 'exiting';
                    this.animProgress = 0;
                }
                break;
            case 'exiting':
                if (this.animProgress >= 300) {
                    this.onHide?.(this.current);
                    this.showNext();
                }
                break;
        }
    }

    getPosition(canvasWidth, canvasHeight) {
        let x, y;

        switch (this.position) {
            case 'top-left':
                x = this.margin;
                y = this.margin;
                break;
            case 'top-right':
                x = canvasWidth - this.width - this.margin;
                y = this.margin;
                break;
            case 'bottom-left':
                x = this.margin;
                y = canvasHeight - this.height - this.margin;
                break;
            case 'bottom-right':
                x = canvasWidth - this.width - this.margin;
                y = canvasHeight - this.height - this.margin;
                break;
            default:
                x = canvasWidth - this.width - this.margin;
                y = this.margin;
        }

        // Animation offset
        let offset = 0;
        if (this.animState === 'entering') {
            offset = (1 - this.animProgress / 300) * (this.width + this.margin);
        } else if (this.animState === 'exiting') {
            offset = (this.animProgress / 300) * (this.width + this.margin);
        }

        if (this.position.includes('right')) {
            x += offset;
        } else {
            x -= offset;
        }

        return { x, y };
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (!this.current || this.animState === 'idle') return;

        const pos = this.getPosition(canvasWidth, canvasHeight);
        const { x, y } = pos;

        ctx.save();

        // Draw based on style
        switch (this.style) {
            case 'modern':
                this.renderModern(ctx, x, y);
                break;
            case 'retro':
                this.renderRetro(ctx, x, y);
                break;
            case 'minimal':
                this.renderMinimal(ctx, x, y);
                break;
            default:
                this.renderModern(ctx, x, y);
        }

        ctx.restore();
    }

    renderModern(ctx, x, y) {
        const a = this.current;

        // Gradient background
        const gradient = ctx.createLinearGradient(x, y, x + this.width, y);
        gradient.addColorStop(0, this.getRarityColor(a.rarity));
        gradient.addColorStop(1, '#1a1a2e');

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Background
        ctx.fillStyle = gradient;
        this.roundRect(ctx, x, y, this.width, this.height, 10);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Icon area
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(x + 45, y + this.height / 2, 30, 0, Math.PI * 2);
        ctx.fill();

        // Icon placeholder
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', x + 45, y + this.height / 2);

        // Title
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(a.title.toUpperCase(), x + 85, y + 15);

        // Achievement name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(a.name, x + 85, y + 32);

        // Description
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.fillText(a.description || '', x + 85, y + 55);

        // Points
        if (a.points > 0) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(\`+\${a.points}\`, x + this.width - 15, y + 15);
        }
    }

    renderRetro(ctx, x, y) {
        const a = this.current;

        // Pixelated border
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, this.width, this.height);
        ctx.fillStyle = this.getRarityColor(a.rarity);
        ctx.fillRect(x + 4, y + 4, this.width - 8, this.height - 8);
        ctx.fillStyle = '#111';
        ctx.fillRect(x + 8, y + 8, this.width - 16, this.height - 16);

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★ ' + a.name + ' ★', x + this.width / 2, y + this.height / 2);
    }

    renderMinimal(ctx, x, y) {
        const a = this.current;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(x, y, this.width, this.height);

        ctx.fillStyle = this.getRarityColor(a.rarity);
        ctx.fillRect(x, y, 4, this.height);

        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.name, x + 20, y + this.height / 2);
    }

    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return '#888';
            case 'uncommon': return '#00cc00';
            case 'rare': return '#0088ff';
            case 'epic': return '#aa00ff';
            case 'legendary': return '#ff8800';
            default: return '#888';
        }
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Integration with AchievementSystem
    connectToAchievements(achievementSystem) {
        achievementSystem.onUnlock = (achievement) => {
            this.show(achievement);
        };
    }

    // Callbacks
    onShow = null;
    onHide = null;
}`;
    }
}

export const achievementPopup = AchievementPopup.getInstance();
