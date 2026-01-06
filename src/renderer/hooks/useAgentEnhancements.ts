/**
 * Agent Enhancement Hooks
 * 
 * React hooks for accessing the 5 new agent enhancement modules:
 * - Tool Chaining
 * - Agent Handoff
 * - Context Compression
 * - MCTS Planner
 * - Streaming Pipeline
 */

import { useState, useCallback, useEffect } from 'react';
import { shadowAPI } from '../shadowAPI';

// ============================================================================
// TYPES
// ============================================================================

export interface ChainStep {
    toolName: string;
    params: Record<string, any>;
    inputMapping?: Record<string, string>;
    outputAs?: string;
    optional?: boolean;
}

export interface ChainResult {
    success: boolean;
    chainId: string;
    outputs: Record<string, any>;
    totalDuration: number;
    error?: string;
}

export interface HandoffRequest {
    id: string;
    sourceAgent: string;
    targetAgent: string;
    task: string;
    status: string;
}

export interface ContextWindow {
    items: any[];
    totalTokens: number;
}

export interface PlanAction {
    name: string;
    description: string;
    params: Record<string, any>;
    probability: number;
    cost: number;
}

// ============================================================================
// TOOL CHAINING HOOK
// ============================================================================

export function useToolChaining() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<ChainResult | null>(null);

    const createChain = useCallback(async (name: string, steps: ChainStep[], options?: any) => {
        setLoading(true);
        setError(null);
        try {
            const chain = await shadowAPI.toolChaining.createChain(name, steps, options);
            return chain;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const executeChain = useCallback(async (chainId: string, initialParams?: any) => {
        setLoading(true);
        setError(null);
        try {
            const result = await shadowAPI.toolChaining.executeChain(chainId, initialParams);
            setLastResult(result);
            return result;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getStats = useCallback(async () => {
        return await shadowAPI.toolChaining.getChainStats();
    }, []);

    const getHistory = useCallback(async (limit?: number) => {
        return await shadowAPI.toolChaining.getExecutionHistory(limit);
    }, []);

    return {
        loading,
        error,
        lastResult,
        createChain,
        executeChain,
        getStats,
        getHistory
    };
}

// ============================================================================
// AGENT HANDOFF HOOK
// ============================================================================

export function useAgentHandoff() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingHandoffs, setPendingHandoffs] = useState<HandoffRequest[]>([]);

    const requestHandoff = useCallback(async (
        sourceAgent: string,
        targetAgent: string,
        task: string,
        options?: any
    ) => {
        setLoading(true);
        setError(null);
        try {
            const request = await shadowAPI.handoff.request(sourceAgent, targetAgent, task, options);
            return request;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const acceptHandoff = useCallback(async (handoffId: string) => {
        setLoading(true);
        try {
            const result = await shadowAPI.handoff.accept(handoffId);
            // Refresh pending
            refreshPending();
            return result;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const completeHandoff = useCallback(async (handoffId: string, result: any, notes?: string[]) => {
        setLoading(true);
        try {
            return await shadowAPI.handoff.complete(handoffId, result, notes);
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshPending = useCallback(async (agentType?: string) => {
        const pending = await shadowAPI.handoff.getPending(agentType);
        setPendingHandoffs(pending || []);
    }, []);

    const getStats = useCallback(async () => {
        return await shadowAPI.handoff.getStats();
    }, []);

    const getPolicy = useCallback(async () => {
        return await shadowAPI.handoff.getPolicy();
    }, []);

    return {
        loading,
        error,
        pendingHandoffs,
        requestHandoff,
        acceptHandoff,
        completeHandoff,
        refreshPending,
        getStats,
        getPolicy
    };
}

// ============================================================================
// CONTEXT COMPRESSION HOOK
// ============================================================================

export function useContextCompression() {
    const [loading, setLoading] = useState(false);
    const [currentWindow, setCurrentWindow] = useState<ContextWindow | null>(null);

    const addItem = useCallback(async (windowId: string, content: string, options?: any) => {
        setLoading(true);
        try {
            const item = await shadowAPI.context.addItem(windowId, content, options);
            // Refresh window
            await getWindow(windowId);
            return item;
        } catch (err) {
            console.error('Add item failed:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getWindow = useCallback(async (windowId: string) => {
        const window = await shadowAPI.context.getWindow(windowId);
        setCurrentWindow(window);
        return window;
    }, []);

    const compress = useCallback(async (windowId: string, options?: any) => {
        setLoading(true);
        try {
            await shadowAPI.context.compress(windowId, options);
            await getWindow(windowId);
        } finally {
            setLoading(false);
        }
    }, []);

    const createCheckpoint = useCallback(async (windowId: string) => {
        return await shadowAPI.context.createCheckpoint(windowId);
    }, []);

    const getHierarchy = useCallback(async (windowId: string) => {
        return await shadowAPI.context.getHierarchy(windowId);
    }, []);

    const getStats = useCallback(async () => {
        return await shadowAPI.context.getStats();
    }, []);

    return {
        loading,
        currentWindow,
        addItem,
        getWindow,
        compress,
        createCheckpoint,
        getHierarchy,
        getStats
    };
}

// ============================================================================
// MCTS PLANNER HOOK
// ============================================================================

export function useMCTSPlanner() {
    const [loading, setLoading] = useState(false);
    const [plannedActions, setPlannedActions] = useState<PlanAction[]>([]);
    const [config, setConfigState] = useState<any>(null);

    const planActions = useCallback(async (goal: string, context: any, actions: PlanAction[]) => {
        setLoading(true);
        try {
            const result = await shadowAPI.planner.planActions(goal, context, actions);
            setPlannedActions(result || []);
            return result;
        } catch (err) {
            console.error('Planning failed:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getConfig = useCallback(async () => {
        const cfg = await shadowAPI.planner.getConfig();
        setConfigState(cfg);
        return cfg;
    }, []);

    const setConfig = useCallback(async (newConfig: any) => {
        await shadowAPI.planner.setConfig(newConfig);
        await getConfig();
    }, []);

    // Load config on mount
    useEffect(() => {
        getConfig();
    }, [getConfig]);

    return {
        loading,
        plannedActions,
        config,
        planActions,
        getConfig,
        setConfig
    };
}

// ============================================================================
// STREAMING PIPELINE HOOK
// ============================================================================

export function useStreamingPipeline() {
    const [loading, setLoading] = useState(false);
    const [stages, setStages] = useState<string[]>([]);
    const [stats, setStats] = useState<any>(null);

    const addStage = useCallback(async (transformerType: string, options?: any) => {
        await shadowAPI.streaming.addStage(transformerType, options);
        await refreshStages();
    }, []);

    const refreshStages = useCallback(async () => {
        const currentStages = await shadowAPI.streaming.getStages();
        setStages(currentStages || []);
    }, []);

    const clearStages = useCallback(async () => {
        await shadowAPI.streaming.clearStages();
        setStages([]);
    }, []);

    const process = useCallback(async (chunk: any) => {
        setLoading(true);
        try {
            return await shadowAPI.streaming.process(chunk);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshStats = useCallback(async () => {
        const currentStats = await shadowAPI.streaming.getStats();
        setStats(currentStats);
        return currentStats;
    }, []);

    // Load stages on mount
    useEffect(() => {
        refreshStages();
    }, [refreshStages]);

    return {
        loading,
        stages,
        stats,
        addStage,
        refreshStages,
        clearStages,
        process,
        refreshStats
    };
}
