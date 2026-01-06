/**
 * Cosmic Deep Copy List
 */
import { EventEmitter } from 'events';
type CNode = { val: number; next?: CNode; random?: CNode };
export class CosmicDeepCopyList extends EventEmitter {
    private static instance: CosmicDeepCopyList;
    private constructor() { super(); }
    static getInstance(): CosmicDeepCopyList { if (!CosmicDeepCopyList.instance) { CosmicDeepCopyList.instance = new CosmicDeepCopyList(); } return CosmicDeepCopyList.instance; }
    copyRandomList(head: CNode | null): CNode | null { if (!head) return null; let curr: CNode | null = head; while (curr) { const copy: CNode = { val: curr.val, next: curr.next }; curr.next = copy; curr = copy.next || null; } curr = head; while (curr) { if (curr.random) curr.next!.random = curr.random.next; curr = curr.next?.next || null; } const dummy: CNode = { val: 0 }; let copyTail = dummy; curr = head; while (curr) { copyTail.next = curr.next; copyTail = copyTail.next!; curr.next = curr.next?.next; curr = curr.next || null; } return dummy.next || null; }
}
export const cosmicDeepCopyList = CosmicDeepCopyList.getInstance();
