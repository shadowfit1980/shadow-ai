/**
 * Oracle Vision Board
 * 
 * A visual planning system that helps developers see the future
 * of their code through visualized goals and manifestations.
 */

import { EventEmitter } from 'events';

export interface VisionBoard {
    id: string;
    name: string;
    goals: VisionGoal[];
    manifestations: Manifestation[];
    timeline: TimelineEntry[];
    energy: number;
    createdAt: Date;
}

export interface VisionGoal {
    id: string;
    title: string;
    description: string;
    category: 'feature' | 'quality' | 'performance' | 'architecture';
    priority: number;
    status: 'envisioned' | 'manifesting' | 'manifested';
    targetDate?: Date;
}

export interface Manifestation {
    goalId: string;
    progress: number;
    energyInvested: number;
    blockers: string[];
    accelerators: string[];
}

export interface TimelineEntry {
    date: Date;
    event: string;
    goalId?: string;
    impact: number;
}

export class OracleVisionBoard extends EventEmitter {
    private static instance: OracleVisionBoard;
    private boards: Map<string, VisionBoard> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): OracleVisionBoard {
        if (!OracleVisionBoard.instance) {
            OracleVisionBoard.instance = new OracleVisionBoard();
        }
        return OracleVisionBoard.instance;
    }

    createBoard(name: string): VisionBoard {
        const board: VisionBoard = {
            id: `board_${Date.now()}`,
            name,
            goals: [],
            manifestations: [],
            timeline: [],
            energy: 1.0,
            createdAt: new Date(),
        };

        this.boards.set(board.id, board);
        this.emit('board:created', board);
        return board;
    }

    addGoal(boardId: string, goal: Omit<VisionGoal, 'id' | 'status'>): VisionGoal | undefined {
        const board = this.boards.get(boardId);
        if (!board) return undefined;

        const newGoal: VisionGoal = {
            ...goal,
            id: `goal_${Date.now()}`,
            status: 'envisioned',
        };

        board.goals.push(newGoal);
        board.manifestations.push({
            goalId: newGoal.id,
            progress: 0,
            energyInvested: 0,
            blockers: [],
            accelerators: [],
        });

        board.timeline.push({
            date: new Date(),
            event: `Goal envisioned: ${newGoal.title}`,
            goalId: newGoal.id,
            impact: newGoal.priority * 0.1,
        });

        this.emit('goal:added', { board, goal: newGoal });
        return newGoal;
    }

    manifest(boardId: string, goalId: string, progress: number): Manifestation | undefined {
        const board = this.boards.get(boardId);
        if (!board) return undefined;

        const manifestation = board.manifestations.find(m => m.goalId === goalId);
        const goal = board.goals.find(g => g.id === goalId);
        if (!manifestation || !goal) return undefined;

        manifestation.progress = Math.min(1, manifestation.progress + progress);
        manifestation.energyInvested += progress * 0.2;
        board.energy = Math.max(0, board.energy - progress * 0.1);

        if (manifestation.progress >= 1) {
            goal.status = 'manifested';
            board.timeline.push({
                date: new Date(),
                event: `Goal manifested: ${goal.title}`,
                goalId,
                impact: 1,
            });
        } else if (manifestation.progress > 0) {
            goal.status = 'manifesting';
        }

        this.emit('manifestation:progress', { board, manifestation });
        return manifestation;
    }

    addBlocker(boardId: string, goalId: string, blocker: string): void {
        const board = this.boards.get(boardId);
        if (!board) return;

        const manifestation = board.manifestations.find(m => m.goalId === goalId);
        if (manifestation) {
            manifestation.blockers.push(blocker);
        }
    }

    addAccelerator(boardId: string, goalId: string, accelerator: string): void {
        const board = this.boards.get(boardId);
        if (!board) return;

        const manifestation = board.manifestations.find(m => m.goalId === goalId);
        if (manifestation) {
            manifestation.accelerators.push(accelerator);
        }
    }

    rechargeEnergy(boardId: string): void {
        const board = this.boards.get(boardId);
        if (board) {
            board.energy = Math.min(1, board.energy + 0.3);
            this.emit('energy:recharged', board);
        }
    }

    getBoard(id: string): VisionBoard | undefined {
        return this.boards.get(id);
    }

    getAllBoards(): VisionBoard[] {
        return Array.from(this.boards.values());
    }

    getStats(): { total: number; manifestedGoals: number; avgEnergy: number } {
        const boards = Array.from(this.boards.values());
        const manifestedGoals = boards.reduce(
            (s, b) => s + b.goals.filter(g => g.status === 'manifested').length, 0
        );

        return {
            total: boards.length,
            manifestedGoals,
            avgEnergy: boards.length > 0
                ? boards.reduce((s, b) => s + b.energy, 0) / boards.length
                : 0,
        };
    }
}

export const oracleVisionBoard = OracleVisionBoard.getInstance();
