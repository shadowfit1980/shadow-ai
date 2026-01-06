/**
 * Conversation Tree - Branching conversations
 */
import { EventEmitter } from 'events';

export interface ConversationNode { id: string; parentId?: string; role: 'user' | 'assistant'; content: string; children: string[]; timestamp: number; }
export interface ConversationBranch { id: string; name: string; nodes: Map<string, ConversationNode>; rootId: string; }

export class ConversationTree extends EventEmitter {
    private static instance: ConversationTree;
    private branches: Map<string, ConversationBranch> = new Map();
    private activeId?: string;
    private constructor() { super(); }
    static getInstance(): ConversationTree { if (!ConversationTree.instance) ConversationTree.instance = new ConversationTree(); return ConversationTree.instance; }

    createBranch(name: string): ConversationBranch {
        const rootNode: ConversationNode = { id: `node_${Date.now()}`, role: 'assistant', content: 'Conversation started', children: [], timestamp: Date.now() };
        const branch: ConversationBranch = { id: `branch_${Date.now()}`, name, nodes: new Map([[rootNode.id, rootNode]]), rootId: rootNode.id };
        this.branches.set(branch.id, branch);
        this.activeId = branch.id;
        return branch;
    }

    addMessage(branchId: string, parentId: string, role: ConversationNode['role'], content: string): ConversationNode | null {
        const branch = this.branches.get(branchId); if (!branch) return null;
        const parent = branch.nodes.get(parentId); if (!parent) return null;
        const node: ConversationNode = { id: `node_${Date.now()}`, parentId, role, content, children: [], timestamp: Date.now() };
        parent.children.push(node.id);
        branch.nodes.set(node.id, node);
        this.emit('added', node);
        return node;
    }

    fork(branchId: string, nodeId: string, newBranchName: string): ConversationBranch | null { const branch = this.branches.get(branchId); if (!branch) return null; return this.createBranch(newBranchName); }
    getActive(): ConversationBranch | null { return this.activeId ? this.branches.get(this.activeId) || null : null; }
    getAll(): ConversationBranch[] { return Array.from(this.branches.values()); }
}
export function getConversationTree(): ConversationTree { return ConversationTree.getInstance(); }
