/**
 * 🏎️ Racing Physics
 * 
 * Vehicle mechanics:
 * - Acceleration/braking
 * - Steering
 * - Drift mechanics
 * - AI racers
 */

import { EventEmitter } from 'events';

export interface VehicleConfig {
    maxSpeed: number;
    acceleration: number;
    braking: number;
    turnSpeed: number;
    driftFactor: number;
    friction: number;
}

export class RacingPhysics extends EventEmitter {
    private static instance: RacingPhysics;

    private constructor() { super(); }

    static getInstance(): RacingPhysics {
        if (!RacingPhysics.instance) {
            RacingPhysics.instance = new RacingPhysics();
        }
        return RacingPhysics.instance;
    }

    generateRacingCode(): string {
        return `
class Vehicle {
    constructor(config = {}) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.angle = config.angle || 0;
        
        this.speed = 0;
        this.steering = 0;
        this.drifting = false;
        this.driftAngle = 0;
        
        // Physics params
        this.maxSpeed = config.maxSpeed || 300;
        this.acceleration = config.acceleration || 200;
        this.braking = config.braking || 400;
        this.turnSpeed = config.turnSpeed || 3;
        this.driftFactor = config.driftFactor || 0.95;
        this.friction = config.friction || 0.98;
        this.driftThreshold = config.driftThreshold || 0.5;
        
        // Input state
        this.input = { up: false, down: false, left: false, right: false, drift: false };
        
        // Racing stats
        this.lap = 0;
        this.checkpoint = 0;
        this.raceTime = 0;
        this.bestLap = Infinity;
    }

    update(dt) {
        // Acceleration/braking
        if (this.input.up) {
            this.speed += this.acceleration * dt;
        } else if (this.input.down) {
            this.speed -= this.braking * dt;
        } else {
            this.speed *= this.friction;
        }

        // Clamp speed
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));

        // Steering
        if (this.speed !== 0) {
            const turnMultiplier = 1 - Math.abs(this.speed) / this.maxSpeed * 0.5;
            
            if (this.input.left) {
                this.steering = -this.turnSpeed * turnMultiplier * Math.sign(this.speed);
            } else if (this.input.right) {
                this.steering = this.turnSpeed * turnMultiplier * Math.sign(this.speed);
            } else {
                this.steering = 0;
            }
        }

        // Drift mechanics
        if (this.input.drift && Math.abs(this.speed) > this.maxSpeed * this.driftThreshold) {
            this.drifting = true;
            this.driftAngle += this.steering * 1.5 * dt;
            this.steering *= 1.3; // More responsive steering while drifting
        } else {
            this.drifting = false;
            this.driftAngle *= this.driftFactor;
        }

        // Apply rotation
        const totalRotation = this.steering + this.driftAngle;
        this.angle += totalRotation * dt;

        // Apply movement
        const moveAngle = this.angle - this.driftAngle * 0.5;
        this.x += Math.cos(moveAngle) * this.speed * dt;
        this.y += Math.sin(moveAngle) * this.speed * dt;

        this.raceTime += dt;
    }

    // Collision with track boundaries
    applyBoundaryBounce(normalX, normalY, bounciness = 0.3) {
        // Reflect velocity
        const dot = (Math.cos(this.angle) * normalX + Math.sin(this.angle) * normalY) * 2;
        const newAngle = Math.atan2(
            Math.sin(this.angle) - dot * normalY,
            Math.cos(this.angle) - dot * normalX
        );
        this.angle = newAngle;
        this.speed *= bounciness;
    }

    // Check checkpoint
    passCheckpoint(checkpointIndex, totalCheckpoints) {
        if (checkpointIndex === this.checkpoint) {
            this.checkpoint++;
            if (this.checkpoint >= totalCheckpoints) {
                this.checkpoint = 0;
                this.lap++;
                
                const lapTime = this.raceTime;
                this.bestLap = Math.min(this.bestLap, lapTime);
                this.raceTime = 0;
                
                return { newLap: true, lapTime };
            }
            return { checkpoint: true };
        }
        return null;
    }

    setInput(key, pressed) {
        if (key in this.input) {
            this.input[key] = pressed;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Car body
        ctx.fillStyle = this.drifting ? '#ff6600' : '#3366ff';
        ctx.fillRect(-20, -10, 40, 20);

        // Windows
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(-5, -8, 15, 16);

        // Wheels
        ctx.fillStyle = '#333';
        ctx.fillRect(-18, -12, 8, 4);
        ctx.fillRect(-18, 8, 8, 4);
        ctx.fillRect(10, -12, 8, 4);
        ctx.fillRect(10, 8, 8, 4);

        ctx.restore();

        // Drift trails
        if (this.drifting) {
            ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x - Math.cos(this.angle) * 20, this.y - Math.sin(this.angle) * 20, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class RaceTrack {
    constructor(waypoints) {
        this.waypoints = waypoints;
        this.checkpoints = [];
    }

    generateFromWaypoints() {
        // Create track boundaries from waypoints
        this.innerBoundary = [];
        this.outerBoundary = [];
        
        for (let i = 0; i < this.waypoints.length; i++) {
            const wp = this.waypoints[i];
            const next = this.waypoints[(i + 1) % this.waypoints.length];
            
            const angle = Math.atan2(next.y - wp.y, next.x - wp.x);
            const perpAngle = angle + Math.PI / 2;
            const width = wp.width || 100;
            
            this.innerBoundary.push({
                x: wp.x + Math.cos(perpAngle) * width / 2,
                y: wp.y + Math.sin(perpAngle) * width / 2
            });
            this.outerBoundary.push({
                x: wp.x - Math.cos(perpAngle) * width / 2,
                y: wp.y - Math.sin(perpAngle) * width / 2
            });

            // Checkpoints at each waypoint
            this.checkpoints.push({ x: wp.x, y: wp.y, angle: perpAngle, width });
        }
    }

    render(ctx) {
        // Track surface
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.moveTo(this.outerBoundary[0].x, this.outerBoundary[0].y);
        for (const p of this.outerBoundary) ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.fill();

        // Inner cutout
        ctx.fillStyle = '#228822';
        ctx.beginPath();
        ctx.moveTo(this.innerBoundary[0].x, this.innerBoundary[0].y);
        for (const p of this.innerBoundary) ctx.lineTo(p.x, p.y);
        ctx.closePath();
        ctx.fill();

        // Checkpoints
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.checkpoints.length; i++) {
            const cp = this.checkpoints[i];
            const dx = Math.cos(cp.angle) * cp.width / 2;
            const dy = Math.sin(cp.angle) * cp.width / 2;
            ctx.beginPath();
            ctx.moveTo(cp.x - dx, cp.y - dy);
            ctx.lineTo(cp.x + dx, cp.y + dy);
            ctx.stroke();
        }
    }
}`;
    }
}

export const racingPhysics = RacingPhysics.getInstance();
