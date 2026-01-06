/**
 * 🚀 Performance Optimizer - Bundle Analysis & Code Splitting
 * 
 * Provides utilities for:
 * - Bundle size analysis
 * - Lazy loading configuration
 * - Memory profiling
 * - IPC batching
 */

import { BrowserWindow } from 'electron';

export interface BundleStats {
    totalSize: number;
    mainBundle: number;
    vendorBundle: number;
    chunkCount: number;
    treeshakeable: number;
    unusedExports: string[];
}

export interface MemoryProfile {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
}

export interface IPCBatch {
    id: string;
    calls: { channel: string; args: any[] }[];
    timestamp: number;
}

class PerformanceOptimizer {
    private static instance: PerformanceOptimizer;
    private memorySnapshots: MemoryProfile[] = [];
    private ipcBatchQueue: Map<string, IPCBatch> = new Map();
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 50; // ms

    private constructor() { }

    public static getInstance(): PerformanceOptimizer {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }

    /**
     * Analyze bundle sizes and suggest optimizations
     */
    public async analyzeBundles(buildDir: string): Promise<BundleStats> {
        const fs = await import('fs');
        const path = await import('path');

        let totalSize = 0;
        let mainBundle = 0;
        let vendorBundle = 0;
        let chunkCount = 0;

        try {
            const files = fs.readdirSync(buildDir);

            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.mjs')) {
                    const stat = fs.statSync(path.join(buildDir, file));
                    totalSize += stat.size;
                    chunkCount++;

                    if (file.includes('main') || file.includes('index')) {
                        mainBundle += stat.size;
                    } else if (file.includes('vendor') || file.includes('node_modules')) {
                        vendorBundle += stat.size;
                    }
                }
            }
        } catch (err) {
            console.error('Bundle analysis error:', err);
        }

        return {
            totalSize,
            mainBundle,
            vendorBundle,
            chunkCount,
            treeshakeable: Math.floor(totalSize * 0.15), // Estimate
            unusedExports: [] // Would need static analysis
        };
    }

    /**
     * Get current memory profile
     */
    public getMemoryProfile(): MemoryProfile {
        const mem = process.memoryUsage();
        const profile: MemoryProfile = {
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            external: mem.external,
            rss: mem.rss,
            arrayBuffers: mem.arrayBuffers || 0
        };

        this.memorySnapshots.push(profile);

        // Keep last 100 snapshots
        if (this.memorySnapshots.length > 100) {
            this.memorySnapshots.shift();
        }

        return profile;
    }

    /**
     * Get memory trend over time
     */
    public getMemoryTrend(): { trend: 'stable' | 'growing' | 'leaking'; avgGrowth: number } {
        if (this.memorySnapshots.length < 10) {
            return { trend: 'stable', avgGrowth: 0 };
        }

        const recent = this.memorySnapshots.slice(-10);
        const first = recent[0].heapUsed;
        const last = recent[recent.length - 1].heapUsed;
        const avgGrowth = (last - first) / recent.length;

        let trend: 'stable' | 'growing' | 'leaking' = 'stable';
        if (avgGrowth > 1000000) { // 1MB growth per snapshot
            trend = 'leaking';
        } else if (avgGrowth > 100000) { // 100KB growth
            trend = 'growing';
        }

        return { trend, avgGrowth };
    }

    /**
     * Batch IPC calls to reduce overhead
     */
    public addToBatch(batchId: string, channel: string, args: any[]): void {
        if (!this.ipcBatchQueue.has(batchId)) {
            this.ipcBatchQueue.set(batchId, {
                id: batchId,
                calls: [],
                timestamp: Date.now()
            });
        }

        this.ipcBatchQueue.get(batchId)!.calls.push({ channel, args });

        // Auto-flush after delay
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        this.batchTimeout = setTimeout(() => this.flushBatch(batchId), this.BATCH_DELAY);
    }

    /**
     * Flush a batch of IPC calls
     */
    public async flushBatch(batchId: string): Promise<any[]> {
        const batch = this.ipcBatchQueue.get(batchId);
        if (!batch) return [];

        this.ipcBatchQueue.delete(batchId);

        // In a real implementation, these would be sent as a single IPC call
        // and processed on the other side
        console.log(`[PerfOptimizer] Flushing batch ${batchId} with ${batch.calls.length} calls`);

        return batch.calls.map(call => ({ channel: call.channel, status: 'batched' }));
    }

    /**
     * Suggest code splitting opportunities
     */
    public suggestCodeSplitting(): {
        routes: string[];
        heavyComponents: string[];
        lazyImports: string[];
    } {
        return {
            routes: [
                'MasterDashboard',
                'PluginMarketplace',
                'PersonalitySelector',
                'ProjectHealthPanel',
                'GameDevDashboard',
                'VisualGameDesigner'
            ],
            heavyComponents: [
                'monaco-editor',
                'd3-visualization',
                'react-flow',
                'chart-components'
            ],
            lazyImports: [
                'import("./components/dashboard/MasterDashboard")',
                'import("./components/plugins/PluginMarketplace")',
                'import("./components/health/ProjectHealthPanel")',
                'import("./components/personality/PersonalitySelector")'
            ]
        };
    }

    /**
     * Get renderer process performance metrics
     */
    public async getRendererMetrics(win: BrowserWindow): Promise<{
        paintTime: number;
        domNodes: number;
        jsHeapSize: number;
    }> {
        try {
            const metrics = await win.webContents.executeJavaScript(`
                (() => {
                    const perf = performance.getEntriesByType('paint');
                    const paintTime = perf.length > 0 ? perf[perf.length - 1].startTime : 0;
                    const domNodes = document.querySelectorAll('*').length;
                    const jsHeapSize = performance.memory ? performance.memory.usedJSHeapSize : 0;
                    return { paintTime, domNodes, jsHeapSize };
                })()
            `);
            return metrics;
        } catch (err) {
            return { paintTime: 0, domNodes: 0, jsHeapSize: 0 };
        }
    }

    /**
     * Generate performance report
     */
    public generateReport(): {
        memory: MemoryProfile;
        memoryTrend: { trend: string; avgGrowth: number };
        codeSplitting: any;
        recommendations: string[];
    } {
        const memory = this.getMemoryProfile();
        const memoryTrend = this.getMemoryTrend();
        const codeSplitting = this.suggestCodeSplitting();

        const recommendations: string[] = [];

        if (memoryTrend.trend === 'leaking') {
            recommendations.push('⚠️ Possible memory leak detected - investigate event listeners');
        }
        if (memoryTrend.trend === 'growing') {
            recommendations.push('📈 Memory usage growing - consider cleanup in useEffect');
        }
        if (memory.heapUsed > 500 * 1024 * 1024) {
            recommendations.push('💾 High memory usage (>500MB) - implement virtualization');
        }
        recommendations.push(`🔀 Lazy load ${codeSplitting.routes.length} route components`);
        recommendations.push(`📦 ${codeSplitting.heavyComponents.length} heavy components identified for splitting`);

        return {
            memory,
            memoryTrend,
            codeSplitting,
            recommendations
        };
    }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();
export default performanceOptimizer;
