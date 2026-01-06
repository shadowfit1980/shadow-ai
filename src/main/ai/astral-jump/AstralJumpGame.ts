/**
 * Astral Jump Game
 */
import { EventEmitter } from 'events';
export class AstralJumpGame extends EventEmitter {
    private static instance: AstralJumpGame;
    private constructor() { super(); }
    static getInstance(): AstralJumpGame { if (!AstralJumpGame.instance) { AstralJumpGame.instance = new AstralJumpGame(); } return AstralJumpGame.instance; }
    canJump(nums: number[]): boolean { let maxReach = 0; for (let i = 0; i < nums.length; i++) { if (i > maxReach) return false; maxReach = Math.max(maxReach, i + nums[i]); } return true; }
    getStats(): { games: number } { return { games: 0 }; }
}
export const astralJumpGame = AstralJumpGame.getInstance();
