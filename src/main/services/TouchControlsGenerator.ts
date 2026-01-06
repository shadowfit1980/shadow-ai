/**
 * 📱 Touch Controls Generator
 * 
 * Mobile touch input:
 * - Virtual joysticks
 * - Touch buttons
 * - Swipe gestures
 * - Multi-touch
 */

import { EventEmitter } from 'events';

export interface TouchControl {
    id: string;
    type: 'joystick' | 'button' | 'dpad' | 'swipeZone';
    x: number;
    y: number;
    size: number;
    anchor: { x: number; y: number };
    options: Record<string, any>;
}

export interface TouchLayout {
    id: string;
    name: string;
    controls: TouchControl[];
}

export class TouchControlsGenerator extends EventEmitter {
    private static instance: TouchControlsGenerator;
    private layouts: Map<string, TouchLayout> = new Map();

    private constructor() {
        super();
        this.initializePresets();
    }

    static getInstance(): TouchControlsGenerator {
        if (!TouchControlsGenerator.instance) {
            TouchControlsGenerator.instance = new TouchControlsGenerator();
        }
        return TouchControlsGenerator.instance;
    }

    private initializePresets(): void {
        // Platformer layout
        this.layouts.set('platformer', {
            id: 'platformer', name: 'Platformer Controls',
            controls: [
                { id: 'move', type: 'joystick', x: 100, y: -100, size: 120, anchor: { x: 0, y: 1 }, options: { axes: 'horizontal' } },
                { id: 'jump', type: 'button', x: -100, y: -150, size: 80, anchor: { x: 1, y: 1 }, options: { label: 'A' } },
                { id: 'action', type: 'button', x: -180, y: -100, size: 60, anchor: { x: 1, y: 1 }, options: { label: 'B' } }
            ]
        });

        // RPG layout
        this.layouts.set('rpg', {
            id: 'rpg', name: 'RPG Controls',
            controls: [
                { id: 'move', type: 'joystick', x: 100, y: -100, size: 120, anchor: { x: 0, y: 1 }, options: { axes: 'both' } },
                { id: 'attack', type: 'button', x: -100, y: -150, size: 70, anchor: { x: 1, y: 1 }, options: { label: '⚔' } },
                { id: 'skill1', type: 'button', x: -180, y: -100, size: 50, anchor: { x: 1, y: 1 }, options: { label: '1' } },
                { id: 'skill2', type: 'button', x: -100, y: -60, size: 50, anchor: { x: 1, y: 1 }, options: { label: '2' } },
                { id: 'menu', type: 'button', x: -50, y: 50, size: 40, anchor: { x: 1, y: 0 }, options: { label: '☰' } }
            ]
        });

        // Shooter layout
        this.layouts.set('shooter', {
            id: 'shooter', name: 'Shooter Controls',
            controls: [
                { id: 'move', type: 'joystick', x: 100, y: -100, size: 120, anchor: { x: 0, y: 1 }, options: { axes: 'both' } },
                { id: 'aim', type: 'joystick', x: -100, y: -100, size: 120, anchor: { x: 1, y: 1 }, options: { axes: 'both', fireOnRelease: true } },
                { id: 'reload', type: 'button', x: -50, y: -220, size: 50, anchor: { x: 1, y: 1 }, options: { label: 'R' } },
                { id: 'weapon', type: 'button', x: 50, y: 50, size: 50, anchor: { x: 0, y: 0 }, options: { label: '🔫' } }
            ]
        });
    }

    getLayout(id: string): TouchLayout | undefined {
        return this.layouts.get(id);
    }

    getAllLayouts(): string[] {
        return Array.from(this.layouts.keys());
    }

    generateTouchControlsCode(): string {
        return `
class TouchControls {
    constructor(canvas, layout) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.controls = layout.controls;
        this.touches = new Map();
        this.state = {};

        this.setupEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvasRect = this.canvas.getBoundingClientRect();
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.computePositions();
    }

    computePositions() {
        this.controlBounds = this.controls.map(ctrl => {
            let x = ctrl.anchor.x === 1 ? this.width + ctrl.x : ctrl.x;
            let y = ctrl.anchor.y === 1 ? this.height + ctrl.y : ctrl.y;
            return { ...ctrl, computedX: x, computedY: y };
        });
    }

    setupEvents() {
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
    }

    onTouchStart(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const pos = this.getTouchPos(touch);
            const ctrl = this.findControlAt(pos.x, pos.y);
            if (ctrl) {
                this.touches.set(touch.identifier, { control: ctrl, startX: pos.x, startY: pos.y });
                this.handleControlStart(ctrl, pos);
            }
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const data = this.touches.get(touch.identifier);
            if (data) {
                const pos = this.getTouchPos(touch);
                this.handleControlMove(data.control, pos, data);
            }
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const data = this.touches.get(touch.identifier);
            if (data) {
                this.handleControlEnd(data.control);
                this.touches.delete(touch.identifier);
            }
        }
    }

    getTouchPos(touch) {
        return {
            x: (touch.clientX - this.canvasRect.left) * (this.width / this.canvasRect.width),
            y: (touch.clientY - this.canvasRect.top) * (this.height / this.canvasRect.height)
        };
    }

    findControlAt(x, y) {
        return this.controlBounds.find(ctrl => {
            const dx = x - ctrl.computedX;
            const dy = y - ctrl.computedY;
            return Math.sqrt(dx * dx + dy * dy) < ctrl.size;
        });
    }

    handleControlStart(ctrl, pos) {
        if (ctrl.type === 'button') {
            this.state[ctrl.id] = { pressed: true };
            this.onButtonDown?.(ctrl.id);
        } else if (ctrl.type === 'joystick') {
            this.state[ctrl.id] = { x: 0, y: 0, active: true };
        }
    }

    handleControlMove(ctrl, pos, data) {
        if (ctrl.type === 'joystick') {
            let dx = (pos.x - ctrl.computedX) / (ctrl.size * 0.5);
            let dy = (pos.y - ctrl.computedY) / (ctrl.size * 0.5);
            
            // Clamp to unit circle
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 1) { dx /= len; dy /= len; }
            
            // Apply axis constraints
            if (ctrl.options.axes === 'horizontal') dy = 0;
            if (ctrl.options.axes === 'vertical') dx = 0;
            
            this.state[ctrl.id] = { x: dx, y: dy, active: true };
            this.onJoystickMove?.(ctrl.id, dx, dy);
        }
    }

    handleControlEnd(ctrl) {
        if (ctrl.type === 'button') {
            this.state[ctrl.id] = { pressed: false };
            this.onButtonUp?.(ctrl.id);
        } else if (ctrl.type === 'joystick') {
            this.state[ctrl.id] = { x: 0, y: 0, active: false };
            this.onJoystickMove?.(ctrl.id, 0, 0);
        }
    }

    render() {
        this.controlBounds.forEach(ctrl => {
            const state = this.state[ctrl.id] || {};
            
            if (ctrl.type === 'joystick') {
                // Base circle
                this.ctx.beginPath();
                this.ctx.arc(ctrl.computedX, ctrl.computedY, ctrl.size, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                this.ctx.fill();
                
                // Thumb
                const thumbX = ctrl.computedX + (state.x || 0) * ctrl.size * 0.5;
                const thumbY = ctrl.computedY + (state.y || 0) * ctrl.size * 0.5;
                this.ctx.beginPath();
                this.ctx.arc(thumbX, thumbY, ctrl.size * 0.4, 0, Math.PI * 2);
                this.ctx.fillStyle = state.active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)';
                this.ctx.fill();
            } else if (ctrl.type === 'button') {
                this.ctx.beginPath();
                this.ctx.arc(ctrl.computedX, ctrl.computedY, ctrl.size / 2, 0, Math.PI * 2);
                this.ctx.fillStyle = state.pressed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
                this.ctx.fill();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = \`\${ctrl.size * 0.4}px Arial\`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(ctrl.options.label || '', ctrl.computedX, ctrl.computedY);
            }
        });
    }

    getState(id) {
        return this.state[id] || null;
    }
}`;
    }
}

export const touchControlsGenerator = TouchControlsGenerator.getInstance();
