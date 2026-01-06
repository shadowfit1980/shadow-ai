/**
 * Quantum Reorder List
 */
import { EventEmitter } from 'events';
type ONode = { val: number; next?: ONode };
export class QuantumReorderList extends EventEmitter {
    private static instance: QuantumReorderList;
    private constructor() { super(); }
    static getInstance(): QuantumReorderList { if (!QuantumReorderList.instance) { QuantumReorderList.instance = new QuantumReorderList(); } return QuantumReorderList.instance; }
    reorderList(head: ONode | null): void { if (!head || !head.next) return; let slow = head, fast = head; while (fast.next && fast.next.next) { slow = slow.next!; fast = fast.next.next; } let second = slow.next; slow.next = undefined; let prev: ONode | null = null; while (second) { const next = second.next; second.next = prev || undefined; prev = second; second = next; } second = prev; let first = head; while (second) { const tmp1 = first.next, tmp2 = second.next; first.next = second; second.next = tmp1; first = tmp1!; second = tmp2 || null; } }
    isPalindrome(head: ONode | null): boolean { const vals: number[] = []; while (head) { vals.push(head.val); head = head.next || null; } let left = 0, right = vals.length - 1; while (left < right) if (vals[left++] !== vals[right--]) return false; return true; }
}
export const quantumReorderList = QuantumReorderList.getInstance();
