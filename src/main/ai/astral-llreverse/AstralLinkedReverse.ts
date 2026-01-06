/**
 * Astral Linked Reverse
 */
import { EventEmitter } from 'events';
type LNode = { val: number; next?: LNode };
export class AstralLinkedReverse extends EventEmitter {
    private static instance: AstralLinkedReverse;
    private constructor() { super(); }
    static getInstance(): AstralLinkedReverse { if (!AstralLinkedReverse.instance) { AstralLinkedReverse.instance = new AstralLinkedReverse(); } return AstralLinkedReverse.instance; }
    reverseList(head: LNode | null): LNode | null { let prev: LNode | null = null; while (head) { const next = head.next || null; head.next = prev || undefined; prev = head; head = next; } return prev; }
    reverseBetween(head: LNode | null, left: number, right: number): LNode | null { if (!head || left === right) return head; const dummy: LNode = { val: 0, next: head }; let prev = dummy; for (let i = 1; i < left; i++) prev = prev.next!; const start = prev.next!; let curr = start.next; for (let i = 0; i < right - left; i++) { start.next = curr!.next; curr!.next = prev.next; prev.next = curr; curr = start.next; } return dummy.next || null; }
    reverseKGroup(head: LNode | null, k: number): LNode | null { const count = (node: LNode | null): number => { let c = 0; while (node) { c++; node = node.next || null; } return c; }; const length = count(head); const dummy: LNode = { val: 0, next: head || undefined }; let prev = dummy; for (let i = 0; i < Math.floor(length / k); i++) { const start = prev.next!; let curr = start.next; for (let j = 1; j < k; j++) { start.next = curr!.next; curr!.next = prev.next; prev.next = curr; curr = start.next; } prev = start; } return dummy.next || null; }
}
export const astralLinkedReverse = AstralLinkedReverse.getInstance();
