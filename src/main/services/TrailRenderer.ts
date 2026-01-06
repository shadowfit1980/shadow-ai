/**
 * ✨ Trail Renderer
 * 
 * Motion trails for entities:
 * - Position history
 * - Fading trails
 * - Custom styles
 * - Multiple trail types
 */

import { EventEmitter } from 'events';

export type TrailStyle = 'line' | 'dots' | 'glow' | 'ribbon' | 'particles';

export interface TrailConfig {
    maxLength: number;
    fadeTime: number;
    style: TrailStyle;
    color: string;
    width: number;
}

export class TrailRenderer extends EventEmitter {
    private static instance: TrailRenderer;

    private constructor() { super(); }

    static getInstance(): TrailRenderer {
        if (!TrailRenderer.instance) {
            TrailRenderer.instance = new TrailRenderer();
        }
        return TrailRenderer.instance;
    }

    getDefaultConfig(): TrailConfig {
        return {
            maxLength: 30,
            fadeTime: 0.5,
            style: 'line',
            color: '#ffffff',
            width: 3
        };
    }

    generateTrailCode(): string {
        return `
class Trail {
    constructor(config = {}) {
        this.points = [];
        this.maxLength = config.maxLength || 30;
        this.fadeTime = config.fadeTime || 0.5;
        this.style = config.style || 'line';
        this.color = config.color || '#ffffff';
        this.width = config.width || 3;
        this.active = true;
    }

    addPoint(x, y) {
        if (!this.active) return;
        
        this.points.push({
            x, y,
            time: Date.now(),
            alpha: 1
        });

        // Limit length
        while (this.points.length > this.maxLength) {
            this.points.shift();
        }
    }

    update(dt) {
        const now = Date.now();
        const fadeMs = this.fadeTime * 1000;

        this.points.forEach(p => {
            const age = now - p.time;
            p.alpha = Math.max(0, 1 - age / fadeMs);
        });

        // Remove fully faded points
        this.points = this.points.filter(p => p.alpha > 0);
    }

    render(ctx) {
        if (this.points.length < 2) return;

        switch (this.style) {
            case 'line':
                this.renderLine(ctx);
                break;
            case 'dots':
                this.renderDots(ctx);
                break;
            case 'glow':
                this.renderGlow(ctx);
                break;
            case 'ribbon':
                this.renderRibbon(ctx);
                break;
            case 'particles':
                this.renderParticles(ctx);
                break;
        }
    }

    renderLine(ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            
            ctx.beginPath();
            ctx.strokeStyle = this.colorWithAlpha(this.color, p2.alpha);
            ctx.lineWidth = this.width * (i / this.points.length);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    renderDots(ctx) {
        this.points.forEach((p, i) => {
            const size = (this.width * 0.5) * (i / this.points.length) + 1;
            ctx.fillStyle = this.colorWithAlpha(this.color, p.alpha);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    renderGlow(ctx) {
        ctx.lineCap = 'round';
        
        // Multiple passes for glow effect
        for (let pass = 3; pass >= 1; pass--) {
            ctx.beginPath();
            ctx.strokeStyle = this.colorWithAlpha(this.color, 0.3 / pass);
            ctx.lineWidth = this.width * pass * 2;
            
            this.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            
            ctx.stroke();
        }

        // Core line
        this.renderLine(ctx);
    }

    renderRibbon(ctx) {
        if (this.points.length < 2) return;

        ctx.fillStyle = this.color;
        ctx.beginPath();

        // Top edge
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const width = (this.width * (i / this.points.length));
            const angle = this.getAngle(i);
            const x = p.x + Math.cos(angle + Math.PI / 2) * width;
            const y = p.y + Math.sin(angle + Math.PI / 2) * width;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        // Bottom edge (reverse)
        for (let i = this.points.length - 1; i >= 0; i--) {
            const p = this.points[i];
            const width = (this.width * (i / this.points.length));
            const angle = this.getAngle(i);
            const x = p.x + Math.cos(angle - Math.PI / 2) * width;
            const y = p.y + Math.sin(angle - Math.PI / 2) * width;
            ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    renderParticles(ctx) {
        this.points.forEach((p, i) => {
            if (Math.random() > 0.5) return;
            
            const size = 2 + Math.random() * 3;
            const offsetX = (Math.random() - 0.5) * this.width * 2;
            const offsetY = (Math.random() - 0.5) * this.width * 2;
            
            ctx.fillStyle = this.colorWithAlpha(this.color, p.alpha * 0.8);
            ctx.beginPath();
            ctx.arc(p.x + offsetX, p.y + offsetY, size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    getAngle(index) {
        if (index === 0 && this.points.length > 1) {
            const p1 = this.points[0];
            const p2 = this.points[1];
            return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        } else if (index > 0) {
            const p1 = this.points[index - 1];
            const p2 = this.points[index];
            return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        }
        return 0;
    }

    colorWithAlpha(color, alpha) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
        }
        return color.replace(/[\\d.]+\\)/, \`\${alpha})\`);
    }

    clear() {
        this.points = [];
    }

    setActive(active) {
        this.active = active;
    }
}

class TrailManager {
    constructor() {
        this.trails = new Map();
    }

    create(id, config) {
        const trail = new Trail(config);
        this.trails.set(id, trail);
        return trail;
    }

    get(id) {
        return this.trails.get(id);
    }

    remove(id) {
        this.trails.delete(id);
    }

    update(dt) {
        this.trails.forEach(trail => trail.update(dt));
    }

    render(ctx) {
        this.trails.forEach(trail => trail.render(ctx));
    }
}`;
    }

    getStyles(): TrailStyle[] {
        return ['line', 'dots', 'glow', 'ribbon', 'particles'];
    }
}

export const trailRenderer = TrailRenderer.getInstance();
