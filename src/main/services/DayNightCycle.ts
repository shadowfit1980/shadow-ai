/**
 * 🌅 Day/Night Cycle
 * 
 * Time-based lighting:
 * - Sun/moon position
 * - Sky color gradients
 * - Ambient lighting
 * - Time progression
 */

import { EventEmitter } from 'events';

export interface TimeOfDay {
    hour: number;
    minute: number;
    dayProgress: number; // 0-1
}

export interface LightingConfig {
    ambientColor: string;
    skyColor: string;
    sunColor: string;
    intensity: number;
}

export class DayNightCycle extends EventEmitter {
    private static instance: DayNightCycle;

    private constructor() { super(); }

    static getInstance(): DayNightCycle {
        if (!DayNightCycle.instance) {
            DayNightCycle.instance = new DayNightCycle();
        }
        return DayNightCycle.instance;
    }

    getLighting(dayProgress: number): LightingConfig {
        // dayProgress: 0 = midnight, 0.5 = noon
        const hour = dayProgress * 24;

        if (hour >= 6 && hour < 8) {
            // Dawn
            const t = (hour - 6) / 2;
            return {
                ambientColor: this.lerpColor('#1a1a3e', '#ffeedd', t),
                skyColor: this.lerpColor('#1a1a3e', '#87ceeb', t),
                sunColor: '#ff7700',
                intensity: 0.3 + t * 0.4
            };
        } else if (hour >= 8 && hour < 17) {
            // Day
            return {
                ambientColor: '#ffffff',
                skyColor: '#87ceeb',
                sunColor: '#fffacd',
                intensity: 1.0
            };
        } else if (hour >= 17 && hour < 20) {
            // Dusk
            const t = (hour - 17) / 3;
            return {
                ambientColor: this.lerpColor('#ffeedd', '#1a1a3e', t),
                skyColor: this.lerpColor('#ff7700', '#1a1a3e', t),
                sunColor: '#ff4500',
                intensity: 0.7 - t * 0.4
            };
        } else {
            // Night
            return {
                ambientColor: '#0a0a1e',
                skyColor: '#0a0a1e',
                sunColor: '#aaccff', // Moon
                intensity: 0.2
            };
        }
    }

    private lerpColor(colorA: string, colorB: string, t: number): string {
        const a = this.hexToRgb(colorA);
        const b = this.hexToRgb(colorB);
        const r = Math.round(a.r + (b.r - a.r) * t);
        const g = Math.round(a.g + (b.g - a.g) * t);
        const bVal = Math.round(a.b + (b.b - a.b) * t);
        return `rgb(${r}, ${g}, ${bVal})`;
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    generateDayNightCode(): string {
        return `
class DayNightCycle {
    constructor() {
        this.time = 0.5; // Start at noon
        this.speed = 1; // 1 = 1 game hour per real minute
        this.paused = false;
    }

    update(dt) {
        if (this.paused) return;
        
        // Advance time
        this.time += (dt / 60) * this.speed / 24;
        if (this.time >= 1) this.time -= 1;
    }

    getHour() {
        return Math.floor(this.time * 24);
    }

    getMinute() {
        return Math.floor((this.time * 24 * 60) % 60);
    }

    getTimeString() {
        const h = this.getHour().toString().padStart(2, '0');
        const m = this.getMinute().toString().padStart(2, '0');
        return \`\${h}:\${m}\`;
    }

    setTime(hour, minute = 0) {
        this.time = (hour + minute / 60) / 24;
    }

    getSunPosition(width, height) {
        // Sun moves in an arc across the sky
        const angle = (this.time - 0.25) * Math.PI * 2; // 6 AM = horizon
        const radius = height * 0.8;
        return {
            x: width / 2 + Math.cos(angle) * radius,
            y: height - Math.sin(angle) * radius,
            visible: this.time > 0.25 && this.time < 0.75
        };
    }

    getMoonPosition(width, height) {
        const angle = (this.time + 0.25) * Math.PI * 2;
        const radius = height * 0.8;
        return {
            x: width / 2 + Math.cos(angle) * radius,
            y: height - Math.sin(angle) * radius,
            visible: this.time < 0.25 || this.time > 0.75
        };
    }

    getAmbientLight() {
        const hour = this.getHour();
        
        if (hour >= 6 && hour < 8) {
            const t = (hour - 6) / 2;
            return { color: this.lerpColor('#1a1a3e', '#ffffff', t), intensity: 0.3 + t * 0.7 };
        } else if (hour >= 8 && hour < 17) {
            return { color: '#ffffff', intensity: 1.0 };
        } else if (hour >= 17 && hour < 20) {
            const t = (hour - 17) / 3;
            return { color: this.lerpColor('#ffeedd', '#1a1a3e', t), intensity: 1.0 - t * 0.7 };
        } else {
            return { color: '#1a1a3e', intensity: 0.3 };
        }
    }

    getSkyGradient(ctx, width, height) {
        const hour = this.getHour();
        const gradient = ctx.createLinearGradient(0, 0, 0, height);

        if (hour >= 6 && hour < 8) { // Dawn
            gradient.addColorStop(0, '#ff7700');
            gradient.addColorStop(0.5, '#ffcc66');
            gradient.addColorStop(1, '#87ceeb');
        } else if (hour >= 8 && hour < 17) { // Day
            gradient.addColorStop(0, '#1e90ff');
            gradient.addColorStop(1, '#87ceeb');
        } else if (hour >= 17 && hour < 20) { // Dusk
            gradient.addColorStop(0, '#1a1a3e');
            gradient.addColorStop(0.3, '#ff4500');
            gradient.addColorStop(0.6, '#ff7700');
            gradient.addColorStop(1, '#ffcc66');
        } else { // Night
            gradient.addColorStop(0, '#000011');
            gradient.addColorStop(1, '#0a0a2e');
        }

        return gradient;
    }

    lerpColor(a, b, t) {
        const parse = hex => ({
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        });
        const ca = parse(a), cb = parse(b);
        const r = Math.round(ca.r + (cb.r - ca.r) * t);
        const g = Math.round(ca.g + (cb.g - ca.g) * t);
        const bl = Math.round(ca.b + (cb.b - ca.b) * t);
        return \`rgb(\${r}, \${g}, \${bl})\`;
    }

    render(ctx, width, height) {
        // Sky background
        ctx.fillStyle = this.getSkyGradient(ctx, width, height);
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sun = this.getSunPosition(width, height);
        if (sun.visible && sun.y < height) {
            ctx.fillStyle = '#ffdd00';
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, 30, 0, Math.PI * 2);
            ctx.fill();
        }

        // Moon
        const moon = this.getMoonPosition(width, height);
        if (moon.visible && moon.y < height) {
            ctx.fillStyle = '#ddddff';
            ctx.beginPath();
            ctx.arc(moon.x, moon.y, 25, 0, Math.PI * 2);
            ctx.fill();
        }

        // Stars at night
        if (this.getHour() < 6 || this.getHour() >= 20) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 50; i++) {
                const x = (i * 17 + this.time * 1000) % width;
                const y = (i * 31) % (height * 0.5);
                ctx.fillRect(x, y, 2, 2);
            }
        }
    }
}`;
    }
}

export const dayNightCycle = DayNightCycle.getInstance();
