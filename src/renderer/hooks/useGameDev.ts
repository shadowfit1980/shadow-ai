/**
 * React Hooks for Game Development
 * 
 * Provides easy-to-use hooks for:
 * - Game templates
 * - Procedural generation
 * - Framework selection
 */

import { useState, useCallback, useEffect } from 'react';

export interface GameTemplate {
    name: string;
    language: string;
    framework: string;
    files: { path: string; content: string }[];
    dependencies: string[];
}

export interface FrameworkInfo {
    language: string;
    frameworks: string[];
}

// ============================================================================
// HOOK: useGameDev - Main game development hook
// ============================================================================

export function useGameDev() {
    const [frameworks, setFrameworks] = useState<FrameworkInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);

    // Load available frameworks on mount
    useEffect(() => {
        loadFrameworks();
    }, []);

    const loadFrameworks = useCallback(async () => {
        try {
            const result = await (window as any).shadowAPI.gameDev.getFrameworks();
            setFrameworks(result);
        } catch (error) {
            console.error('Failed to load frameworks:', error);
        }
    }, []);

    const getTemplate = useCallback(async (framework: string): Promise<GameTemplate | null> => {
        setLoading(true);
        try {
            const template = await (window as any).shadowAPI.gameDev.getTemplate(framework);
            setSelectedTemplate(template);
            return template;
        } catch (error) {
            console.error('Failed to get template:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getInstallCommand = useCallback(async (framework: string): Promise<string> => {
        return await (window as any).shadowAPI.gameDev.getInstallCommand(framework);
    }, []);

    return {
        frameworks,
        loading,
        selectedTemplate,
        getTemplate,
        getInstallCommand,
        loadFrameworks,
    };
}

// ============================================================================
// HOOK: usePygame - Python Pygame hook
// ============================================================================

export function usePygame() {
    const [template, setTemplate] = useState<GameTemplate | null>(null);
    const [loading, setLoading] = useState(false);

    const loadTemplate = useCallback(async () => {
        setLoading(true);
        try {
            const result = await (window as any).shadowAPI.gameDev.getPygameTemplate();
            setTemplate(result);
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    return { template, loading, loadTemplate };
}

// ============================================================================
// HOOK: usePhaser - Phaser.js hook
// ============================================================================

export function usePhaser() {
    const [template, setTemplate] = useState<GameTemplate | null>(null);
    const [loading, setLoading] = useState(false);

    const loadTemplate = useCallback(async () => {
        setLoading(true);
        try {
            const result = await (window as any).shadowAPI.gameDev.getPhaserTemplate();
            setTemplate(result);
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    return { template, loading, loadTemplate };
}

// ============================================================================
// HOOK: useThreeJs - Three.js 3D hook
// ============================================================================

export function useThreeJs() {
    const [template, setTemplate] = useState<GameTemplate | null>(null);
    const [loading, setLoading] = useState(false);

    const loadTemplate = useCallback(async () => {
        setLoading(true);
        try {
            const result = await (window as any).shadowAPI.gameDev.getThreeJsTemplate();
            setTemplate(result);
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    return { template, loading, loadTemplate };
}

// ============================================================================
// HOOK: useGodot - Godot engine hook
// ============================================================================

export function useGodot() {
    const [template, setTemplate] = useState<GameTemplate | null>(null);
    const [loading, setLoading] = useState(false);

    const loadTemplate = useCallback(async () => {
        setLoading(true);
        try {
            const result = await (window as any).shadowAPI.gameDev.getGodotTemplate();
            setTemplate(result);
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    return { template, loading, loadTemplate };
}

// ============================================================================
// HOOK: useUnity - Unity C# hook
// ============================================================================

export function useUnity() {
    const [template, setTemplate] = useState<GameTemplate | null>(null);
    const [loading, setLoading] = useState(false);

    const loadTemplate = useCallback(async () => {
        setLoading(true);
        try {
            const result = await (window as any).shadowAPI.gameDev.getUnityTemplate();
            setTemplate(result);
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    return { template, loading, loadTemplate };
}

// ============================================================================
// HOOK: useLibGDX - Java LibGDX hook
// ============================================================================

export function useLibGDX() {
    const [template, setTemplate] = useState<GameTemplate | null>(null);
    const [loading, setLoading] = useState(false);

    const loadTemplate = useCallback(async () => {
        setLoading(true);
        try {
            const result = await (window as any).shadowAPI.gameDev.getLibGDXTemplate();
            setTemplate(result);
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    return { template, loading, loadTemplate };
}
