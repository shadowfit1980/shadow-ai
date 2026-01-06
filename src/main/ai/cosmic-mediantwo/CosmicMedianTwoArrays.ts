/**
 * Cosmic Median Two Sorted Arrays
 */
import { EventEmitter } from 'events';
export class CosmicMedianTwoArrays extends EventEmitter {
    private static instance: CosmicMedianTwoArrays;
    private constructor() { super(); }
    static getInstance(): CosmicMedianTwoArrays { if (!CosmicMedianTwoArrays.instance) { CosmicMedianTwoArrays.instance = new CosmicMedianTwoArrays(); } return CosmicMedianTwoArrays.instance; }
    findMedianSortedArrays(nums1: number[], nums2: number[]): number { if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1]; const m = nums1.length, n = nums2.length; let lo = 0, hi = m; while (lo <= hi) { const i = Math.floor((lo + hi) / 2); const j = Math.floor((m + n + 1) / 2) - i; const maxLeft1 = i === 0 ? -Infinity : nums1[i - 1]; const minRight1 = i === m ? Infinity : nums1[i]; const maxLeft2 = j === 0 ? -Infinity : nums2[j - 1]; const minRight2 = j === n ? Infinity : nums2[j]; if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) { if ((m + n) % 2 === 0) return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2; return Math.max(maxLeft1, maxLeft2); } if (maxLeft1 > minRight2) hi = i - 1; else lo = i + 1; } return 0; }
    findKthElement(nums1: number[], nums2: number[], k: number): number { const m = nums1.length, n = nums2.length; if (m > n) return this.findKthElement(nums2, nums1, k); if (m === 0) return nums2[k - 1]; if (k === 1) return Math.min(nums1[0], nums2[0]); const i = Math.min(m, Math.floor(k / 2)); const j = Math.min(n, Math.floor(k / 2)); if (nums1[i - 1] < nums2[j - 1]) return this.findKthElement(nums1.slice(i), nums2, k - i); return this.findKthElement(nums1, nums2.slice(j), k - j); }
}
export const cosmicMedianTwoArrays = CosmicMedianTwoArrays.getInstance();
