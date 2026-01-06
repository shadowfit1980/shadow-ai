/**
 * Mystic Linked List Cycle
 */
import { EventEmitter } from 'events';
type ListNode = { val: number; next?: ListNode };
export class MysticLinkedListCycle extends EventEmitter {
    private static instance: MysticLinkedListCycle;
    private constructor() { super(); }
    static getInstance(): MysticLinkedListCycle { if (!MysticLinkedListCycle.instance) { MysticLinkedListCycle.instance = new MysticLinkedListCycle(); } return MysticLinkedListCycle.instance; }
    hasCycle(head: ListNode | null): boolean { let slow = head, fast = head; while (fast && fast.next) { slow = slow!.next || null; fast = fast.next.next || null; if (slow === fast) return true; } return false; }
    detectCycle(head: ListNode | null): ListNode | null { let slow = head, fast = head; while (fast && fast.next) { slow = slow!.next || null; fast = fast.next.next || null; if (slow === fast) { slow = head; while (slow !== fast) { slow = slow!.next || null; fast = fast!.next || null; } return slow; } } return null; }
    getIntersectionNode(headA: ListNode | null, headB: ListNode | null): ListNode | null { let a = headA, b = headB; while (a !== b) { a = a ? a.next || null : headB; b = b ? b.next || null : headA; } return a; }
}
export const mysticLinkedListCycle = MysticLinkedListCycle.getInstance();
