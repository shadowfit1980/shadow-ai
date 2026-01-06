/**
 * 📍 Waypoint System
 * 
 * Path and patrol management:
 * - Waypoint chains
 * - Patrol routes
 * - Path following
 */

import { EventEmitter } from 'events';

export interface Waypoint {
    id: string;
    x: number;
    y: number;
    waitTime?: number;
    action?: string;
}

export interface WaypointPath {
    id: string;
    waypoints: Waypoint[];
    loop: boolean;
}

export class WaypointSystem extends EventEmitter {
    private static instance: WaypointSystem;

    private constructor() { super(); }

    static getInstance(): WaypointSystem {
        if (!WaypointSystem.instance) {
            WaypointSystem.instance = new WaypointSystem();
        }
        return WaypointSystem.instance;
    }

    generateWaypointCode(): string {
        return `
class WaypointSystem {
    constructor() {
        this.paths = new Map();
        this.entities = new Map();
    }

    // Create path
    createPath(id, waypoints, loop = true) {
        this.paths.set(id, {
            id,
            waypoints: waypoints.map((wp, i) => ({
                id: wp.id || \`wp_\${i}\`,
                x: wp.x,
                y: wp.y,
                waitTime: wp.waitTime || 0,
                action: wp.action || null
            })),
            loop
        });
    }

    // Get path
    getPath(id) {
        return this.paths.get(id);
    }

    // Assign entity to path
    assignToPath(entityId, pathId, startIndex = 0) {
        const path = this.paths.get(pathId);
        if (!path) return false;

        this.entities.set(entityId, {
            pathId,
            currentIndex: startIndex,
            waiting: false,
            waitTimer: 0,
            speed: 100,
            reachedEnd: false
        });

        return true;
    }

    // Remove entity from pathing
    removeFromPath(entityId) {
        this.entities.delete(entityId);
    }

    // Set entity speed
    setSpeed(entityId, speed) {
        const data = this.entities.get(entityId);
        if (data) data.speed = speed;
    }

    // Get current target waypoint
    getCurrentTarget(entityId) {
        const data = this.entities.get(entityId);
        if (!data) return null;

        const path = this.paths.get(data.pathId);
        if (!path) return null;

        return path.waypoints[data.currentIndex];
    }

    // Update entity toward waypoint
    update(entityId, entity, dt) {
        const data = this.entities.get(entityId);
        if (!data || data.reachedEnd) return { moving: false };

        const path = this.paths.get(data.pathId);
        if (!path) return { moving: false };

        const target = path.waypoints[data.currentIndex];
        if (!target) return { moving: false };

        // Handle waiting
        if (data.waiting) {
            data.waitTimer -= dt;
            if (data.waitTimer <= 0) {
                data.waiting = false;
                this.advanceWaypoint(data, path);
            }
            return { moving: false, waiting: true };
        }

        // Move toward target
        const dx = target.x - entity.x;
        const dy = target.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
            // Reached waypoint
            this.onWaypointReached?.(entityId, target);

            if (target.action) {
                this.onAction?.(entityId, target.action);
            }

            if (target.waitTime > 0) {
                data.waiting = true;
                data.waitTimer = target.waitTime;
                return { moving: false, waiting: true, reachedWaypoint: true };
            }

            this.advanceWaypoint(data, path);
            return { moving: false, reachedWaypoint: true };
        }

        // Calculate movement
        const moveX = (dx / dist) * data.speed * dt;
        const moveY = (dy / dist) * data.speed * dt;

        return {
            moving: true,
            moveX,
            moveY,
            angle: Math.atan2(dy, dx)
        };
    }

    advanceWaypoint(data, path) {
        data.currentIndex++;

        if (data.currentIndex >= path.waypoints.length) {
            if (path.loop) {
                data.currentIndex = 0;
            } else {
                data.reachedEnd = true;
                this.onPathComplete?.(data.pathId);
            }
        }
    }

    // Reverse direction
    reverse(entityId) {
        const data = this.entities.get(entityId);
        if (!data) return;

        const path = this.paths.get(data.pathId);
        if (!path) return;

        path.waypoints.reverse();
        data.currentIndex = path.waypoints.length - 1 - data.currentIndex;
    }

    // Draw path for debugging
    drawPath(ctx, pathId, color = '#ffff00') {
        const path = this.paths.get(pathId);
        if (!path || path.waypoints.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        path.waypoints.forEach((wp, i) => {
            if (i === 0) ctx.moveTo(wp.x, wp.y);
            else ctx.lineTo(wp.x, wp.y);
        });

        if (path.loop) {
            ctx.lineTo(path.waypoints[0].x, path.waypoints[0].y);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Draw waypoint markers
        path.waypoints.forEach((wp, i) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), wp.x, wp.y);
        });
    }

    // Callbacks
    onWaypointReached = null;
    onAction = null;
    onPathComplete = null;
}`;
    }
}

export const waypointSystem = WaypointSystem.getInstance();
