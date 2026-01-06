/**
 * Dimensional Aho Corasick
 */
import { EventEmitter } from 'events';
class ACNode { children: Map<string, ACNode> = new Map(); fail: ACNode | null = null; output: string[] = []; }
export class DimensionalAhoCorasick extends EventEmitter {
    private root: ACNode = new ACNode();
    addPattern(pattern: string): void { let node = this.root; for (const c of pattern) { if (!node.children.has(c)) node.children.set(c, new ACNode()); node = node.children.get(c)!; } node.output.push(pattern); }
    build(): void { const queue: ACNode[] = []; for (const [, child] of this.root.children) { child.fail = this.root; queue.push(child); } while (queue.length) { const curr = queue.shift()!; for (const [c, child] of curr.children) { queue.push(child); let fail = curr.fail; while (fail && !fail.children.has(c)) fail = fail.fail; child.fail = fail?.children.get(c) || this.root; child.output = [...child.output, ...child.fail.output]; } } }
    search(text: string): { pattern: string; index: number }[] { const results: { pattern: string; index: number }[] = []; let node = this.root; for (let i = 0; i < text.length; i++) { while (node && !node.children.has(text[i])) node = node.fail!; if (!node) { node = this.root; continue; } node = node.children.get(text[i])!; for (const pattern of node.output) results.push({ pattern, index: i - pattern.length + 1 }); } return results; }
}
export const createAhoCorasick = () => new DimensionalAhoCorasick();
