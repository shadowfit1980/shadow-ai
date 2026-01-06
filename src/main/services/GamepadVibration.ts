/**
 * 🎮 Gamepad Vibration
 * 
 * Haptic feedback:
 * - Vibration patterns
 * - Intensity control
 * - Duration
 */

import { EventEmitter } from 'events';

export type VibrationPattern = 'light' | 'medium' | 'heavy' | 'pulse' | 'rumble';

export class GamepadVibration extends EventEmitter {
    private static instance: GamepadVibration;

    private constructor() { super(); }

    static getInstance(): GamepadVibration {
        if (!GamepadVibration.instance) {
            GamepadVibration.instance = new GamepadVibration();
        }
        return GamepadVibration.instance;
    }

    getPatterns(): VibrationPattern[] {
        return ['light', 'medium', 'heavy', 'pulse', 'rumble'];
    }

    generateVibrationCode(): string {
        return `
class HapticFeedback {
    constructor() {
        this.enabled = true;
        this.intensity = 1.0;
        this.activeVibrations = [];
    }

    getGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
            if (gp && gp.vibrationActuator) return gp;
        }
        return null;
    }

    vibrate(pattern = 'medium', duration = 200) {
        if (!this.enabled) return;
        
        const gp = this.getGamepad();
        if (!gp || !gp.vibrationActuator) {
            // Fallback to mobile vibration
            if (navigator.vibrate) {
                navigator.vibrate(duration);
            }
            return;
        }

        const params = this.getPatternParams(pattern);
        
        gp.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: duration * this.intensity,
            weakMagnitude: params.weak * this.intensity,
            strongMagnitude: params.strong * this.intensity
        });
    }

    getPatternParams(pattern) {
        switch (pattern) {
            case 'light':
                return { weak: 0.3, strong: 0 };
            case 'medium':
                return { weak: 0.5, strong: 0.3 };
            case 'heavy':
                return { weak: 0.8, strong: 0.8 };
            case 'pulse':
                return { weak: 1.0, strong: 0 };
            case 'rumble':
                return { weak: 0.4, strong: 1.0 };
            default:
                return { weak: 0.5, strong: 0.3 };
        }
    }

    // Presets
    hit() { this.vibrate('medium', 100); }
    explosion() { this.vibrate('heavy', 300); }
    pickup() { this.vibrate('light', 50); }
    damage() { this.vibrate('rumble', 200); }
    death() { this.vibrate('heavy', 500); }
    success() { this.pulse(3, 100, 50); }
    
    // Pulse pattern
    pulse(count, onDuration, offDuration) {
        if (!this.enabled) return;

        let i = 0;
        const doPulse = () => {
            if (i >= count) return;
            this.vibrate('pulse', onDuration);
            i++;
            setTimeout(doPulse, onDuration + offDuration);
        };
        doPulse();
    }

    // Continuous vibration
    startContinuous(pattern = 'light', interval = 100) {
        if (this.continuousInterval) this.stopContinuous();
        
        this.continuousInterval = setInterval(() => {
            this.vibrate(pattern, interval - 10);
        }, interval);
    }

    stopContinuous() {
        if (this.continuousInterval) {
            clearInterval(this.continuousInterval);
            this.continuousInterval = null;
        }
    }

    // Engine rumble (speed-based)
    engineRumble(speed, maxSpeed) {
        if (!this.enabled) return;
        
        const intensity = (speed / maxSpeed) * 0.3;
        const gp = this.getGamepad();
        
        if (gp && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: 50,
                weakMagnitude: intensity * this.intensity,
                strongMagnitude: intensity * 0.3 * this.intensity
            });
        }
    }

    // Custom pattern
    custom(sequence) {
        // sequence: [{pattern, duration, delay}, ...]
        let time = 0;
        for (const step of sequence) {
            setTimeout(() => {
                this.vibrate(step.pattern, step.duration);
            }, time);
            time += step.duration + (step.delay || 0);
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this.stopContinuous();
    }

    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
    }
}

// Mobile vibration fallback
class MobileHaptics {
    static vibrate(pattern) {
        if (!navigator.vibrate) return false;
        
        if (typeof pattern === 'number') {
            navigator.vibrate(pattern);
        } else if (Array.isArray(pattern)) {
            navigator.vibrate(pattern);
        }
        return true;
    }

    static light() { this.vibrate(10); }
    static medium() { this.vibrate(40); }
    static heavy() { this.vibrate(100); }
    static pattern(onOff) { this.vibrate(onOff); } // [100, 50, 100]
}`;
    }
}

export const gamepadVibration = GamepadVibration.getInstance();
