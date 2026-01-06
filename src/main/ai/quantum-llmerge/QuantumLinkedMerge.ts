/**
 * Quantum Linked Merge
 */
import { EventEmitter } from 'events';
type MNode = { val: number; next?: MNode };
export class QuantumLinkedMerge extends EventEmitter {
    private static instance: QuantumLinkedMerge;
    private constructor() { super(); }
    static getInstance(): QuantumLinkedMerge { if (!QuantumLinkedMerge.instance) { QuantumLinkedMerge.instance = new QuantumLinkedMerge(); } return QuantumLinkedMerge.instance; }
    mergeTwoLists(l1: MNode | null, l2: MNode | null): MNode | null { const dummy: MNode = { val: 0 }; let curr = dummy; while (l1 && l2) { if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next || null; } else { curr.next = l2; l2 = l2.next || null; } curr = curr.next; } curr.next = l1 || l2 || undefined; return dummy.next || null; }
    mergeKLists(lists: (MNode | null)[]): MNode | null { if (lists.length === 0) return null; const mergeTwoLists = this.mergeTwoLists.bind(this); while (lists.length > 1) { const merged: (MNode | null)[] = []; for (let i = 0; i < lists.length; i += 2) { merged.push(i + 1 < lists.length ? mergeTwoLists(lists[i], lists[i + 1]) : lists[i]); } lists = merged; } return lists[0]; }
    sortList(head: MNode | null): MNode | null { if (!head || !head.next) return head; let slow = head, fast = head.next; while (fast && fast.next) { slow = slow.next!; fast = fast.next.next!; } const mid = slow.next!; slow.next = undefined; return this.mergeTwoLists(this.sortList(head), this.sortList(mid)); }
}
export const quantumLinkedMerge = QuantumLinkedMerge.getInstance();
