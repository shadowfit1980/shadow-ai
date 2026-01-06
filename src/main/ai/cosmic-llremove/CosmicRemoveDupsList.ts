/**
 * Cosmic Remove Duplicates List
 */
import { EventEmitter } from 'events';
type DNode = { val: number; next?: DNode };
export class CosmicRemoveDupsList extends EventEmitter {
    private static instance: CosmicRemoveDupsList;
    private constructor() { super(); }
    static getInstance(): CosmicRemoveDupsList { if (!CosmicRemoveDupsList.instance) { CosmicRemoveDupsList.instance = new CosmicRemoveDupsList(); } return CosmicRemoveDupsList.instance; }
    deleteDuplicates(head: DNode | null): DNode | null { let curr = head; while (curr && curr.next) { if (curr.val === curr.next.val) curr.next = curr.next.next; else curr = curr.next; } return head; }
    deleteDuplicatesII(head: DNode | null): DNode | null { const dummy: DNode = { val: -Infinity, next: head || undefined }; let prev = dummy; while (head) { if (head.next && head.val === head.next.val) { while (head.next && head.val === head.next.val) head = head.next; prev.next = head.next; } else { prev = prev.next!; } head = head.next || null; } return dummy.next || null; }
    partition(head: DNode | null, x: number): DNode | null { const before: DNode = { val: 0 }; const after: DNode = { val: 0 }; let beforePtr = before, afterPtr = after; while (head) { if (head.val < x) { beforePtr.next = head; beforePtr = beforePtr.next; } else { afterPtr.next = head; afterPtr = afterPtr.next; } head = head.next || null; } afterPtr.next = undefined; beforePtr.next = after.next; return before.next || null; }
}
export const cosmicRemoveDupsList = CosmicRemoveDupsList.getInstance();
