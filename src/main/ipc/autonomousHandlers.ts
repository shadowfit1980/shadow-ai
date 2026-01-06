/**
 * Autonomous Workflow IPC Handlers
 * 
 * Exposes the AutonomousIntegrationManager to the renderer process
 */

import { ipcMain } from 'electron';
import { autonomousIntegration } from '../ai/integration/AutonomousIntegrationManager';
import type { AutonomousRequest, AutonomousResult } from '../ai/integration/AutonomousIntegrationManager';
import { autonomousWebSocketManager } from '../services/AutonomousWebSocketManager';

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    currentPhase?: string;
    progress: number; // 0-100
    startTime: number;
    endTime?: number;
    error?: string;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

class AutonomousWorkflowManager {
    private activeWorkflows = new Map<string, WorkflowStatus>();
    private completedResults = new Map<string, AutonomousResult>();
    private workflowPromises = new Map<string, Promise<AutonomousResult>>();

    async submitWorkflow(request: AutonomousRequest): Promise<{ jobId: string; status: string }> {
        console.log('📋 Submitting autonomous workflow...');

        // Generate job ID
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Initialize status
        const status: WorkflowStatus = {
            jobId,
            status: 'pending',
            progress: 0,
            startTime: Date.now()
        };
        this.activeWorkflows.set(jobId, status);

        // Notify UI of new workflow
        autonomousWebSocketManager.broadcast({
            type: 'workflow:created',
            data: { jobId, request }
        });

        // Start workflow asynchronously
        const workflowPromise = this.executeWorkflow(jobId, request);
        this.workflowPromises.set(jobId, workflowPromise);

        return { jobId, status: 'pending' };
    }

    private async executeWorkflow(jobId: string, request: AutonomousRequest): Promise<AutonomousResult> {
        const status = this.activeWorkflows.get(jobId)!;
        
        try {
            // Update status to running
            status.status = 'running';
            status.currentPhase = 'Initializing';
            this.activeWorkflows.set(jobId, status);
            
            autonomousWebSocketManager.broadcast({
                type: 'workflow:started',
                data: { jobId }
            });

            // Hook into autonomous integration to track progress
            this.setupProgressTracking(jobId);

            // Execute autonomous workflow
            const result = await autonomousIntegration.processAutonomousRequest(request);

            // Store results
            this.completedResults.set(jobId, result);

            // Update status to completed
            status.status = 'completed';
            status.progress = 100;
            status.endTime = Date.now();
            this.activeWorkflows.set(jobId, status);

            autonomousWebSocketManager.broadcast({
                type: 'workflow:completed',
                data: { jobId, result }
            });

            return result;

        } catch (error) {
            console.error(`❌ Workflow ${jobId} failed:`, error);
            
            status.status = 'failed';
            status.error = error instanceof Error ? error.message : 'Unknown error';
            status.endTime = Date.now();
            this.activeWorkflows.set(jobId, status);

            autonomousWebSocketManager.broadcast({
                type: 'workflow:failed',
                data: { jobId, error: status.error }
            });

            throw error;
        } finally {
            this.workflowPromises.delete(jobId);
        }
    }

    private setupProgressTracking(jobId: string): void {
        // This will be called to update progress as the workflow executes
        // For now, we'll simulate progress updates based on phases
        const phases = [
            'Design & Architecture',
            'Security & Compliance',
            'Implementation',
            'Quality Assurance',
            'Sandbox Validation',
            'Impact Analysis',
            'CI/CD Pipeline',
            'Documentation',
            'Audit & Provenance'
        ];

        let currentPhaseIndex = 0;
        const phaseInterval = setInterval(() => {
            const status = this.activeWorkflows.get(jobId);
            if (!status || status.status !== 'running') {
                clearInterval(phaseInterval);
                return;
            }

            if (currentPhaseIndex < phases.length) {
                status.currentPhase = phases[currentPhaseIndex];
                status.progress = Math.min(95, ((currentPhaseIndex + 1) / phases.length) * 100);
                this.activeWorkflows.set(jobId, status);

                autonomousWebSocketManager.broadcast({
                    type: 'workflow:progress',
                    data: {
                        jobId,
                        phase: status.currentPhase,
                        progress: status.progress
                    }
                });

                currentPhaseIndex++;
            }
        }, 3000); // Update every 3 seconds
    }

    getStatus(jobId: string): WorkflowStatus | null {
        return this.activeWorkflows.get(jobId) || null;
    }

    getResults(jobId: string): AutonomousResult | null {
        return this.completedResults.get(jobId) || null;
    }

    getAllWorkflows(): WorkflowStatus[] {
        return Array.from(this.activeWorkflows.values());
    }

    async cancelWorkflow(jobId: string): Promise<void> {
        const status = this.activeWorkflows.get(jobId);
        if (status && status.status === 'running') {
            status.status = 'cancelled';
            status.endTime = Date.now();
            this.activeWorkflows.set(jobId, status);

            autonomousWebSocketManager.broadcast({
                type: 'workflow:cancelled',
                data: { jobId }
            });
        }
    }

    getStats() {
        return autonomousIntegration.getStats();
    }
}

const workflowManager = new AutonomousWorkflowManager();

// ============================================================================
// IPC HANDLERS
// ============================================================================

export function registerAutonomousHandlers(): void {
    // Submit autonomous workflow
    ipcMain.handle('autonomous:submit', async (_event, request: AutonomousRequest) => {
        try {
            return await workflowManager.submitWorkflow(request);
        } catch (error) {
            console.error('Error submitting workflow:', error);
            throw error;
        }
    });

    // Get workflow status
    ipcMain.handle('autonomous:getStatus', async (_event, jobId: string) => {
        return workflowManager.getStatus(jobId);
    });

    // Get workflow results
    ipcMain.handle('autonomous:getResults', async (_event, jobId: string) => {
        return workflowManager.getResults(jobId);
    });

    // Get all workflows
    ipcMain.handle('autonomous:getAllWorkflows', async () => {
        return workflowManager.getAllWorkflows();
    });

    // Cancel workflow
    ipcMain.handle('autonomous:cancel', async (_event, jobId: string) => {
        return await workflowManager.cancelWorkflow(jobId);
    });

    // Get system stats
    ipcMain.handle('autonomous:getStats', async () => {
        return workflowManager.getStats();
    });

    console.log('✅ Autonomous IPC handlers registered');
}
