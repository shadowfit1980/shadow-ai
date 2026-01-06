/**
 * Goal Decomposer - Break goals into tasks
 */
import { EventEmitter } from 'events';

export interface Goal { id: string; description: string; subgoals: { id: string; description: string; status: 'pending' | 'active' | 'complete' }[]; status: 'planning' | 'executing' | 'complete'; }

export class GoalDecomposer extends EventEmitter {
    private static instance: GoalDecomposer;
    private goals: Map<string, Goal> = new Map();
    private constructor() { super(); }
    static getInstance(): GoalDecomposer { if (!GoalDecomposer.instance) GoalDecomposer.instance = new GoalDecomposer(); return GoalDecomposer.instance; }

    create(description: string): Goal {
        const goal: Goal = { id: `goal_${Date.now()}`, description, subgoals: [], status: 'planning' };
        this.goals.set(goal.id, goal); this.emit('created', goal); return goal;
    }

    decompose(goalId: string, subgoals: string[]): boolean { const g = this.goals.get(goalId); if (!g) return false; g.subgoals = subgoals.map((d, i) => ({ id: `sub_${Date.now()}_${i}`, description: d, status: 'pending' })); g.status = 'executing'; return true; }
    completeSubgoal(goalId: string, subgoalId: string): boolean { const g = this.goals.get(goalId); if (!g) return false; const s = g.subgoals.find(s => s.id === subgoalId); if (!s) return false; s.status = 'complete'; if (g.subgoals.every(s => s.status === 'complete')) g.status = 'complete'; return true; }
    get(goalId: string): Goal | null { return this.goals.get(goalId) || null; }
    getActive(): Goal[] { return Array.from(this.goals.values()).filter(g => g.status === 'executing'); }
}
export function getGoalDecomposer(): GoalDecomposer { return GoalDecomposer.getInstance(); }
