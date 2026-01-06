/**
 * Autonomous WebSocket Manager
 * 
 * Manages real-time communication for autonomous workflow updates
 */

import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';

// ============================================================================
// TYPES
// ============================================================================

interface WebSocketMessage {
    type: string;
    data: any;
    timestamp?: number;
}

// ============================================================================
// AUTONOMOUS WEBSOCKET MANAGER
// ============================================================================

export class AutonomousWebSocketManager extends EventEmitter {
    private static instance: AutonomousWebSocketManager;
    private mainWindow: BrowserWindow | null = null;
    private isConnected = false;

    private constructor() {
        super();
        this.setupEventHandlers();
    }

    static getInstance(): AutonomousWebSocketManager {
        if (!AutonomousWebSocketManager.instance) {
            AutonomousWebSocketManager.instance = new AutonomousWebSocketManager();
        }
        return AutonomousWebSocketManager.instance;
    }

    // ========================================================================
    // CONNECTION MANAGEMENT
    // ========================================================================

    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window;
        this.isConnected = true;
        console.log('✅ AutonomousWebSocketManager connected to main window');

        // Send connection established message
        this.broadcast({
            type: 'connection:established',
            data: { connected: true }
        });
    }

    disconnect(): void {
        this.mainWindow = null;
        this.isConnected = false;
        console.log('🔌 AutonomousWebSocketManager disconnected');
    }

    // ========================================================================
    // MESSAGE BROADCASTING
    // ========================================================================

    broadcast(message: WebSocketMessage): void {
        if (!this.mainWindow || !this.isConnected) {
            console.warn('⚠️  Cannot broadcast: No active connection');
            return;
        }

        // Add timestamp if not present
        if (!message.timestamp) {
            message.timestamp = Date.now();
        }

        try {
            this.mainWindow.webContents.send('autonomous:update', message);
            this.emit('message:sent', message);
        } catch (error) {
            console.error('❌ Error broadcasting message:', error);
            this.emit('error', error);
        }
    }

    // ========================================================================
    // WORKFLOW EVENT HELPERS
    // ========================================================================

    notifyWorkflowCreated(jobId: string, request: any): void {
        this.broadcast({
            type: 'workflow:created',
            data: { jobId, request }
        });
    }

    notifyWorkflowStarted(jobId: string): void {
        this.broadcast({
            type: 'workflow:started',
            data: { jobId }
        });
    }

    notifyWorkflowProgress(jobId: string, phase: string, progress: number, details?: any): void {
        this.broadcast({
            type: 'workflow:progress',
            data: { jobId, phase, progress, details }
        });
    }

    notifyPhaseComplete(jobId: string, phase: string, result: any): void {
        this.broadcast({
            type: 'workflow:phase:complete',
            data: { jobId, phase, result }
        });
    }

    notifyAgentActivity(jobId: string, agentName: string, action: string, status: string): void {
        this.broadcast({
            type: 'workflow:agent:activity',
            data: { jobId, agentName, action, status }
        });
    }

    notifyWorkflowCompleted(jobId: string, result: any): void {
        this.broadcast({
            type: 'workflow:completed',
            data: { jobId, result }
        });
    }

    notifyWorkflowFailed(jobId: string, error: string): void {
        this.broadcast({
            type: 'workflow:failed',
            data: { jobId, error }
        });
    }

    notifyWorkflowCancelled(jobId: string): void {
        this.broadcast({
            type: 'workflow:cancelled',
            data: { jobId }
        });
    }

    // ========================================================================
    // SYSTEM METRICS
    // ========================================================================

    notifySystemMetrics(metrics: {
        cpuUsage: number;
        memoryUsage: number;
        activeWorkflows: number;
        agentUtilization: Record<string, number>;
    }): void {
        this.broadcast({
            type: 'system:metrics',
            data: metrics
        });
    }

    notifyAgentHealth(agentName: string, health: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        lastActivity: number;
        tasksCompleted: number;
        averageConfidence: number;
    }): void {
        this.broadcast({
            type: 'system:agent:health',
            data: { agentName, ...health }
        });
    }

    // ========================================================================
    // LOG STREAMING
    // ========================================================================

    streamLog(jobId: string, level: 'info' | 'warn' | 'error', message: string): void {
        this.broadcast({
            type: 'workflow:log',
            data: { jobId, level, message }
        });
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    private setupEventHandlers(): void {
        this.on('error', (error) => {
            console.error('WebSocket Manager Error:', error);
        });

        this.on('message:sent', (message) => {
            // Optional: Log all sent messages for debugging
            // console.log('📤 Message sent:', message.type);
        });
    }

    // ========================================================================
    // STATUS
    // ========================================================================

    getStatus(): {
        connected: boolean;
        hasWindow: boolean;
        eventCount: number;
    } {
        return {
            connected: this.isConnected,
            hasWindow: this.mainWindow !== null,
            eventCount: this.listenerCount('message:sent')
        };
    }
}

// Export singleton
export const autonomousWebSocketManager = AutonomousWebSocketManager.getInstance();
