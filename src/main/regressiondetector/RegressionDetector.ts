/**
 * Regression Detector - Detect test regressions
 */
import { EventEmitter } from 'events';

export interface Regression { id: string; testId: string; testName: string; previousStatus: 'passed'; currentStatus: 'failed'; commit?: string; detectedAt: number; }

export class RegressionDetector extends EventEmitter {
    private static instance: RegressionDetector;
    private regressions: Map<string, Regression> = new Map();
    private testHistory: Map<string, { status: 'passed' | 'failed'; timestamp: number }[]> = new Map();
    private constructor() { super(); }
    static getInstance(): RegressionDetector { if (!RegressionDetector.instance) RegressionDetector.instance = new RegressionDetector(); return RegressionDetector.instance; }

    recordResult(testId: string, testName: string, status: 'passed' | 'failed', commit?: string): Regression | null {
        const history = this.testHistory.get(testId) || [];
        const lastStatus = history[history.length - 1]?.status;
        history.push({ status, timestamp: Date.now() });
        this.testHistory.set(testId, history);
        if (lastStatus === 'passed' && status === 'failed') {
            const reg: Regression = { id: `reg_${Date.now()}`, testId, testName, previousStatus: 'passed', currentStatus: 'failed', commit, detectedAt: Date.now() };
            this.regressions.set(reg.id, reg);
            this.emit('regressionDetected', reg);
            return reg;
        }
        return null;
    }

    getActive(): Regression[] { return Array.from(this.regressions.values()); }
    markFixed(id: string): boolean { return this.regressions.delete(id); }
}
export function getRegressionDetector(): RegressionDetector { return RegressionDetector.getInstance(); }
