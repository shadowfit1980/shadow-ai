/**
 * Mystic Collision
 */
import { EventEmitter } from 'events';
export class MysticCollision extends EventEmitter {
    private static instance: MysticCollision;
    private constructor() { super(); }
    static getInstance(): MysticCollision { if (!MysticCollision.instance) { MysticCollision.instance = new MysticCollision(); } return MysticCollision.instance; }
    pointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean { return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh; }
    pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean { return (px - cx) ** 2 + (py - cy) ** 2 <= r ** 2; }
    rectIntersect(r1x: number, r1y: number, r1w: number, r1h: number, r2x: number, r2y: number, r2w: number, r2h: number): boolean { return r1x < r2x + r2w && r1x + r1w > r2x && r1y < r2y + r2h && r1y + r1h > r2y; }
    circleIntersect(c1x: number, c1y: number, r1: number, c2x: number, c2y: number, r2: number): boolean { return (c1x - c2x) ** 2 + (c1y - c2y) ** 2 <= (r1 + r2) ** 2; }
    getStats(): { checked: number } { return { checked: 0 }; }
}
export const mysticCollision = MysticCollision.getInstance();
