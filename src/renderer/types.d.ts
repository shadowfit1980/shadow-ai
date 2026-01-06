/**
 * Global type declarations for Shadow AI
 */

interface Window {
    shadowAPI: {
        // Model Management
        model: {
            list: () => Promise<any[]>;
            select: (id: string) => Promise<void>;
            chat: (messages: any[]) => Promise<string>;
        };

        // Safety & Policies
        safety: {
            getPolicies: () => Promise<any[]>;
            getViolations: (limit?: number) => Promise<any[]>;
            getViolationStats: () => Promise<any>;
        };

        // Mode Management
        mode: {
            getMode: () => Promise<string>;
            setMode: (mode: string) => Promise<boolean>;
            getConfig: () => Promise<any>;
        };

        // Agent & Tasks
        agent: {
            getQueueStats: () => Promise<any>;
            getAllTasks: () => Promise<any[]>;
        };

        // Metrics & Monitoring
        metrics: {
            getSummary: (since?: string) => Promise<any>;
            getCalibrationData: () => Promise<any>;
        };

        // AL

        Ops
        alops: {
            getHealthStatus: () => Promise<any>;
            getMetrics: () => Promise<any>;
            getAlerts: () => Promise<any[]>;
        };

        // Legacy fallback
        electronAPI?: typeof shadowAPI;
    };

    // Legacy support - alias to shadowAPI
    electronAPI: Window['shadowAPI'];
}

declare const window: Window;
