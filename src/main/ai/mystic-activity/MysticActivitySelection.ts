/**
 * Mystic Activity Selection
 */
import { EventEmitter } from 'events';
export interface Activity { id: number; start: number; end: number; weight?: number; }
export class MysticActivitySelection extends EventEmitter {
    private static instance: MysticActivitySelection;
    private constructor() { super(); }
    static getInstance(): MysticActivitySelection { if (!MysticActivitySelection.instance) { MysticActivitySelection.instance = new MysticActivitySelection(); } return MysticActivitySelection.instance; }
    maxActivities(activities: Activity[]): Activity[] { const sorted = [...activities].sort((a, b) => a.end - b.end); const result: Activity[] = []; let lastEnd = -Infinity; for (const act of sorted) { if (act.start >= lastEnd) { result.push(act); lastEnd = act.end; } } return result; }
    weightedActivitySelection(activities: Activity[]): { activities: Activity[]; totalWeight: number } { const sorted = [...activities].sort((a, b) => a.end - b.end); const n = sorted.length; const dp = new Array(n).fill(0); const prev = new Array(n).fill(-1); for (let i = 0; i < n; i++) { for (let j = i - 1; j >= 0; j--) { if (sorted[j].end <= sorted[i].start) { prev[i] = j; break; } } } for (let i = 0; i < n; i++) { const weight = sorted[i].weight || 1; const include = weight + (prev[i] >= 0 ? dp[prev[i]] : 0); const exclude = i > 0 ? dp[i - 1] : 0; dp[i] = Math.max(include, exclude); } const result: Activity[] = []; let i = n - 1; while (i >= 0) { const weight = sorted[i].weight || 1; const include = weight + (prev[i] >= 0 ? dp[prev[i]] : 0); const exclude = i > 0 ? dp[i - 1] : 0; if (include > exclude) { result.unshift(sorted[i]); i = prev[i]; } else { i--; } } return { activities: result, totalWeight: dp[n - 1] }; }
}
export const mysticActivitySelection = MysticActivitySelection.getInstance();
