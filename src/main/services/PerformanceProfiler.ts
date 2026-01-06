/**
 * 📊 Performance Profiler
 * 
 * Game performance monitoring:
 * - FPS tracking
 * - Memory usage
 * - Frame times
 * - Bottleneck detection
 */

import { EventEmitter } from 'events';

export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    minFps: number;
    maxFps: number;
    avgFps: number;
    memory?: number;
    drawCalls?: number;
}

export class PerformanceProfiler extends EventEmitter {
    private static instance: PerformanceProfiler;

    private constructor() { super(); }

    static getInstance(): PerformanceProfiler {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }

    generateProfilerCode(): string {
        return `
class PerformanceProfiler {
    constructor() {
        this.enabled = true;
        this.visible = false;
        this.samples = [];
        this.maxSamples = 120;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        this.minFps = Infinity;
        this.maxFps = 0;
        this.avgFps = 0;
        this.sections = new Map();
        this.currentSection = null;
    }

    toggle() {
        this.visible = !this.visible;
    }

    beginFrame() {
        if (!this.enabled) return;
        this.frameStart = performance.now();
    }

    endFrame() {
        if (!this.enabled) return;
        
        const now = performance.now();
        const frameTime = now - this.frameStart;
        this.frameCount++;

        // Store sample
        this.samples.push({
            time: now,
            frameTime,
            sections: new Map(this.sections)
        });

        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }

        // Update FPS every second
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;

            // Update min/max
            if (this.fps > 0) {
                this.minFps = Math.min(this.minFps, this.fps);
                this.maxFps = Math.max(this.maxFps, this.fps);
            }

            // Calculate average from samples
            if (this.samples.length > 0) {
                const recentSamples = this.samples.slice(-60);
                const avgFrameTime = recentSamples.reduce((sum, s) => sum + s.frameTime, 0) / recentSamples.length;
                this.avgFps = Math.round(1000 / avgFrameTime);
            }
        }

        // Clear sections for next frame
        this.sections.clear();
    }

    beginSection(name) {
        if (!this.enabled) return;
        this.currentSection = { name, start: performance.now() };
    }

    endSection() {
        if (!this.enabled || !this.currentSection) return;
        const time = performance.now() - this.currentSection.start;
        this.sections.set(this.currentSection.name, time);
        this.currentSection = null;
    }

    getMetrics() {
        const lastSample = this.samples[this.samples.length - 1];
        return {
            fps: this.fps,
            frameTime: lastSample?.frameTime || 0,
            minFps: this.minFps === Infinity ? 0 : this.minFps,
            maxFps: this.maxFps,
            avgFps: this.avgFps,
            memory: this.getMemory(),
            sections: lastSample?.sections || new Map()
        };
    }

    getMemory() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / 1048576);
        }
        return null;
    }

    reset() {
        this.samples = [];
        this.minFps = Infinity;
        this.maxFps = 0;
        this.avgFps = 0;
    }

    render(ctx, x = 10, y = 10) {
        if (!this.visible) return;

        const metrics = this.getMetrics();
        const width = 200;
        const height = 100;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);

        // FPS text
        ctx.font = '14px monospace';
        
        const fpsColor = this.fps >= 55 ? '#00ff00' : this.fps >= 30 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = fpsColor;
        ctx.fillText(\`FPS: \${this.fps}\`, x + 10, y + 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(\`Frame: \${metrics.frameTime.toFixed(1)}ms\`, x + 10, y + 35);
        ctx.fillText(\`Min/Max: \${metrics.minFps}/\${metrics.maxFps}\`, x + 10, y + 50);
        ctx.fillText(\`Avg: \${metrics.avgFps}\`, x + 10, y + 65);
        
        if (metrics.memory !== null) {
            ctx.fillText(\`Memory: \${metrics.memory}MB\`, x + 10, y + 80);
        }

        // FPS graph
        this.renderGraph(ctx, x + width + 10, y, 150, height);
    }

    renderGraph(ctx, x, y, width, height) {
        if (this.samples.length < 2) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);

        // 60 FPS line
        ctx.strokeStyle = '#00ff00';
        ctx.setLineDash([2, 2]);
        const fps60Y = y + height - (60 / 120) * height;
        ctx.beginPath();
        ctx.moveTo(x, fps60Y);
        ctx.lineTo(x + width, fps60Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Frame time graph (converted to FPS)
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1;
        ctx.beginPath();

        const recent = this.samples.slice(-60);
        recent.forEach((sample, i) => {
            const sampleFps = Math.min(120, 1000 / sample.frameTime);
            const px = x + (i / 60) * width;
            const py = y + height - (sampleFps / 120) * height;
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });

        ctx.stroke();
    }
}`;
    }
}

export const performanceProfiler = PerformanceProfiler.getInstance();
