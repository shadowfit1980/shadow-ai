/**
 * 🎢 Tween Engine
 * 
 * Smooth animation tweening:
 * - Easing functions
 * - Chaining
 * - Callbacks
 * - Groups
 */

import { EventEmitter } from 'events';

export type EasingFunction = (t: number) => number;
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' |
    'quadIn' | 'quadOut' | 'quadInOut' |
    'cubicIn' | 'cubicOut' | 'cubicInOut' |
    'elasticIn' | 'elasticOut' | 'elasticInOut' |
    'bounceIn' | 'bounceOut' | 'bounceInOut' |
    'backIn' | 'backOut' | 'backInOut';

export interface TweenConfig {
    target: any;
    properties: Record<string, number>;
    duration: number;
    easing?: EasingType;
    delay?: number;
    yoyo?: boolean;
    repeat?: number;
    onStart?: () => void;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
}

export class TweenEngine extends EventEmitter {
    private static instance: TweenEngine;
    private easings: Map<EasingType, EasingFunction> = new Map();

    private constructor() {
        super();
        this.initializeEasings();
    }

    static getInstance(): TweenEngine {
        if (!TweenEngine.instance) {
            TweenEngine.instance = new TweenEngine();
        }
        return TweenEngine.instance;
    }

    private initializeEasings(): void {
        // Linear
        this.easings.set('linear', t => t);

        // Quad
        this.easings.set('easeIn', t => t * t);
        this.easings.set('easeOut', t => 1 - (1 - t) * (1 - t));
        this.easings.set('easeInOut', t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

        this.easings.set('quadIn', t => t * t);
        this.easings.set('quadOut', t => 1 - (1 - t) * (1 - t));
        this.easings.set('quadInOut', t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

        // Cubic
        this.easings.set('cubicIn', t => t * t * t);
        this.easings.set('cubicOut', t => 1 - Math.pow(1 - t, 3));
        this.easings.set('cubicInOut', t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        // Elastic
        this.easings.set('elasticIn', t => {
            if (t === 0 || t === 1) return t;
            return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
        });
        this.easings.set('elasticOut', t => {
            if (t === 0 || t === 1) return t;
            return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
        });
        this.easings.set('elasticInOut', t => {
            if (t === 0 || t === 1) return t;
            if (t < 0.5) {
                return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2;
            }
            return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1;
        });

        // Bounce
        const bounceOut = (t: number) => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) return n1 * t * t;
            if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
            if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        };
        this.easings.set('bounceOut', bounceOut);
        this.easings.set('bounceIn', t => 1 - bounceOut(1 - t));
        this.easings.set('bounceInOut', t =>
            t < 0.5 ? (1 - bounceOut(1 - 2 * t)) / 2 : (1 + bounceOut(2 * t - 1)) / 2
        );

        // Back
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        this.easings.set('backIn', t => (c1 + 1) * t * t * t - c1 * t * t);
        this.easings.set('backOut', t => 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2));
        this.easings.set('backInOut', t =>
            t < 0.5
                ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
        );
    }

    getEasing(type: EasingType): EasingFunction {
        return this.easings.get(type) || (t => t);
    }

    getAllEasings(): EasingType[] {
        return Array.from(this.easings.keys());
    }

    generateTweenCode(): string {
        return `
class Tween {
    constructor(target) {
        this.target = target;
        this.start = {};
        this.end = {};
        this.duration = 1000;
        this.elapsed = 0;
        this.delay = 0;
        this.delayElapsed = 0;
        this.easing = t => t;
        this.yoyo = false;
        this.repeat = 0;
        this.repeatCount = 0;
        this.playing = false;
        this.reversed = false;
        this.chain = null;
    }

    to(properties, duration) {
        this.end = { ...properties };
        this.duration = duration;
        return this;
    }

    from(properties) {
        this.start = { ...properties };
        return this;
    }

    setEasing(easingFn) {
        this.easing = easingFn;
        return this;
    }

    setDelay(ms) {
        this.delay = ms;
        return this;
    }

    setYoyo(enabled) {
        this.yoyo = enabled;
        return this;
    }

    setRepeat(times) {
        this.repeat = times;
        return this;
    }

    onStart(fn) {
        this._onStart = fn;
        return this;
    }

    onUpdate(fn) {
        this._onUpdate = fn;
        return this;
    }

    onComplete(fn) {
        this._onComplete = fn;
        return this;
    }

    then(tween) {
        this.chain = tween;
        return tween;
    }

    start() {
        this.playing = true;
        this.elapsed = 0;
        this.delayElapsed = 0;
        
        // Capture start values
        for (const prop in this.end) {
            if (!(prop in this.start)) {
                this.start[prop] = this.target[prop];
            }
        }
        
        this._onStart?.();
        return this;
    }

    update(dt) {
        if (!this.playing) return;

        // Handle delay
        if (this.delayElapsed < this.delay) {
            this.delayElapsed += dt;
            return;
        }

        this.elapsed += dt;
        let t = Math.min(this.elapsed / this.duration, 1);
        
        if (this.reversed) t = 1 - t;
        
        const eased = this.easing(t);

        // Apply values
        for (const prop in this.end) {
            const startVal = this.start[prop];
            const endVal = this.end[prop];
            this.target[prop] = startVal + (endVal - startVal) * eased;
        }

        this._onUpdate?.(t);

        // Check completion
        if (this.elapsed >= this.duration) {
            if (this.yoyo && !this.reversed) {
                this.reversed = true;
                this.elapsed = 0;
            } else if (this.repeatCount < this.repeat) {
                this.repeatCount++;
                this.elapsed = 0;
                this.reversed = false;
            } else {
                this.playing = false;
                this._onComplete?.();
                this.chain?.start();
            }
        }
    }

    stop() {
        this.playing = false;
        return this;
    }
}

class TweenManager {
    constructor() {
        this.tweens = [];
    }

    add(target) {
        const tween = new Tween(target);
        this.tweens.push(tween);
        return tween;
    }

    update(dt) {
        this.tweens = this.tweens.filter(t => {
            t.update(dt);
            return t.playing || t.chain?.playing;
        });
    }

    killAll() {
        this.tweens.forEach(t => t.stop());
        this.tweens = [];
    }
}

// Easing functions
const Easing = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => 1 - (1 - t) * (1 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    elasticOut: t => Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
    bounceOut: t => {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
};`;
    }
}

export const tweenEngine = TweenEngine.getInstance();
