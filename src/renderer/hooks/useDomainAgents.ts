/**
 * React Hooks for Domain APIs
 * 
 * Custom hooks for accessing new domain-specific agent APIs
 */

import { useState, useCallback, useEffect } from 'react';
import { shadowAPI } from '../shadowAPI';

// ============================================================================
// MOBILE AGENT HOOK
// ============================================================================

export interface UseMobileAgentReturn {
    capabilities: any[];
    loading: boolean;
    error: string | null;
    detectPlatform: (task: any) => Promise<any>;
    generateMetadata: (description: string, platform: 'ios' | 'android') => Promise<any>;
    execute: (task: any) => Promise<any>;
}

export function useMobileAgent(): UseMobileAgentReturn {
    const [capabilities, setCapabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        shadowAPI.mobile.getCapabilities().then(setCapabilities).catch(console.error);
    }, []);

    const detectPlatform = useCallback(async (task: any) => {
        setLoading(true);
        setError(null);
        try {
            return await shadowAPI.mobile.detectPlatform(task);
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const generateMetadata = useCallback(async (description: string, platform: 'ios' | 'android') => {
        setLoading(true);
        setError(null);
        try {
            return await shadowAPI.mobile.generateMetadata(description, platform);
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const execute = useCallback(async (task: any) => {
        setLoading(true);
        setError(null);
        try {
            return await shadowAPI.mobile.execute(task);
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    return { capabilities, loading, error, detectPlatform, generateMetadata, execute };
}

// ============================================================================
// GAME AGENT HOOK
// ============================================================================

export interface UseGameAgentReturn {
    capabilities: any[];
    loading: boolean;
    error: string | null;
    detectEngine: (task: any) => Promise<any>;
    generateProcedural: (asset: any, project: any) => Promise<any>;
    designMultiplayer: (task: any, project: any) => Promise<any>;
    execute: (task: any) => Promise<any>;
}

export function useGameAgent(): UseGameAgentReturn {
    const [capabilities, setCapabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        shadowAPI.game.getCapabilities().then(setCapabilities).catch(console.error);
    }, []);

    const detectEngine = useCallback(async (task: any) => {
        setLoading(true);
        setError(null);
        try {
            return await shadowAPI.game.detectEngine(task);
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const generateProcedural = useCallback(async (asset: any, project: any) => {
        setLoading(true);
        try {
            return await shadowAPI.game.generateProcedural(asset, project);
        } finally {
            setLoading(false);
        }
    }, []);

    const designMultiplayer = useCallback(async (task: any, project: any) => {
        setLoading(true);
        try {
            return await shadowAPI.game.designMultiplayer(task, project);
        } finally {
            setLoading(false);
        }
    }, []);

    const execute = useCallback(async (task: any) => {
        setLoading(true);
        try {
            return await shadowAPI.game.execute(task);
        } finally {
            setLoading(false);
        }
    }, []);

    return { capabilities, loading, error, detectEngine, generateProcedural, designMultiplayer, execute };
}

// ============================================================================
// DESKTOP AGENT HOOK
// ============================================================================

export function useDesktopAgent() {
    const [capabilities, setCapabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        shadowAPI.desktop.getCapabilities().then(setCapabilities).catch(console.error);
    }, []);

    const detectFramework = useCallback(async (task: any) => {
        setLoading(true);
        try {
            return await shadowAPI.desktop.detectFramework(task);
        } finally {
            setLoading(false);
        }
    }, []);

    const generateInstaller = useCallback(async (config: any, project: any) => {
        setLoading(true);
        try {
            return await shadowAPI.desktop.generateInstaller(config, project);
        } finally {
            setLoading(false);
        }
    }, []);

    const execute = useCallback(async (task: any) => {
        setLoading(true);
        try {
            return await shadowAPI.desktop.execute(task);
        } finally {
            setLoading(false);
        }
    }, []);

    return { capabilities, loading, detectFramework, generateInstaller, execute };
}

// ============================================================================
// HIVEMIND HOOK
// ============================================================================

export function useHiveMind() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const refreshStats = useCallback(async () => {
        const s = await shadowAPI.hivemind.getStats();
        setStats(s);
    }, []);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    const query = useCallback(async (problem: string) => {
        setLoading(true);
        try {
            return await shadowAPI.hivemind.query({ problem, maxResults: 5 });
        } finally {
            setLoading(false);
        }
    }, []);

    const learnPattern = useCallback(async (problem: string, solution: string, category: string) => {
        setLoading(true);
        try {
            return await shadowAPI.hivemind.learnPattern(problem, solution, category);
        } finally {
            setLoading(false);
        }
    }, []);

    const getBestSolution = useCallback(async (problem: string) => {
        setLoading(true);
        try {
            return await shadowAPI.hivemind.getBestSolution(problem);
        } finally {
            setLoading(false);
        }
    }, []);

    return { stats, loading, query, learnPattern, getBestSolution, refreshStats };
}

// ============================================================================
// SIMULATOR HOOK
// ============================================================================

export function useSimulator() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const refreshStats = useCallback(async () => {
        const s = await shadowAPI.simulator.getStats();
        setStats(s);
    }, []);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    const runLoadTest = useCallback(async (options: {
        targetUrl: string;
        requestsPerSecond: number;
        duration: number;
    }) => {
        setLoading(true);
        try {
            return await shadowAPI.simulator.runLoadTest(options);
        } finally {
            setLoading(false);
        }
    }, []);

    const runChaos = useCallback(async (experiment: any) => {
        setLoading(true);
        try {
            return await shadowAPI.simulator.runChaos(experiment);
        } finally {
            setLoading(false);
        }
    }, []);

    const testResilience = useCallback(async (components: string[]) => {
        setLoading(true);
        try {
            return await shadowAPI.simulator.testResilience(components);
        } finally {
            setLoading(false);
        }
    }, []);

    return { stats, loading, runLoadTest, runChaos, testResilience, refreshStats };
}

// ============================================================================
// TEMPORAL CONTEXT HOOK
// ============================================================================

export function useTemporalContext() {
    const [stats, setStats] = useState<any>(null);

    const refreshStats = useCallback(async () => {
        const s = await shadowAPI.temporal.getStats();
        setStats(s);
    }, []);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    const analyzeArchaeology = useCallback(async (filePath: string) => {
        return await shadowAPI.temporal.analyzeArchaeology(filePath);
    }, []);

    const learnPatterns = useCallback(async (developerId: string) => {
        return await shadowAPI.temporal.learnPatterns(developerId);
    }, []);

    const predictNext = useCallback(async (developerId: string, currentFile: string, recentActions: string[]) => {
        return await shadowAPI.temporal.predictNext(developerId, currentFile, recentActions);
    }, []);

    return { stats, analyzeArchaeology, learnPatterns, predictNext, refreshStats };
}

// ============================================================================
// DOMAIN TOOLS HOOK
// ============================================================================

export function useDomainTools() {
    const [tools, setTools] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        shadowAPI.domainTools.list().then(setTools).catch(console.error);
    }, []);

    const listByCategory = useCallback(async (category: 'mobile' | 'game' | 'desktop') => {
        return await shadowAPI.domainTools.listByCategory(category);
    }, []);

    const execute = useCallback(async (name: string, params: any) => {
        setLoading(true);
        try {
            return await shadowAPI.domainTools.execute(name, params);
        } finally {
            setLoading(false);
        }
    }, []);

    return { tools, loading, listByCategory, execute };
}
