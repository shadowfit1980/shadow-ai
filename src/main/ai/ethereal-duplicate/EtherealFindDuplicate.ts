/**
 * Ethereal Find Duplicate
 */
import { EventEmitter } from 'events';
export class EtherealFindDuplicate extends EventEmitter {
    private static instance: EtherealFindDuplicate;
    private constructor() { super(); }
    static getInstance(): EtherealFindDuplicate { if (!EtherealFindDuplicate.instance) { EtherealFindDuplicate.instance = new EtherealFindDuplicate(); } return EtherealFindDuplicate.instance; }
    findDuplicate(nums: number[]): number { let slow = nums[0], fast = nums[0]; do { slow = nums[slow]; fast = nums[nums[fast]]; } while (slow !== fast); slow = nums[0]; while (slow !== fast) { slow = nums[slow]; fast = nums[fast]; } return slow; }
    getStats(): { found: number } { return { found: 0 }; }
}
export const etherealFindDuplicate = EtherealFindDuplicate.getInstance();
