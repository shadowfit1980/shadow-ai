/**
 * React Hooks for Kimi K2 Enhancement APIs
 * 
 * Provides easy-to-use hooks for:
 * - Evolution Agent
 * - Agent Collaboration
 * - Self-Healing
 * - What-If Simulator
 * - Predictive Development
 * - Developer DNA
 * - Analytics
 */

import { useState, useCallback } from 'react';

// Type definitions
interface EvolutionReport {
    timestamp: number;
    dependencyUpdates: any[];
    technicalDebt: any[];
    healthScore: number;
}

interface HealingResult {
    issuesFound: number;
    issuesFixed: number;
    issuesFailed: number;
    fixes: any[];
    duration: number;
}

interface BurnoutIndicator {
    level: 'normal' | 'elevated' | 'high';
    indicators: string[];
    recommendations: string[];
}

interface DevelopmentMetrics {
    codingVelocity: number;
    bugIntroductionRate: number;
    reviewTurnaroundTime: number;
    testCoverage: number;
    codeComplexity: number;
    documentationCoverage: number;
}

// ============================================================================
// EVOLUTION HOOK
// ============================================================================

export function useEvolution() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<EvolutionReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await (window as any).shadowAPI.evolution.generateReport();
            setReport(result);
            return result;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const checkDependencies = useCallback(async () => {
        return await (window as any).shadowAPI.evolution.checkDependencies();
    }, []);

    const analyzeTechDebt = useCallback(async () => {
        return await (window as any).shadowAPI.evolution.analyzeTechnicalDebt();
    }, []);

    const applySecurityPatches = useCallback(async () => {
        return await (window as any).shadowAPI.evolution.applySecurityPatches();
    }, []);

    return {
        loading,
        report,
        error,
        generateReport,
        checkDependencies,
        analyzeTechDebt,
        applySecurityPatches,
    };
}

// ============================================================================
// AGENT COLLABORATION HOOK
// ============================================================================

export function useAgentCollaboration() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const parallelExecute = useCallback(async (agentIds: string[], task: any) => {
        setLoading(true);
        try {
            const res = await (window as any).shadowAPI.agentCollaboration.parallelExecute(agentIds, task);
            setResult(res);
            return res;
        } finally {
            setLoading(false);
        }
    }, []);

    const debate = useCallback(async (topic: string, agentIds: string[], context?: any) => {
        setLoading(true);
        try {
            const res = await (window as any).shadowAPI.agentCollaboration.debate(topic, agentIds, context);
            setResult(res);
            return res;
        } finally {
            setLoading(false);
        }
    }, []);

    const getStats = useCallback(async () => {
        return await (window as any).shadowAPI.agentCollaboration.getStats();
    }, []);

    return { loading, result, parallelExecute, debate, getStats };
}

// ============================================================================
// SELF-HEALING HOOK
// ============================================================================

export function useSelfHealing() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HealingResult | null>(null);

    const runFull = useCallback(async () => {
        setLoading(true);
        try {
            const res = await (window as any).shadowAPI.selfHealing.runFull();
            setResult(res);
            return res;
        } finally {
            setLoading(false);
        }
    }, []);

    const autoFixLint = useCallback(async () => {
        return await (window as any).shadowAPI.selfHealing.autoFixLint();
    }, []);

    const diagnoseBuild = useCallback(async () => {
        return await (window as any).shadowAPI.selfHealing.diagnoseBuild();
    }, []);

    const resolveDependencies = useCallback(async () => {
        return await (window as any).shadowAPI.selfHealing.resolveDependencies();
    }, []);

    return { loading, result, runFull, autoFixLint, diagnoseBuild, resolveDependencies };
}

// ============================================================================
// WHAT-IF SIMULATOR HOOK
// ============================================================================

export function useWhatIfSimulator() {
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState<any>(null);

    const simulateRefactoring = useCallback(async (refactor: any) => {
        setLoading(true);
        try {
            const res = await (window as any).shadowAPI.whatif.simulateRefactoring(refactor);
            setSimulation(res);
            return res;
        } finally {
            setLoading(false);
        }
    }, []);

    const simulateDependencyUpgrade = useCallback(async (dep: any) => {
        setLoading(true);
        try {
            const res = await (window as any).shadowAPI.whatif.simulateDependencyUpgrade(dep);
            setSimulation(res);
            return res;
        } finally {
            setLoading(false);
        }
    }, []);

    const compareImplementations = useCallback(async (implA: any, implB: any) => {
        return await (window as any).shadowAPI.whatif.compareImplementations(implA, implB);
    }, []);

    return { loading, simulation, simulateRefactoring, simulateDependencyUpgrade, compareImplementations };
}

// ============================================================================
// PREDICTIVE DEVELOPMENT HOOK
// ============================================================================

export function usePredictive() {
    const [burnout, setBurnout] = useState<BurnoutIndicator | null>(null);
    const [nextFiles, setNextFiles] = useState<string[]>([]);

    const detectBurnout = useCallback(async () => {
        const res = await (window as any).shadowAPI.predictive.detectBurnout();
        setBurnout(res);
        return res;
    }, []);

    const predictNextFiles = useCallback(async (currentFile: string) => {
        const res = await (window as any).shadowAPI.predictive.nextFiles(currentFile);
        setNextFiles(res);
        return res;
    }, []);

    const estimateTime = useCallback(async (task: any) => {
        return await (window as any).shadowAPI.predictive.estimateTime(task);
    }, []);

    const identifyBlockers = useCallback(async (context: any) => {
        return await (window as any).shadowAPI.predictive.identifyBlockers(context);
    }, []);

    const suggestRefactoring = useCallback(async () => {
        return await (window as any).shadowAPI.predictive.suggestRefactoring();
    }, []);

    return { burnout, nextFiles, detectBurnout, predictNextFiles, estimateTime, identifyBlockers, suggestRefactoring };
}

// ============================================================================
// DEVELOPER DNA HOOK
// ============================================================================

export function useDeveloperDNA(developerId: string) {
    const [profile, setProfile] = useState<any>(null);
    const [peakHours, setPeakHours] = useState<number[]>([]);

    const loadProfile = useCallback(async () => {
        const res = await (window as any).shadowAPI.developerDNA.getProfile(developerId);
        setProfile(res);
        return res;
    }, [developerId]);

    const loadPeakHours = useCallback(async () => {
        const res = await (window as any).shadowAPI.developerDNA.getPeakHours(developerId);
        setPeakHours(res);
        return res;
    }, [developerId]);

    const analyzeCode = useCallback(async (code: string) => {
        return await (window as any).shadowAPI.developerDNA.analyze(code);
    }, []);

    const learnFromCode = useCallback(async (code: string) => {
        return await (window as any).shadowAPI.developerDNA.learn(developerId, code);
    }, [developerId]);

    return { profile, peakHours, loadProfile, loadPeakHours, analyzeCode, learnFromCode };
}

// ============================================================================
// ANALYTICS HOOK
// ============================================================================

export function useDevAnalytics() {
    const [metrics, setMetrics] = useState<DevelopmentMetrics | null>(null);
    const [bottlenecks, setBottlenecks] = useState<string[]>([]);

    const loadMetrics = useCallback(async () => {
        const res = await (window as any).shadowAPI.devAnalytics.getMetrics();
        setMetrics(res);
        return res;
    }, []);

    const loadBottlenecks = useCallback(async () => {
        const res = await (window as any).shadowAPI.devAnalytics.identifyBottlenecks();
        setBottlenecks(res);
        return res;
    }, []);

    const predictDeadlineRisk = useCallback(async (
        daysRemaining: number,
        tasksRemaining: number,
        avgTaskDays: number
    ) => {
        return await (window as any).shadowAPI.devAnalytics.predictDeadlineRisk(
            daysRemaining, tasksRemaining, avgTaskDays
        );
    }, []);

    const recordLines = useCallback(async (lines: number) => {
        return await (window as any).shadowAPI.devAnalytics.recordLines(lines);
    }, []);

    const recordCommit = useCallback(async (bugCount?: number) => {
        return await (window as any).shadowAPI.devAnalytics.recordCommit(bugCount);
    }, []);

    return { metrics, bottlenecks, loadMetrics, loadBottlenecks, predictDeadlineRisk, recordLines, recordCommit };
}

// ============================================================================
// SPECIALIST AGENT HOOKS
// ============================================================================

export function useUnifiedPlatform() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const execute = useCallback(async (task: any) => {
        setLoading(true);
        try {
            const res = await (window as any).shadowAPI.unifiedPlatform.execute(task);
            setResult(res);
            return res;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, result, execute };
}

export function useAPIArchitect() {
    const [loading, setLoading] = useState(false);
    const execute = useCallback(async (task: any) => {
        setLoading(true);
        try {
            return await (window as any).shadowAPI.apiArchitect.execute(task);
        } finally {
            setLoading(false);
        }
    }, []);
    return { loading, execute };
}

export function useAccessibility() {
    const [loading, setLoading] = useState(false);
    const execute = useCallback(async (task: any) => {
        setLoading(true);
        try {
            return await (window as any).shadowAPI.accessibility.execute(task);
        } finally {
            setLoading(false);
        }
    }, []);
    return { loading, execute };
}

export function useSpatialComputing() {
    const [loading, setLoading] = useState(false);
    const execute = useCallback(async (task: any) => {
        setLoading(true);
        try {
            return await (window as any).shadowAPI.spatial.execute(task);
        } finally {
            setLoading(false);
        }
    }, []);
    return { loading, execute };
}
