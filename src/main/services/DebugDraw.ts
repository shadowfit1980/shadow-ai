/**
 * 🔍 Debug Draw
 * 
 * Visual debugging tools:
 * - Collision boxes
 * - Velocity vectors
 * - Path visualization
 * - Text labels
 */

import { EventEmitter } from 'events';

export type DebugDrawType = 'rect' | 'circle' | 'line' | 'vector' | 'point' | 'text' | 'path';

export interface DebugShape {
    type: DebugDrawType;
    color: string;
    data: any;
    duration?: number;
    createdAt?: number;
}

export class DebugDraw extends EventEmitter {
    private static instance: DebugDraw;

    private constructor() { super(); }

    static getInstance(): DebugDraw {
        if (!DebugDraw.instance) {
            DebugDraw.instance = new DebugDraw();
        }
        return DebugDraw.instance;
    }

    generateDebugDrawCode(): string {
        return `
class DebugDraw {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        this.shapes = [];
        this.persistentShapes = new Map();
        this.showColliders = true;
        this.showVelocities = true;
        this.showPaths = true;
        this.showLabels = true;
    }

    toggle() {
        this.enabled = !this.enabled;
    }

    clear() {
        this.shapes = [];
    }

    // Instant draw methods (cleared each frame)
    rect(x, y, w, h, color = '#00ff00') {
        if (!this.enabled) return;
        this.shapes.push({ type: 'rect', x, y, w, h, color });
    }

    circle(x, y, radius, color = '#00ff00') {
        if (!this.enabled) return;
        this.shapes.push({ type: 'circle', x, y, radius, color });
    }

    line(x1, y1, x2, y2, color = '#00ff00', width = 1) {
        if (!this.enabled) return;
        this.shapes.push({ type: 'line', x1, y1, x2, y2, color, width });
    }

    vector(x, y, vx, vy, color = '#ff0000', scale = 1) {
        if (!this.enabled) return;
        this.shapes.push({ type: 'vector', x, y, vx: vx * scale, vy: vy * scale, color });
    }

    point(x, y, color = '#ff0000', size = 5) {
        if (!this.enabled) return;
        this.shapes.push({ type: 'point', x, y, color, size });
    }

    text(x, y, text, color = '#ffffff', size = 12) {
        if (!this.enabled || !this.showLabels) return;
        this.shapes.push({ type: 'text', x, y, text, color, size });
    }

    path(points, color = '#ffff00', closed = false) {
        if (!this.enabled || !this.showPaths) return;
        this.shapes.push({ type: 'path', points, color, closed });
    }

    // Persistent shapes (stay until removed)
    addPersistent(id, shape) {
        this.persistentShapes.set(id, shape);
    }

    removePersistent(id) {
        this.persistentShapes.delete(id);
    }

    // Draw entity debug info
    drawEntity(entity) {
        if (!this.enabled) return;

        // Bounding box
        if (this.showColliders && entity.width && entity.height) {
            this.rect(entity.x, entity.y, entity.width, entity.height, '#00ff00');
        }

        // Velocity
        if (this.showVelocities && entity.vx !== undefined) {
            this.vector(
                entity.x + entity.width / 2,
                entity.y + entity.height / 2,
                entity.vx, entity.vy, '#ff0000', 10
            );
        }

        // Label
        if (this.showLabels && entity.name) {
            this.text(entity.x, entity.y - 10, entity.name, '#ffffff');
        }
    }

    // Render all shapes
    render() {
        if (!this.enabled) return;

        const ctx = this.ctx;
        ctx.save();

        // Draw persistent shapes
        for (const shape of this.persistentShapes.values()) {
            this.drawShape(shape);
        }

        // Draw frame shapes
        for (const shape of this.shapes) {
            this.drawShape(shape);
        }

        ctx.restore();

        // Clear frame shapes
        this.shapes = [];
    }

    drawShape(shape) {
        const ctx = this.ctx;
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;
        ctx.lineWidth = shape.width || 1;

        switch (shape.type) {
            case 'rect':
                ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
                break;

            case 'circle':
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'line':
                ctx.beginPath();
                ctx.moveTo(shape.x1, shape.y1);
                ctx.lineTo(shape.x2, shape.y2);
                ctx.stroke();
                break;

            case 'vector':
                ctx.beginPath();
                ctx.moveTo(shape.x, shape.y);
                ctx.lineTo(shape.x + shape.vx, shape.y + shape.vy);
                ctx.stroke();
                
                // Arrowhead
                const angle = Math.atan2(shape.vy, shape.vx);
                const headLen = 8;
                ctx.beginPath();
                ctx.moveTo(shape.x + shape.vx, shape.y + shape.vy);
                ctx.lineTo(
                    shape.x + shape.vx - headLen * Math.cos(angle - 0.5),
                    shape.y + shape.vy - headLen * Math.sin(angle - 0.5)
                );
                ctx.moveTo(shape.x + shape.vx, shape.y + shape.vy);
                ctx.lineTo(
                    shape.x + shape.vx - headLen * Math.cos(angle + 0.5),
                    shape.y + shape.vy - headLen * Math.sin(angle + 0.5)
                );
                ctx.stroke();
                break;

            case 'point':
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'text':
                ctx.font = \`\${shape.size}px monospace\`;
                ctx.fillText(shape.text, shape.x, shape.y);
                break;

            case 'path':
                if (shape.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                    ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                if (shape.closed) ctx.closePath();
                ctx.stroke();
                break;
        }
    }
}`;
    }
}

export const debugDraw = DebugDraw.getInstance();
