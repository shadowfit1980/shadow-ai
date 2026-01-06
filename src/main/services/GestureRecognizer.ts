/**
 * 👆 Gesture Recognizer
 * 
 * Touch gesture detection:
 * - Swipe, pinch, rotate
 * - Tap patterns
 * - Custom gestures
 */

import { EventEmitter } from 'events';

export type GestureType = 'tap' | 'double_tap' | 'swipe' | 'pinch' | 'rotate' | 'hold';

export class GestureRecognizer extends EventEmitter {
    private static instance: GestureRecognizer;

    private constructor() { super(); }

    static getInstance(): GestureRecognizer {
        if (!GestureRecognizer.instance) {
            GestureRecognizer.instance = new GestureRecognizer();
        }
        return GestureRecognizer.instance;
    }

    getGestureTypes(): GestureType[] {
        return ['tap', 'double_tap', 'swipe', 'pinch', 'rotate', 'hold'];
    }

    generateGestureCode(): string {
        return `
class GestureRecognizer {
    constructor(element) {
        this.element = element;
        this.touches = new Map();
        this.lastTap = 0;
        this.holdTimer = null;
        
        this.config = {
            swipeThreshold: 50,
            swipeTimeLimit: 300,
            doubleTapInterval: 300,
            holdDuration: 500,
            pinchThreshold: 10
        };
        
        this.setupListeners();
    }

    setupListeners() {
        this.element.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.element.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.element.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        this.element.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
    }

    onTouchStart(e) {
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            this.touches.set(touch.identifier, {
                id: touch.identifier,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: Date.now()
            });
        }

        // Single touch - start hold timer
        if (this.touches.size === 1) {
            const touch = Array.from(this.touches.values())[0];
            this.holdTimer = setTimeout(() => {
                this.emit('hold', { x: touch.startX, y: touch.startY });
                this.onHold?.(touch.startX, touch.startY);
            }, this.config.holdDuration);
        }

        // Multi-touch - record initial state
        if (this.touches.size === 2) {
            this.initialPinchDistance = this.getPinchDistance();
            this.initialPinchAngle = this.getPinchAngle();
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const tracked = this.touches.get(touch.identifier);
            if (tracked) {
                tracked.currentX = touch.clientX;
                tracked.currentY = touch.clientY;
            }
        }

        // Cancel hold on movement
        if (this.holdTimer) {
            const touch = Array.from(this.touches.values())[0];
            const dist = Math.hypot(touch.currentX - touch.startX, touch.currentY - touch.startY);
            if (dist > 10) {
                clearTimeout(this.holdTimer);
                this.holdTimer = null;
            }
        }

        // Pinch/rotate detection
        if (this.touches.size === 2) {
            const currentDist = this.getPinchDistance();
            const currentAngle = this.getPinchAngle();
            
            const scale = currentDist / this.initialPinchDistance;
            const rotation = currentAngle - this.initialPinchAngle;
            
            const center = this.getPinchCenter();
            
            if (Math.abs(scale - 1) > 0.05) {
                this.emit('pinch', { scale, center });
                this.onPinch?.(scale, center);
            }
            
            if (Math.abs(rotation) > 0.1) {
                this.emit('rotate', { rotation, center });
                this.onRotate?.(rotation, center);
            }
        }
    }

    onTouchEnd(e) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;

        for (const touch of e.changedTouches) {
            const tracked = this.touches.get(touch.identifier);
            if (!tracked) continue;

            const dx = tracked.currentX - tracked.startX;
            const dy = tracked.currentY - tracked.startY;
            const dist = Math.hypot(dx, dy);
            const duration = Date.now() - tracked.startTime;

            // Swipe detection
            if (dist > this.config.swipeThreshold && duration < this.config.swipeTimeLimit) {
                const direction = this.getSwipeDirection(dx, dy);
                const velocity = dist / duration;
                
                this.emit('swipe', { direction, velocity, dx, dy });
                this.onSwipe?.(direction, velocity);
            }
            // Tap detection
            else if (dist < 10 && duration < 200) {
                const now = Date.now();
                
                if (now - this.lastTap < this.config.doubleTapInterval) {
                    this.emit('double_tap', { x: tracked.startX, y: tracked.startY });
                    this.onDoubleTap?.(tracked.startX, tracked.startY);
                    this.lastTap = 0;
                } else {
                    this.emit('tap', { x: tracked.startX, y: tracked.startY });
                    this.onTap?.(tracked.startX, tracked.startY);
                    this.lastTap = now;
                }
            }

            this.touches.delete(touch.identifier);
        }
    }

    getSwipeDirection(dx, dy) {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        if (angle > -45 && angle <= 45) return 'right';
        if (angle > 45 && angle <= 135) return 'down';
        if (angle > -135 && angle <= -45) return 'up';
        return 'left';
    }

    getPinchDistance() {
        const touches = Array.from(this.touches.values());
        if (touches.length < 2) return 0;
        
        return Math.hypot(
            touches[0].currentX - touches[1].currentX,
            touches[0].currentY - touches[1].currentY
        );
    }

    getPinchAngle() {
        const touches = Array.from(this.touches.values());
        if (touches.length < 2) return 0;
        
        return Math.atan2(
            touches[1].currentY - touches[0].currentY,
            touches[1].currentX - touches[0].currentX
        );
    }

    getPinchCenter() {
        const touches = Array.from(this.touches.values());
        if (touches.length < 2) return { x: 0, y: 0 };
        
        return {
            x: (touches[0].currentX + touches[1].currentX) / 2,
            y: (touches[0].currentY + touches[1].currentY) / 2
        };
    }

    emit(event, data) {
        // EventEmitter pattern
    }

    // Callbacks
    onTap = null;
    onDoubleTap = null;
    onSwipe = null;
    onPinch = null;
    onRotate = null;
    onHold = null;
}`;
    }
}

export const gestureRecognizer = GestureRecognizer.getInstance();
