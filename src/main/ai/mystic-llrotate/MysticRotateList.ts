/**
 * Mystic Rotate List
 */
import { EventEmitter } from 'events';
type RNode = { val: number; next?: RNode };
export class MysticRotateList extends EventEmitter {
    private static instance: MysticRotateList;
    private constructor() { super(); }
    static getInstance(): MysticRotateList { if (!MysticRotateList.instance) { MysticRotateList.instance = new MysticRotateList(); } return MysticRotateList.instance; }
    rotateRight(head: RNode | null, k: number): RNode | null { if (!head || !head.next || k === 0) return head; let len = 1, tail = head; while (tail.next) { len++; tail = tail.next; } k %= len; if (k === 0) return head; tail.next = head; for (let i = 0; i < len - k; i++) tail = tail.next!; head = tail.next!; tail.next = undefined; return head; }
    swapPairs(head: RNode | null): RNode | null { const dummy: RNode = { val: 0, next: head || undefined }; let prev = dummy; while (prev.next && prev.next.next) { const first = prev.next; const second = prev.next.next; first.next = second.next; second.next = first; prev.next = second; prev = first; } return dummy.next || null; }
}
export const mysticRotateList = MysticRotateList.getInstance();
