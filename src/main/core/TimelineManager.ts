/**
 * ⏱️ TimelineManager - Non-Linear Undo/Redo System
 * 
 * Claude's Recommendation: Like Figma - every edit is a branch in time
 * User can fork the timeline at any point
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// Types
export interface TimelineNode {
    id: string;
    parentId: string | null;
    timestamp: Date;
    action: TimelineAction;
    state: StateSnapshot;
    branch: string;
    metadata: ActionMetadata;
}

export interface TimelineAction {
    type: 'edit' | 'ai_generation' | 'refactor' | 'create' | 'delete' | 'rename' | 'move';
    target: string; // file path or identifier
    description: string;
    diff?: string;
    beforeContent?: string;
    afterContent?: string;
}

export interface StateSnapshot {
    files: Map<string, string>; // path -> content hash
    cursor?: CursorPosition;
    selection?: Selection;
    openTabs?: string[];
}

export interface CursorPosition {
    file: string;
    line: number;
    column: number;
}

export interface Selection {
    file: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export interface ActionMetadata {
    source: 'user' | 'ai' | 'auto';
    model?: string;
    confidence?: number;
    duration?: number;
}

export interface TimelineBranch {
    name: string;
    headNodeId: string;
    createdAt: Date;
    description?: string;
}

export interface TimelineView {
    nodes: TimelineNode[];
    branches: TimelineBranch[];
    currentNodeId: string;
    currentBranch: string;
}

export class TimelineManager extends EventEmitter {
    private static instance: TimelineManager;
    private nodes: Map<string, TimelineNode> = new Map();
    private branches: Map<string, TimelineBranch> = new Map();
    private currentNodeId: string | null = null;
    private currentBranch = 'main';
    private maxNodes = 10000; // Limit timeline size

    private constructor() {
        super();
        this.initializeMainBranch();
    }

    static getInstance(): TimelineManager {
        if (!TimelineManager.instance) {
            TimelineManager.instance = new TimelineManager();
        }
        return TimelineManager.instance;
    }

    private initializeMainBranch(): void {
        const rootNode: TimelineNode = {
            id: this.generateId(),
            parentId: null,
            timestamp: new Date(),
            action: {
                type: 'create',
                target: 'root',
                description: 'Timeline initialized'
            },
            state: { files: new Map() },
            branch: 'main',
            metadata: { source: 'auto' }
        };

        this.nodes.set(rootNode.id, rootNode);
        this.currentNodeId = rootNode.id;

        this.branches.set('main', {
            name: 'main',
            headNodeId: rootNode.id,
            createdAt: new Date(),
            description: 'Main timeline'
        });
    }

    /**
     * Record an action in the timeline
     */
    record(action: TimelineAction, metadata: ActionMetadata = { source: 'user' }): TimelineNode {
        const node: TimelineNode = {
            id: this.generateId(),
            parentId: this.currentNodeId,
            timestamp: new Date(),
            action,
            state: this.captureState(),
            branch: this.currentBranch,
            metadata
        };

        this.nodes.set(node.id, node);
        this.currentNodeId = node.id;

        // Update branch head
        const branch = this.branches.get(this.currentBranch);
        if (branch) {
            branch.headNodeId = node.id;
        }

        // Cleanup old nodes if limit exceeded
        this.cleanupOldNodes();

        this.emit('timeline:record', { node });
        return node;
    }

    /**
     * Undo to a specific point
     */
    goto(nodeId: string): TimelineNode | null {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        const previousNodeId = this.currentNodeId;
        this.currentNodeId = nodeId;
        this.currentBranch = node.branch;

        this.emit('timeline:goto', {
            from: previousNodeId,
            to: nodeId,
            node
        });

        return node;
    }

    /**
     * Undo one step
     */
    undo(): TimelineNode | null {
        const current = this.nodes.get(this.currentNodeId!);
        if (!current || !current.parentId) return null;

        return this.goto(current.parentId);
    }

    /**
     * Redo (find child on current branch)
     */
    redo(): TimelineNode | null {
        const children = this.getChildren(this.currentNodeId!);
        const sameBranchChild = children.find(c => c.branch === this.currentBranch);

        if (sameBranchChild) {
            return this.goto(sameBranchChild.id);
        }

        return null;
    }

    /**
     * Fork the timeline at the current point
     */
    fork(branchName: string, description?: string): TimelineBranch {
        if (this.branches.has(branchName)) {
            throw new Error(`Branch ${branchName} already exists`);
        }

        const branch: TimelineBranch = {
            name: branchName,
            headNodeId: this.currentNodeId!,
            createdAt: new Date(),
            description
        };

        this.branches.set(branchName, branch);
        this.currentBranch = branchName;

        this.emit('timeline:fork', { branch });
        return branch;
    }

    /**
     * Switch to a branch
     */
    switchBranch(branchName: string): TimelineNode | null {
        const branch = this.branches.get(branchName);
        if (!branch) return null;

        this.currentBranch = branchName;
        return this.goto(branch.headNodeId);
    }

    /**
     * Merge a branch into current
     */
    merge(sourceBranch: string): TimelineNode {
        const source = this.branches.get(sourceBranch);
        if (!source) {
            throw new Error(`Branch ${sourceBranch} not found`);
        }

        const mergeNode = this.record({
            type: 'edit',
            target: 'merge',
            description: `Merged branch ${sourceBranch} into ${this.currentBranch}`
        }, { source: 'auto' });

        this.emit('timeline:merge', {
            source: sourceBranch,
            target: this.currentBranch,
            node: mergeNode
        });

        return mergeNode;
    }

    /**
     * Get children of a node
     */
    private getChildren(nodeId: string): TimelineNode[] {
        return Array.from(this.nodes.values())
            .filter(n => n.parentId === nodeId);
    }

    /**
     * Get the full path from root to a node
     */
    getPath(nodeId: string): TimelineNode[] {
        const path: TimelineNode[] = [];
        let current = this.nodes.get(nodeId);

        while (current) {
            path.unshift(current);
            current = current.parentId ? this.nodes.get(current.parentId) : undefined;
        }

        return path;
    }

    /**
     * Get timeline view (for UI)
     */
    getView(): TimelineView {
        return {
            nodes: Array.from(this.nodes.values())
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
            branches: Array.from(this.branches.values()),
            currentNodeId: this.currentNodeId!,
            currentBranch: this.currentBranch
        };
    }

    /**
     * Get recent history for current branch
     */
    getRecentHistory(limit = 50): TimelineNode[] {
        return this.getPath(this.currentNodeId!)
            .slice(-limit);
    }

    /**
     * Search timeline
     */
    search(query: string): TimelineNode[] {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.nodes.values())
            .filter(n =>
                n.action.description.toLowerCase().includes(lowerQuery) ||
                n.action.target.toLowerCase().includes(lowerQuery)
            );
    }

    /**
     * Get node by ID
     */
    getNode(nodeId: string): TimelineNode | undefined {
        return this.nodes.get(nodeId);
    }

    /**
     * Get current node
     */
    getCurrentNode(): TimelineNode | undefined {
        return this.currentNodeId ? this.nodes.get(this.currentNodeId) : undefined;
    }

    /**
     * Capture current state snapshot
     */
    private captureState(): StateSnapshot {
        // In real implementation, this would capture actual file states
        return {
            files: new Map(),
            openTabs: []
        };
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Cleanup old nodes to stay within limit
     */
    private cleanupOldNodes(): void {
        if (this.nodes.size <= this.maxNodes) return;

        // Get all nodes sorted by timestamp
        const sorted = Array.from(this.nodes.values())
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Keep nodes on the path to current
        const currentPath = new Set(this.getPath(this.currentNodeId!).map(n => n.id));

        // Keep branch heads
        const branchHeads = new Set(
            Array.from(this.branches.values()).map(b => b.headNodeId)
        );

        // Remove oldest nodes not in critical paths
        const toRemove = sorted
            .filter(n => !currentPath.has(n.id) && !branchHeads.has(n.id))
            .slice(0, this.nodes.size - this.maxNodes);

        toRemove.forEach(n => this.nodes.delete(n.id));
    }

    /**
     * Export timeline for persistence
     */
    export(): string {
        return JSON.stringify({
            nodes: Array.from(this.nodes.entries()),
            branches: Array.from(this.branches.entries()),
            currentNodeId: this.currentNodeId,
            currentBranch: this.currentBranch
        });
    }

    /**
     * Import timeline from persistence
     */
    import(data: string): void {
        const parsed = JSON.parse(data);
        this.nodes = new Map(parsed.nodes);
        this.branches = new Map(parsed.branches);
        this.currentNodeId = parsed.currentNodeId;
        this.currentBranch = parsed.currentBranch;
    }
}

export const timelineManager = TimelineManager.getInstance();
