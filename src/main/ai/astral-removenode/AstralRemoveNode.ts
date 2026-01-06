/**
 * Astral Remove Node
 */
import { EventEmitter } from 'events';
type NNode = { val: number; next?: NNode };
export class AstralRemoveNode extends EventEmitter {
    private static instance: AstralRemoveNode;
    private constructor() { super(); }
    static getInstance(): AstralRemoveNode { if (!AstralRemoveNode.instance) { AstralRemoveNode.instance = new AstralRemoveNode(); } return AstralRemoveNode.instance; }
    removeNthFromEnd(head: NNode | null, n: number): NNode | null { const dummy: NNode = { val: 0, next: head || undefined }; let fast: NNode | null = dummy, slow: NNode | null = dummy; for (let i = 0; i <= n; i++) fast = fast?.next || null; while (fast) { fast = fast.next || null; slow = slow?.next || null; } if (slow && slow.next) slow.next = slow.next.next; return dummy.next || null; }
    removeElements(head: NNode | null, val: number): NNode | null { const dummy: NNode = { val: -1, next: head || undefined }; let curr = dummy; while (curr.next) { if (curr.next.val === val) curr.next = curr.next.next; else curr = curr.next; } return dummy.next || null; }
    deleteNode(node: NNode): void { node.val = node.next!.val; node.next = node.next!.next; }
}
export const astralRemoveNode = AstralRemoveNode.getInstance();
