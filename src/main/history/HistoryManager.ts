/**
 * History Manager
 * Track action history with undo/redo
 */

import { EventEmitter } from 'events';

export interface HistoryAction {
    id: string;
    type: string;
    data: any;
    timestamp: number;
    undone?: boolean;
}

/**
 * HistoryManager
 * Undo/redo action history
 */
export class HistoryManager extends EventEmitter {
    private static instance: HistoryManager;
    private actions: HistoryAction[] = [];
    private position = -1;
    private maxHistory = 100;

    private constructor() {
        super();
    }

    static getInstance(): HistoryManager {
        if (!HistoryManager.instance) {
            HistoryManager.instance = new HistoryManager();
        }
        return HistoryManager.instance;
    }

    push(type: string, data: any): HistoryAction {
        // Clear future actions if we're not at the end
        if (this.position < this.actions.length - 1) {
            this.actions = this.actions.slice(0, this.position + 1);
        }

        const action: HistoryAction = {
            id: `action_${Date.now()}`,
            type,
            data,
            timestamp: Date.now(),
        };

        this.actions.push(action);
        this.position = this.actions.length - 1;

        if (this.actions.length > this.maxHistory) {
            this.actions.shift();
            this.position--;
        }

        this.emit('pushed', action);
        return action;
    }

    undo(): HistoryAction | null {
        if (this.position < 0) return null;

        const action = this.actions[this.position];
        action.undone = true;
        this.position--;
        this.emit('undone', action);
        return action;
    }

    redo(): HistoryAction | null {
        if (this.position >= this.actions.length - 1) return null;

        this.position++;
        const action = this.actions[this.position];
        action.undone = false;
        this.emit('redone', action);
        return action;
    }

    canUndo(): boolean {
        return this.position >= 0;
    }

    canRedo(): boolean {
        return this.position < this.actions.length - 1;
    }

    getHistory(): HistoryAction[] {
        return [...this.actions];
    }

    clear(): void {
        this.actions = [];
        this.position = -1;
        this.emit('cleared');
    }

    getPosition(): number {
        return this.position;
    }
}

export function getHistoryManager(): HistoryManager {
    return HistoryManager.getInstance();
}
