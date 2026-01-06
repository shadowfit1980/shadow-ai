/**
 * Dimensional Add Two Numbers
 */
import { EventEmitter } from 'events';
type ANode = { val: number; next?: ANode };
export class DimensionalAddTwoNumbers extends EventEmitter {
    private static instance: DimensionalAddTwoNumbers;
    private constructor() { super(); }
    static getInstance(): DimensionalAddTwoNumbers { if (!DimensionalAddTwoNumbers.instance) { DimensionalAddTwoNumbers.instance = new DimensionalAddTwoNumbers(); } return DimensionalAddTwoNumbers.instance; }
    addTwoNumbers(l1: ANode | null, l2: ANode | null): ANode | null { const dummy: ANode = { val: 0 }; let curr = dummy; let carry = 0; while (l1 || l2 || carry) { const sum = (l1?.val || 0) + (l2?.val || 0) + carry; carry = Math.floor(sum / 10); curr.next = { val: sum % 10 }; curr = curr.next; l1 = l1?.next || null; l2 = l2?.next || null; } return dummy.next || null; }
    addTwoNumbersII(l1: ANode | null, l2: ANode | null): ANode | null { const stack1: number[] = [], stack2: number[] = []; while (l1) { stack1.push(l1.val); l1 = l1.next || null; } while (l2) { stack2.push(l2.val); l2 = l2.next || null; } let carry = 0, head: ANode | null = null; while (stack1.length || stack2.length || carry) { const sum = (stack1.pop() || 0) + (stack2.pop() || 0) + carry; carry = Math.floor(sum / 10); const node: ANode = { val: sum % 10, next: head || undefined }; head = node; } return head; }
}
export const dimensionalAddTwoNumbers = DimensionalAddTwoNumbers.getInstance();
