/**
 * 🖼️ UI Layout System
 * 
 * Game UI components and layouts:
 * - Buttons, panels, text
 * - Health bars, inventories
 * - Dialog boxes
 * - Responsive layouts
 */

import { EventEmitter } from 'events';

export interface UIElement {
    id: string;
    type: 'button' | 'panel' | 'text' | 'image' | 'progressBar' | 'slot' | 'dialog';
    x: number;
    y: number;
    width: number;
    height: number;
    anchor: { x: number; y: number };
    parent?: string;
    style: UIStyle;
    data?: any;
}

export interface UIStyle {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    padding?: number;
    opacity?: number;
    hoverStyle?: Partial<UIStyle>;
}

export interface UILayout {
    id: string;
    name: string;
    type: 'hud' | 'menu' | 'dialog' | 'inventory';
    elements: UIElement[];
}

export class UILayoutSystem extends EventEmitter {
    private static instance: UILayoutSystem;
    private layouts: Map<string, UILayout> = new Map();
    private themes: Map<string, Record<string, UIStyle>> = new Map();

    private constructor() {
        super();
        this.initializeThemes();
        this.initializePresets();
    }

    static getInstance(): UILayoutSystem {
        if (!UILayoutSystem.instance) {
            UILayoutSystem.instance = new UILayoutSystem();
        }
        return UILayoutSystem.instance;
    }

    private initializeThemes(): void {
        this.themes.set('dark', {
            panel: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#444',
                borderWidth: 2,
                borderRadius: 8
            },
            button: {
                backgroundColor: '#4a90d9',
                borderColor: '#2c5282',
                borderWidth: 2,
                borderRadius: 4,
                textColor: '#fff',
                fontSize: 16,
                hoverStyle: { backgroundColor: '#63a4e8' }
            },
            text: {
                textColor: '#fff',
                fontSize: 14,
                fontFamily: 'Arial'
            },
            progressBar: {
                backgroundColor: '#333',
                borderColor: '#555',
                borderWidth: 1,
                borderRadius: 4
            }
        });

        this.themes.set('fantasy', {
            panel: {
                backgroundColor: 'rgba(60, 40, 20, 0.9)',
                borderColor: '#8b6914',
                borderWidth: 3,
                borderRadius: 12
            },
            button: {
                backgroundColor: '#8b4513',
                borderColor: '#daa520',
                borderWidth: 2,
                borderRadius: 6,
                textColor: '#f5deb3',
                fontSize: 18
            },
            text: {
                textColor: '#f5deb3',
                fontSize: 16,
                fontFamily: 'Georgia'
            },
            progressBar: {
                backgroundColor: '#2d1810',
                borderColor: '#8b4513',
                borderWidth: 2,
                borderRadius: 6
            }
        });

        this.themes.set('scifi', {
            panel: {
                backgroundColor: 'rgba(0, 20, 40, 0.9)',
                borderColor: '#00ffff',
                borderWidth: 1,
                borderRadius: 0
            },
            button: {
                backgroundColor: 'rgba(0, 100, 150, 0.8)',
                borderColor: '#00ffff',
                borderWidth: 1,
                borderRadius: 0,
                textColor: '#00ffff',
                fontSize: 14
            },
            text: {
                textColor: '#00ffff',
                fontSize: 12,
                fontFamily: 'Courier New'
            },
            progressBar: {
                backgroundColor: 'rgba(0, 50, 80, 0.8)',
                borderColor: '#00ffff',
                borderWidth: 1,
                borderRadius: 0
            }
        });
    }

    private initializePresets(): void {
        // HUD layout
        this.layouts.set('hud', {
            id: 'hud', name: 'Game HUD', type: 'hud',
            elements: [
                {
                    id: 'healthBar', type: 'progressBar',
                    x: 20, y: 20, width: 200, height: 24,
                    anchor: { x: 0, y: 0 },
                    style: { backgroundColor: '#333', borderColor: '#fff', borderWidth: 2 },
                    data: { value: 100, max: 100, color: '#e53e3e' }
                },
                {
                    id: 'manaBar', type: 'progressBar',
                    x: 20, y: 50, width: 200, height: 20,
                    anchor: { x: 0, y: 0 },
                    style: { backgroundColor: '#333', borderColor: '#fff', borderWidth: 2 },
                    data: { value: 80, max: 100, color: '#4299e1' }
                },
                {
                    id: 'scoreText', type: 'text',
                    x: -20, y: 20, width: 150, height: 30,
                    anchor: { x: 1, y: 0 },
                    style: { textColor: '#fff', fontSize: 24 },
                    data: { text: 'Score: 0' }
                },
                {
                    id: 'minimap', type: 'panel',
                    x: -20, y: -20, width: 150, height: 150,
                    anchor: { x: 1, y: 1 },
                    style: { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: '#fff', borderWidth: 2 }
                }
            ]
        });

        // Pause menu
        this.layouts.set('pauseMenu', {
            id: 'pauseMenu', name: 'Pause Menu', type: 'menu',
            elements: [
                {
                    id: 'backdrop', type: 'panel',
                    x: 0, y: 0, width: 9999, height: 9999,
                    anchor: { x: 0.5, y: 0.5 },
                    style: { backgroundColor: 'rgba(0,0,0,0.7)' }
                },
                {
                    id: 'menuPanel', type: 'panel',
                    x: 0, y: 0, width: 300, height: 400,
                    anchor: { x: 0.5, y: 0.5 },
                    style: { backgroundColor: '#1a1a2e', borderColor: '#4a90d9', borderWidth: 3, borderRadius: 12 }
                },
                {
                    id: 'title', type: 'text',
                    x: 0, y: -150, width: 200, height: 40,
                    anchor: { x: 0.5, y: 0.5 },
                    style: { textColor: '#fff', fontSize: 32 },
                    data: { text: 'PAUSED' }
                },
                {
                    id: 'resumeBtn', type: 'button',
                    x: 0, y: -60, width: 200, height: 50,
                    anchor: { x: 0.5, y: 0.5 },
                    style: { backgroundColor: '#4a90d9', textColor: '#fff', fontSize: 20, borderRadius: 8 },
                    data: { text: 'Resume', action: 'resume' }
                },
                {
                    id: 'optionsBtn', type: 'button',
                    x: 0, y: 10, width: 200, height: 50,
                    anchor: { x: 0.5, y: 0.5 },
                    style: { backgroundColor: '#4a90d9', textColor: '#fff', fontSize: 20, borderRadius: 8 },
                    data: { text: 'Options', action: 'options' }
                },
                {
                    id: 'quitBtn', type: 'button',
                    x: 0, y: 80, width: 200, height: 50,
                    anchor: { x: 0.5, y: 0.5 },
                    style: { backgroundColor: '#e53e3e', textColor: '#fff', fontSize: 20, borderRadius: 8 },
                    data: { text: 'Quit', action: 'quit' }
                }
            ]
        });
    }

    getLayout(id: string): UILayout | undefined {
        return this.layouts.get(id);
    }

    getTheme(name: string): Record<string, UIStyle> | undefined {
        return this.themes.get(name);
    }

    getAllThemes(): string[] {
        return Array.from(this.themes.keys());
    }

    generateUICode(): string {
        return `
class UIManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.elements = new Map();
        this.hoverElement = null;
        this.activeElement = null;
        
        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.hoverElement = this.findElementAt(x, y);
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoverElement) {
                this.handleClick(this.hoverElement);
            }
        });
    }

    add(element) {
        this.elements.set(element.id, element);
    }

    remove(id) {
        this.elements.delete(id);
    }

    findElementAt(x, y) {
        for (const el of this.elements.values()) {
            const bounds = this.getBounds(el);
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return el;
            }
        }
        return null;
    }

    getBounds(el) {
        const x = el.anchor.x === 1 ? this.canvas.width + el.x - el.width :
                  el.anchor.x === 0.5 ? this.canvas.width / 2 + el.x - el.width / 2 : el.x;
        const y = el.anchor.y === 1 ? this.canvas.height + el.y - el.height :
                  el.anchor.y === 0.5 ? this.canvas.height / 2 + el.y - el.height / 2 : el.y;
        return { x, y, width: el.width, height: el.height };
    }

    handleClick(element) {
        if (element.data?.action) {
            this.onAction?.(element.data.action, element);
        }
    }

    render() {
        for (const el of this.elements.values()) {
            this.renderElement(el);
        }
    }

    renderElement(el) {
        const bounds = this.getBounds(el);
        const style = this.hoverElement === el && el.style.hoverStyle
            ? { ...el.style, ...el.style.hoverStyle }
            : el.style;

        const ctx = this.ctx;
        ctx.save();

        switch (el.type) {
            case 'panel':
            case 'button':
                this.drawPanel(bounds, style);
                if (el.data?.text) {
                    this.drawText(el.data.text, bounds, style);
                }
                break;
            case 'text':
                this.drawText(el.data?.text || '', bounds, style);
                break;
            case 'progressBar':
                this.drawProgressBar(bounds, style, el.data);
                break;
        }

        ctx.restore();
    }

    drawPanel(bounds, style) {
        const ctx = this.ctx;
        ctx.fillStyle = style.backgroundColor || '#333';
        ctx.strokeStyle = style.borderColor || '#fff';
        ctx.lineWidth = style.borderWidth || 1;

        const r = style.borderRadius || 0;
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, r);
        ctx.fill();
        if (style.borderWidth) ctx.stroke();
    }

    drawText(text, bounds, style) {
        const ctx = this.ctx;
        ctx.fillStyle = style.textColor || '#fff';
        ctx.font = \`\${style.fontSize || 14}px \${style.fontFamily || 'Arial'}\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    }

    drawProgressBar(bounds, style, data) {
        const ctx = this.ctx;
        
        // Background
        ctx.fillStyle = style.backgroundColor || '#333';
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // Fill
        const progress = (data.value / data.max) * bounds.width;
        ctx.fillStyle = data.color || '#4a90d9';
        ctx.fillRect(bounds.x, bounds.y, progress, bounds.height);
        
        // Border
        if (style.borderWidth) {
            ctx.strokeStyle = style.borderColor || '#fff';
            ctx.lineWidth = style.borderWidth;
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
    }
}`;
    }
}

export const uiLayoutSystem = UILayoutSystem.getInstance();
