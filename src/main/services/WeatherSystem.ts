/**
 * 🌦️ Weather System
 * 
 * Dynamic weather effects:
 * - Rain, snow, fog
 * - Lightning, wind
 * - Day/night integration
 */

import { EventEmitter } from 'events';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'sandstorm';

export interface WeatherConfig {
    type: WeatherType;
    intensity: number; // 0-1
    windSpeed: number;
    windDirection: number; // radians
    temperature?: number;
}

export class WeatherSystem extends EventEmitter {
    private static instance: WeatherSystem;
    private currentWeather: WeatherConfig = {
        type: 'clear',
        intensity: 0,
        windSpeed: 0,
        windDirection: 0
    };

    private constructor() { super(); }

    static getInstance(): WeatherSystem {
        if (!WeatherSystem.instance) {
            WeatherSystem.instance = new WeatherSystem();
        }
        return WeatherSystem.instance;
    }

    setWeather(config: WeatherConfig): void {
        this.currentWeather = config;
        this.emit('weatherChanged', config);
    }

    getWeather(): WeatherConfig {
        return this.currentWeather;
    }

    generateWeatherCode(): string {
        return `
class WeatherSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.type = 'clear';
        this.intensity = 0;
        this.windX = 0;
        this.windY = 0;
        this.lightning = 0;
        this.fogOpacity = 0;
    }

    setWeather(type, intensity = 1) {
        this.type = type;
        this.intensity = intensity;
        this.particles = [];

        const count = Math.floor(intensity * 500);

        switch (type) {
            case 'rain':
                this.windX = 2;
                this.windY = 0;
                for (let i = 0; i < count; i++) {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        speed: 10 + Math.random() * 10,
                        length: 10 + Math.random() * 20
                    });
                }
                break;

            case 'snow':
                this.windX = 0.5;
                for (let i = 0; i < count / 2; i++) {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        speed: 1 + Math.random() * 2,
                        size: 2 + Math.random() * 4,
                        wobble: Math.random() * Math.PI * 2
                    });
                }
                break;

            case 'fog':
                this.fogOpacity = intensity * 0.5;
                break;

            case 'storm':
                this.setWeather('rain', intensity);
                this.lightning = intensity;
                break;
        }
    }

    update(dt) {
        const { type, particles, canvas } = this;

        if (type === 'rain' || type === 'storm') {
            particles.forEach(p => {
                p.y += p.speed * dt * 60;
                p.x += this.windX * dt * 60;

                if (p.y > canvas.height) {
                    p.y = -p.length;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x > canvas.width) p.x = 0;
                if (p.x < 0) p.x = canvas.width;
            });

            // Random lightning
            if (type === 'storm' && Math.random() < 0.001 * this.lightning) {
                this.lightning = 1;
                setTimeout(() => this.lightning = this.intensity * 0.3, 100);
            }
        }

        if (type === 'snow') {
            particles.forEach(p => {
                p.y += p.speed * dt * 60;
                p.wobble += dt * 2;
                p.x += Math.sin(p.wobble) * 0.5 + this.windX * dt * 60;

                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
            });
        }
    }

    render() {
        const { type, particles, ctx, canvas } = this;

        // Lightning flash
        if (type === 'storm' && this.lightning > 0.5) {
            ctx.fillStyle = \`rgba(255, 255, 255, \${this.lightning * 0.3})\`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (type === 'rain' || type === 'storm') {
            ctx.strokeStyle = 'rgba(150, 180, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            particles.forEach(p => {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + this.windX * 2, p.y + p.length);
            });
            ctx.stroke();
        }

        if (type === 'snow') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        if (type === 'fog' || this.fogOpacity > 0) {
            ctx.fillStyle = \`rgba(180, 180, 200, \${this.fogOpacity})\`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Overlay for screen tinting
    getOverlayColor() {
        switch (this.type) {
            case 'rain': return 'rgba(50, 60, 80, 0.2)';
            case 'storm': return 'rgba(30, 30, 50, 0.3)';
            case 'snow': return 'rgba(200, 200, 220, 0.1)';
            case 'fog': return 'rgba(150, 150, 170, 0.3)';
            case 'sandstorm': return 'rgba(180, 150, 100, 0.4)';
            default: return 'rgba(0, 0, 0, 0)';
        }
    }
}`;
    }

    getAllWeatherTypes(): WeatherType[] {
        return ['clear', 'rain', 'snow', 'fog', 'storm', 'sandstorm'];
    }
}

export const weatherSystem = WeatherSystem.getInstance();
